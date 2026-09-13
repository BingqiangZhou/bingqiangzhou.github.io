---
title: 【学习笔记】wewe-rss 死因解剖：半开源架构拆解、闭源中转 502 实测，与微信读书公众号接口的存续验证
published: 2026-09-13
description: 9.7k stars 的公众号 RSS 方案 wewe-rss 归档之后到底发生了什么？本文完整克隆源码做 git 考古，拆解它「自托管壳 + 闭源中转 weread.111965.xyz」的半开源架构与四个中转 API，实测中转服务 502 已死、全生态无差别团灭的原因；再追问更根本的问题——微信读书的接口本身还活着吗？用无凭证探测（-2010 而非 404）、we-mp-rss 九月刚改的采集主路径、社区一手实测报告三条证据链确认读书公众号 API（标题/封面/发布时间/文章 id）仍可用，整理现行接口全景、reviewId 与原文短链的映射规则、风控与号池约束，以及 2026-07-30 公众平台超链接路线被封后的生态格局与选型建议。另附官方通道边界：2026 年 5 月上线的官方 Agent Skill 有文档但覆盖不了公众号文章列表与正文，所有接口零资质门槛，真正的约束是风控与腾讯 DMCA 执法风险。
lang: zh
tags: [学习笔记, 实践记录]
abbrlink: wewe-rss-weread-mp-api
---

[上一篇笔记](/posts/wechat-mp-article-anti-crawl/)里梳理公众号内容获取的六条路线时，提到过一句「wewe-rss 已归档，继任者 we-mp-rss 活跃维护」。当时是结论，这次把过程补上：wewe-rss 这个 9.7k stars 的项目到底是怎么工作的、为什么说死就死、以及一个更根本的问题——它所依赖的微信读书接口，是不是也跟着一起死了？

这篇笔记是源码考古加低频实测的产物：完整克隆了 wewe-rss 的 main 和 v1.x 两个分支（含全部 git 历史）、通读核心代码、用 GitHub API 翻了关键 issue、并对微信读书和公众号的线上端点做了实测探测。先说结论：

> **wewe-rss 本体已经死了**——它是「半开源」架构，开源的只是自托管外壳，真正的核心（微信读书 API 调用、扫码登录、签名与风控对抗）跑在作者私有的闭源中转 `weread.111965.xyz` 上，该服务现在全端点 502，仓库也已于 2026 年 5 月归档，新部署一步都走不通。**但微信读书的公众号接口本身还活着**——`/web/mp/articles` 列表接口实测在线（无凭证返回 `-2010 用户不存在`而非 404），社区项目 we-mp-rss 九天前刚把它改成采集主路径，轻量场景下拉取标题、封面、发布时间、文章 id 四件套没有问题；真正的约束是风控：个人低频可用，量大要上号池。顺带回答两个必然会问到的问题：官方有 Agent Skill 通道（2026 年 5 月上线、有文档、领 Key 即用），但覆盖不了公众号文章列表和正文；这些接口全都零资质门槛——约束从来不是资质，而是风控和法律灰色地带。

## wewe-rss 的原理：借微信读书「曲线救国」

先交代背景。微信公众号没有官方 RSS、没有开放 API，直接爬 `mp.weixin.qq.com` 有滑块验证和频控（上一篇文章拆过）。wewe-rss 的思路是绕道微信读书：

1. 微信读书里可以「关注」公众号，每个公众号在读书体系里对应一本「书」，有自己的 bookId；
2. 用户在 wewe-rss 后台扫码登录自己的微信读书账号，服务端拿到 `vid` 和 `token`；
3. 之后通过读书的接口按「书的章节/评论列表」拉取公众号文章列表（标题、封面、发布时间、文章 id），存进本地数据库；
4. 定时任务（cron，默认每天两次）刷新，再由 `feed` 库输出 RSS/Atom/JSON 订阅源；
5. 「全文模式」下，生成 feed 时才去直连 `mp.weixin.qq.com/s/{id}` 抓正文，cheerio 提取 `.rich_media_content`，把 `data-src` 换成 `src`、去掉懒加载的 `opacity: 0`。

这条路线的优点是拿文章列表完全不碰公众号反爬；代价是依赖读书账号——登录易失效、频控严格、有封号风险。这个基本盘从项目诞生起就没变过。

## 架构拆解：一半开源，一半在作者服务器上

这是本次考古最重要的发现：**开源仓库里从头到尾没有一行直连 `weread.qq.com` 的代码。**全部微信读书交互都经由 `PLATFORM_URL`（默认 `https://weread.111965.xyz`，见 `apps/server/src/configuration.ts`）转发：

```text
你的浏览器
   │
   ▼
自托管 wewe-rss（NestJS + tRPC + Prisma，Docker 部署）
   │  只有下面 4 个中转 API（Bearer 读书 token）
   ▼
作者闭源中转 weread.111965.xyz    ← 签名/登录/风控对抗全在这里（不开源）
   │
   ▼
weread.qq.com 微信读书官方接口
```

自托管侧是标准全家桶：NestJS 后端（4000 端口）+ React 前端 + Prisma（MySQL/SQLite），扫码二维码由前端 `QRCodeSVG` 组件直接渲染中转返回的 `scanUrl`。中转 API 一共四个：

| 接口 | 方法 | 作用 |
| --- | --- | --- |
| `/api/v2/login/platform` | GET | 创建登录会话，返回 `{uuid, scanUrl}` |
| `/api/v2/login/platform/{uuid}` | GET | 长轮询扫码结果（120s 超时），成功返回 `{vid, token, username}` |
| `/api/v2/platform/wxs2mp` | POST | 提交 `mp.weixin.qq.com/s/` 分享链接，解析出公众号信息 |
| `/api/v2/platform/mps/{mpId}/articles?page=N` | GET | 分页拉取公众号文章列表 |

后两个接口携带 `xid`（账号 id）和 `Authorization: Bearer {token}` 请求头。中转返回的错误串在客户端有明确的语义映射：`WeReadError401` 把账号标记为「失效」、`WeReadError429` 打进「今日小黑屋」（内存 Map，重启清除）、`WeReadError400` 等 10 秒重试。限流规则在作者手里，据 issue #396（2025-04-20，最后一次中转侧修复）：单账号每天 50 次请求、单 IP 24 小时 300 次——作者自述之前放宽到 300 次每天「没两天接口就 gg 了」。

「半开源」这个定性不是我发明的，是社区吵出来的。issue #11（2024-03-01，标题就叫「假开源吗？」）里，用户发现自己微信读书账号的 token 会流经作者服务器，甚至有人发现刚注册的读书小号在首次使用前一天就有登录记录。作者的回应是「token 是从这个服务生成的，只做请求转发」，随后在 README 加了转发声明。知乎后来的生态综述也直接把它归类为「半开源免费」。

git 考古还有两个细节值得记录：

- **历史被重写过**：仓库 185 个提交全部始于 2024-02-27（「Initial commit」只有 .gitignore 和 README），v1.x 分支保留的 43 个提交也全部是 2024 年 2 月末之后的。2023 年那个更早的、可能直连读书 API 的版本（如果有）已不可考——至少现存所有版本都强依赖中转。
- **「v2 全新接口」是中转侧的事**：2024-03-25 的 `feat: use v2 api` 提交只是把客户端请求路径从 `/api/platform/...` 换成 `/api/v2/...`。README 里「v2.x 版本使用全新接口，更加稳定」说的是作者换了中转后端的接口，跟开源代码关系不大。

## 死亡时间线与实测

把所有信号按时间排起来，死亡过程相当清晰：

| 时间 | 事件 |
| --- | --- |
| 2025-04-20 | 最后一次中转侧修复（issue #396），此后再无实质更新 |
| 2026-03-20 | 最后一次提交，内容是删掉 README 里的微信打赏二维码——典型的收摊信号 |
| 2026-03-24 | issue #463「还有更新吗？好像都失效了」：都没能订阅成功；四月评论区已经出现「作者都把微信图删了跑路了」 |
| 2026-05-11 | 仓库归档，只读（GitHub 归档横幅的日期；知乎汇总里写的一月归档与之不符，以 GitHub 为准） |
| 2026-09-13 | 本文实测，见下表 |

实测用的是最朴素的方法——对着中转域名发请求：

| 探测目标 | 结果 |
| --- | --- |
| `weread.111965.xyz/api/v2/login/platform` | **502**，连测 4 次均 502 |
| `weread.111965.xyz/`（根路径） | 502 |
| `weread.111965.xyz/api/v2/platform/mps/.../articles` | 502 |
| `weread.qq.com`（微信读书本站） | 200，平台本身活着 |
| `mp.weixin.qq.com/s/{id}`（全文抓取路径） | 200（浏览器 UA 低频可访问） |

502 的响应体是 Cloudflare 的「error code: 502」错误页，DNS 解析到 Cloudflare 边缘节点——也就是说域名还在、CDN 还在，**后面的源站没了**。这不是网络拦截，是服务真的下线了。

由此可以精确推演各类部署的命运：

- **新部署**：扫码登录、添加订阅、刷新文章全部走中转，中转 502，一步都走不通，完全不可用；
- **存量部署**：本地数据库里的历史文章还能生成 feed，全文抓取也不依赖中转，但无法同步任何新文章——对「订阅」这个核心用途来说等于死了；
- **无法自救**：中转闭源，fork 也没用。除非有人逆向微信读书的登录签名、重写一个兼容 `PLATFORM_URL` 的服务，而那正是当初作者把最难部分闭源托管的原因。

一个 9.7k stars 的项目，死亡时不需要任何代码被删——只要一台源站服务器关机就够了。

## 追问：微信读书的接口还活着吗

wewe-rss 死了不代表读书路线死了。要回答「公众号文章列表（标题、封面、发布时间、文章 id）还能不能拉」，我搭了三条证据链。

### 证据一：无凭证探测——端点在线，只是要登录

用浏览器请求头直接请求读书的三个端点：

| 端点 | 无 Cookie 实测结果 |
| --- | --- |
| `GET /web/mp/articles?bookId=...&offset=0` | HTTP 200，返回 `{"errCode":-2010,"errMsg":"用户不存在"}` |
| `GET /api/mp/cover?bookId=...` | HTTP 401 "LOGIN ERR"，errcode -2010 |
| `GET /web/book/info?bookId=...` | HTTP 200，同样 -2010 |

返回的是「用户不存在」（缺登录态）而不是 404 或空响应——接口存在、逻辑在跑，只等一个有效 Cookie。我也在本地 Chrome 里打开 weread.qq.com 尝试用现成会话做真实调用，但浏览器里读书未登录，书架接口同样返回 -2010，所以「带凭证实测」这最后一步留给了愿意扫码的读者。

### 证据二：we-mp-rss 的代码——九天前刚把列表接口改回主路径

we-mp-rss（4.6k stars，最后推送 2026-09-10）在 2026 年 8 月初上线了「微信读书采集模式」，它的 `core/wx/model/weread_mp.py` 里有一段很有意思的注释演化：

- 8 月 13 日的文档 `docs/weread-mp.md` 写的是：「新版微信读书已废弃 `/web/mp/articles` 列表接口（实测恒返回 -2041）」，当时只做了 `/api/mp/cover`（只返回最新一篇文章）的兜底方案；
- **9 月 4 日的提交**（「公众号采集改为列表接口增量补抓多篇，cover 接口兜底」）把结论翻转了：代码注释原话「`/web/mp/articles` 曾在部分旧 Cookie 上返回 -2041，当时据此回退到 cover 方案；**实测该列表接口可用**，是增量补抓的主路径」。

也就是说「已废弃」是八月旧 Cookie 下的误判，文档没来得及更新，代码已经用新鲜 Cookie 实测推翻了它。它的解析代码写明了响应结构，字段和我们要的四件套一一对应：

```text
reviews[]                      ← 按 review 组分页（offset 按组数递增）
  └── subReviews[]
        └── review
              ├── reviewId     ← 文章 id
              ├── createTime   ← 发布时间
              └── mpInfo
                    ├── title    ← 标题
                    ├── pic_url  ← 封面
                    ├── time     ← 发布时间（另一来源）
                    └── originalId ← 原文短链 token
```

### 证据三：社区一手报告

we-mp-rss 的 issue #442（七月末开帖，九月还在更新）是这波逆向工程的主阵地，里面有完整的接口文档和实测报告。用户 wozaitianwai 的原话：「测试了下还行，轻轻碰下 `/web/mp/articles` 就行了，剩下自己拿信息撺就行了，**连订阅都不要**，个人关注号不多问题不大，量大就得走号池战术了」。另有一个 x554960766/wechat-mp-tools（139 stars，9 月 11 日还在推送）也走读书路线，同样活跃。

三条证据链交叉验证后，结论可以下了：**读书的公众号接口活着，而且比 wewe-rss 中转时代的门槛更低**——新版已不需要 `x-wr-ticket` 签名，只要浏览器登录 Cookie（`wr_vid`、`wr_skey`、`wr_rt`）。

## 现行的微信读书公众号接口全景

把 #442 的社区逆向和 we-mp-rss 的实现汇总成一张表（2026-09 验证）：

| 接口 | 作用 | 备注 |
| --- | --- | --- |
| `GET https://weread.qq.com/web/mp/articles?bookId=&offset=` | **文章列表**（标题/封面/发布时间/reviewId） | 主路径；offset 翻页，实测可用 50 步长 |
| `GET https://weread.qq.com/web/mp/content?reviewId=` | 文章正文 HTML | 提取 `#js_content` |
| `GET https://weread.qq.com/api/mp/cover?bookId=` | 仅最新一篇文章 | 列表接口失败时的兜底 |
| `POST https://weread.qq.com/mp/shelf/addToShelf` | 把公众号加书架（等于「关注」） | 可选，实测不订阅也能拉列表 |
| `GET https://weread.qq.com/web/shelf/bookIds` | 查询是否已订阅 | 配合上一个用 |

最小可用示例（`<BOOK_ID>` 换成目标公众号的 bookId）：

```bash
curl 'https://weread.qq.com/web/mp/articles?bookId=<BOOK_ID>&offset=0' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Referer: https://weread.qq.com/' \
  --cookie "wr_vid=...; wr_skey=...; wr_rt=..."
```

id 体系有两个对写解析器很关键的映射规则：

- **bookId**：公众号在读书里的 bookId 形如 `MP_WXS_<数字标识>`（数字标识是公众号 fakid 的 base64 变体）；
- **reviewId**：形如 `<BOOK_ID>_<ARTICLE_TOKEN>`，其中 **token 段直接就是 `mp.weixin.qq.com/s/<token>` 原文短链的 token**（#442 作者实测过）。也就是说拿到列表就等于拿到了永久原文直链，不需要再查一次。

错误码语义也整理一下，排障时少走弯路：`-2010` 用户不存在（没带 Cookie 或会话没建立）、`-2012` 登录超时（Cookie 过期，重新从浏览器复制）、`-2041` 认证/风控错误（也是「接口已废弃」讹传的来源——换新鲜 Cookie 往往就通了）。

## 官方文档与资质：有一条合法通道，但它不是为你开的

讲完接口全景，两个必然的追问值得单独一节：这些接口有官方文档吗？调用要什么资质？

### 官方文档：Agent Skill 有，公众号场景没有

微信读书在 **2026 年 5 月 17 日**上线了官方 Agent Skill / Agent Gateway，这是目前唯一有正式文档的官方 API 通道：

- 统一网关：`POST https://i.weread.qq.com/api/agent/gateway`，鉴权 `Authorization: Bearer wrk-xxx`；
- 文档放在官方 GitHub 仓库 [Tencent/WeChatReading](https://github.com/Tencent/WeChatReading)（Apache-2.0 开源），搜书、书籍信息、书架、笔记划线、阅读统计、点评、推荐等每个能力一份 md 文档，请求格式、参数、回包字段写得相当规范；
- API Key 在 [weread.qq.com/r/weread-skills](https://weread.qq.com/r/weread-skills) 登录即可领取（`wrk-` 前缀，绑定个人账号 vid）。

对公众号场景，它的覆盖是**部分的**：搜索接口支持 `scope=2`（搜公众号）和 `scope=4`（搜公众号文章）；章节目录接口有 `isMPChapter` 标记（公众号的书，章节即文章，回包含标题、字数、更新时间、`chapterUid`）；书架能列出公众号类书籍。但对照我们要的四件套，官方 Skill 只给得了标题和更新时间——**没有文章级封面、没有 reviewId 到 `mp.weixin.qq.com` 原文直链的映射、更没有文章正文接口**。想做 RSS 订阅，`/web/mp/articles` + `/web/mp/content` 仍是唯一完整路径，而它们是网页客户端的内部接口，不在官方开放范围内，也永远不会有文档——读书用户协议里原话就是「旧版本的软件可能无法使用，腾讯不保证旧版本软件继续可用」。

顺带排一个搜索陷阱：`cp.weread.qq.com`「微信读书·开放平台」名字很像开发者平台，实际是原「创作平台」升级来的**内容方入驻平台**，给出版社、作者、机构上架内容用的，和调接口拉文章完全是两码事。

### 资质：零门槛，但这不是好消息

| 通道 | 资质要求 | 实际约束 |
| --- | --- | --- |
| 官方 Agent Gateway | **零门槛**：读书用户登录领 API Key 即用 | 文档未写配额频控，无 SLA；能力范围由腾讯划定 |
| 网页 `/web/*` 接口 | **零门槛**：普通账号登录 Cookie（`wr_vid`/`wr_skey`/`wr_rt`） | 纯风控约束：`-2012` 过期、`-2041` 风控、封号；量大需号池 |
| cp 开放平台 | 内容方资质（出版社/作者/机构） | 与调接口无关 |

不需要企业主体、不需要开发者注册、不需要审核——「零资质」反过来读才是真相：**正因为不需要你注册，腾讯也从未授权你这么用**。官方 Skill 是腾讯划定的合法边界（个人数据访问加搜书），公众号批量抓取被留在了边界外面。

### DMCA 前科：法律风险不是理论上的

腾讯对微信生态逆向项目的法律执行动过真格：[2026 年 1 月 8 日的 DMCA 投诉](https://github.com/github/dmca/blob/master/2026/01/2026-01-08-tencent.md)一次性下架了 **4,195 个仓库**（含整个 fork 网络），法律依据是 DMCA 第 1201 条反规避条款。需要如实说明的是：我核对过那份投诉原文，点名的全是微信聊天记录导出类工具，**0 次提到 weread**——读书逆向项目目前没有被点名下架过。但「绕过技术保护措施」的法律逻辑是同一套，we-mp-rss 这类项目随时可能成为下一个目标。官方 Skill 在 DMCA 风波四个月后上线，社区生态（awesome-weread 清单、OpenWeRead SDK 等）也在主动转向官方 API——可以理解为腾讯用官方通道「收编」了个人数据访问的需求，同时把批量抓公众号这种场景继续留在灰色地带。

## 坑与注意事项

- **文档会骗人，代码才诚实。**we-mp-rss 的文档至今写着列表接口「已废弃恒返回 -2041」，但那是八月旧 Cookie 下的结论，九月的代码已经推翻。以后看到「读书接口已废弃」的说法，先怀疑 Cookie 过期或触发风控，而不是接口没了。
- **风控是主要约束，不是接口。**社区共识：个人轻量订阅（几个到几十个号、低频刷新）没问题；量一大（有人在 issue 里说要订 350 到 3000 个号）就需要号池加严格限频（we-mp-rss 默认正文间隔至少 2 秒、翻页间隔 1 秒）。历史文章可以翻页回补，cover 兜底模式则只能拿到最新一篇，中间漏掉的文章要等列表接口可用时才能补齐。
- **Cookie 会过期。**we-mp-rss 为此写了一个独立扫码登录驱动（`driver/weread_qr.py`，参考 nasonliu/papers3-weread），可以不经任何中转自己完成读书扫码登录——这也侧面证明读书的登录链路对第三方客户端是开放的。
- **当心中转遗产。**新项目里还残留着对死掉中转的引用（比如 wechat-mp-tools 的配置里仍有 `weread.111965.xyz`），遇到相关报错先检查是不是踩到了 wewe-rss 时代的坑。
- **闭源服务套路仍在延续。**wewe-rss issue 区里推荐的「继任服务」zlzchat，克隆下来一看是个 Java jar 加一句部署文档指向某个 IP 端口——和 wewe-rss 同样的「开源外壳 + 远端闭源服务」模式。选型时先看它敢不敢把读书调用链放进开源代码里。

## 生态现状：2026 年 9 月怎么选

这个领域最近的一次大地震是 **2026-07-30 公众平台超链接接口被官方封禁**——we-mp-rss 原本的主打路线（申请个人公众号、借后台「超链接」接口批量查文章）就此失效，社区才在八月集体转回读书路线。目前按需求选型：

| 需求 | 方案 | 状态 |
| --- | --- | --- |
| 长期订阅一批公众号转 RSS | we-mp-rss 自部署（读书模式） | 活跃维护，2026-09-10 仍有推送 |
| 轻量拉某个号的文章列表 | 直接调 `/web/mp/articles`（本文接口表） | 可用，注意限频 |
| 单篇正文存档 | 浏览器 UA 一行 curl（见上篇笔记） | 可用 |
| 查个人阅读数据 / 搜书 | 官方 Agent Skill（`Tencent/WeChatReading`） | 官方支持，领 Key 即用 |
| 不想折腾 | wechat2rss 等付费服务 | 付费 |
| wewe-rss 存量部署 | 无解，迁移吧 | 中转已死 |

## 几点启示

- **「半开源」项目的生死不由你决定。**wewe-rss 开源了 90% 的代码，但把最难、最核心的 10%（签名、登录、风控对抗）闭源托管在自己服务器上。这 10% 一关机，另外 90% 就是精美的废铁。选型时「核心链路是否在开源代码里」应该是一票否决项。
- **接口考古要以「_endpoint 级实测」为准。**这次三个关键判断——中转已死（502）、读书接口活着（-2010 而非 404）、列表接口可用（九天前的代码注释）——全部来自直接探测和最新代码，而不是任何一篇二手文章。文档、教程、甚至官方 README 的时效性都远不如一次 curl。
- **风控对抗的经济学。**从 issue #396 的「放宽限流两天就 gg」到 #442 的「量大就得走号池」，这条路线的成本曲线一直很陡。平台只需要收紧一个口子，社区就要用成倍的账号和间隔去换——公众号这个中文互联网最封闭的内容池，短期内看不到松动的迹象。
- **开放与执法是同一枚硬币的两面。**官方 Agent Skill（开放个人数据访问）与 4,195 仓库的 DMCA 下架（打击聊天记录导出）相隔不到半年先后落地：能收编的需求给条合法通道，不能收编的场景加大执法力度。选型时先想清楚自己的需求落在硬币哪一面——查自己的阅读数据走官方 Skill，批量抓公众号就注定只能在灰色地带里控制好频率和体量。

## 参考资料

源码与考古：

- [cooderl/wewe-rss（9.7k stars，已归档）](https://github.com/cooderl/wewe-rss) / [issue #11 假开源吗](https://github.com/cooderl/wewe-rss/issues/11) / [issue #396 最后一次修复与限流规则](https://github.com/cooderl/wewe-rss/issues/396) / [issue #463 还有更新吗](https://github.com/cooderl/wewe-rss/issues/463)

读书接口与继任项目：

- [rachelos/we-mp-rss（4.6k stars，活跃）](https://github.com/rachelos/we-mp-rss) / [微信读书公众号采集文档](https://github.com/rachelos/we-mp-rss/blob/main/docs/weread-mp.md)（注意其中「列表接口已废弃」为过时结论） / [issue #442 新方案路径（现行接口全景与社区实测）](https://github.com/rachelos/we-mp-rss/issues/442)
- [x554960766/wechat-mp-tools（读书路线，活跃）](https://github.com/x554960766/wechat-mp-tools) / [teng-lin/weread-omni（读书增强工具包）](https://github.com/teng-lin/weread-omni)

官方通道与合规：

- [Tencent/WeChatReading（官方 Agent Skill 文档仓库，Apache-2.0）](https://github.com/Tencent/WeChatReading) / [微信读书 API Key 领取页](https://weread.qq.com/r/weread-skills) / [微信读书·开放平台（内容方入驻，非开发者 API）](https://cp.weread.qq.com/) / [QClaw：API Key 获取指南](https://qclaw.qq.com/docs/211404800074477568/)
- [腾讯 2026-01-08 DMCA 投诉原文（GitHub dmca 仓库，4,195 个仓库被下架）](https://github.com/github/dmca/blob/master/2026/01/2026-01-08-tencent.md) / [CyberNews 对该事件的评论](https://cybernews.com/security/tencent-dmca-takedowns-on-github-raise-questions/) / [新浪财经报道](https://finance.sina.com.cn/stock/t/2026-01-18/doc-inhhtasv3685238.shtml)
- [Ceelog/OpenWeRead（基于官方 Skill 的 SDK）](https://github.com/Ceelog/OpenWeRead) / [awesome-weread（官方 API 生态清单）](https://github.com/BENZEMA216/awesome-weread)

生态综述：

- [知乎：微信公众号 RSS 订阅方案汇总（2026-03）](https://zhuanlan.zhihu.com/p/2012810675609699554) / [知乎：We-MP-RSS 开源利器](https://zhuanlan.zhihu.com/p/1925281790370747495) / [知乎：使用 RSS 订阅微信公众号](https://zhuanlan.zhihu.com/p/1944803444100687716) / [V2EX：可用的公众号 RSS 订阅方案讨论](https://hk.v2ex.com/t/1138322)

相关笔记：

- [突破微信公众号文章反爬：六条获取路线（附实测）](/posts/wechat-mp-article-anti-crawl/)
