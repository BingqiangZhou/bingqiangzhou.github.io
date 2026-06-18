---
title: 【学习笔记】用 CC Switch 把新版 Codex 接入国产模型（GLM-5.2 / DeepSeek / 小米 MiMo）
published: 2026-06-18
description: 新版 Codex 砍掉了 wire_api = "chat"，直连 GLM/DeepSeek/MiMo 已不可行。用 CC Switch 起本地代理做 Responses↔Chat 协议翻译，三步把 Codex 接入国产模型。
lang: zh
tags: [学习笔记]
---

> 想在 Codex CLI 里用 GLM-5.2、DeepSeek、小米 MiMo 这些国产模型，**现在已经不能靠手改 `~/.codex/config.toml` 直连了**——新版 Codex 把 `wire_api = "chat"` 整个移除了，只说 Responses API，而国产模型只会 Chat Completions，两边对不上。
>
> 解法是起一个本地代理做协议翻译，目前最省心的是 **CC Switch**。本文讲清「为什么直连不通」+「CC Switch 怎么接」+「三个模型的具体参数」。

## 问题：新版 Codex 已经直连不了国产模型

如果你照着网上偏旧的文章，在 `~/.codex/config.toml` 里写：

```toml
[model_providers.glm]
base_url = "https://open.bigmodel.cn/api/coding/paas/v4"
env_key = "ZHIPUAI_API_KEY"
wire_api = "chat"          # ← 新版 Codex 直接报错
```

会直接撞上：

```
Error loading config.toml: `wire_api = "chat"` is no longer supported.
How to fix: set `wire_api = "responses"` in your provider config.
```

那把 `chat` 改成 `responses` 行不行？也不行——下文说原因。

## 为什么会这样：两边协议断层

OpenAI 在 [discussion #7782](https://github.com/openai/codex/discussions/7782) 里宣布：**2026 年 2 月初正式移除 Codex 对 `chat/completions` 的支持**，全面转向为推理模型设计的 **Responses API**。

但国产模型这边：

- **GLM / DeepSeek / 小米 MiMo** 对外只有 **Chat Completions**（`/v1/chat/completions`），**没有 `/responses` 端点**（智谱那边甚至有人专门开 issue 求加 `/responses`：`zai-org/GLM-5#39`）。

于是死结：

| 你写的 `wire_api` | 发生什么 |
| --- | --- |
| `"chat"` | 新版 Codex 直接拒绝加载配置（上面那个报错） |
| `"responses"`（直连国产模型） | Codex 去打 `/v1/responses`，国产模型没这个端点 → **404** |
| 不写 | 默认 responses，同上 404 |

**直连这条路在新版 Codex 上彻底走不通了。** 必须在中间插一层「翻译」。

## 解法：CC Switch 本地代理

### CC Switch 是什么

[CC Switch](https://github.com/farion1231/cc-switch)（`ccswitch.io`）是一个跨平台桌面 app（Tauri 写的，Rust + React），专门统一管理 Codex / Claude Code / Gemini CLI 等工具的模型供应商，10 万 + star。它内置 **DeepSeek / GLM / Kimi / MiniMax / Qwen / SiliconFlow** 等预设，还支持各家 **Coding Plan / Token Plan 套餐**。

### 原理：它其实叠了三层

1. **配置改写器**：它来当 `~/.codex/config.toml` 的「唯一真相源」。你切供应商时，它原子地覆写 live 配置。
2. **本地协议代理**：在 `127.0.0.1:15721` 起一个服务，把 Codex 的 Responses 请求翻译成上游的 Chat Completions，再把回复翻回来。**这是让国产模型跑起来的核心。**
3. **密钥保险柜**：真实 API Key 只存在 CC Switch 自己的数据库里，live 配置里只放占位符，转发时动态注入——密钥不会明文散落在 Codex 配置里。

关键效果：**Codex 始终以为自己在和一个标准的 Responses 端点通信**，实际上那个「端点」是本地代理。

### 一次请求的完整链路

```
Codex ──POST /v1/responses (Responses 协议)──► CC Switch 本地代理 (127.0.0.1:15721)
                                                    │
                                       ① 拦截 /responses → /chat/completions
                                       ② Responses 请求体 → Chat 请求体
                                       ③ 注入真实 API Key（从 CC Switch 数据库取）
                                                    ▼
                                  上游 Chat 端点（GLM / DeepSeek / MiMo）
                                                    │  ④ 返回 Chat 响应 / SSE 流
                                                    ▼
                                       ⑤ 把 Chat 响应/SSE 重新组装成 Responses 格式
                                                    │
                                                    ▼
                                                Codex（收到标准 Responses）
```

翻译里真正难的是工具调用循环（保持 `tool_call` 的 id/index 稳定）、流式 SSE 事件映射、以及 DeepSeek 思考模式的 `reasoning_content` 回放——这些 CC Switch 都帮你处理了。

## 安装 CC Switch

```bash
# macOS（推荐）
brew install --cask cc-switch

# Windows / Linux：去 https://github.com/farion1231/cc-switch/releases 下载安装包
```

两个前置条件：

- **Codex 至少启动过一次**，这样 `~/.codex/` 目录骨架才存在，CC Switch 才能写入配置。
- CC Switch **3.16.0 及以上**（本地路由功能）。

## 三步把 Codex 接到国产模型

### 第 0 步：先跑一次 Codex

```bash
codex   # 启动一次，生成 ~/.codex/ 骨架，然后退出即可
```

### 第 1 步：打开本地路由

打开 CC Switch → **设置 → 路由 → 本地路由**：

1. 打开**路由总开关**，本地代理在 `127.0.0.1:15721` 启动；
2. 在「路由启用」里勾上 **Codex**（Claude / Gemini 按需）。

### 第 2 步：添加供应商

切到顶部 **Codex 标签页 → 右上角加号 → 新建供应商**：

1. 预设列表里选目标（如 DeepSeek / GLM）；
2. 填入对应 API Key；
3. 保存。

预设已自动填好接口地址、默认模型、模型列表和 thinking 参数，并**默认开启「需要本地路由映射」**。不在预设里的（如部分新模型）走自定义：填 Key + base_url + 模型，「API 格式」选 **OpenAI Chat Completions（需开启路由）**。

### 第 3 步：启用并重启

供应商列表里点该供应商的 **「启用」**，然后**重启 Codex 终端**（Codex 会缓存配置，模型目录也不热加载）。进 Codex 后用 `/model` 确认当前模型对不对。

> ⚠️ 当前限制：Codex app **一个会话只用配置里的第一个模型**，没有运行时多模型切换界面。想换模型 = 在 CC Switch 里切 active 供应商 + 重启。

## 三个模型的具体参数

优先用预设；下面这些值是预设背后填的内容，**自定义时或核对预设时用**。

### GLM-5.2（智谱 Coding Plan，国内）

| 项 | 值 |
| --- | --- |
| base_url | `https://open.bigmodel.cn/api/coding/paas/v4` |
| 模型 | `glm-5.2`（模型本身即原生 1M 上下文） |
| Key | 智谱开放平台后台生成，**作用域选「Coding Plan」** |

注意几点：

- **模型名就是 `glm-5.2`**：智谱开放平台上 GLM-5.2 原生支持 1M 上下文，不需要任何后缀；网上常见的 `glm-5.2[1m]` 是 **Z.ai 平台的别名写法**，智谱这边用不到（别照搬）。
- **国内 / 海外两套域名**：国内 `open.bigmodel.cn/api/coding/paas/v4`，海外 Z.ai 镜像 `api.z.ai/api/coding/paas/v4`，路径都带 `/coding/`。如果 CC Switch 的 GLM 预设默认是 Z.ai，国内用户把 base_url 换成上面的智谱地址。
- **Coding Plan 端点 ≠ 通用按量端点**：套餐是 `/api/coding/paas/v4`，按 token 计费是 `/api/paas/v4`（少一段 `/coding`），别填错。
- GLM-5.2 思考强度走自家参数 `thinking: {type: enabled}` + `reasoning_effort`（不是 OpenAI 的 `reasoning_effort` 语义），CC Switch 的 GLM 预设会帮你填好，一般不用动。
- 1M 上下文首 token 延迟较高（几十秒），频繁超时把代理/客户端超时调大。

### DeepSeek（V4）

| 项 | 值 |
| --- | --- |
| base_url | `https://api.deepseek.com`（或 `/v1`） |
| 模型 | `deepseek-v4-pro`（旗舰）/ `deepseek-v4-flash`（轻量） |
| Key | DeepSeek 后台，`sk-` 开头 |

> `deepseek-chat` / `deepseek-reasoner` 计划于 2026/07/24 弃用，分别对应 `deepseek-v4-flash` 的非思考 / 思考模式，新配直接用 V4 名字。

### 小米 MiMo

| 项 | 值 |
| --- | --- |
| base_url（按量付费） | `https://api.xiaomimimo.com/v1`（Key 形如 `sk-xxxxx`） |
| base_url（Token Plan） | `https://token-plan-cn.xiaomimimo.com/v1`（Key 形如 `tp-xxxxx`） |
| 模型 | `mimo-v2.5`（推荐，通用）/ 重任务可选 `mimo-v2.5-pro`（旗舰） |

MiMo 同时兼容 OpenAI 和 Anthropic 格式，接 Codex 走 OpenAI Chat Completions 那条。MiMo 预设可能不全，没有的话用自定义，按上表填 + 选 Chat 格式 + 开路由。

> ⚠️ **别用旧 V2 模型名**：`mimo-v2-flash` / `mimo-v2-pro` 等 V2 全系列**将于 2026-06-30 下线**（`mimo-v2-flash` 从 6/18 起已自动转发到 V2.5 并按 V2.5 计费）。新配直接用 `mimo-v2.5`（重任务可用 `mimo-v2.5-pro`），别照搬网上旧教程的 V2 名字。

## CC Switch 帮你生成的配置长这样

理解一下接管后 `~/.codex/config.toml` 里被写成什么样（不用手敲，CC Switch 自动生成）：

```toml
model = "glm-5.2"
model_provider = "cc_switch"            # 名字随版本而异

[model_providers.cc_switch]
base_url = "http://127.0.0.1:15721/v1"  # 指向本地代理，不是上游真地址
wire_api = "responses"                   # 对 Codex 说 responses
env_key = "CC_SWITCH_KEY"                # 占位符，真 key 在 CC Switch 库里
```

真正的 GLM/DeepSeek/MiMo 地址和 key 都在 CC Switch 那边，由代理转发时注入。这就是为什么你自己不用再手写一堆 `model_providers`。

## 切换与管理

- **切换模型**：GUI 或系统托盘点选供应商 → CC Switch 重写 live 配置 + 改代理转发目标 → **重启 Codex 生效**。
- **故障转移**：CC Switch 代理带 **auto-failover / 熔断 / 健康检查**，可配多个 provider 互为备用，挂了自动切。
- **用量统计**：CC Switch 有用量面板，能看到每家的花费 / 请求数 / token。
- **回官方**：加一个「Official」预设，切过去后走官方登录流程即可（路由接管模式下会阻止用代理访问官方账号，出于安全考虑）。

## 排查常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| Codex 报 `wire_api = "chat" is no longer supported` | 别再手写 chat 了，交给 CC Switch 路由（它对外用 responses） |
| Codex 报 404 / `/responses` 不存在 | 接管没生效，或你手动把上游 Chat 地址直接写进了配置。确认 `config.toml` 指向 `http://127.0.0.1:15721/v1` 且路由开关开着 |
| 上游返回 404 | 自定义时 base_url 填错了——填**根地址**，不要带 `/chat/completions` 后缀 |
| `/model` 看不到目标模型 | 保存供应商后**重启 Codex**（CC Switch 生成的模型目录不热加载） |
| 问它「你是什么模型」答 GPT-5 | 正常，Codex 有系统提示词。实际用的是哪家，去 CC Switch 用量统计里看 |
| 切换后没生效 | 同时确认三处：Codex 标签下当前供应商已启用、本地路由在运行、「路由启用」里 Codex 开着 |

调试时可以先 `curl` 直连上游的 `/v1/chat/completions`，确认 key 和地址本身没问题，再回头查 CC Switch / Codex 这层。

## 小结

1. **直连已死**：新版 Codex 只说 Responses API，国产模型只会 Chat Completions，手改配置两头都不通。
2. **走 CC Switch 本地代理**：它让 Codex 以为在和标准 Responses 端点说话，背后翻译成各家 Chat——配配置改写 + 协议翻译 + 密钥托管三件事。
3. **三步上手**：装 CC Switch（≥3.16.0）→ 开本地路由 + 加供应商（填 key）→ 启用并重启 Codex。

> 不想装 GUI 的话，同类命令行中转还有 codex-relay(ccx)、MoonBridge、LiteLLM（responses 转换模式）、VibeAround 等，原理都是 Responses↔Chat 翻译。或者临时把 Codex 降级到 0.80 这类还支持 `chat` 的旧版本救急——但治标不治本，OpenAI 只会继续推 Responses。
>
> **信息时效**：本文基于 2026-06 的情况（Codex 已于 2 月移除 chat；GLM-5.2 于 6/13 开放；DeepSeek V4 已上线；MiMo V2.5 系列，V2 于 6/30 下线）。CC Switch 的 UI 和预设会迭代，具体按钮名以你安装的版本为准；模型 id / 端点路径以各家最新文档为准。
