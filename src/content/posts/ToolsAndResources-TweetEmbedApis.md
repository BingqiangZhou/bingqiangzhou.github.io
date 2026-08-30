---
title: 【工具分享】免费拿推文数据的三条路：X oEmbed、fxtwitter 与 syndication API 实测
published: 2026-08-30
description: 想拿一条推文的正文、展开后的链接、长推全文和媒体直链，不一定得给 X API 交钱：官方 oEmbed 免费但只给「喂浏览器」的 HTML，社区项目 fxtwitter 直接吐结构化 JSON，react-tweet 则逆向了 X 内部的 syndication 接口。本文实测对比三条路，顺带盘点 vxtwitter 等同类服务、国内网络可达性与风险边界。
lang: zh
tags:
  - 工具分享
  - 实践记录
---

最近在折腾一个需求：把一条推文的内容「拿下来」——正文、里面带的链接、媒体文件、互动数据。按正路走当然是用 X API v2，但看一眼 2026 年的定价就会冷静下来：官方 API 已全面转向按量付费，读取约 \$0.005 一条（每月上限 200 万条），发帖 \$0.015 一条，带链接的帖子 \$0.20 一条；老的 Free / Basic \$200 / Pro \$5000 订阅档已经不对新用户开放。换算一下：读一千条推文，五美元。

好在还有免费的路。这篇笔记整理并实测了三条：**X 官方 oEmbed**、社区项目 **fxtwitter**，以及 react-tweet 背后的 **syndication 内部接口**，顺带盘点同类服务。先说结论：

> 要「嵌入展示」——官方 oEmbed；要「结构化数据」——fxtwitter；想在自己博客里渲染静态推文卡片——react-tweet；发链接给 Discord / Telegram 朋友——直接把 `x.com` 换成 `fxtwitter.com` 或 `vxtwitter.com`。全部免费，无需任何 key。

## 一、X 官方 oEmbed：免费、不限流，但返回的是「喂浏览器的」

oEmbed 是 X 官方体系里仅存的免费读取通道，和官网的「生成嵌入代码」工具（publish 工具）同源。端点长这样：

```bash
curl "https://publish.x.com/oembed?url=https://x.com/jack/status/20"
```

旧域名 `publish.twitter.com/oembed` 也仍指向同一服务。无需开发者账号、无需 Bearer Token，官方文档甚至直接标注 **Rate limited: No**。

常用参数（完整列表见文末官方文档）：

| 参数 | 说明 |
| --- | --- |
| `url` | 必填，推文 URL（配 `widget_type=timeline` 还能嵌时间线） |
| `theme` | `light` / `dark` |
| `maxwidth` | 220–550，默认 325（超过 550 按原生窄卡处理） |
| `hide_media` / `hide_thread` | 隐藏媒体 / 隐藏对话上下文 |
| `omit_script` | 返回里不塞 widgets.js 的 `<script>` 标签 |
| `align` / `lang` / `dnt` | 对齐、界面语言、禁用个性化追踪 |

返回的是标准 oEmbed JSON（官方文档示例，截取）：

```json
{
  "url": "https://twitter.com/Interior/status/463440424141459456",
  "author_name": "US Dept of Interior",
  "author_url": "https://twitter.com/Interior",
  "html": "<blockquote class=\"twitter-tweet\"><p lang=\"en\" dir=\"ltr\">Sunrise at yesterday's … <a href=\"http://t.co/YuKy2rcjyU\">pic.twitter.com/YuKy2rcjyU</a></p>&mdash; US Dept of Interior (@Interior) <a href=\"…\">September 4, 2014</a></blockquote>\n<script async src=\"//platform.twitter.com/widgets.js\" charset=\"utf-8\"></script>",
  "width": 550,
  "height": null,
  "type": "rich",
  "cache_age": "3153600000"
}
```

`html` 字段就是一段 `<blockquote>` 加上加载 widgets.js 的脚本：浏览器执行脚本后，会把 blockquote 替换成跨域 iframe，那才是我们熟悉的嵌入式推文卡片。`cache_age` 折合约 100 年，官方在暗示「随便缓存」；`height` 恒为 `null`（官方不支持 `maxheight`）。

如果需求只是「把推文嵌进网页」，它是完美答案。但想拿数据，四个硬伤马上暴露：

1. **正文埋在 HTML 里**。文本在 `<p>` 标签中，混着 `<a>`、HTML 实体（`&mdash;`）和作者签名行，得自己剥。
2. **链接是 t.co 短链**。`href` 指向 `https://t.co/xxx`，真实目标 URL 不可得，只能自己跟一遍 301/302 重定向：

   ```bash
   curl -sI https://t.co/YuKy2rcjyU | awk 'tolower($1)=="location:"{print $2}'
   ```

3. **长推按「展示版」截断**。X Premium 用户能发上万字符的 Note 长推，但嵌入体系只给截断版正文——渲染出的卡片里是个 "Show more" 按钮（Terence Eden 有过专门观察），oEmbed 也没有任何参数可以索取全文。官方 API v2 里对应的解法是 `tweet.fields=note_tweet`，而那正是要花钱的部分。
4. **几乎没有附加数据**。互动数、浏览量、社区笔记、投票、媒体原始直链统统没有（媒体只存在于渲染后的 iframe 里）。

真要从 oEmbed 里剥正文，大致长这样（Node）：

```js
const { html } = await fetch(
  'https://publish.x.com/oembed?url=https://x.com/jack/status/20'
).then(r => r.json())
const text = html
  .match(/<p[^>]*>([\s\S]*?)<\/p>/)[1] // <p> 里就是正文
  .replace(/<[^>]+>/g, '')             // 去掉正文里的内联标签
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
```

正则方案对作者签名行天然免疫（它在 `<p>` 外面），代价是要自己处理 HTML 实体；更稳的做法是上 cheerio 之类直接解析。

它最大的优势是**存续保证**：官方接口、官方文档、明确标注不限流，而且每条推文的页面源码里自带 oEmbed 发现链接（`<link rel="alternate" type="application/json+oembed" href="https://publish.x.com/oembed?url=…">`）。

另外有个实测出来的现实问题：**国内网络直连不通**。`publish.x.com`、`publish.twitter.com` 在我这边的家用宽带上都直接超时，`pbs.twimg.com`（媒体 CDN）和 `cdn.syndication.twimg.com` 一样全灭。也就是说，面向国内读者的网页嵌入 widgets.js 推文卡片，大概率加载失败——这与接口本身无关，是网络环境问题，但对选型很关键。

## 二、fxtwitter：社区项目，直接给 JSON

fxtwitter 是这条需求下口碑最好的社区方案。项目几经更名：最早叫 **FixTweet**，后来叫 **FxTwitter**，现在的整体品牌是 **FxEmbed**——同时运营 `fxtwitter.com`（twitter.com 前加 fx）、`fixupx.com`（x.com 前加 fixup）和 `fxbsky.app`（Bluesky）。TypeScript 写在 Cloudflare Workers 上，MIT 协议，约 5k star，支持完全自托管。取数走的是 X 网页端同款的 GraphQL 内部接口，源码里配了多端点负载均衡和凭据管理（`src/helpers/graphql.ts`、`endpointBalancing.ts` 可考）——这也是后文「非官方通道」风险的具体含义。

两种用法。

**用法一：换域名修嵌入。** 把推文 URL 里的 `x.com` 换成 `fxtwitter.com`（或 `fixupx.com`），Discord、Telegram 就能原生播放视频、展示多图拼图（mosaic）、投票和引用推。这是它最初的存在意义——Discord 桌面端的官方嵌入放不了 X 视频。原理是换域名后服务端返回带 Open Graph meta 的页面，Discord / Telegram 的预览爬虫读 OG 标签渲染富卡片，全程不依赖 X 的脚本和 iframe。顺带一提，项目源码的 provider 目录如今已覆盖 twitter / bluesky / instagram / mastodon / threads / tiktok 六个平台（文档目前主推 X 和 Bluesky 两个）。

**用法二：JSON API，本篇的主角。** `api.fxtwitter.com` 暴露的就是它生成嵌入卡片所用的同一份数据：

```bash
curl "https://api.fxtwitter.com/jack/status/20"
```

v1 端点格式为 `api.fxtwitter.com/<screen_name>/status/<id>`，`screen_name` 可省略；另有 `/2/` 前缀的 v2 端点族。实测返回（截取）：

```json
{
  "code": 200,
  "message": "OK",
  "tweet": {
    "url": "https://x.com/jack/status/20",
    "id": "20",
    "text": "just setting up my twttr",
    "raw_text": { "text": "just setting up my twttr", "display_text_range": [0, 24], "facets": [] },
    "author": {
      "screen_name": "jack",
      "name": "jack",
      "avatar_url": "https://pbs.twimg.com/profile_images/…/azNjKOSH_200x200.jpg",
      "followers": 11829755,
      "verification": { "verified": true, "type": "individual" }
    },
    "replies": 18004,
    "retweets": 124743,
    "likes": 308665,
    "bookmarks": 21361,
    "quotes": 7049,
    "is_note_tweet": false,
    "community_note": null,
    "source": "Twitter Web Client",
    "created_at": "Tue Mar 21 20:50:14 +0000 2006"
  }
}
```

对着 oEmbed 的四个硬伤，逐条看它怎么解决：

- **正文即字段**：`text` 直接可用。
- **t.co 已展开**：`text` 里的短链已被替换成真实 URL，`raw_text.facets` 还保留三份信息备查。实测一条马斯克的推文：

  ```json
  {
    "type": "url",
    "indices": [67, 90],
    "original": "https://t.co/y4QwutjXce",
    "replacement": "https://grok.com/share/bGVnYWN5_dfaad20f-…",
    "display": "grok.com/share/bGVnYWN5…"
  }
  ```

- **长推全文**：`is_note_tweet` 标记是否长推。我拿一条 904 字符的 Note 推文实测，`text` 与 `raw_text.text` 均为完整 904 字符，一字不少。
- **附加数据管够**：互动数之外还有 `views`（浏览量，实测一条 324 万）、`bookmarks`、`community_note`（社区笔记全文）、`poll`（投票选项与百分比）、`quote`（引用推的递归结构）、`media.photos[].url`（`pbs.twimg.com` 原图直链）、`media.videos[].formats`（多码率 mp4）、`source`（发推客户端）等；带 `lang` 参数还会附赠机器翻译。

v2 端点族更夸张：线程展开（`/2/thread/:id`）、对话树（`/2/conversation/:id`）、用户时间线、粉丝 / 关注列表、搜索、趋势……共 16 个端点，带完整 OpenAPI 3.0 文档（`https://api.fxtwitter.com/2/openapi.json`）。文档标注速率限制为**每 IP 1000 次 / 分钟**，个人工具完全够用；更高需求可 Docker 自托管（官方文档有部署指南，按 Host header 区分 fxtwitter / fixupx / fxbsky 三个域，多图拼图需另配 Mosaic 服务）。

实测还有两个对做工具友好的细节：响应带 `Access-Control-Allow-Origin: *`，浏览器里可以直接 fetch；`x-powered-by` 响应头暴露部署版本（写这篇时是 `fixtweet-main-e4bf81c-2026-08-28T23:31:35`，顺带一提还有个 `x-trans-rights: true` 的彩蛋，很有社区项目的味道）。

文档没大书特书、但源码里确实有而且我实测可用的几样东西：

- **RSS / Atom 订阅**：`fxtwitter.com/<handle>/feed.xml`（另有 `feed.atom.xml`、`media.xml`、`media.atom.xml`），把任意公开时间线变成标准 RSS 源，正文直接在 `<item>` 里。配合下面的国内可直连，这是订阅 X 用户最现实的姿势之一。
- **自家 oEmbed 端点**：`fxtwitter.com/owoembed?url=…`，给自家嵌入页用的，路径起得很皮；第三方也能拿它对接标准 oEmbed 消费端。
- **媒体尺寸参数**：API 返回的图片直链长这样 `pbs.twimg.com/…?name=orig`，把 `name=` 换成 `large` / `medium` / `small` 就是不同尺寸。
- 官方还维护着状态页 `status.fxtwitter.com`，依赖它做工具的可以盯着。

另外，`api.fxtwitter.com` 与 `api.vxtwitter.com` 国内均可直连（都架在 Cloudflare 上），这点比所有 X 官方域名都强。

## 三、同类服务巡礼

### react-tweet 与 syndication 接口

Vercel 的 react-tweet 是「在博客里渲染推文卡片」这个细分需求的事实标准。它的取数通道不是 oEmbed，而是逆向了 X 嵌入体系内部的 syndication 接口——publish 官方工具渲染预览用的就是它：

```text
GET https://cdn.syndication.twimg.com/tweet-result?id=<推文ID>&lang=en&token=<token>&features=…
```

免 key，返回完整 JSON。`token` 由推文 ID 算出，react-tweet 源码里就一行：

```ts
const getToken = (id: string) =>
  ((Number(id) / 1e15) * Math.PI).toString(6 ** 2).replace(/(0+|\.)/g, '')
```

（除以 1e15、乘 π、转 36 进制、去掉零和小数点。）react-tweet 把数据渲染成与官方嵌入几乎一样的 React 组件，纯静态、无客户端 JS，很适合 Astro / Next 这类静态站。但它是**未文档化的内部接口**，历史上出过整站嵌入集体挂掉的事故，官方修不修全看心情；react-tweet 文档自己也建议服务端取数并缓存。国内直连同样不通。

### vxtwitter（BetterTwitFix）

vxtwitter 是与 fxtwitter 同期的另一个修嵌入项目（dylanpdx 的 BetterTwitFix，起家于一个 Flask 服务），域名玩法一样：`twitter.com` 换 `vxtwitter.com`（别名 `fixvx.com`）。同样有 JSON API：

```bash
curl "https://api.vxtwitter.com/jack/status/20"
```

字段比 fxtwitter 朴素得多，但对「只要正文和媒体」的场景非常顺手：`text`（实测长推也给全文）、`mediaURLs`（**直链 mp4**，实测一条视频推直接给出 `video.twimg.com/…/xxx.mp4`）、`media_extended`（带 `altText` 无障碍描述、宽高、时长）、`qrt`（引用推）。还有两个很有归档味道的彩蛋参数：`include_rtf` / `include_txt`，会在媒体列表里追加一个 .rtf / .txt 文件链接，方便某些归档软件直接吃。响应经 CDN 缓存 24 小时，同样开 CORS。

dylanpdx 顺手把同一套模式复制到了其他平台：`vxreddit.com`、`vxtiktok.com`、`vxinstagram.com`（Instagram 版现由社区接手维护）、`vxBsky`；Instagram 领域更流行的是受 fxtwitter 启发的 InstaFix（`ddinstagram.com`）。社区有人维护着一份各平台「嵌入修链接」服务的清单 gist，收录比本文全得多。

### 前车之鉴：Nitter 的三次死亡

做推文数据源绕不开 Nitter 这个名字，它的轨迹是非官方方案风险的完整样本：2024 年 2 月 X 关闭游客账号接口，Nitter 宣告死亡；2025 年 2 月靠真实账号的「自挂」方式复活；2026 年 8 月 25 日，X 直接向 Nitter 发出律师函，nitter.net 与 xcancel 相继下线——就在我写这篇笔记的五天前。第三方 oEmbed 聚合器（如 noembed）对 x.com 的支持也早已不稳，实测已返回 "no matching providers"。结论：**任何依赖 X 非官方接口的方案，都要按「随时可能没」来设计**。

### 对照组：Bluesky 的官方免费通道

把 X 换成 Bluesky，本文的很多痛点在官方侧就不存在。实测 `embed.bsky.app/oembed?url=…`：免 key、标准 oEmbed JSON，而且**正文全文直接放在 `<p>` 里**（连换行都保留），`cache_age` 86400 秒；官方还维护着一套文档化的公开只读 API（`public.api.bsky.app` 的 XRPC 接口，同样无需 key）。回头再看 X 的 oEmbed：截断和 t.co 更像是产品选择，不是 oEmbed 规范本身的限制。当然，国内网络对 `bsky.app` 系域名同样不通（实测全部超时），想直连还是得走 `api.fxbsky.app`（FxEmbed 家族的 Bluesky API，响应结构与 fxtwitter 对齐）。

### 其它零碎

- **商业聚合器**（Iframely、Embed.ly）：包一层官方 oEmbed，HTML 的所有局限原样继承，胜在稳定省事。
- **直接爬 x.com 页面**：页面对爬虫会吐 og meta（正文在 title / description 里），但游客访问限制越来越紧，且明显违反 ToS，不建议。

## 四、横向对比总表

| 维度 | X 官方 oEmbed | fxtwitter API | vxtwitter API | syndication（react-tweet） |
| --- | --- | --- | --- | --- |
| 运营方 | X 官方 | 社区开源（FxEmbed） | 社区开源（dylanpdx） | X 内部接口（社区逆向用法） |
| 价格 / 凭证 | 免费无 key | 免费无 key | 免费无 key | 免费无 key |
| 返回形态 | HTML 片段 | 结构化 JSON | 结构化 JSON | 结构化 JSON |
| 正文 | 藏在 `<p>` 里需自己剥 | `text` 直接可用 | `text` 直接可用 | `text` 直接可用 |
| t.co 短链 | 需自己跟重定向 | 已展开 + facets 三份记录 | 已展开 | entities 里带展开 URL |
| 长推全文 | 截断 | 全文（`is_note_tweet`） | 实测全文 | 未验证 |
| 附加信息 | 仅作者 / 尺寸 | 引用推、社区笔记、浏览量、书签、投票、媒体直链、翻译 | 引用推、社区笔记、投票、altText | 互动数、媒体 |
| 速率限制 | 官方标注不限流 | 文档 1000 次 / 分 / IP | 未见标注 | 未文档化 |
| 国内直连（实测） | 不通 | 通 | 通 | 不通 |
| 稳定性 | 官方存续保证最强 | 无 SLA，历史事故修复快 | 无 SLA | 无 SLA，出过全站故障 |

## 五、选型建议

- **网页嵌入推文卡片**：海外受众用官方 oEmbed 最省心；自己的静态博客想要不加载第三方脚本的静态卡片，用 react-tweet（服务端取数 + 缓存）。
- **做工具、拿数据**：fxtwitter 首选——字段最全、文档最全（OpenAPI）、出事能自托管兜底。
- **只要媒体直链 / 做归档**：vxtwitter 朴素直接，`mediaURLs` 一行拿完，还有 txt / rtf 彩蛋。
- **发链接给朋友**：Discord / Telegram 里换域名（`fxtwitter.com`、`fixupx.com`、`vxtwitter.com`）。
- **国内场景**：接口层面 fxtwitter / vxtwitter 可直连，但媒体直链都在 `pbs.twimg.com` / `video.twimg.com` 上，国内访客加载不了——要给国内用户用，得自己转存媒体或走代理；给国内读者的博客嵌推文，截图依然是最稳的。
- **生产级依赖**：务必加缓存（连官方 oEmbed 都建议缓存 100 年了）和降级链（fxtwitter → vxtwitter → oEmbed）；真到不能断的程度，老老实实上官方按量付费 API。

## 六、风险与边界

免费是有代价的。fxtwitter 依赖 X 的非官方通道，历史上因 X 改接口断供过（issue #333），修得快但没有赔偿；syndication 出过全站嵌入故障；Nitter 收律师函是五天前的事。这些方案做个人工具、做展示、做低频归档都没问题，但**不要当数据库用，不要商用转售，重要数据尽早落盘**。还有个容易被忽略的隐私面：用社区 API 意味着对方服务端看得到你取了哪些内容、从哪个 IP 取的——介意的话，自托管是唯一彻底的解法。日常使用也请守在文档限速（1000 次 / 分 / IP）以内，别把它当爬虫后端。另一面，oEmbed 虽然免费稳定，但它的定位就是「给浏览器嵌入用」，拿来取数据是勉为其难。

## 参考链接

- [X 官方 oEmbed 文档](https://docs.x.com/x-for-websites/oembed-api)｜[X API 按量付费定价](https://docs.x.com/x-api/getting-started/pricing)｜[2026-04 定价更新公告](https://devcommunity.x.com/t/x-api-pricing-update-owned-reads-now-0-001-other-changes-effective-april-20-2026/263025)
- [FxEmbed 官方文档](https://docs.fxembed.com/)｜[API 概览](https://docs.fxembed.com/api/introduction/)｜[GitHub 仓库](https://github.com/FixTweet/FixTweet)
- [react-tweet 官网](https://react-tweet.vercel.app/)｜[Vercel 发布博客](https://vercel.com/blog/introducing-react-tweet)｜[syndication 接口的发现过程（issue #76）](https://github.com/vercel/react-tweet/issues/76)｜[fetch-tweet.ts 源码](https://github.com/vercel/react-tweet/blob/main/packages/react-tweet/src/api/fetch-tweet.ts)
- [BetterTwitFix 仓库](https://github.com/dylanpdx/BetterTwitFix)｜[vxtwitter API 文档（api.md）](https://github.com/dylanpdx/BetterTwitFix/blob/main/api.md)｜[各平台嵌入修链接服务清单（gist）](https://gist.github.com/Lexedia/bbbde4dbbf628b0bfe8476a96a977a8f)｜[InstaFix（ddinstagram）](https://github.com/Wikidepia/InstaFix)
- [Terence Eden：嵌入长推的 Show more 观察](https://mastodon.social/@Edent/112920187385651147)｜[devcommunity：希望 oEmbed 保留原文](https://devcommunity.x.com/t/keep-original-text-in-oembed-urls/165324)｜[devcommunity：全站嵌入故障事件](https://devcommunity.x.com/t/all-twitter-embeds-seem-to-be-broken/210735)
- [shkspr.mobi：不需要 API key 归档推特数据](https://shkspr.mobi/blog/2025/04/you-dont-need-an-api-key-to-archive-twitter-data/)｜[TechCrunch：X 向 Nitter 发律师函（2026-08-25）](https://techcrunch.com/2026/08/25/x-sends-cease-and-desist-to-open-source-project-nitter-over-alleged-scraping/)｜[Nitter 维基百科](https://en.wikipedia.org/wiki/Nitter)
- [Bluesky 开发者文档（含公开 XRPC API）](https://docs.bsky.app)｜[FxEmbed 状态页](https://status.fxtwitter.com/)
