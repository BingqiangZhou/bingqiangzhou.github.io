---
title: 【工具分享】Hermes Agent 接入 Agnes AI：API Key、上下文压缩与免费限额
published: 2026-11-25
description: 把 Agnes AI 配成 Hermes Agent 的模型后端：API Key 与 Base URL 的三种写法、512K 上下文长度和压缩触发阈值的调优，以及免费档的 RPM 限额与 429 应对。
tags: [工具分享, Agent, AI实测]
toc: true
abbrlink: hermes-agent-agnes-setup
---

> 配置要点与限速规则核对于 2026 年 11 月，Agnes 的限额调整频繁，实际以控制台为准。

Hermes Agent 是 Nous Research 开源的自主智能体框架，能跨会话记事、自己写技能、接 Telegram / Discord 之类的消息入口，适合长期挂在机器上跑任务。Agnes AI 是一家新加坡的模型公司，提供 OpenAI 兼容格式的文本、图像、视频三模态 API，文本模型免费、不绑卡、不限时长，靠限速和付费档位区分。

我用 Hermes 跑日常任务，一轮对话动辄七八次请求，token 消耗涨得很快。为了省 token，我把 Hermes Agent 的 API key 切换到了免费的 Agnes——模型用 `agnes-3.0-flash`，一分钱不花，只是有限速。实际用下来，大多数时候没有遇到 429 限流，偶尔撞上了，等 1 分钟再输入 `/retry` 就好了。

这篇按「部署 → 配 Key → 定窗口 → 参数速览 → 摸清限额」的顺序走一遍，所有配置项都给出可直接复制的片段。

## 一、我的部署方式

先交代一下使用场景，方便对号入座：我用 Hermes 主要跑**定时获取资讯**的任务——用内置的 cron 定时抓新闻源、整理成摘要，再推送到消息入口给我看。也就是说它是全天候常驻的，部署和升级路径会直接影响体验。

- **部署位置**：腾讯云海外的轻量应用服务器。选海外节点，是因为 Agent 要频繁抓各类资讯站点，海外网络直连省心，也少一层代理折腾；
- **消息入口**：接了飞书，定时任务的产物直接推到飞书会话里，手机上随时能看；
- **系统镜像**：腾讯云提供了预装 Hermes 的可部署镜像，开机就能用，这一点很省事。缺点是镜像更新比较慢，而 Hermes 恰好是个迭代很勤的项目；
- **升级方式**：不用等镜像跟进——**直接和 Hermes 对话，让它自己升级自己**（等价于让它执行 `hermes update`），升级完重启一下进程就是最新版。

这套「海外轻量服务器 + 飞书 + 免费模型」的组合，跑定时资讯任务基本零成本，剩下的就是把模型配好、把上下文管好，也就是后面几节的内容。

## 二、拿到 Agnes 的 API Key

前置条件只有一个：Hermes Agent 已经装好（官方文档有 Linux / macOS / WSL2 / Windows 原生的安装指南，不重复），所有配置文件都在 `~/.hermes/` 下。

注册流程：

1. 打开 `platform.agnes-ai.com` 注册，邮箱验证即可，不需要绑定支付方式；
2. 进入 **Settings → API Keys**，新建一个 Key 并立刻复制——完整 Key 通常只展示一次；
3. 如果创建时选择了「限定范围」，记得把要用的模型勾上，否则会报模型无权限。

当前可用的主要模型：

| 模型 ID | 类型 | 上下文窗口 | 备注 |
| --- | --- | --- | --- |
| `agnes-3.0-flash` | 文本 | 512K | 主力推荐，支持工具调用与流式 |
| `agnes-3.0-pro` | 文本 | 1M | 推理与长文档场景 |
| `agnes-2.5-pro` | 文本 | 1M | 商用稳定版 |
| `agnes-image-2.5-flash` | 图像 | — | 文生图、图生图 |
| `agnes-video-2.5-flash` | 视频 | — | 文生视频、首帧控制 |

注意 `agnes-2.5-flash` 将于 **2026 年 11 月 30 日退役**，网上大量教程还在用它，照抄会直接踩空，新配置一律写 `agnes-3.0-flash`。

## 三、把 Agnes 配成 Hermes 的模型后端

Agnes 完全兼容 OpenAI API 格式，网关地址是 `https://apihub.agnes-ai.com/v1`。Hermes 有三种写法，效果等价；我自己用的是 3.1 的官方四条命令。

### 3.1 官方推荐：四条命令

```bash
hermes config set model.provider custom
hermes config set model.base_url https://apihub.agnes-ai.com/v1
hermes config set model.api_key 你的API_KEY
hermes config set model.default agnes-3.0-flash
```

几个细节：

- `set` 要写在配置键前面，顺序反了会报参数错误；
- Base URL 只到 `/v1`，**不要**自己补 `/chat/completions`，Hermes 会拼接完整路径；
- API Key 直接写裸 Key，不需要加 `Bearer ` 前缀；
- `model.api_key` 是 Hermes 认识的字段，命令执行后明文会写进 `~/.hermes/.env`（变量名 `HERMES_MODEL_API_KEY`），`config.yaml` 里只留一个 `${HERMES_MODEL_API_KEY}` 引用，不会把密钥散落在配置文件里。

### 3.2 直接改 config.yaml

打开 `~/.hermes/config.yaml`，把 `model:` 段改成：

```yaml
model:
  provider: custom
  base_url: https://apihub.agnes-ai.com/v1
  api_key: ${HERMES_MODEL_API_KEY}
  default: agnes-3.0-flash
  context_length: 524288
```

`${VAR}` 写法会在加载时展开，变量仍然放在 `.env` 里。

### 3.3 长期方案：providers 字典（推荐）

`model.context_length` 是「显式固定值」，优先级最高，但切换模型、provider 或 Base URL 时会被自动清掉。如果你会在多个模型之间来回切，用 `providers:` 字典按模型声明更稳：

```yaml
model:
  provider: agnes
  default: agnes-3.0-flash

providers:
  agnes:
    api: https://apihub.agnes-ai.com/v1
    key_env: AGNES_API_KEY
    models:
      agnes-3.0-flash:
        context_length: 524288
      agnes-3.0-pro:
        context_length: 1000000
```

然后在 `~/.hermes/.env` 里加一行：

```bash
AGNES_API_KEY=你的API_KEY
```

`transport` 不用写，OpenAI 兼容端点会自动识别成 `chat_completions`。

### 3.4 验证

先在命令行确认 Key 和网关没问题：

```bash
curl https://apihub.agnes-ai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 你的API_KEY" \
  -d '{"model":"agnes-3.0-flash","messages":[{"role":"user","content":"你好"}]}'
```

返回 200 和一段 JSON 就通了。再进 Hermes 里检查：

```bash
hermes config get model
hermes config get compression
```

会话里用 `/model` 看当前模型、`/usage` 看真实 token 用量、`/compress` 手动触发一次压缩，能直观验证阈值是否按预期生效。

### 3.5 五个高频报错

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `401 Unauthorized` | Key 错误、过期或没勾模型权限 | 重新生成 Key，检查「限定范围」 |
| `404 model not found` | 模型 ID 大小写写错，或用了已退役的 2.5 Flash | 复制控制台里的完整模型 ID |
| `404` 且路径里带 `/chat/completions` | Base URL 写成了完整端点 | 只保留到 `/v1` |
| `context length exceeded` | 窗口设大了，或压缩触发太晚 | 见第四、五节 |
| `429 Too Many Requests` | 撞到 RPM 限制 | 等 1 分钟再 `/retry`，见第六节 |

## 四、上下文长度：默认 256K，改成实际值

自定义的模型配置，Hermes 上下文默认按 **256K** 处理；而 Agnes 3.0 Flash 的实际窗口是 512K。窗口不准，压缩触发点和仪表盘都会跟着错，所以要改成实际值。

改法很简单：直接在会话里和 Hermes 说「把默认 256K 的对话长度改成 512K」，它自己就执行了 `hermes config set`，等价于手敲：

```bash
hermes config set model.context_length 524288
```

注意实际数字不是整 512000，而是 512 × 1024 = **524288**，要和 API 真实窗口对得上。改完用 `hermes config get model` 确认即可。

两个补充：

- `model.context_length` 是显式覆盖，切换 provider 时会被清掉；会来回切模型的话，把窗口写进 `providers.<id>.models.<model>.context_length` 更稳；
- Hermes 对窗口小于 512K 的模型有保护：压缩阈值最低被抬到 0.75（只升不降），所以别把窗口写成 500000 这类值。另外 `agnes-3.0-pro`、`agnes-2.5-pro` 是 1M 窗口，换模型记得同步改。

## 五、模型配置参数：默认值就够用

前面配好 Key 和窗口之后，Hermes 还有一批模型行为相关的参数可调——最核心的是上下文压缩（compression），此外还有重试、推理强度、辅助模型这些。这一节就简单过一遍每个参数管什么。

先说结论：**这些参数全都有安全的默认值，没有特殊需求一个都不用改**。我自己就是全部用默认值跑的，唯一动过的是第四节的 `context_length`——那是因为自定义模型探测不到窗口，属于必设项。

### 5.1 压缩参数（compression 段）

压缩解决的是「对话越来越长怎么办」：上下文用到一定比例时，Hermes 会把早期内容折叠成摘要，只保留最近的交互。相关参数都写在 `compression:` 段：

| 配置项 | 默认值 | 作用 |
| --- | --- | --- |
| `enabled` | `true` | 总开关 |
| `threshold` | `0.50` | 上下文占窗口多少比例时触发压缩，512K 窗口即约 262K 处 |
| `threshold_tokens` | `null` | 绝对 token 上限，与比例阈值取较小者 |
| `model_thresholds` | `{}` | 按模型名子串覆盖阈值，最长匹配优先 |
| `target_ratio` | `0.20` | 压缩后保留多少尾部；仅 `tail_mode: legacy` 时生效，默认 `lean` 模式下改它无效 |
| `tail_mode` | `lean` | 尾部保留策略，默认按窗口 2.5%（夹在 10K–25K）留尾部 |
| `protect_last_n` | `20` | 最少保护的最近消息数 |
| `min_tail_user_messages` | `1` | 尾部保证保留的真实用户消息数 |

补一句窗口地板：模型窗口小于 512K 时，`threshold` 下限会被强制抬到 0.75（只升不降），设得再低也没用。

### 5.2 其他模型参数

| 参数 | 默认值 | 作用 |
| --- | --- | --- |
| `model.streaming` | `true` | 流式返回，agent 核心优先流式（含子代理） |
| `agent.max_turns` | `500` | 单次对话最大工具调用轮数 |
| `agent.api_max_retries` | `3` | API 报错时的应用级自动重试次数 |
| `agent.auto_recovery_cycles` | `5` | 瞬时故障后的额外等待重试周期 |
| `agent.reasoning_effort` | `medium` | 推理强度（xhigh / high / medium / low / minimal / none） |
| `auxiliary.*` | `provider: auto` | 压缩摘要、网页提取、会话标题、图片理解、会话检索等辅助任务的模型，默认跟随主 provider |
| `delegation.model` / `provider` | 空 = 继承主模型 | 子代理的模型路由 |
| `prompt_caching.cache_ttl` | `auto` | prompt 缓存 TTL，可固定 5m / 1h |

### 5.3 什么时候才需要动

默认值是官方替大多数人踩过坑之后的平衡点，动之前先想清楚要解决什么问题：

- **经常撞 429**：先别调参，默认的 `api_max_retries: 3` 加 `auto_recovery_cycles: 5` 大多数时候会自己恢复，实在不行等 1 分钟再 `/retry`（见第六节）；
- **依赖 prompt 缓存、想减少失效**：把 `threshold` 提到 0.65–0.70，减少压缩次数；
- **长任务里 Agent 忘了最初需求**：调大 `protect_last_n`、`min_tail_user_messages`；
- **想手动压缩**：会话里输入 `/compress`；查看当前值用 `hermes config get compression`。

## 六、免费限额：能白嫖到什么程度

Agnes 的文本模型对免费用户是无限期开放的——不绑卡、没有「7 天试用」的套路，代价只有限速：

- 文本 RPM（每分钟请求数）**动态调整**，以控制台显示为准。2026 年 9 月 23 日的公告曾把免费用户的文本实际 RPM 下调 50%，当时给到的数字是 10 RPM（企业认证用户 20）；最新文档已统一改为「动态」，不再承诺具体数值；
- 没有订阅配额的概念，限速是唯一的硬约束，撞到就是 429；
- 限制按 Key 类型共享，同一类型建多个 Key 不会叠加 RPM，多建无益。

对 Hermes 这种一轮对话可能连续发七八次请求的 Agent 来说，10 RPM 意味着工具循环稍微密一点就会卡住。

说下实测体感：日常使用**大多数时候没有遇到 429**，单轮问答、偶尔跑个工具循环基本无感；但在密集的多轮工具调用里确实撞过几次。遇到了不用改任何配置，**等 1 分钟，再输入 `/retry` 就好了**——RPM 是按分钟滑窗计算的，等窗口滑过去就恢复了。

如果跑下来发现经常被限速，那就别再死磕免费档：去对比各家的 token plan，选一个合适的订阅，然后把 API key 换成对应平台重新配一遍就好——本文的接入流程对任何 OpenAI 兼容平台都通用。

## 七、踩坑清单

1. **别用 `agnes-2.0-flash` / `agnes-2.5-flash`**，后者 11 月 30 日退役，前者早已不是主力；
2. **Base URL 不要带 `/chat/completions`**，只写到 `/v1`；
3. **Key 不要加 `Bearer ` 前缀**，Hermes 自己会拼；
4. **窗口小于 512K 时阈值最低 0.75**，设 0.3 不会生效，只会被抬到 0.75；
5. **`target_ratio` 只在 `legacy` 模式有用**，默认 `lean` 模式改它没效果；
6. **`model.context_length` 切换 provider 会被清掉**，长期配置用 `providers.<id>.models.<model>.context_length`；
7. **多建 Key 不会增加 RPM**，同类型 Key 共享一个池；
8. **免费档偶尔撞 429 不用慌**，等 1 分钟再 `/retry` 就能恢复；但 RPM 会动态下调，别把速率假设写死进脚本。

## 参考链接

- Hermes Agent 配置文档：<https://hermes-agent.nousresearch.com/docs/user-guide/configuration>
- Hermes 模型配置：<https://hermes-agent.nousresearch.com/docs/user-guide/configuring-models>
- Hermes 上下文压缩与缓存：<https://hermes-agent.nousresearch.com/docs/developer-guide/context-compression-and-caching>
- Agnes 官方 Hermes 集成指南：<https://wiki.agnes-ai.com/en/docs/cid2>
- Agnes 订阅计划：<https://wiki.agnes-ai.com/en/docs/tokenplan>
- Agnes 3.0 Flash 模型页：<https://wiki.agnes-ai.com/en/docs/agnes-30-flash>
- Agnes 模型定价：<https://wiki.agnes-ai.com/en/docs/pricing>
