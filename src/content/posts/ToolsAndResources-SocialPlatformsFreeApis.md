---
title: 【工具分享】八大平台的免费 API 全景：官方、oEmbed、RSS 与社区通道实测
published: 2026-08-30
description: 承接上一篇 X 的研究：把 FxEmbed 源码里出现的六个平台（X、Bluesky、Mastodon、Threads、Instagram、TikTok）加上 YouTube 和 Discord 一次盘完。每个平台一张 API 清单表，按官方 API、官方 oEmbed、原生 RSS、社区通道、国内直连五个维度整理，重点标注免费通道——结论是它们正好分成了完全开放、半开放、封闭三个梯队，Discord 则是「免费但私有」的特例。
lang: zh
tags:
  - 工具分享
  - 实践记录
---

[上一篇笔记](/posts/toolsresources-tweetembedapis/)研究「免费拿推文数据」时，我翻了 fxtwitter（FxEmbed）的源码，发现它的 provider 目录里躺着六个平台：twitter、bluesky、instagram、mastodon、threads、tiktok。索性把 YouTube 和 Discord 也加上，一次把主流平台盘完。

统一视角看五件事：**官方 API 免费到什么程度、官方 oEmbed 免不免 token、原生 RSS 还在不在、社区通道有哪些、国内能不能直连**。文中所有「实测」均在 2026-08-30 完成：本机为国内家庭宽带，服务端验证借助网页抓取服务（下文不再重复标注）。每个平台配一张 API 清单表，免费通道加粗。

## 总表

| 平台 | 官方 API | 官方 oEmbed | 原生 RSS | 代表性社区通道 |
| --- | --- | --- | --- | --- |
| X | 按量付费（读约 \$0.005/条） | 免 key，但正文截断、t.co 短链 | 无 | fxtwitter、vxtwitter、syndication |
| Bluesky | 免费免 key（XRPC） | 免费，全文就在 `<p>` 里 | 无 | api.fxbsky.app |
| Mastodon | 免费免 key（REST） | 免费免 key | **有**（`@user.rss`） | 基本不需要 |
| Threads | 免费，偏发布向，读取需 App Review | **2026-03 起免 token** | 无 | FxEmbed 实验中（未上线域名） |
| Instagram | 免费，但要商业账号 + token + 审核 | 要 token | 无 | InstaFix、vxinstagram |
| TikTok | 免费，OAuth / 学术申请 | 免 key | 无 | vxtiktok、FxEmbed 实验域名 |
| YouTube | 免费 + key + 每日 1 万配额 | 免 key，不占配额 | **有**（频道 feed） | Invidious / Piped、yt-dlp |
| Discord | 免费全家桶，但都要 Bot Token | 无（聊天平台） | 无 | Lanyard（presence） |

国内直连实测（本机）：**通**的有 `api.fxtwitter.com`、`api.vxtwitter.com`、`api.fxbsky.app`、`noembed.com`、`api.lanyard.rest`，以及个别 Mastodon 实例（联邦网络的好处）；**不通**的包括 X 全家（publish.x.com、pbs.twimg.com、cdn.syndication.twimg.com）、Bluesky 全家、threads.com、graph.threads.com、tiktok.com、youtube.com、mastodon.social、graph.facebook.com、discord.com。规律很直白：平台官方域名全军覆没，架在 Cloudflare 上的社区服务基本都活着。

## X：上一篇的主角

结论都在[上一篇](/posts/toolsresources-tweetembedapis/)，一句话版：官方 oEmbed 免费不限流但「喂浏览器」，官方 API 按量付费，结构化数据用社区方案。

| API / 通道 | 端点 | 鉴权 | 费用 | 限制与备注 |
| --- | --- | --- | --- | --- |
| **官方 oEmbed** | `publish.x.com/oembed` | 无 | **免费** | 官方标注不限流；HTML 片段、t.co 短链、长推截断 |
| 官方 X API v2 | `api.x.com/2/*` | OAuth / Bearer | 按量付费 | 读约 \$0.005/条；`note_tweet` 字段拿长推全文；旧订阅档对新用户停售 |
| **社区：syndication** | `cdn.syndication.twimg.com/tweet-result` | 无 | **免费** | 未文档化内部接口；react-tweet 同款；token 一行公式算出 |
| **社区：fxtwitter** | `api.fxtwitter.com` | 无 | **免费** | 1000 req/min/IP；v1/v2 端点 + OpenAPI；`feed.xml` 订阅时间线；国内可直连 |
| **社区：vxtwitter** | `api.vxtwitter.com` | 无 | **免费** | `mediaURLs` 直链 mp4、altText；CDN 缓存 24h；国内可直连 |

## Bluesky：官方就是「别人家的社区 API」

Bluesky 是八家里官方通道最慷慨的。公开只读入口 `public.api.bsky.app` **免 key 免注册**，服务端实测 `getPostThread`：正文、互动数（likeCount 9343 一目了然）、嵌入媒体的 alt 文本、作者认证信息一应俱全。需要写操作时用「应用密码」（设置里生成、可撤销、可限定范围），底层是开放的 AT Protocol，甚至可以自托管 PDS 当数据源。

| API / 通道 | 端点 | 鉴权 | 费用 | 限制与备注 |
| --- | --- | --- | --- | --- |
| **官方 XRPC API（公开读）** | `public.api.bsky.app/xrpc/*` | 无 | **免费** | getPostThread / searchFeed 等；实测全量数据 |
| 官方 XRPC API（完整） | `api.bsky.app/xrpc/*` | 应用密码 | **免费** | 写操作、DM 等；docs.bsky.app |
| **官方 oEmbed** | `embed.bsky.app/oembed` | 无 | **免费** | 正文全文就在 `<p>` 里（实测） |
| **Jetstream firehose** | `jetstream1.bsky.network`（WebSocket） | 无 | **免费** | 全站实时事件流，可按 DID 过滤；可自托管 |
| 聊天（DM） | `chat.bsky.social`（`app.bsky.chat.*`） | 应用密码 | **免费** | 私信收发 |
| **社区：fxbsky** | `api.fxbsky.app` | 无 | **免费** | `/2/status/<handle>/<rkey>`；OpenAPI；国内可直连 |

没有原生 RSS，订阅需求用上面的 fxbsky 或第三方补。

## Mastodon：三件套全免费，还自带 RSS

Mastodon 是「开放」的基准线，官方三件套（REST、oEmbed、RSS）全部免费免 key。API 是**实例级**的，找一个可达实例就能用——mastodon.social 在国内被墙，但联邦网络里总有活着的，我在 `mementomori.social` 上完成了全链路本机实测：

```bash
# 公共时间线（免鉴权）
curl "https://mementomori.social/api/v1/timelines/public?local=true&limit=1"
# oEmbed：把任意嘟文 URL 传给 /api/oembed
curl "https://mementomori.social/api/oembed?url=https://mementomori.social/@user/117184070418133181"
# RSS：个人主页地址加 .rss 后缀
curl "https://mementomori.social/@HS_muutokset.rss"
```

| API / 通道 | 端点 | 鉴权 | 费用 | 限制与备注 |
| --- | --- | --- | --- | --- |
| **官方 REST API（公开读）** | `<实例>/api/v1/*` | 无 | **免费** | lookup / statuses / timelines public 实测通过 |
| 官方 REST API（写/搜索） | 同上 | OAuth Bearer | **免费** | 搜索、关注时间线、发嘟文需要 token |
| **官方 oEmbed** | `<实例>/api/oembed?url=` | 无 | **免费** | 实测返回 blockquote + embed 页，cache_age 86400 |
| **原生 RSS** | `<实例>/@user.rss` | 无 | **免费** | 标准 RSS 2.0，正文、媒体、头像齐全（实测） |
| Streaming API | wss（经 `/api/v1/instance` 发现） | 要 token | **免费** | 匿名流已因滥用被关闭 |
| 实例发现 | `instances.social/api/` | 免费申请 token | **免费** | 找可达实例、比价配置 |

注意「全网」视角不存在，只能按实例查询；但对「拿某人公开嘟文 / 订阅某人」这类需求，官方通道已经完备到社区方案没有存在的必要。

## Threads：官方 API 门槛犹在，但 oEmbed 今年刚「免签」

Threads 的官方 API 免费但偏**发布向**：发帖、回复管理、insights、查询提及自己的帖子，都只能访问自己的账号；读别人的内容要走 App Review（2026 年起陆续放出了关键词搜索等读取能力，配额也放得细：发布 250 帖 / 24 小时，关键词搜索 500 次 / 7 天）。对只想嵌入展示的开发者，今年有个大变化：**2026 年 3 月 3 日起 oEmbed 免 token、免审核**。实测：

```bash
curl "https://graph.threads.com/v1.0/oembed?url=https://www.threads.com/@threadsapi.changelog/post/DVcNwt2jDZS/"
```

```json
{
  "type": "rich",
  "version": "1.0",
  "html": "<blockquote class=\"text-post-media\" data-text-post-permalink=\"https://www.threads.com/t/DVcNwt2jDZS…\">…View on Threads…</blockquote>\n<script async src=\"https://www.threads.com/embed.js\"></script>",
  "provider_name": "Threads",
  "width": 658
}
```

| API / 通道 | 端点 | 鉴权 | 费用 | 限制与备注 |
| --- | --- | --- | --- | --- |
| 官方 Threads API | `graph.threads.com/v1.0/*` | OAuth（Threads 登录） | **免费** | 发布 250 帖/24h；关键词搜索 500 次/7 天；读他人内容要 App Review |
| **官方 oEmbed** | `graph.threads.com/v1.0/oembed` | 无（2026-03-03 起） | **免费** | 1000 req/h；maxwidth 320–658；详见下方两个坑 |
| 官方 WordPress 插件 | meta-embeds-for-wordpress | 无 | **免费开源** | Threads / Instagram / Facebook 一把抓 |
| 社区：FxEmbed threads | （未上线） | - | - | 源码有 provider、`.env.example` 无域名 |

oEmbed 的两个坑：一是 fallback HTML 是一张「View on Threads」占位卡，**正文不在里面**，要靠 `embed.js` 渲染（这点连 X 都不如，X 的 `<p>` 里至少有截断版正文）；二是官方文档写明**用途限制**：这个端点只能用于在网站/应用里嵌入展示，把返回的元数据用于提取、分析、持久化都是明确禁止的——想拿数据做归档，此路不通。

## Instagram：最封闭的一家

Instagram 把门关得最死。当年给个人开发者用的 Basic Display API 已于 **2024 年 12 月 4 日彻底关停**；现在官方分成两条路，都要专业账号（商业/创作者）且各有审核门槛；连官方 oEmbed 端点都要 access token。网页通道也一样：游客访问基本看不到内容，og meta 时灵时不灵。

| API / 通道 | 端点 | 鉴权 | 费用 | 限制与备注 |
| --- | --- | --- | --- | --- |
| Instagram Graph API（FB 登录） | `graph.facebook.com/v*/*` | OAuth + 商业账号 + App Review | **免费**（无按次收费） | 发布 / insights / 评论管理全家桶，功能最全 |
| Instagram API with IG Login | `graph.instagram.com` | OAuth（IG 账号直接登录，免 FB 绑定） | **免费** | 2024-07 推出；消息 + insights，功能仍在追赶前者 |
| 官方 oEmbed | `graph.facebook.com/…/instagram_oembed` | 要 access token | **免费** | 对比 Threads 三月刚免 token，很讽刺 |
| **社区：InstaFix** | `ddinstagram.com` | 无 | **免费** | README 写着「深受 fxtwitter 启发」 |
| **社区：vxinstagram** | `vxinstagram.com` | 无 | **免费** | 社区接手维护 |
| **社区：FxEmbed IG** | `67instagram.com` | 无 | **免费** | `.env.example` 可查，实验性质 |

无 RSS。Meta 对社区服务的态度是持续打击，域名随时可能被夺回或屏蔽——Instagram 的嵌入方案要做好随时换域名的准备。

## TikTok：oEmbed 大方，数据 API 严格分层

官方 oEmbed 是八家里最「直给」的：`https://www.tiktok.com/oembed?url=<视频或主页URL>`，免 key 免注册，服务端实测：

```json
{
  "version": "1.0",
  "type": "video",
  "title": "Scramble up ur name & I'll try to guess it😍❤️ #foryoupage #petsoftiktok #aesthetic",
  "author_url": "https://www.tiktok.com/@scout2015",
  "author_name": "Scout and Suki",
  "html": "<blockquote class=\"tiktok-embed\" cite=\"https://www.tiktok.com/@scout2015/video/6718335390845095173\" …>…</blockquote>\n<script async src=\"https://www.tiktok.com/embed.js\"></script>",
  "thumbnail_url": "https://p16-tiktok-va.ibyteimg.com/obj/tos-maliva-pz0068/…?x-expires=1594850400&x-signature=…",
  "provider_name": "TikTok"
}
```

标题、作者、缩略图、嵌入代码一次给全。两个坑：`thumbnail_url` 是带签名和过期时间的（`x-expires`），**不能当长期图床用**；正文细节靠 `embed.js` 渲染。

| API / 通道 | 端点 | 鉴权 | 费用 | 限制与备注 |
| --- | --- | --- | --- | --- |
| **官方 oEmbed** | `www.tiktok.com/oembed?url=` | 无 | **免费** | 支持视频和创作者主页 URL；缩略图签名时效 |
| Display API | OAuth | OAuth | **免费** | 读用户自己的资料/视频（`user.info.basic` 等 scope） |
| Content Posting API | OAuth | OAuth + 应用审核 | **免费** | 视频直发/草稿；上架要过 audit（SELF_ONLY 模式起步） |
| Research API | 申请制 | 学术机构资质 | **免费** | 公共内容研究；条款限制数据留存与共享 |
| **社区：vxtiktok** | `vxtiktok.com` | 无 | **免费** | 换域名修嵌入 |
| **社区：FxEmbed tiktok** | `fixtok.wuff.gay`、`dxtiktok.com` 等 | 无 | **免费** | 实验域名组，风格奔放 |

## YouTube：免费但全在「配额经济学」里

| API / 通道 | 端点 | 鉴权 | 费用 | 限制与备注 |
| --- | --- | --- | --- | --- |
| **官方 oEmbed** | `www.youtube.com/oembed?url=` | 无 | **免费** | 不占任何配额；标题/作者/缩略图/iframe；无统计数据 |
| Data API v3 | `googleapis.com/youtube/v3/*` | API key（免费申请） | **免费** | 每项目 10,000 units/天：`videos.list`=1、`search.list`=100、上传=1600；配额不可购买，只能审计扩容；太平洋午夜重置 |
| **频道 RSS** | `youtube.com/feeds/videos.xml?channel_id=` | 无 | **免费** | Atom 格式，实测含完整标题和简介；也支持 `playlist_id=` |
| Analytics API | OAuth（自有频道） | OAuth | **免费** | 自有频道的播放数据 |
| **社区：Invidious / Piped** | 各实例 `/api/v1/*` | 无 | **免费** | 开源前端自带 API；实例质量参差，我试的两个国内不通 |
| **社区：yt-dlp** | 本地 CLI | 无 | **免费** | 元数据万金油，`--dump-json` 一次拿全 |

oEmbed 国内被墙，我经 noembed 代理实测成功，返回标准 iframe：

```json
{
  "type": "video",
  "html": "<iframe width=\"200\" height=\"113\" src=\"https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed\" …></iframe>",
  "title": "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
  "provider_name": "YouTube"
}
```

经验法则：**能拿视频 ID 就别用 `search.list`**（一次 100 单位），oEmbed 和 RSS 能解决的就不碰配额。

## Discord：全部免费，但内容是私有的

Discord 是个特例：API 免费到彻底、文档一流、限速透明（429 + `X-RateLimit-*` 响应头），但它是聊天平台而非内容平台——没有 oEmbed，读消息必须 Bot Token 加相应权限，公开能白嫖的只有零星端点。

| API / 通道 | 端点 | 鉴权 | 费用 | 限制与备注 |
| --- | --- | --- | --- | --- |
| 官方 REST API v10 | `discord.com/api/v10/*` | Bot Token | **免费** | 按路由限速 + 全局上限；超限 429 并带 `X-RateLimit-*` 头 |
| 官方 Gateway | `wss://gateway.discord.gg` | Bot Token | **免费** | 实时事件 WebSocket；网关地址可免鉴权查询（实测） |
| **Webhooks** | `discord.com/api/webhooks/<id>/<token>` | URL 即凭证 | **免费** | 约 30 条/分钟（未文档化，保守按 5 条/2 秒）；发消息最简通道 |
| **服务器 Widget** | `discord.com/api/guilds/<id>/widget.json` | 无（需服务器开启 widget） | **免费** | 公开在线成员/邀请；实测免鉴权（错误也是业务 JSON 而非 401） |
| **社区：Lanyard** | `api.lanyard.rest/v1/users/<id>` | 无（用户加入其服务器即可） | **免费** | 实时 presence 的 REST + WebSocket + KV 存储；本机实测可直连 |

几个实测细节：`GET /api/v10/gateway` 不带任何 token 直接返回 `{"url":"wss://gateway.discord.gg"}`；widget.json 对不存在的服务器返回标准错误码（10004 Unknown Guild）而不是 401，证明它就是公开端点，只是要在服务器设置里开 widget。Lanyard 是把「展示我的 Discord 状态」做成免费 API 的社区项目，返回实时活动、Spotify 歌曲甚至自定义 KV——做个人主页状态卡片的人很爱用它。注意 Webhook URL 等于完整凭证，泄露就意味着任何人都能往你频道发消息，务必当密钥管理。

## 通用工具层

跨平台需求还有几个「胶水」可以用：

- **oembed.com 的 provider 注册表**——各平台官方 oEmbed 端点的权威索引，找端点入口先看这里。
- **noembed.com**——免费聚合代理，一个端点对接几十家 provider，本机实测可直连（YouTube 正常返回；X 已无 provider）。
- **Iframely / Embed.ly**——商业聚合器，稳定省事，适合不想维护的团队。
- **Meta 官方 WordPress 插件**（meta-embeds-for-wordpress）——WordPress 用户直接用。

## 三个梯队（外加一个特例）

把八个平台放在一起，格局立刻清晰：

1. **完全开放**（Mastodon、Bluesky）：官方 API 免费免 key，RSS 是标配或近似标配。开放协议的去中心化平台，把「别人家的社区 API」做成了自己的官方 API。
2. **半开放**（YouTube、TikTok、Threads）：官方给免费通道，但各有一道门槛——YouTube 是配额经济学，TikTok 是 oEmbed 大方、数据 API 分层，Threads 是发布自由、读取要审核。
3. **封闭**（X、Instagram）：官方通道收费或高墙，逼出了最繁荣的社区生态——fxtwitter 五千 star、InstaFix 全家桶，都是被需求推出来的。
4. **特例**（Discord）：免费且官方文档一流，但内容本身是私有空间——API 围绕 bot 和 webhook 展开，公开可白嫖的只有网关查询、widget 和社区的 Lanyard。

选型上：**做嵌入**优先各平台官方 oEmbed（Threads 今年也免签了；国内受众注意 iframe 和 embed.js 全在墙外，要么截图要么走社区 OG 页）；**拿数据** Mastodon / Bluesky 直接官方，X 用 fxtwitter，YouTube 用「RSS + oEmbed」组合拳（多数场景碰不到配额）；**订阅时间线**用 Mastodon 的 `.rss`、YouTube 的 `feed.xml`、X 的 `fxtwitter.com/<user>/feed.xml`（上篇实测过）；**给 Discord 发通知**一个 webhook 足矣。

## 风险清单

- **Threads oEmbed 的用途限制条款**：只许展示，不许提取元数据做分析或持久化——用它做归档是违反条款的。
- **TikTok 缩略图签名时效**：`x-expires` 过了就 403，重要图片要立刻转存。
- **YouTube 配额按太平洋时间午夜重置**，跨时区排任务要注意。
- **Discord webhook URL 即凭证**，泄露等于频道被任意发消息。
- **Instagram 社区域名随时会死**（Meta 持续打击），X 的社区接口随时可能断供（Nitter 收律师函的前车之鉴见上篇）——社区域名只当展示用，不当数据源依赖。
- **一切免 key 通道都没有 SLA**：能缓存就缓存，能落盘就落盘。

## 参考链接

- [Bluesky 开发者文档](https://docs.bsky.app)｜[Jetstream 官方文档](https://bsky.network/docs/jetstream/)｜[FxEmbed 文档](https://docs.fxembed.com/)
- [Mastodon API 文档](https://docs.joinmastodon.org/api/)｜[Mastodon oEmbed 说明](https://docs.joinmastodon.org/methods/oembed/)｜[instances.social API](https://instances.social/api/doc/)
- [Threads API 文档](https://developers.facebook.com/documentation/threads)｜[Threads oEmbed：嵌入帖子](https://developers.facebook.com/documentation/threads/tools-and-resources/embed-a-threads-post)｜[2026-04 官方更新博客（tokenless oEmbed）](https://developers.facebook.com/blog/post/2026/04/14/whats-new-in-the-threads-api/)｜[meta-embeds-for-wordpress](https://github.com/facebook/meta-embeds-for-wordpress)
- [Instagram 平台总览](https://developers.facebook.com/documentation/instagram-platform/overview)｜[Basic Display API 关停公告（2024-09）](https://developers.facebook.com/blog/post/2024/09/04/update-on-instagram-basic-display-api/)｜[Instagram oEmbed 文档](https://developers.facebook.com/documentation/instagram-platform/oembed)
- [TikTok oEmbed：嵌入视频](https://developers.tiktok.com/doc/embed-videos/)｜[Content Posting API](https://developers.tiktok.com/products/content-posting-api/)｜[Research API](https://developers.tiktok.com/products/research-api/)
- [YouTube Data API 配额计算器](https://developers.google.com/youtube/v3/determine_quota_cost)｜[配额与合规审计](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)｜[频道 RSS 说明](https://support.google.com/youtube/answer/6224207)
- [Discord 开发者文档](https://docs.discord.com/developers/docs)｜[限速说明](https://docs.discord.com/developers/topics/rate-limits)｜[Guild Widget 端点](https://docs.discord.com/developers/resources/guild)｜[Lanyard（GitHub）](https://github.com/phineas/lanyard)
- [oEmbed 官方注册表](https://oembed.com/providers)｜[noembed](https://noembed.com/)
