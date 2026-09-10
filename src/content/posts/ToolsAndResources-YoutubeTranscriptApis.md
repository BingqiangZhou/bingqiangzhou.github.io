---
title: 【工具分享】YouTube 转录 API 全景实测：官方死路、自爬苦路与 kome.ai / NoteGPT 免登录接口
published: 2026-09-10
description: 想拿一条 YouTube 视频的字幕喂给 AI，官方 Data API 只对视频主人开半扇门，自爬 timedtext 又撞上 PO token 与 IP 封禁。本文实测第三方工具的免登录内部接口——kome.ai 裸奔可用、NoteGPT 靠一次性匿名 UUID、tactiq 已上 Firebase App Check——并盘点 youtube-transcript-api、yt-dlp、Invidious / Piped 与商业 API 的定价和国内可达性。
lang: zh
tags:
  - 工具分享
  - 实践记录
---

最近的需求和之前[免费拿推文数据](/posts/toolsandresources-tweetembedapis/)那篇是同一个套路：把一条 YouTube 视频的**字幕全文**拿下来，喂给 AI 做总结、翻译或者检索。按正路走当然会撞墙——YouTube Data API v3 根本不给你别人视频的字幕；于是各路野路子应运而生，其中最「香」的一类，是 kome.ai、NoteGPT、tactiq 这些在线转录工具网页版背后的**免登录内部接口**：人家网页工具不要登录就能用，接口自然多半也是裸的。

这篇笔记把官方路线、自爬路线、第三方内部接口、开源前端实例和商业 API 全部梳理并实测了一遍。先说结论：

> 手边就要一条字幕：**kome.ai 接口**，一个 POST 直接返回全文，连 Cookie 都不要；要**时间戳和视频元信息**：**NoteGPT 接口**，带一个随机匿名 UUID Cookie 即可（每个 UUID 一次机会）；做产品要稳定：**supadata / youtube-transcript.io** 这类正经付费 API，或者自己在海外服务器上跑 **youtube-transcript-api**；国内无代理环境：youtube.com 直连不通，**kome.ai 和 notegpt.io 反而都可直连**——补测一圈同行之后可以确认，这是唯二的现成免登录通道。

## 一、官方路线：YouTube Data API v3 只开半扇门

先看官方。YouTube Data API v3 里和字幕相关的是 `captions` 资源，两个端点，待遇天差地别：

- **`captions.list`**：传入视频 ID，返回该视频有哪些字幕轨（语言、类型、名称）。API key 即可调用，任何公开视频都行。但它只给**清单**，不给内容。
- **`captions.download`**：真正下载字幕内容（srt / vtt）。要求 OAuth 2.0 授权，且**授权者必须是视频的频道主人**——拿别人视频的 caption track ID 去调，直接 `403 Forbidden`。官方文档写得很清楚，Stack Overflow 上这个 403 问题的经典提问能追溯到十年前。

也就是说：**「拿任意公开视频的字幕全文」这件事，在官方 API 体系里是死路**，连付费档都不存在这个能力。Google Issue Tracker 上有个开放的功能请求（#549911088），希望开放公开视频字幕的只读访问，目前没有下文。YouTube 的立场可以理解——字幕是喂给模型的高价值语料，官方不想做那个「一键洗稿管道」。

顺带一提：`videos.list` 端点能给标题、描述、时长、标签等元信息（API key 即可），但正文语音内容一概没有。如果你只需要元信息，官方 API 依然是正路。

## 二、自爬路线：timedtext 与 PO token 的猫鼠游戏

官方不给，社区就自己爬。YouTube 播放器自己拿字幕的通道是一个内部端点：

```text
GET https://www.youtube.com/api/timedtext?v=<videoId>&lang=<lang>&fmt=json3&…
```

标准流程是：请求 watch 页面 HTML → 从 `ytInitialPlayerResponse` 里解析 `captions.playerCaptionsTracklistRenderer.captionTracks[]`，拿到每条字幕轨的 `baseUrl`（自带一长串签名参数）→ 请求该 URL 得到带时间戳的 JSON 或 XML。2022 年以前这条通道对无登录请求基本不设防，无数「YouTube 转录 API」项目都建立在这上面。

然后是猫鼠游戏的经典三连：

1. **PO token**。2023 年起，`timedtext` 开始要求 **pot（proof-of-origin token）**——一个由浏览器端 BotGuard 跑挑战代码签出来的凭证，裸请求拿到的 `baseUrl` 常常直接返回空内容。yt-dlp 生态为此专门长出了 [bgutil-ytdlp-pot-provider](https://github.com/Brainicism/bgutil-ytdlp-pot-provider) 插件：本地起一个无头浏览器专门生成 PO token 供 yt-dlp 使用。
2. **IP 封禁**。云厂商（AWS / GCP / Azure / DigitalOcean，甚至 Cloudflare Workers）的出口 IP 被 YouTube 大面积标记，请求直接被拒。Python 库 [youtube-transcript-api](https://github.com/jdepoix/youtube-transcript-api)（当前 1.2.4，Python 3.8+）把这些场景封装成了体面的异常和代理支持，但维护者在 issue 里反复说明：**住宅 IP 通常没事，数据中心 IP 基本必挂**，解法只有轮换住宅代理或走 cookie 认证。
3. **游客 watch 页降级**。不给 Cookie 请求 watch 页，返回的 `playerCaptionsTracklistRenderer` 可能整个缺失——你以为视频没字幕，其实只是 YouTube 不想让「空浏览器」看见。

所以「自己爬」在 2026 年的现状是：**本地家宽 + 真实浏览器环境基本可用；一上服务器就开始玄学**。有人实测用 Cloudflare WARP（WireGuard 隧道，走 Cloudflare 的住宅级出口而非 Workers 的数据中心出口）绕开了 IP 封禁，是目前成本最低的自爬姿势。典型命令：

```bash
# yt-dlp：只下字幕不下视频（自动字幕，转成 srt）
yt-dlp --write-auto-subs --skip-download --convert-subs srt \
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

```python
# youtube-transcript-api：返回 [(文本, 开始秒, 持续秒), ...]
from youtube_transcript_api import YouTubeTranscriptApi

chunks = YouTubeTranscriptApi().fetch("dQw4w9WgXcQ", languages=["en"])
text = " ".join(snippet.text for snippet in chunks)
```

还有一条常被遗忘的路线：**Invidious / Piped** 这类开源 YouTube 前端自带 API（`/api/v1/captions/<id>`、`/api/v1/videos/<id>`），能直接吐字幕清单和 WebVTT。但公共实例这两年被 YouTube 的反爬打得七零八落，我先后实测了 yewtu.be、inv.nadeko.net、inv.tux.pizza、invidious.f5.si、iv.melmac.space 等**七个实例**（含 Piped 官方 API pipedapi.kavin.rocks），国内全部连接超时——自托管 + 海外 IP + 自己解决 PO token 才是正解，门槛并不比直接爬低。

对了，国内网络直连 `www.youtube.com` 本身就不通（实测超时），这一整节的所有方案都要先有代理。

## 三、主菜：第三方工具的免登录内部接口实测

「YouTube 转 MP3」「视频转文字」是一个巨大的工具站赛道，kome.ai、NoteGPT、tactiq、youtubetotranscript.com……这些站的网页工具大多宣称「免费、无需注册」。网页不要登录，意味着前端调用的后端接口大概率也不校验登录——把它们从浏览器开发者工具里挖出来，就是一个现成的转录 API。2026 年的各家现状，我逐个实测如下（测试样本：Rick Astley 的《Never Gonna Give You Up》`dQw4w9WgXcQ` 和《Me at the zoo》`jNQXAC9IVRw`；网络环境：国内家宽直连，无代理）。

### kome.ai：连 Cookie 都不要的裸奔接口

kome.ai 是个 AI 工具箱站，其中的 [YouTube Transcript Generator](https://kome.ai/tools/youtube-transcript-generator) 就是前端。它后端就一个端点，POST 一个视频 ID 即可：

```bash
curl -X POST 'https://kome.ai/api/transcript' \
  -H 'Content-Type: application/json' \
  -d '{"video_id":"dQw4w9WgXcQ","format":true}'
```

实测响应（截取）：

```json
{
  "transcript": "[♪♪♪]\n♪ We're no strangers to love ♪\n♪ You know the rules\nand so do I ♪\n…",
  "hasMore": false,
  "length": ""
}
```

要点：

- **零凭证**：不需要 Cookie、不需要 Referer、不需要浏览器 UA，`curl` 裸调即通。
- 返回**纯文本全文**（`format: true` 时带换行），**没有时间戳**——这是它和 NoteGPT 最大的差异，只想「拿全文喂 AI」的话这反而是优点，省得自己拼。
- `video_id` 字段填 11 位视频 ID 或完整 URL 都行。
- 实测连续请求无即时限流（连打三次均约 4–7 秒返回）；接口部署在 **Vercel** 上，CORS 回显任意 Origin，浏览器里直接 `fetch` 也行。
- 错误处理很「朴素」：传不存在的视频 ID，HTTP 依然 200，错误信息塞在 `transcript` 字段里返回英文文案（"Transcripts aren't available for this video…"）；传无字幕的视频则可能长时间挂起直到超时。
- **国内直连可用**（Vercel 域名）。

在 Firecrawl 那篇《Best YouTube Transcript Extractors》盘点里，kome 被归类为「无 API、仅网页工具」——从「官方没提供 API」的意义上说没错，但内部接口摆在这里，能不能用是另一回事。

### NoteGPT：一次性匿名 UUID 的「假登录」

[NoteGPT](https://notegpt.io/) 是个 AI 学习工具站，YouTube 字幕生成器做得相当完整。它老的接口在技术圈流传很广：

```text
GET https://notegpt.io/api/v2/video-transcript?platform=youtube&video_id=<视频ID>
```

直接 curl 它，得到的是 `{"code": 164003, "message": "login expired"}`——看起来免费时代结束了？我用浏览器打开它的工具页实测：**网页端不登录照样能出字幕**（转录文本可用，AI 总结等高级功能才要求登录）。既然网页能用，接口就一定还活着，只是换了姿势。扒网络请求发现前端已经改调新端点：

```text
GET https://notegpt.io/api/v2/video-transcript-v2?platform=youtube&video_id=<视频ID>
```

而「登录过期」的真相是一个 **Cookie**：前端首次访问时会种一个 `anonymous_user_id=<UUID>`，服务端按这个匿名 ID 放行。规律是实测出来的，很有点意思：

- 带一个**任意随机 UUID** 的 `anonymous_user_id` Cookie → `{"code": 100000, "message": "success"}`，连 Referer 和浏览器 UA 都不需要；
- **每个匿名 UUID 只有一次调用机会**：用它取过一条字幕后（哪怕再取同一条），后续一律 "login expired"；换一个新 UUID 立刻复活。

所以可复用的姿势就是每次现造一个 UUID：

```bash
curl 'https://notegpt.io/api/v2/video-transcript-v2?platform=youtube&video_id=dQw4w9WgXcQ' \
  -H "Cookie: anonymous_user_id=$(powershell -NoProfile -Command '[guid]::NewGuid()')"
```

（Linux/macOS 换成 `uuidgen`，或直接在脚本里生成任意 UUID v4 形式的字符串。）

它返回的数据是本文所有方案里**最丰富**的：视频元信息（标题、封面、时长、频道）+ 语言列表 + 三种字幕轨：

```json
{
  "code": 100000,
  "message": "success",
  "data": {
    "videoId": "dQw4w9WgXcQ",
    "videoInfo": { "name": "Rick Astley - Never Gonna Give You Up …", "duration": "213", "author": "Rick Astley", "…": "…" },
    "language_code": [{ "code": "en", "name": "English" }],
    "transcripts": {
      "en": {
        "custom":  [{ "start": "00:00:01", "end": "00:00:49", "text": "[♪♪♪] ♪ We're no strangers …" }],
        "default": [{ "start": "00:00:19", "end": "00:00:22", "text": "♪ We're no strangers to love ♪" }],
        "auto":    [{ "start": "00:00:19", "end": "00:00:22", "text": "♪ We're no strangers to love ♪" }]
      }
    }
  }
}
```

`default` 是创作者上传的手动字幕，`auto` 是 YouTube 自动识别，`custom` 是网页展示用的段落级合并稿（时间戳粗、文本整段）。三轨并存，按需取用。老 v1 端点实测同样还活着，机制一模一样。

另外**国内直连可用**（Cloudflare），接口还带 `Access-Control-Allow-Origin`。对无代理的国内环境来说，kome + NoteGPT 这两个接口基本覆盖了「拿 YouTube 字幕」的全部刚需。

### tactiq：曾经的最爱，如今上了 Firebase App Check

tactiq 是个会议记录工具，它的 [YouTube Transcript Generator](https://tactiq.io/tools/youtube-transcript) 曾经贡献过这条圈子里传播最广的免登录接口：

```bash
curl -X POST 'https://tactiq-apps-prod.tactiq.io/transcript' \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://tactiq.io' \
  -d '{"videoUrl":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","langCode":"en"}'
```

GitHub 上搜这个域名还能翻出一堆教程和存量代码。但实测如今返回：

```text
HTTP 401 — Unauthorized: Missing App Check token
```

tactiq 给这个内部接口挂上了 **Firebase App Check**：请求必须携带其前端运行时由 Firebase SDK 频道签发的 token，裸 HTTP 复刻不通。这是「内部接口生命周期」的典型样本——从裸奔到加锁，往往只需要一次被爬爆的经历。它也说明本文这类情报的**保鲜期很短**。

### 其它几家：快速过一遍

先说还活着的两家：

- **youtubetotranscript.com**：GET `https://youtubetotranscript.com/transcript?v=<id>&current_language_code=en`，返回整页 HTML（字幕在 `transcript-segment` 结构里）。实测对 curl 直接甩 Cloudflare「Just a moment…」人机挑战页，真浏览器可过；国内直连域名可达。适合浏览器里用，不适合程序化调用。
- **youtube-transcript.io**：少数**正经提供文档化 API** 的（`POST /api/transcripts`，body 为 `{"ids": [...]}`），生态位接近商业服务。实测无凭证返回 401 "no token provided"——注册账号拿 token 才能用，免费额度有限。

为了验证「免登录通道还剩多少」，我又拿同一批样本视频补测了一圈圈内提到过的其它候选，全军覆没，而且每家死法都不一样：

| 候选 | 实测死法（2026-09-10） |
| --- | --- |
| youtubetranscript.com | 端点活着（`GET /?server_vid2=<id>` 返回 XML），内容却是一句道歉："YouTube is currently blocking us from fetching subtitles"——被 YouTube 上游封锁，服务本身残废 |
| downsub | `get-info.downsub.com` 对 curl 甩 Cloudflare 人机挑战页 |
| savesubs.com | `POST /action/extract` 返回 `{"status":false,"message":"BLOCKED"}`，主动拦截程序化调用 |
| summarize.tech | HTTP 503，老牌免费总结站，服务降级中 |
| theyoutubetranscript.com | TLS 连接被重置，国内不可达——这是 Reddit r/vibecoding 上「免费转录下载器 + API」帖子的主角 |
| transcript-api.com | 上面那个项目的配套付费 API（starter 档 \$2 / 月），国内同样无响应 |
| getproxytube.com | 302 跳转 RapidAPI，已经变成需要 key 的转售 API |

这份阵亡名单比成活名单更有信息量，三种死法正好对应三类风险：savesubs 的 BLOCKED 是**主动收紧**（和 tactiq 上 App Check、NoteGPT 收紧到匿名 UUID 单次制是同一股趋势）；downsub 用 Cloudflare 挡程序化流量；而 youtubetranscript.com 是**被 YouTube 上游封锁**——它提醒我们一件容易被忽略的事：第三方转录站自己也是自爬路线的玩家，YouTube 的反爬压力会原样穿透到下游工具站，「站着的」和「倒下的」之间只隔一次上游清洗。

另外 Reddit 上还散落着若干独立开发者的「免费 YouTube 转录 API」帖（r/SideProject、r/indiehackers 都有），如今 Reddit 对爬虫和无登录浏览器双重封锁，帖子本身都已难以核验；这类个人服务的平均寿命以月计，不建议托付。至于 NoteGPT / kome 的其它竞品（mapify、transkripe 之类）：同一套「网页工具 + 内部接口」的打法，方法（开 F12 看网络请求）可以照搬，但每一家都处在各自的收紧周期里，逐一列举意义不大。

## 四、商业 API：花钱买省心

把「YouTube 转录」做成正经生意的服务商不少，代表是 [supadata](https://supadata.ai/youtube-transcript-api)。它按 credit 计费，定价实测整理如下（2026-09 官网）：

| 档位 | 月 credit | 价格 | 速率 |
| --- | --- | --- | --- |
| Free | 100 | 免费 | 1 次 / 秒 |
| Basic | 300 | \$5 / 月 | 10 次 / 秒 |
| Pro | 3,000 | \$17 / 月 | 10 次 / 秒 |
| Mega | 30,000 | \$47 / 月 | 50 次 / 秒 |

计费规则：**拿 1 条字幕（含整个视频 / 频道 / 播放列表的元数据）= 1 credit**；视频没有现成字幕、要它家 AI 现场转写的话 1 分钟 = 2 credits；翻译 1 分钟 = 30 credits。免费档每月 100 条对个人工具人其实相当够用。同类还有 RapidAPI 市场里的一票转售商（searchapi、scrapingdog、scrapecreators 等）以及 [youtube-transcript.io](https://www.youtube-transcript.io/)，价位都在同一量级。

它们与免费路线的本质区别：服务方替你扛了 IP 池、PO token、重试这些脏活，并提供 SLA 与支持——以及，**它们的合规责任也由自己承担**。

## 五、横向对比总表

| 维度 | Data API v3 | 自爬 timedtext | youtube-transcript-api / yt-dlp | kome.ai 接口 | NoteGPT 接口 | tactiq 接口 | supadata 等商业 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 凭证 | API key / OAuth | 无（需过反爬） | 无（需过反爬） | **无** | 匿名 UUID Cookie | 已上 App Check | API key |
| 能拿任意视频 | ❌ 仅自家视频 | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| 时间戳 | ✅（自家） | ✅ | ✅ | ❌ 纯文本 | ✅ 三轨 | — | ✅ |
| 元信息 | ✅ | 需另解析 | 需另解析 | ❌ | ✅ 标题封面频道 | — | ✅ |
| 稳定性 | 官方保障 | 猫鼠游戏 | 本地可用、云端易封 | 无 SLA 随时可能关门 | 无 SLA，UUID 单次 | 已关门 | SLA |
| 速率 | 配额制 | 看 IP 脸色 | 看 IP 脸色 | 实测连打无即时限制 | 每 UUID 一次 | — | 1–100 次 / 秒 |
| 国内直连（实测） | ❌ | ❌ | ❌ | ✅ | ✅ | 域名通但 401 | 多数 ✅ |

## 六、选型建议

- **临时拿一条字幕看内容**：kome.ai 一发入魂，全文即 `transcript` 字段。
- **要时间戳 / 元信息 / 多语言轨**：NoteGPT 的 `video-transcript-v2`，记得每次换新的匿名 UUID。
- **个人脚本、低频批量**：海外 VPS 或本地跑 youtube-transcript-api / yt-dlp（配 bgutil PO token 插件），零外部依赖。
- **做产品、要稳定性**：supadata 免费档起步（100 条 / 月），量大了再看定价；别把产品压在 kome / NoteGPT 的内部接口上。
- **国内无代理环境**：正路全灭（youtube.com、googleapis 都不通），kome + NoteGPT 直连可用，是唯二现成通道；要批量就得想办法出海。
- **视频压根没有字幕**：所有「转录」接口都只能拿现成字幕（kome 会超时、NoteGPT 网页的 AI 转写要登录配额）。真兜底是 yt-dlp 下音频 + 本地 Whisper 自己转，这条路最慢但永远有效。

## 七、风险与边界

老规矩，免费野路子的三根刺：

1. **随时关门**。tactiq 加 App Check 就发生在我实测的同时期；NoteGPT 从「裸奔」收紧到「匿名 UUID 单次制」也是演进的结果——每一家都可能在被爬爆后进入下一个收紧周期，第三节的补测阵亡名单（savesubs 主动 BLOCKED、downsub 挂 Cloudflare、youtubetranscript.com 被上游封锁）就是这股趋势的最新快照。这个领域的节奏，和[推文数据那边](/posts/toolsandresources-tweetembedapis/)的 Nitter 三次死亡如出一辙：按「随时可能没」来设计，缓存与降级链（kome → NoteGPT → 自爬）是基本姿势。
2. **ToS 与滥用边界**。内部接口不是公开 API，批量调用实质是白嫖人家服务器，也违背 YouTube 服务条款的精神。个人低频使用属于灰色地带，爬虫化、商用转售则是在雷区蹦迪——别忘了你的每一个请求对方服务端都看得到 IP 和内容偏好。
3. **内容与隐私**。字幕是创作者的内容，注意版权边界；另外经手第三方接口意味着「你查了什么视频」对对方是明牌，介意的话只有自爬或自托管一条路。

对了，如果你对这类「网页工具背后的免登录接口」感兴趣，同一个方法论在微信公众号文章抓取上也能用，之前[写过一篇](/posts/wechat-mp-article-anti-crawl/)：区别在于微信那边校验的是 UA 与频控，YouTube 转录站这边校验的是登录态——归根结底都是在找「网页能用而接口没锁死」的那道缝。

## 参考链接

- [YouTube Data API：captions.download 官方文档](https://developers.google.com/youtube/v3/docs/captions/download)｜[captions.list 文档](https://developers.google.com/youtube/v3/docs/captions/list)｜[Stack Overflow：非本人视频 403](https://stackoverflow.com/questions/32226097/downloading-captions-using-youtube-v3-api)｜[Google Issue Tracker：开放公开视频字幕的请求](https://issuetracker.google.com/issues/549911088)
- [youtube-transcript-api（GitHub）](https://github.com/jdepoix/youtube-transcript-api)｜[PyPI 1.2.4](https://pypi.org/project/youtube-transcript-api/)｜[issue #606：云 IP 被封](https://github.com/jdepoix/youtube-transcript-api/issues/606)｜[issue #379：代理在服务器上失效](https://github.com/jdepoix/youtube-transcript-api/issues/379)
- [Stack Overflow：timedtext 的 pot 参数](https://stackoverflow.com/questions/79668836/youtube-caption-extract-timedtext-api-pot-parameter)｜[bgutil-ytdlp-pot-provider（PO token 生成器）](https://github.com/Brainicism/bgutil-ytdlp-pot-provider)｜[用 Cloudflare WARP 绕开 YouTube IP 封禁](https://blog.arfevrier.fr/leveraging-cloudflare-warp-to-bypass-youtubes-api-restrictions/)
- [kome.ai YouTube Transcript Generator](https://kome.ai/tools/youtube-transcript-generator)｜[NoteGPT 字幕生成器](https://notegpt.io/cn/youtube-transcript-generator)｜[tactiq 转录工具](https://tactiq.io/tools/youtube-transcript)｜[tactiq 端点的存量用法存档（GitHub）](https://github.com/BrainbaseHQ/kafka-master-prompt/blob/main/pipedream_code_test.md)｜[youtubetotranscript.com](https://youtubetotranscript.com/)｜[downsub](https://downsub.com)｜[savesubs](https://savesubs.com)｜[youtubetranscript.com](https://youtubetranscript.com)
- [supadata 定价](https://supadata.ai/pricing)｜[youtube-transcript.io](https://www.youtube-transcript.io/)｜[Firecrawl：Best YouTube Transcript Extractors 2026](https://www.firecrawl.dev/blog/best-youtube-transcript-extractors)｜[OutlierKit：Every Way to Get Transcripts in 2026](https://outlierkit.com/resources/youtube-transcript-api/)
- 相关旧文：[免费拿推文数据的三条路](/posts/toolsandresources-tweetembedapis/)｜[八大平台的免费 API 全景](/posts/toolsandresources-socialplatformsfreeapis/)｜[突破微信公众号文章反爬](/posts/wechat-mp-article-anti-crawl/)
