---
title: 【学习笔记】GLM-5.3 原生 Responses 协议：配置 Codex 直连 GLM 编程套餐
published: 2026-08-27
description: GLM-5.3 的开放平台端点原生支持 OpenAI Responses 协议，Codex 不再需要协议转换代理即可直连 GLM 编程套餐。本篇整理官方文档并在 Windows 本机完整落地：models.json 与 config.toml 配置、profile 一键切换、三步验证，以及五个实测踩坑（max 档位的版本兼容、模型目录的替换语义等）。
lang: zh
tags: [学习笔记, 工具分享]
abbrlink: codex-glm-responses-api
---

> 本篇记录的是：GLM-5.3 上线原生 **Responses 协议**端点之后，如何把 OpenAI 的 Codex 直连到 GLM 编程套餐（GLM Coding Plan）。
>
> 在此之前，想在 Codex 里用 GLM，得自己在中间架一层 Responses 与 Chat Completions 之间的协议转换代理；现在官方端点直接"说"Responses 协议，接入从"常驻一个中转服务"简化成"改两个配置文件"。本篇按"背景 → 准备 → 手动配置 → 自动化配置 → 模型选择 → 本地实战 → 踩坑 → 排错"的顺序展开，配置内容以智谱官方文档为准，实战与踩坑部分来自我在 Windows 本机的完整落地记录。

---

## 1. 背景：为什么"原生支持 Responses"值得单独记一笔

Codex 是 OpenAI 推出的 AI 编程智能体，支持在终端（Codex CLI）和桌面应用中使用。它对第三方模型接入方有个隐含门槛：Codex 与模型服务端通信的首选协议是 OpenAI 自家的 **Responses API**，而不是大家最熟悉的 Chat Completions。OpenAI 一直在把 Codex 的重心从 chat/completions 迁往 responses，第三方模型想被 Codex"原生直连"，就得提供一个兼容的 `/responses` 端点。

GLM 此前的开放平台端点只提供两套协议：给 Claude Code 用的 Anthropic 兼容接口，以及标准的 Chat Completions 接口——唯独缺 Responses。所以过去在 Codex 里用 GLM 编程套餐，社区通行做法是自己跑一个协议转换代理，把 Codex 发出的 Responses 请求翻译成 Chat Completions 再转发给智谱。社区也一直在官方仓库呼吁原生支持，典型如 GitHub issue [zai-org/GLM-5#39](https://github.com/zai-org/GLM-5/issues/39)，标题就是"建议智谱官方 API 支持 OpenAI 兼容的 /responses 接口，以提升 Codex 兼容性"。

转折点在 GLM-5.3：官方为它上线了专属的 Responses 协议端点，GLM 的 API 至此原生覆盖 Anthropic 兼容、Chat Completions、Responses 三种接入协议。顺带一提模型本身——按官方文档的说法，GLM-5.3 与 GLM-5.2 使用相同的基础模型，提升全部来自后训练，主打复杂软件工程与 Agent 任务能力的进阶；同期全量上线编程套餐的还有 GLM-5.3-Flash——GLM-5 系列首个**原生多模态**模型，视觉能力被原生融入 Coding 循环，套餐内可用额度是 GLM-5.3 的 3 倍。

于是现在 Codex 接 GLM 的完整动作只剩三步：拿到编程套餐的 API Key → 声明模型元数据 → 配置 provider。下面逐步展开。

---

## 2. 准备工作

三样东西：

1. **GLM Coding Plan 订阅与 API Key**。在[智谱开放平台](https://open.bigmodel.cn)注册并订阅编程套餐后：
   - 个人版套餐用户：通过[个人编程套餐 → 套餐概览](https://bigmodel.cn/coding-plan/personal/overview)新建 API Key；
   - 团队版套餐成员：通过[团队编程套餐 → 我的套餐](https://bigmodel.cn/coding-plan?z_plan=team)获取 API Key。注意**团队套餐 Key 与平台其他 API Key 不通用**，要用团队额度必须用团队套餐 Key。
2. **安装 Codex CLI**：需要 Node.js 18 或更新版本（macOS 推荐 nvm 安装，避免后续权限问题），然后：

   ```bash
   npm install -g @openai/codex
   codex --version   # 显示版本号即安装成功
   ```

3. （可选）**桌面端 Codex 应用**：从 [ChatGPT 下载页](https://www.chatgpt.com/download)按操作系统下载安装；若已装 CLI，也可以直接运行 `codex app` 启动桌面应用。

---

## 3. 手动配置：两个文件搞定直连

官方文档给的方案是改两个文件，都在用户主目录的 `.codex` 文件夹下：

- 模型目录文件：`models.json`——向 Codex 声明 GLM 模型的元数据；
- 主配置文件：`config.toml`——声明 provider、端点与 API Key。

Windows 用户注意路径差异：macOS/Linux 是 `.codex` 目录，Windows 是 `C:\Users\<用户名>\.codex\`。

### 3.1 创建模型目录文件 models.json

Codex 会话内用 `/model` 切换模型时，下拉列表来自它的"模型目录"。GLM 模型不在 Codex 内置目录里，所以要先写一份元数据文件，把模型名、上下文窗口、支持的推理档位等信息声明出来。将以下内容完整复制写入 `models.json`（文件或目录不存在就先创建）：

```json
{
    "models": [
        {
            "slug": "glm-5.3",
            "display_name": "glm-5.3",
            "description": "Z.ai's latest flagship model",
            "default_reasoning_level": "max",
            "supported_reasoning_levels": [
                {
                    "effort": "low",
                    "description": "Light reasoning"
                },
                {
                    "effort": "high",
                    "description": "Enhanced reasoning"
                },
                {
                    "effort": "max",
                    "description": "Deep reasoning"
                },
                {
                    "effort": "ultra",
                    "description": "Alias of max, desktop-compatible"
                }
            ],
            "shell_type": "shell_command",
            "visibility": "list",
            "supported_in_api": true,
            "priority": 0,
            "base_instructions": "",
            "supports_reasoning_summaries": true,
            "default_reasoning_summary": "none",
            "support_verbosity": false,
            "apply_patch_tool_type": "freeform",
            "truncation_policy": {
                "mode": "bytes",
                "limit": 10000
            },
            "context_window": 1048576,
            "max_context_window": 1048576,
            "effective_context_window_percent": 95,
            "supports_parallel_tool_calls": true,
            "experimental_supported_tools": [],
            "input_modalities": [
                "text"
            ]
        },
        {
            "slug": "glm-5.3-flash",
            "display_name": "glm-5.3-flash",
            "description": "Native multimodal model",
            "default_reasoning_level": "max",
            "supported_reasoning_levels": [
                {
                    "effort": "low",
                    "description": "Light reasoning"
                },
                {
                    "effort": "high",
                    "description": "Enhanced reasoning"
                },
                {
                    "effort": "max",
                    "description": "Deep reasoning"
                },
                {
                    "effort": "ultra",
                    "description": "Alias of max, desktop-compatible"
                }
            ],
            "shell_type": "shell_command",
            "visibility": "list",
            "supported_in_api": true,
            "priority": 1,
            "base_instructions": "",
            "supports_reasoning_summaries": true,
            "default_reasoning_summary": "none",
            "support_verbosity": false,
            "apply_patch_tool_type": "freeform",
            "truncation_policy": {
                "mode": "bytes",
                "limit": 10000
            },
            "context_window": 1048576,
            "max_context_window": 1048576,
            "effective_context_window_percent": 95,
            "supports_parallel_tool_calls": true,
            "experimental_supported_tools": [],
            "input_modalities": [
                "text",
                "image"
            ]
        }
    ]
}
```

一个说明：官方 Codex 文档的示例目录里，第二个模型是 `glm-5-turbo`（约 200K 上下文、不暴露推理档位）。本篇按 GLM-5.3-Flash 模型页的规格把它替换成了 `glm-5.3-flash`——上下文同为 1M，推理档位同为 low/high/max，输入模态多了 image。若想与官方示例完全一致，把这个条目换回 `glm-5-turbo` 即可。另外，两个模型都额外补了一个 `ultra` 档：它在线上会被 Codex 映射为 `max`，但能通过桌面 app 的档位白名单，是绕开坑六的关键补丁。

值得留意的几个字段：

| 字段 | glm-5.3 | glm-5.3-flash | 含义 |
| --- | --- | --- | --- |
| `context_window` | 1048576（1M tokens） | 1048576（1M tokens） | 上下文窗口，决定单会话能装多少代码 |
| `supported_reasoning_levels` | low / high / max / ultra | low / high / max / ultra | 推理力度档位；ultra 线上等同 max（见第 7 节坑六） |
| `input_modalities` | 仅 text | text + image | 模型能接收的输入类型，flash 的多模态入口 |
| `priority` | 0 | 1 | 模型列表排序，数字越小越靠前 |

### 3.2 配置 config.toml：端点与 API Key

将以下内容完整写入主配置文件 `config.toml`，并把 `<Your API Key>` 替换为上一步获取的 Key：

```toml
model_provider = "ZAI"
model = "glm-5.3"
model_reasoning_effort = "max"
model_catalog_json = "~/.codex/models.json"

[model_providers.ZAI]
name = "ZAI"
base_url = "https://open.bigmodel.cn/api/v1"
experimental_bearer_token = "<Your API Key>"
wire_api = "responses"
```

逐行拆解：

| 字段 | 作用 |
| --- | --- |
| `model_provider = "ZAI"` | 默认 provider 指向下面定义的 ZAI |
| `model = "glm-5.3"` | 默认模型，可换成 `models.json` 里声明过的其他模型 |
| `model_reasoning_effort = "max"` | 默认推理力度，可选 low / high / max |
| `model_catalog_json` | 指向 3.1 创建的模型目录文件 |
| `base_url` | **Responses 协议专属端点**，注意不是 Claude Code 用的那个（见第 8 节） |
| `experimental_bearer_token` | 直接以 Bearer Token 方式携带 API Key |
| `wire_api = "responses"` | **整个配置的灵魂**：告诉 Codex 用 Responses 协议通信 |

上表中的 `experimental_bearer_token` 只接受**字面量**字符串——写成 `"$ZAI_API_KEY"` 不会被展开，Codex 会把这段文字原样当作 token 发出去。如果不想把 Key 硬编码在配置文件里，正确姿势是改用 Codex provider 通用的 `env_key` 字段，由它在运行时从环境变量读取，把 `[model_providers.ZAI]` 段换成：

```toml
[model_providers.ZAI]
name = "ZAI"
base_url = "https://open.bigmodel.cn/api/v1"
env_key = "ZAI_API_KEY"
wire_api = "responses"
```

再在环境变量里设置 `ZAI_API_KEY` 即可（Windows 可用 `setx ZAI_API_KEY "<Your API Key>"`，设完重开终端）。Codex 源码里对 `experimental_bearer_token` 的注释也明确写着：出于安全原因不鼓励使用，建议改用 `env_key`。此外 provider 还支持更进阶的 `auth` 块——用一个命令动态获取 token（可配置缓存时长与 401 后自动刷新），适合 token 会过期的场景，但它与 `env_key`、`experimental_bearer_token` 互斥，二者选其一。

配置完成后，重启 Codex 应用，或打开一个**新**终端执行 `codex`，即可开始使用。

---

## 4. 偷懒方式：Coding Tool Helper

不想手改配置文件的话，官方还提供了自动化助手，一条命令进入交互界面，按提示选择 Codex 即可自动完成工具安装与套餐配置：

```bash
npx @z_ai/coding-helper
```

详细说明见官方的 Coding Tool Helper 文档。手改和自动化二选一即可，殊途同归。

---

## 5. 模型选择与切换

两个可选模型定位不同：

| 模型 | 定位 | 上下文窗口 | 输入模态 | 推理档位 |
| --- | --- | --- | --- | --- |
| `glm-5.3` | 最新旗舰，复杂软件工程与 Agent 任务 | 1M tokens | 仅文本 | low / high / max |
| `glm-5.3-flash` | GLM-5 系列首个原生多模态模型，套餐额度 3 倍 | 1M tokens | 文本 + 图像（模型另支持视频、文件输入） | low / high / max |

两款思考都不可关闭（`thinking.type` 仅支持 `enabled`），差异在定位：`glm-5.3` 是纯文本旗舰；`glm-5.3-flash` 在套餐里享有 3 倍额度、API 定价约为 glm-5.3 的十分之一，而且是 GLM-5 系列首个原生多模态模型——视觉能力原生融入 Coding 循环，能主动观察界面、渲染结果与交互反馈并持续改进，官方给的最佳实践之一就是"一组产品截图直接复刻成可运行的前端工程"。放到 Codex 里，最直接的收益是可以把设计稿、UI 截图、报错截图直接贴进会话让模型看着干活，而不是靠文字转述。

在两者之间切换，按"单次 → 永久"的粒度有四种方式：

1. **会话内 `/model`（最常用）**：输入 `/model` 回车，从模型目录弹窗里选 `glm-5.3` 或 `glm-5.3-flash`；由于目录里声明了推理档位，选完模型还会让继续选 low/high/max。选择会被持久化为新的默认值，之后的新会话沿用它，可随时用 `/status` 确认当前生效的模型与推理档位。
2. **启动参数 `-m`（单次会话）**：`codex -m glm-5.3-flash` 用 flash 开一个新会话，不改默认配置；非交互的 `codex exec` 同样支持，如 `codex exec -m glm-5.3-flash "跑一下测试并修复失败项"`。
3. **改 `config.toml` 的 `model` 字段（永久默认）**：改成 `glm-5.3-flash` 后重启 Codex，与 `/model` 持久化的效果等同，适合确定主力模型后一次性定死。
4. **profile 叠加（高频横跳）**：在 `.codex` 目录下新建 `glm.config.toml`，内容只需一行 `model = "glm-5.3-flash"`，启动时 `codex --profile glm`。profile 会叠加在主配置之上，provider、Key 等其余配置自动继承，等于给两个模型各留一个一键入口。

推理力度不必跟着模型绑定：重度调试用 `max`，日常改动可以降到 `low` 换速度，`/model` 弹窗里顺手就能改。

---

## 6. 本地实战：Windows 本机完整落地

光看不练假把式，这套配置我在自己的 Windows 机器（Codex CLI 经 npm 全局安装）上完整落地了一遍。这台机器的 Codex 已有一套重度配置——OpenAI 登录态、桌面应用联动、插件与项目信任一应俱全，所以原则是**只做增量修改、先备份再动手**：先复制一份 `config.toml.bak-<日期>`，出问题随时回滚。

### 6.1 最终文件布局

| 文件 | 作用 |
| --- | --- |
| `config.toml` | 主配置：默认模型改为 glm-5.3，末尾追加 ZAI provider（`env_key` 引用环境变量里已有的 `ZHIPU_API_KEY`） |
| `models.json` | GLM 模型目录，内容即 3.1 节那份 |
| `glm.config.toml` | profile：一行 `model = "glm-5.3-flash"`，其余自动继承主配置 |
| `openai.config.toml` | profile：恢复改造前的 OpenAI 默认 |
| `openai-models.json` | OpenAI 模型专用目录（来历见第 7 节坑三） |

主配置顶部键区最终长这样（provider 段即 3.2 节的 `env_key` 版本；环境变量里已经有 `ZHIPU_API_KEY`，无需再新设。档位用 `ultra` 而非 `max`，原因见第 7 节坑六——简言之：线上等效 max，又能通过桌面 app 的档位白名单）：

```toml
model_provider = "ZAI"
model = "glm-5.3"
model_reasoning_effort = "ultra"
model_catalog_json = "~/.codex/models.json"
```

两个 profile 文件小到可以整行背下来：

```toml
# glm.config.toml —— provider、Key、目录全部继承主配置
model = "glm-5.3-flash"
model_reasoning_effort = "ultra"
```

```toml
# openai.config.toml —— 恢复 OpenAI 原默认
model_provider = "openai"
model = "gpt-5.6-luna"
model_reasoning_effort = "high"
model_catalog_json = "~/.codex/openai-models.json"
```

三个入口各就各位：`codex` 走 glm-5.3，`codex --profile glm` 走 glm-5.3-flash，`codex --profile openai` 完全回到改造前。

### 6.2 验证三连

配置完不验证等于没配，三步由静到动：

```bash
# 1. 目录与配置解析（不调 API；config.toml 的语法错误也会在这里暴露）
codex debug models                              # 应列出 glm-5.3 与 glm-5.3-flash

# 2. 默认模型端到端冒烟（消耗极少量额度）
codex exec "只回复两个字：pong"

# 3. profile 冒烟 + openai profile 配置校验
codex exec --profile glm "只回复两个字：flash"
codex --profile openai debug prompt-input       # 能跑通即分层配置解析正常
```

`codex exec` 的输出头部会打出 `model` / `provider` / `reasoning effort` 三行，肉眼核对无误即算通过。实测三步全绿：glm-5.3 与 glm-5.3-flash 均以 `provider: ZAI` 正常应答，档位显示 `ultra`（线上实际发送 `max`，验证方法见第 7 节坑六）。

---

## 7. 实测踩坑记录

官方 FAQ 覆盖不到的六个坑，全部在本机复现过，按严重程度排序：

**坑一：`max` 档位与 Codex 版本强绑定（会让 Codex 直接启动失败）。** 照官方文档写 `model_reasoning_effort = "max"`，或在 `models.json` 里声明 `"max"` 档位，旧版 CLI 会直接报错退出：

```text
Error: unknown variant `max`, expected one of `none`, `minimal`, `low`, `medium`, `high`, `xhigh`
```

`max` 是较新版本才加入的推理档位枚举，智谱文档默认你用的是新版 CLI。实测 0.135.0 拒绝，`npm install -g @openai/codex@latest` 升级到 0.150.1 后一切正常。不方便升级的话，把配置里所有 `max` 换成 `high` 也能跑，只是少了最深一档推理。

**坑二：不写 `model_reasoning_effort` 会落到 `none`。** 我曾以为删掉这个键、让 `models.json` 里的 `default_reasoning_level` 兜底即可——实际 `codex exec` 头部显示 `reasoning effort: none`，目录默认值并没有生效。结论：显式写，别依赖目录默认。

**坑三：`model_catalog_json` 是"替换"不是"叠加"。** 设置自定义目录后，`/model` 选择器里 OpenAI 系模型全部消失——自定义目录会**整体替换**可见目录，而不是在默认目录上追加 GLM 两条。要保留 OpenAI 入口，就得给 openai profile 单独配一份目录。省事的做法是从 Codex 自己的在线目录缓存 `models_cache.json` 里提取条目，但要做两步清洗：删掉旧版本不认的 `max` / `ultra` 档位；补上本地目录 schema 必填的 `base_instructions`、`supports_reasoning_summaries`、`supports_parallel_tool_calls` 三个字段（缓存条目里没有，缺了会报 `missing field`）。

**坑四：`codex debug models` 不支持 `--profile`。** 会报 "–-profile only applies to runtime commands"。想验证某个 profile 的分层配置（含目录解析），改用 `codex --profile <name> debug prompt-input`，不消耗 API 额度。

**坑五（无害但吓人）：ZAI 会话下的 rmcp 回连报错。** `codex exec` 输出里偶现 `ERROR rmcp ... chatgpt.com/backend-api/wham/apps`——那是 OpenAI 捆绑插件在非 OpenAI provider 下尝试回连 OpenAI 后端，失败但不影响 GLM 响应，忽略即可。

**坑六：`max` 档位被桌面 app 白名单过滤，`xhigh` 又被 GLM 拒收——解法是 `ultra`。** 这是排查最曲折的一个坑，分三层：

- **桌面层**：Codex 桌面 app 的 UI 有一份"可用档位白名单"（low / medium / high / xhigh / ultra），**唯独漏了 `max`**（上游 [issue #33233](https://github.com/openai/codex/issues/33233)）。后果是显示"漂移"：`config.toml` 设成 `max` 时，桌面 Effort 一栏并不显示 Max，而是回落成白名单内的档位展示（实测显示成了 Medium）——但这只是**显示层 bug**：抓包证明线上依然原样发送 `max`，GLM 也确实跑在最深档。真正的问题是显示与行为不一致，很容易让人误判成"档位被降了"。
- **服务端层**：直接调 GLM 的 Responses 接口探测，glm-5.3 只接受 `low / high / max` 三档——`xhigh`、`ultra` 原样发送都会 400：`该模型始终思考，不支持关闭思考；请使用 low、high 或 max`。所以**不能用 xhigh 冒充 max**。
- **客户端层**：用本地 HTTP 接收器抓 Codex 实际发出的请求体（`codex exec -c 'model_providers.ZAI.base_url="http://127.0.0.1:8899/api/v1"'` 临时把端点指到本地），发现 Codex 对档位做了**线上映射**：`high`→`high`、`max`→`max`、`xhigh`→`xhigh`（原样透传，所以会 400），而 **`ultra`→`max`**。

三层拼起来就是完整解法：**把档位设为 `ultra`**——桌面白名单认它，Effort 菜单能正确显示并选中 Ultra（见下图），Codex 发到线上的是 `max`，GLM 照单全收。显示与行为终于一致，CLI 与桌面双端等效拿到最深推理档。用 `usage.output_tokens_details.reasoning_tokens` 做对照（同一道推理题）：low 平均约 700、high 约 900、max 约 2500——深度差异肉眼可见，这也是验证"某档位是否真的在跑 max"的通用方法。注意 `ultra`→`max` 是 0.150.x 的实测行为，Codex 升级后建议用同样的抓包法复验一遍。

![Codex 桌面 app 的 Effort 菜单：档位配置为 ultra 后，Ultra 正确显示并被选中](/assets/images/2026/20260827/codex-desktop-effort-ultra.webp)

一个顺带的正面确认：`model_catalog_json` 写 `~/.codex/models.json` 的波浪号在 Windows 上能正常展开，不必写绝对路径。

---

## 8. 常见问题排查

**改了配置不生效。** 官方 FAQ 给的排查顺序：关闭所有 Codex 窗口重新打开（或开个新终端再跑 `codex`）；确认 `models.json` 存在且 JSON 格式正确（可用在线校验工具检查）；确认 `model_catalog_json` 路径指向正确；确认 `experimental_bearer_token` 已替换为真实 Key；确认 TOML 格式无误（字段名、引号、中括号完整）。

**端点抄混了。** 这是我认为最容易踩的坑：智谱给不同工具的协议端点是分开的，别把 Claude Code 的配置照搬过来——

| 工具 | 协议 | base_url |
| --- | --- | --- |
| Claude Code / Goose | Anthropic 兼容 | `https://open.bigmodel.cn/api/coding/paas/v4` |
| Codex | OpenAI Responses | `https://open.bigmodel.cn/api/v1` |

**Key 用错额度。** 团队套餐 Key 与平台其他 API Key 不通用；个人与团队两个套餐也各有各的 Key，用哪个额度就配哪个 Key。

---

## 9. 我的总结与思考

**第一，协议覆盖补齐之后，"换模型"的成本只剩改配置文件。** Claude Code 走 Anthropic 协议、Codex 走 Responses 协议，这是当前终端编程智能体的两大事实标准。GLM 把两套协议都原生支持之后，配上编程套餐的订阅模式，在两大利器之间切换 provider 的工作量就是十几行 TOML——不再需要任何常驻中间层。对订阅制编程套餐来说，"协议全兼容"应该算是基础设施而不是加分项了。

**第二，models.json 这个细节比看上去重要。** 官方没有让用户只填一个模型名了事，而是给了一份完整的模型元数据目录——上下文窗口、推理档位、补丁工具格式都声明出来。这决定了 Codex 会不会用错误的参数去调用模型（比如按默认窗口提前截断上下文、发不支持的推理档位）。给第三方模型写接入配置时，"能用"和"被正确地用"之间的差距往往就在这些元数据上。这次实战还额外证明：这些枚举是随 CLI 版本演进的（`max` 档位在旧版直接拒收），第三方接入方案要与手头的 CLI 版本对齐，升级前后都值得用 `codex debug models` 验一遍。

**第三，排错心法：协议 → 目录 → 凭据三层各查一遍。** 先确认协议对不对（`wire_api` 是不是 `responses`、端点有没有抄混），再确认目录对不对（`models.json` 是否存在且合法、`model_catalog_json` 是否指向它），最后确认凭据对不对（Key 是否替换、是否用错了套餐的 Key）。这份配置一共就这三层，逐层排除基本都能定位问题。

一句话收束：**Responses 协议补上之后，GLM 编程套餐在 Codex 里的接入姿势，终于和官方支持的其他工具一样"原生"了。**

---

> 资料来源：
>
> - 智谱开放文档《Codex》（配置与 FAQ 的权威来源）：<https://docs.bigmodel.cn/cn/coding-plan/tool/codex>
> - 智谱开放文档《GLM-5.3》：<https://docs.bigmodel.cn/cn/guide/models/text/glm-5.3>
> - 智谱开放文档《如何切换模型》：<https://docs.bigmodel.cn/cn/coding-plan/latest-model>
> - 社区呼吁原生支持 `/responses` 的 issue：<https://github.com/zai-org/GLM-5/issues/39>
