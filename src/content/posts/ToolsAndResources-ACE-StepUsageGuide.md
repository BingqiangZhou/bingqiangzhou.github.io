---
title: 【工具分享】免费 AI 音乐怎么用？ACE-Step 网页端、云端 API、本地部署三种方式
published: 2026-07-08
description: ACE-Step 1.5 的完整用法手册。三种用法——网页端 acemusic.ai 注册即用、云端 API（OpenAI 兼容）写脚本调用、本地部署数据不出门，按门槛从低到高全覆盖。附并发限制实测：递增并发 1→2→4→8→16，拐点在 4-8 之间，错误码是 504 而非 429，单 key 并发上限设 4 最稳。
lang: zh
tags: [工具分享]
abbrlink: ace-step-usage-guide
---

想用 AI 生成一首免费、能商用的背景音乐？有三种方式——最简单的注册个账号点几下就行，想写脚本批量生成、或数据不想外发的，也有进阶玩法。这篇是 **ACE-Step 1.5 的完整用法手册**，从最省事到最硬核全覆盖，挑适合你的那一档即可。

ACE-Step 1.5 一共有**三种用法**，按门槛从低到高：

| 用法 | 门槛 | 适合 |
|---|---|---|
| **一、网页端 acemusic.ai** | 注册个账号就行 | 不写代码、偶尔生成几首 |
| **二、云端 API** | 一个免费 API key | 写脚本调用、集成进自己的流水线 |
| **三、本地部署** | 有张 ≥4GB 显存的 GPU（4GB 只能纯器乐，要人声需 ≥6GB） | 数据不能外发、或要大批量生成 |

三种用法背后**是同一个模型**（MIT 开源的 ACE-Step 1.5），区别只在「算力跑在哪」。下面逐一讲。

![三种用法对比：网页端、云端 API、本地部署](/assets/images/2026/20260708/ace-step-usage-guide/images/01-infographic-three-ways.webp)

> 💡 **大多数人只需要看第一部分就够了。** 第二、三部分是给写代码、或要批量生成的进阶读者；并发实测那一章，只在你一次要生成十几首时才用得上。**不确定自己属于哪种？先看第一部分，最省事。**

如果你打算**批量生成**（同时开多个请求、一次跑十几首），还要看第四部分「并发限制实测」——云端能同时跑几路、超了会怎样，我实测过了，结论有点反直觉。

## 一、网页端：acemusic.ai 点几下就能出音乐

**最省事的用法**——翻 ACE-Step 的 GitHub README 会看到一句容易被忽略的话：**"Try acemusic.ai — 100% free!"**。acemusic.ai 就是 ACE-Step 官方做的云端版：同一个 MIT 模型、免费、无需本地 GPU 或安装。注册个账号就能用。

### 1.1 注册登录

打开 [acemusic.ai](https://acemusic.ai)，点右上角「Log in」，支持两种登录方式：

- **Continue with Google**（Google 账号一键登录）
- **Sign in with Email**（邮箱验证码登录——输邮箱→收验证码→填码→进）

没有独立密码，靠邮箱验证码或 Google 授权，省事也省心。登录后会自动跳到 Playground（创作工作台）。

### 1.2 四个主页面

顶部导航有四个入口，对应四种用途：

| 入口 | 用途 |
|---|---|
| **Trending**（热门） | 看大家生成的公开作品，是**抄提示词的好地方**（每个作品都展示了完整 prompt） |
| **Latest**（最新） | 最新公开作品流 |
| **Create**（创作） | **生成你自己的音乐**，主战场 |
| **Get API Key** | 拿 API key（写脚本用，见第二部分） |

> 💡 **Trending 是隐藏宝藏**：每个公开作品都完整展示了作者用的 prompt（风格描述）、所用模型、时长、点赞数。不知道 prompt 怎么写时，去 Trending 翻几个高赞作品，照着改最有效。

### 1.3 Create 页：怎么生成一首

进 Create 页，界面分这几块（实测界面）：

**① 引擎选择**：`Cloud`（云端，免费）或 `Local`（本地，需自己部署——这个选项是把网页当前端、连你本地的后端，进阶用法）。普通用户选 Cloud。

**② 模型**：当前是 `ACE-Step V1.5 XL Turbo`（网页端默认给的就是 turbo 版，和 API 的 `acemusic/acestep-v1.5-turbo` 同款）。

**③ 四种创作模式**（单选）：

| 模式 | 用途 |
|---|---|
| **Simple**（简单） | 只写一句风格描述，让模型自动发挥 |
| **Custom**（自定义） | 写风格描述 + 自己贴歌词，控制最细 |
| **Remix**（混音） | 上传一段音频，基于它重新创作 |
| **Edit**（编辑） | 上传音频做局部修改 |

**④ 输入区**：
- **Song Description**（歌曲描述框）：写 prompt 的地方，placeholder 提示「Describe the styles of the song...」
- **Instrumental**（纯器乐勾选框）：勾上就不要人声，做 BGM/Jingle 必勾
- **Upload Audio**（上传音频）：仅 Remix/Edit 模式用

**⑤ Generate 按钮**：点一下，等约 20-30 秒（turbo 版很快），音频就出来了，存进 **My Library**（我的音乐库）——在 Library 里可以在线试听、下载（默认 mp3 格式），公开的作品还能被别人点赞。

### 1.4 网页端 vs API：该用哪个

网页端适合**不写代码、或只是偶尔生成**的场景。但一旦你要做下面这些事，就该上 API 了：

- 批量生成（一次跑几十首挑最好的）
- 集成进自己的脚本/流水线（比如我的播客生成 skill 自动配 BGM）
- 精确控制时长、输出格式、语言等参数（网页端控件有限，API 参数更全）

下面进入第二部分。

## 二、云端 API：acemusic.ai 怎么调

云端 API 走的是 **OpenAI Chat Completions 兼容**接口——调用方式和文本模型一样，一次请求同步返回 base64 音频，最省事。先去 [Get API Key 页](https://acemusic.ai/api-key) 免费领一个 key（登录后直接显示，Base URL 是 `https://api.acemusic.ai`，都有复制按钮）。

下面是我实测验证过的真实调用（model 名以 `/v1/models` 实际返回为准，云端是 `acemusic/acestep-v1.5-turbo`，注意是 `v1.5` 带点）：

```
POST https://api.acemusic.ai/v1/chat/completions
Authorization: Bearer <你的 key>
Content-Type: application/json
User-Agent: curl/8.4.0          # 见坑②，Python 默认 UA 会被拦

{
  "model": "acemusic/acestep-v1.5-turbo",
  "messages": [{"role": "user", "content":
    "<prompt>warm piano instrumental, gentle, no vocals</prompt>"}],
  "audio_config": {"instrumental": true, "duration": 6, "format": "mp3"},
  "use_cot_caption": false
}

→ 返回 choices[0].message.audio[0].audio_url.url = "data:audio/mpeg;base64,..."
   按逗号截掉前缀，base64 解码即得 mp3 文件。
```

![云端 API 调用流程：脚本 → 云端 → mp3](/assets/images/2026/20260708/ace-step-usage-guide/images/02-flowchart-api-call.webp)

几个实测要点：

- **参数是 `audio_config`**：支持 `duration`（时长秒）、`format`（mp3/flac/wav）、`vocal_language`（zh/en/ja）、`instrumental`（true=纯器乐）。注意是 `audio_config` 这个对象，不是直接传 `audio`。
- **响应字段路径要写全**：`choices[0].message.audio[0].audio_url.url`——这个嵌套结构是 OpenAI 标准的 audio 返回格式，别漏中间的 `[0]`。
- **prompt 用 `<prompt>` 标签包裹**：模型会按标签解析，比裸文本更稳。

调云端有两个坑，提前知道能省事：

- **坑①：域名混淆**。别搞混 **acemusic.ai**（官方免费）和 **acestep.io**（第三方站点，免费计划 personal use、商用要付费）。web 搜索时这俩长得像，差点以为官方在线版也收费。**关键选型回到一手文档（官方 README）**。
- **坑②：Python urllib 被 WAF 拦（403）**。urllib 默认 `User-Agent: Python-urllib/x.x` 被网站 WAF 当爬虫拒了，curl 就没事。解法：请求手动带 `User-Agent: curl/8.4.0`。一行 header 的事，但不查不会知道。

## 三、本地部署：注重数据隐私或批量生成时的备选

云端虽省事，但要把 prompt 和生成内容发到第三方服务。**如果你对数据隐私有要求**（比如内部素材不便外发、或要走内网/离线环境），或者要批量生成不想依赖第三方稳定性——那就本地跑。好消息是，ACE-Step 1.5 的本地部署比想象中简单得多。

官方 Quick Start 就三步（Mac/Linux/Windows 通用）：

```
# 1. 装 uv（包管理器，一行搞定）
curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows PowerShell:
# powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# 2. clone + 装依赖
git clone https://github.com/ACE-Step/ACE-Step-1.5.git
cd ACE-Step-1.5
uv sync

# 3. 启动（模型首次运行自动下载，约 10GB）
uv run acestep          # Gradio Web UI → http://localhost:7860
uv run acestep-api      # REST API 服务 → http://localhost:8001
```

就这么简单——**模型权重首次运行自动从 HuggingFace/ModelScope 拉，不用手动下**；Gradio UI 会根据你的 GPU 显存自动选配置（4GB 显存就能 DiT-only 模式跑，6GB 起带 LLM）。

**Windows / macOS 用户有更省事的**：官方提供**便携包**（预装全部依赖，解压即用）——Windows 版双击 `start_gradio_ui.bat`，macOS 版跑 `start_gradio_ui_macos.sh`，连 `uv` 都不用装。

**真实的门槛在哪**：不在部署步骤，而在**硬件和磁盘**——

- 显存 ≥4GB（DiT-only）、≥6GB（带 LLM 才能生成带人声的歌）
- 磁盘 ~10GB（核心模型）
- 首次下载模型要等一会（看网速，大陆建议设 `--download-source modelscope`）

### 3.1 部署完，有三种调用入口

部署跑起来后，本地有三套调用方式，按场景选——

| 入口 | 命令 | 端口 | 适合 |
|---|---|---|---|
| **Gradio Web UI** | `uv run acestep` | 7860 | 手动调试、试 prompt、看波形 |
| **OpenRouter 兼容 API** | （`uv run acestep` 同时启动）| 8002 | 脚本调用，**和云端 acemusic.ai 同构** |
| **异步 REST API** | `uv run acestep-api` | 8001 | 批量任务、需要任务队列 |

前两种（7860 的 UI、8002 的兼容 API）启动同一个进程就有，**8002 那个和云端 acemusic.ai 调用方式完全一样**——把 base URL 从 `https://api.acemusic.ai` 换成 `http://localhost:8002`、key 留空，第二部分的调用代码全部原样能用。

**重点说第三种：异步 REST API**（`uv run acestep-api`，端口 8001）——这是为**批量生成**设计的，和前两种的"一次请求同步返回"不一样，走的是异步任务队列：

```
# 1. 提交任务，拿 task_id
POST http://localhost:8001/release_task
{
  "prompt": "warm piano instrumental",
  "lyrics": "",
  "audio_format": "mp3",
  "audio_duration": 30,
  "vocal_language": "en"
}
→ {"code": 200, "data": {"task_id": "xxx"}}

# 2. 轮询状态（status: 0=排队, 1=成功, 2=失败）
POST http://localhost:8001/query_result
{"task_ids": ["xxx"]}

# 3. status=1 后，从返回的 audio_path 用 GET 下载
GET http://localhost:8001/v1/audio?path=...
```

异步的好处是**能排队**——你一次提交几十个 prompt（比如批量给每期播客生成 BGM），它会按队列依次生成，不阻塞。注意本地异步 API 的字段名和云端不同：用 `prompt`/`lyrics`/`audio_format`/`audio_duration`（不是云端的 `messages`/`audio_config`），model 名是 `acestep-v15-turbo`（原文如此，注意没有点，和云端的 `acemusic/acestep-v1.5-turbo` 不一样）。完整字段看官方 [API 文档](https://github.com/ACE-Step/ACE-Step-1.5/blob/main/docs/en/API.md)。

**判断标准**：云端 acemusic.ai 够用就别折腾本地。**只有这两种情况值得上本地**：① 数据不能外发（隐私/合规）；② 你要批量生成、不想依赖第三方服务的稳定性——这种就用本地的异步 REST API（8001）排队跑。否则云端一个 key 搞定，省心得多。

## 四、并发限制实测：免费云端能同时跑几路？

前面三部分讲的是「怎么把一首音乐生成出来」。但真要用起来，尤其**批量生成**（一次给十几期播客的 BGM、或并行试多个 prompt 选最好的那首），必然要问：**一个 key 同时开几路请求，云端扛得住吗？** 这一章就是回答这个。

### 4.1 官方文档：一个字都没写

先翻文档。结论是：**acemusic.ai 官方对速率/并发限制一个字都没公开。**

- acemusic.ai 官网的 `/docs`、`/pricing` 页**直接 404**——它根本不是一个有公开开发者文档的传统 SaaS API。
- ACE-Step 官方 GitHub 的 README 只写了一句 "Try acemusic.ai — 100% free!"，**全文无 rate limit / concurrency / RPM / quota 字样**。
- 最权威的 [OpenRouter API 文档](https://github.com/ACE-Step/ACE-Step-1.5/blob/main/docs/en/Openrouter_API_DOC.md)（规范 `api.acemusic.ai/v1/chat/completions` 这个 endpoint）里，**Error Codes 表列出了 400/401/500/503/504**——**但没有显式的限流响应头说明**，也没有任何 rate-limit 相关的字段。

官方不公开，只能自己测。下面是实测。

### 4.2 实测方法：递增并发

**方法**：递增并发档位 **1 → 2 → 4 → 8 → 16**，每个档位同时发起 N 个请求（用 `duration: 10s` 的轻量样本降负载，别浪费免费服务的算力），记录每个请求的 HTTP 状态码、完成耗时、响应头（重点找 `429` / `Retry-After` / `X-RateLimit-*`）。档位之间 sleep 5s 让服务喘口气。总请求 31 个，对免费公共服务保持克制。

**判据**：
- 出活速度（每首大约多少秒）不再随并发数变快 → 服务端并发饱和（排队串行化）
- 出现非 200 状态码 → 硬限制触发
- 响应头含 `Retry-After` / `X-RateLimit-*` → 客户端可读配额

### 4.3 实测结果：拐点在 4-8 并发之间

| 并发数 | 成功/总 | 平均耗时 | 最大耗时 | 批次墙钟 | 限流响应头 |
|---|---|---|---|---|---|
| 1 | 1/1 | 21.3s | 21.3s | 21.3s | 无 |
| 2 | 2/2 | 29.1s | 35.6s | 35.6s | 无 |
| 4 | **4/4** | 42.6s | 64.8s | 64.8s | 无 |
| 8 | **4/8** | 54.1s | 65.8s | 65.8s | 无 |
| 16 | **0/16** | 65.8s | 65.9s | 65.9s | 无 |

![并发数 vs 成功率：4 路最稳](/assets/images/2026/20260708/ace-step-usage-guide/images/03-infographic-concurrency-test.webp)

**四个关键发现**：

**① 服务端在排队串行化，并发从 2 起出活速度就见顶。** 1 并发约 20 秒出一首，2/4/8 并发都压到约 17 秒一首——**翻倍并发并没有快多少**。配合"平均耗时随并发数上升"（21s→29s→43s→54s），可以确认：服务端把请求丢进队列**近似串行处理**，多开并发只是让每个请求在队列里等更久，总产出不变。这不是"限制"而是"算力天花板"。

**② 拐点在 4-8 并发之间，错误码是 504 不是 429。** 并发 4 还 100% 成功，并发 8 开始一半失败（4/8），并发 16 全军覆没（0/16）。**失败的错误码全是 504（Gateway Timeout）**，响应体只有一句 `error code: 504`——不是标准的 429 Too Many Requests。这印证了官方 Error Codes 表为什么没列 429：acemusic.ai **用网关超时（等不及队列处理完就掐断连接）来表达过载，而不是显式的限流拒绝**。官方表里的 503（Model not yet initialized）是模型未就绪，504 是过载超时——两个 5xx 各管一摊。

**③ 完全没有 ratelimit/retry-after 响应头。** 所有 31 个请求的响应头里，**没有任何一个**带 `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `Retry-After` 之类的字段。这意味着客户端**无法从响应头读配额、无法知道还要等多久**——和 OpenAI、Stability AI 那种「响应头告诉你还剩多少配额」的规范 API 完全不同。

**④ 504 的固定 ~65s 超时是个硬数字。** 并发 8 和 16 的失败请求，耗时都精确地卡在 ~65.8s（方差 <0.2s）——这是**网关层的固定超时阈值**（约 65 秒等不到响应就掐断）。记住这个数字：客户端的 `timeout` 设到 60s 内能抢在网关掐断前拿到结果，设到 70s 以上就是在等一个注定 504 的请求。

### 4.4 给批量生成的实用建议

把实测结论翻译成工程动作：

1. **单 key 并发上限设 4 最稳。** 并发 4 是实测的"全成功上限"，再高就开始赌运气（8 并发 50% 失败）。用 `ThreadPoolExecutor(max_workers=4)` 或信号量控制即可。
2. **别指望并发省时间——这服务本质是串行的。** 想要 10 首音乐，开 4 并发和开 1 并发的总耗时差不多（出活速度都是约 17 秒/首）。**并发的价值是"挂着跑、你可以干别的"，不是"更快出齐"**。真要快，要么上本地部署（异步 REST API 自己排队，见第三部分），要么多开几个 key 分散。
3. **客户端 timeout 设 90s 够用，别设太长。** 实测最长成功请求 64.8s（并发 4 的最慢那个），网关 65s 后必 504。设 90s 既覆盖正常波动，又不会傻等一个注定超时的请求（有些脚本默认 300s/600s 太长）。
4. **重试要识别 504，但不能秒级重试。** 504 是过载，立刻重试只会给过载的服务雪上加霜，而且大概率再次 504。建议：**指数退避（如 30s/60s/120s，最多 3 次）**——等服务端队列消化掉再试。那种"固定 sleep 2s 重试一次"的简单做法对 504 几乎无效（2s 后队列还没消化）。
5. **失败要优雅降级，别让批量任务崩。** 单首失败不该毁掉整批——用 try/except 记一行 warn 然后跳过，让其余的继续跑。

### 4.5 和本地部署的取舍：批量场景该选哪个

这一章的结论让第三部分「本地部署」的取舍更清晰了：

| 你的场景 | 推荐 | 理由 |
|---|---|---|
| 偶尔生成几首（一期播客的 jingle/BGM） | **云端 acemusic.ai** | 免费、免运维，单首 20s 出活够用 |
| 一次性批量生成 10+ 首，但能挂着等 | **云端 + max_workers=4** | 慢但免费，并发 4 稳定，挂着跑即可 |
| 要快速出齐一大批（几十首，不想等几小时） | **本地部署异步 REST API（8001）** | 自己的 GPU 自己排队，不受云端串行瓶颈限制 |
| 数据不能外发 / 内网 / 离线 | **本地部署** | 隐私合规，且无并发限制 |

一句话：**云端适合"少量多次"，本地适合"批量快出"**。云端的串行吞吐瓶颈，是免费服务的真实代价——想要无限并发，就把算力搬到自己机器上。

## 结语：几种用法怎么选

回到开头那张表，选型其实很简单：

- **只是想玩、或偶尔生成几首** → 网页端 [acemusic.ai](https://acemusic.ai)，注册账号即用
- **要写脚本、集成进流水线** → 云端 API，免费 key + OpenAI 兼容接口
- **数据敏感、或大批量生成** → 本地部署，自己的 GPU 自己做主

还要记住云端有 ~4 路的并发天花板——偶尔几首选云端，真要大批量就上本地。

用法搞定了，**提示词怎么写才能出想要的效果**？那要看同系列的另一篇——《[ACE-Step 1.5 实测：给播客和视频配乐，这免费的 AI 音乐行不行？](https://mp.weixin.qq.com/s/6kktqe9pRQ9-VjWss51IcQ)》，那里有 18 段真实样本（含 Gemini 听评）和提示词的完整方法论。

---

**「AI 音乐给播客用」系列共三篇，这篇是第三篇：**

1. 《[给播客加音乐：找到一个免费能商用的 AI 音乐 API](https://mp.weixin.qq.com/s/N8l26CKfCgtcLKl4TIu5nQ)》——选型对比，以及"把音乐混进人声"的混音手艺
2. 《[ACE-Step 1.5 实测：给播客和视频配乐，这免费的 AI 音乐行不行？](https://mp.weixin.qq.com/s/6kktqe9pRQ9-VjWss51IcQ)》——18 段真实样本 + Gemini 听评 + 提示词方法论
3. **《免费 AI 音乐怎么用？网页端、云端 API、本地部署三种方式》**（本篇）——完整用法手册
