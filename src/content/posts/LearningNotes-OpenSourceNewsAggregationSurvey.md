---
title: 【学习笔记】开源资讯获取与整理方案调研：从热榜聚合、RSS 到 AI 日报
published: 2026-08-17
description: 调研 RSSHub、newsnow、DailyHotApi、Miniflux、FreshRSS、Folo、Wallabag、Linkwarden、linkding、Karakeep、TrendRadar、Horizon 等十余个开源仓库，拆解它们在采集、提取、去重、AI 整理、呈现与存档各阶段的流水线步骤和技术方案，并对照自建 DailyDigest 流水线总结可复用的设计模式。
lang: zh
tags: [学习笔记]
---

> **调研日期**：2026-08-17
> **调研对象**：RSSHub、newsnow、DailyHotApi、Miniflux、FreshRSS、Folo、Wallabag、Linkwarden、linkding、Karakeep、TrendRadar、Horizon 等开源仓库
> **调研动机**：博客里跑着一条每日自动同步资讯与播客的 DailyDigest 流水线，想看看开源社区是怎么解决「资讯获取与整理」这件事的，从中偷师
> **说明**：信息主要来自各仓库 README 与官方文档；star 数为调研时点数据，会随时间变化
> **续篇**：[《订阅公众号文章与 X 推文的开源方案调研》](/posts/learningnotes-wechatandxsubscriptionsurvey/)——把本篇略过的两个最难订阅的源（微信公众号、X）单独深挖

## 一、先把问题拆开：一条五阶段流水线

「资讯获取与整理」听起来是一件事，拆开看其实是一条流水线。所有开源项目都在下面这条线上做取舍——覆盖哪几段、每段做到什么深度，决定了项目的形态：

| 阶段 | 要解决的问题 | 代表项目 |
| --- | --- | --- |
| 获取 Fetch | 内容从哪来：RSS、热榜接口、网页爬虫 | RSSHub、DailyHotApi、newsnow |
| 提取 Extract | 从充满噪声的页面抽出正文与元数据 | Wallabag、Karakeep、Linkwarden |
| 整理 Organize | 去重、过滤、打分、打标签、分类 | Horizon、TrendRadar、FreshRSS |
| 呈现 Present | 网页、RSS、推送、邮件、日报 | Miniflux、Folo、TrendRadar |
| 存档 Archive | 防链接失效：快照、单文件、多格式保存 | Linkwarden、Karakeep、linkding |

按覆盖范围可以把项目粗分成四类：**数据源层**（只做获取，把全网内容标准化输出）、**聚合阅读层**（获取 + 呈现，订阅与阅读体验）、**整理存档层**（提取 + 整理 + 存档，稍后读与书签）、**AI 日报层**（全链路自动化，从抓取直接到成文发布）。下面按这四类逐个拆解。

## 二、数据源层：把「没有 RSS 的世界」接进来

### RSSHub：路由即插件的内容源工厂

[RSSHub](https://github.com/DIYgod/RSSHub)（AGPL-3.0，45.8k star）的口号是「Everything is RSSible」——把不提供 RSS 的网站统统变成 RSS 订阅源。它是这条赛道的基础设施，后面很多项目都直接或间接站在它上面。

**它怎么做的：**

- **核心机制是「路由」**：每个网站内容源对应一个路由插件（核心代码集中在 `lib/` 目录），访问 `/bilibili/user/video/xxx` 这类路径就返回对应站点的 RSS。社区以 PR 方式持续贡献新路由，覆盖微博、B 站、微信公众号、YouTube、Telegram、豆瓣、知乎等几乎所有中文/海外内容平台。
- **规模化的方式是公共实例网络**：官方实例 rsshub.app 之外，全球有超过 5000 个由社区运营的实例，每天分发数百万条内容，负载被自然分摊。
- **部署矩阵极宽**：TypeScript 编写，官方支持 Docker、Vercel、Cloudflare Workers、Fly.io 等多种部署途径，个人自建一个实例成本很低。
- **生态配套**：浏览器扩展 RSSHub Radar 自动发现当前网站可用的 RSSHub 路由（iOS/Android 有 RSSBud/RSSAid 移植版），下游阅读器 Folo 与它同属一个生态。

### DailyHotApi：每个热榜一个路由模块

[DailyHotApi](https://github.com/imsyy/DailyHotApi)（MIT，约 4k star）是「今日热榜」类 API 的开源实现：一个聚合各平台热门数据的接口服务，配套前端就是知名的 DailyHot。

**它怎么做的：**

- **数据源按模块组织**：微信、微博、知乎、B 站、百度、抖音、36 氪、IT 之家、少数派、掘金、虎扑、NGA、V2EX、豆瓣、HelloGitHub 等 60 多个站点，每个站点一个独立路由模块，暴露为 `/{名称}` 接口。README 强调「简明的路由目录，便于新增」——和 RSSHub 的思路一致：加源不改核心。
- **双格式输出**：同一个接口支持 JSON 和 RSS 两种模式，下游无论是写程序还是接阅读器都行。
- **缓存是默认行为**：默认缓存 60 分钟避免频繁请求上游，接口级还支持 `cacheSeconds` 参数自定义。
- **实现上不回避爬虫**：部分接口直接走页面爬虫，少数需要真实浏览器的接口用 Puppeteer。
- **部署方式覆盖了主流免费路线**：Docker / docker-compose、Vercel 一键部署、Railway / Zeabur，还能作为 npm 包安装（`serveHotApi(port)` 起服务）。

### newsnow：双层源定义 + 自适应抓取

[newsnow](https://github.com/ourongxing/newsnow)（MIT，21.4k star）定位是「实时热门资讯聚合阅读」，产品形态上比 DailyHotApi 更完整——直接是一个可部署的站点。

**它怎么做的：**

- **数据源双层设计**：`shared/sources/` 存放各源的元信息与类型定义（前后端共享），`server/sources/` 存放具体抓取实现。加一个新源需要两处配合修改，换来的是类型安全和清晰边界。
- **自适应抓取间隔**：根据源的更新频率自动调整抓取节奏（最小 2 分钟），既省资源也降低 IP 被封的概率。默认整体缓存 30 分钟，登录用户（GitHub OAuth）可以强制刷新。
- **技术栈是现代 Serverless 组合**：前端 Vue/Vite，服务端 Nitro（可部署到 Cloudflare Workers），数据库通过 db0 抽象层对接，官方推荐 Cloudflare D1。
- **甚至提供了 MCP server**：`npx newsnow-mcp-server` 即可把热榜数据接入 AI 助手的工具链。

### 这一层的三个共同设计

1. **插件化的数据源**：每个源一个独立模块/路由，新增源不动核心代码——这是所有聚合类项目活下来的前提，否则维护成本会随源数量线性爆炸。
2. **缓存与频控是生命线**：默认缓存（60 分钟、30 分钟）、可调参数、自适应间隔，本质都是对上游站点的「礼貌」。TrendRadar 甚至在 README 里专门感谢 newsnow 的作者并呼吁用户控制抓取频率。
3. **输出标准化**：统一成 JSON 或 RSS 结构，让下游完全不必关心每个站的接口差异和反爬细节。

## 三、聚合阅读层：自托管 RSS 阅读器的三种哲学

### Miniflux：极简主义——单二进制加调度器

[Miniflux](https://github.com/miniflux/v2)（Apache-2.0，9.6k star）用 Go 写成，自我定位是「极简且固执己见的 feed 阅读器」。

**它怎么做的：**

- **架构上做减法**：单个静态编译的二进制，无外部依赖（数据库只支持 PostgreSQL），前端静态文件全部 embed 进二进制，遵循十二要素应用。内存占用几 MB，跑几百个 feed 毫无压力。
- **更新机制二选一**：内置调度器或传统 cron job。轮询时严格遵循 HTTP 缓存语义——发送并尊重 `Last-Modified`、`If-Modified-Since`、`If-None-Match`、`ETag`、`Cache-Control` 等头，源没更新就不传正文，默认轮询间隔 1 小时。
- **整理能力靠「连接」**：内置 25+ 第三方集成（Telegram、Slack、Discord、Notion、Wallabag、Linkding、Readwise Reader、ntfy 等），把「读到的东西送去哪」这条链路打通。
- **开放 API 换生态**：兼容 Fever 和 Google Reader 两种 API，市面上几乎所有第三方 RSS 客户端都能直接连它。

### FreshRSS：全能聚合器——推送、XPath 抓取、再输出 RSS

[FreshRSS](https://github.com/FreshRSS/FreshRSS)（AGPL-3.0，15.8k star）是 PHP 阵营的老牌多用户聚合器，功能面比 Miniflux 宽得多。

**它怎么做的：**

- **轮询之外还有推送**：支持 WebSub 标准，对 WordPress、Medium、Blogger 等支持推送的源实现「即时更新」，不必等下一轮轮询。
- **自带轻量爬虫**：通过 XPath（或 JSON 文档）配置，可以给没有 RSS 的网页直接生成订阅源——相当于内嵌了一个微型 RSSHub。
- **「聚合器的再聚合」**：user queries 功能可以把筛选后的文章子集重新输出为 HTML、RSS 和 OPML。也就是说 FreshRSS 既是订阅端也可以是数据源端，整理结果可以直接喂给下一级程序。
- **整理与生态**：多用户、自定义标签、匿名阅读模式、官方扩展仓库；API 层面同样兼容 Google Reader（推荐）和 Fever。资源需求极低——官方在树莓派 1 代上测试过 150 个订阅源、2.2 万篇文章，响应低于 1 秒。

### Folo：生态客户端——把订阅做成现代阅读产品

[Folo](https://github.com/RSSNext/Folo)（AGPL-3.0，38.8k star）是 RSSHub 同生态（RSSNext 组织）的「AI RSS 阅读器」，口号「Follow Everything」。

**它怎么做的：**

- **定位在阅读体验层**：数据源大量依赖 RSSHub 的产出，自己专注统一时间线、无干扰阅读、多内容类型（文章、视频、图片、音频）。
- **整理能力产品化**：订阅 feed 与精选列表（lists）、收藏整理、AI 翻译与摘要、列表分享与合集浏览——把「整理」从个人动作变成了可分享的社交资产。
- **全平台 + 云同步**：TypeScript 全栈 monorepo（pnpm workspace + Turborepo），Web / iOS / Android / Windows / macOS / Linux 全覆盖，云端账号保持多端一致。

### 三种哲学的对比

| | Miniflux | FreshRSS | Folo |
| --- | --- | --- | --- |
| 哲学 | 极简、后端优先 | 全能、自托管一切 | 体验优先、生态客户端 |
| 部署 | 单二进制 + Postgres | PHP + 任意主流数据库 | 客户端 + 云服务 |
| 更新方式 | 轮询（HTTP 缓存语义） | 轮询 + WebSub 推送 | 云端托管 |
| 特色 | 25+ 集成、隐私净化 | XPath 抓取、再输出 RSS | lists 分享、AI 辅助 |

## 四、整理与存档层：稍后读与书签管理

这一层解决的是「获取之后怎么办」：把值得读的东西存下来、提取出干净正文、打好标签、并保证链接失效后还能看。

### Wallabag：稍后读的老牌方案

[Wallabag](https://github.com/wallabag/wallabag)（MIT，12.9k star，2013 年至今）定位「保存、分类、稍后自由地读」。

**它怎么做的：**

- **内容提取是一条专业工具链**：Graby 提取器 + php-readability + ftr-site-config 站点专属规则库。第三件尤其值得注意——通用算法搞不定的站点，用社区维护的「每站一份规则」兜底，这与 RSSHub 的路由社区化是同一个思路。
- **整理能力**：标签分类、过滤规则、文本标注，以及导出 epub 等格式带走（详见[官方文档](https://doc.wallabag.org)）。
- **生态完整**：官方 Android/iOS 应用、浏览器扩展 wallabagger，另有付费托管 wallabag.it 给不想自建的用户。

### Linkwarden：为「链接失效」而生的协作书签

[Linkwarden](https://github.com/linkwarden/linkwarden)（AGPL-3.0，19.5k star）的核心理念是应对 Link Rot（链接腐烂）：收藏一个网页的同时保存一份长期可访问的副本。

**它怎么做的：**

- **每个网页存三种格式**：截图、PDF、单文件 HTML（SingleFile 式快照），可选再投递一份到 Wayback Machine。链接原址失效也无所谓。
- **整理与协作**：合集/子合集、多标签、全文搜索、批量操作；Reader 阅读视图支持高亮和批注；多用户协作收集，每个成员可配权限。
- **技术栈**：TypeScript + Next.js 的 monorepo（apps/packages 结构，移动端 React Native），Docker Compose 自托管，也有官方云服务。

### linkding：极简书签的另一端

[linkding](https://github.com/sissbruecker/linkding)（MIT，11.1k star）走的是 Linkwarden 的反面：「minimal, fast, easy to set up」。

**它怎么做的：**

- **Python + Django，一个容器跑起来**。标签、批量编辑、Markdown 笔记、稍后读标记、REST API、SSO，够用就打住。
- **存档轻量外包**：网页快照两种方式——本地存 HTML 文件，或直接交给 Internet Archive。
- 自动抓取网站标题/描述/图标，支持 Netscape HTML 格式导入导出（书签领域的通用交换格式）。

### Karakeep：「收藏一切」加 AI 整理

[Karakeep](https://github.com/karakeep-app/karakeep)（AGPL-3.0，28.4k star，前身 Hoarder）是这一层里 AI 原生程度最高的：链接、笔记、图片、PDF 都能收。

**它怎么做的：**

- **技术栈**：Next.js（App Router）+ Drizzle ORM + tRPC + Puppeteer 抓取 + Meilisearch 搜索，pnpm + turbo monorepo，附带浏览器扩展和 iOS/Android 原生应用。
- **AI 整理是主打**：基于 LLM 的自动打标签和摘要（支持经 Ollama 接本地模型）、全文加语义搜索、对图片做 OCR、还有规则引擎做自动化管理。
- **存档同样认真**：monolith 做整页单文件归档防失效，yt-dlp 自动归档视频。
- **自动获取**：支持 RSS 自动抓取——书签工具反过来长出了订阅能力。
- **数据迁移通道**：支持从 Chrome/Pocket/Linkwarden/Omnivore 导入。能从 Omnivore 导入这件事本身就很说明问题：知名的稍后读服务关停后，用户只能靠开放格式逃生。数据可导出不是锦上添花，是这一层产品的底线。

### 这一层的共性

正文提取（Readability 系算法 + 站点规则库兜底）、多格式存档（截图/PDF/单文件 HTML）、标签体系、全文搜索、开放导入导出——五件套齐了就是一个合格的整理存档工具；差异只在「协作」和「AI」两个维度上做加法。

## 五、AI 日报层：全自动「抓取 → 筛选 → 成文 → 发布」

这一类和我的 DailyDigest 场景最接近：不做人肉阅读器，而是让机器每天自动出一份简报。

### TrendRadar：舆情监控加多渠道推送

[TrendRadar](https://github.com/sansan0/TrendRadar)（GPL-3.0，61.5k star）定位「AI 驱动的舆情与热点筛选」：聚合多平台热搜，按关键词或 AI 兴趣筛选后推送到手机。

**它怎么做的（步骤）：**

1. **获取**：默认聚合知乎、微博、百度、B 站、抖音、今日头条、澎湃、凤凰网、华尔街见闻、财联社、贴吧等 11 个平台热榜，外加任意 RSS/Atom 源。数据依赖 newsnow 的 API（v6.9.0 起支持自部署 newsnow 做数据源，还做了域名校验）。
2. **整理（两阶段 AI 筛选）**：AI 先从 `ai_interests.txt` 里的自然语言兴趣描述提取结构化标签，再对新闻按标签批量分类打分，用 `min_score`（1-10 分）阈值控制推送；AI 失败自动回退关键词匹配——工程上对 LLM 的不可靠性做了降级设计。
3. **模型接入**：经 LiteLLM 统一接口支持 100+ 提供商（默认推荐 DeepSeek，也支持 OpenAI、Gemini、Ollama 本地模型），带重试和备用模型。
4. **推送**：企业微信、飞书、钉钉、Telegram、邮件、ntfy、Bark、Slack、通用 Webhook 十来种渠道。
5. **交互**：独立的 MCP Server 提供 21 个工具（趋势分析、情感分析、相似新闻、时期对比等），让 Claude Desktop、Cursor 这类客户端能用自然语言对话分析积累在 SQLite 里的数据。
6. **调度**：三种部署——Docker 常驻、GitHub Actions 模板仓库（配 Secrets 即用，需每 7 天手动签到续期）、本地 uv 运行。

### Horizon：最完整的七阶段流水线

[Horizon](https://github.com/Thysrael/Horizon)（MIT，8.9k star）自称「个人 AI 新闻雷达」，是我看到把这件事拆得最干净的项目，README 直接把流水线写成七步：**Define → Fetch → Deduplicate → Analyze & Filter → Enrich → Summarize → Deliver**。

**它怎么做的（步骤）：**

1. **Define（配置）**：定义数据源、处理 profile、模型、语言和投递渠道。`horizon-wizard` 交互式向导输入兴趣（比如「LLM inference」「嵌入式」）就能生成配置。
2. **Fetch（抓取）**：并发拉取所有源，支持 Hacker News（含热帖评论）、RSS/Atom、Reddit（含评论）、Telegram 公开频道、Twitter/X、GitHub 用户动态与 releases、OpenBB 金融新闻。抓取窗口用 `--hours N` 控制（默认 24 小时）。
3. **Deduplicate（去重）**：跨平台合并指向同一事件或同一 URL 的条目，还有 topic_dedup 按主题去重——同一条新闻在 HN、Reddit、RSS 各出现一次是常态，这步直接决定日报质量。
4. **Analyze & Filter（打分过滤）**：每个源绑定一个 processing profile（如 tech-news，也可让 AI 自动匹配），按 profile 的 prompt 给每条内容打分，用户设阈值（如 7.0）过滤。
5. **Enrich（增强）**：按 profile 生成内容块——背景调研、社区讨论摘要等，每个内容块只允许使用白名单内的工具；RSS 还有全文提取器。
6. **Summarize（成文）**：渲染本地化的标题、导语、分节和引用来源为 Markdown 简报，中英双语，可限制条数和分类配额控制成本。
7. **Deliver（投递）**：GitHub Pages 每日站点、SMTP/IMAP 邮件订阅（自动处理订阅与退订）、Webhook（飞书/钉钉/Slack/Discord）、MCP Server，或本地文件。

**工程上的亮点**：Python + uv 管理；官方提供可直接用的 GitHub Actions workflow（`daily-summary.yml`）定时生成并部署到 GitHub Pages；配置文件里任意字符串可用 `${VAR_NAME}` 引用环境变量，密钥不落盘。

### 同类项目速览

| 项目 | 方案要点 |
| --- | --- |
| [news-bot](https://github.com/JaredYe04/news-bot) | 每日自动爬取推送，Markdown 日报，AI 摘要聚焦 AI/LLM、Agent、RAG 方向 |
| [Daily_AI_News](https://github.com/wwJay1024/Daily_AI_News) | 聚合 36 氪 AI 新闻与 GitHub 热门 AI 项目，LLM 筛选总结后推飞书群 |
| [ai-news-today](https://github.com/handsometong/ai-news-today) | Cloudflare Workers 驱动，每日精选发布到 GitHub Pages |
| [CloudFlare-AI-Insight-Daily](https://github.com/justlovemaki/CloudFlare-AI-Insight-Daily) | Cloudflare Workers 上的 AI 资讯日报 |

### 这一类沉淀出的标准步骤

把上面几个项目抽象一下，一条成熟的 AI 日报流水线是八步：**定时触发 → 多源并发抓取 → 结构化归一 → 去重（URL 级 + 主题级）→ LLM 打分过滤（阈值可控、失败降级）→ 增强与摘要 → 渲染成文 → 多渠道投递**。触发器和投递端完全可以无服务器化（GitHub Actions / Cloudflare Workers + Pages），中间的 LLM 调用才是主要成本项。

## 六、横向总结：可复用的设计模式

把四层放在一起看，各阶段的主流选型：

| 维度 | 主流方案 | 代表 |
| --- | --- | --- |
| 采集 | RSS 解析、站点 API 逆向、XPath/浏览器爬虫 | RSSHub、FreshRSS、DailyHotApi |
| 调度 | 内置调度器 / cron / GitHub Actions / Workers 定时 | Miniflux、Horizon、ai-news-today |
| 缓存与频控 | HTTP 条件请求、默认缓存、自适应间隔 | Miniflux（ETag）、newsnow |
| 提取 | Readability 系 + 站点规则库兜底、Puppeteer | Wallabag（graby）、Karakeep |
| 去重 | URL 规范化合并 + 主题级去重 | Horizon |
| AI 整理 | 打分过滤 + 自动打标签 + 摘要，本地模型可选 | Horizon、TrendRadar、Karakeep |
| 存储 | SQLite / PostgreSQL / Meilisearch / S3 / 纯 Markdown 文件 | linkding、Miniflux、Horizon |
| 呈现与投递 | Web、RSS 再输出、IM 推送、邮件、GitHub Pages | FreshRSS、TrendRadar、Horizon |
| 存档 | 截图 / PDF / 单文件 HTML / Wayback | Linkwarden、Karakeep、linkding |

七个值得记住的模式：

1. **路由即插件**：数据源一个一个模块地加，核心永不动摇（RSSHub、DailyHotApi、newsnow 三家殊途同归）。
2. **礼貌抓取**：条件请求、默认缓存、自适应频率。这一步没做好的项目，部署当天就会被上游封掉。
3. **分层解耦**：数据源层和呈现层各自独立演进，newsnow 的 API 被 TrendRadar 复用、RSSHub 的 feed 喂给 Folo 和 Miniflux——好接口自然长出生态。
4. **聚合之后再聚合**：FreshRSS 能把筛选结果再输出为 RSS，整理的产物可以成为下一级流水线的输入。
5. **AI 当主编而非打字员**：成熟项目的 LLM 都用在打分、过滤、去重这些「决策」环节，摘要反而是最简单的部分；并且全部做了降级方案（关键词回退、备用模型、重试）。
6. **无服务器化调度**：GitHub Actions 当 cron、Pages 当托管、Workers 当运行时，「零服务器跑日报」已经是这类项目的默认形态。
7. **数据主权**：开放的导入导出格式、多格式存档、自托管选项——工具会死，数据不能陪葬。

顺带一提常见组合套路：轻量自用是 Miniflux + RSSHub；要中文热榜是 DailyHotApi 或 newsnow 自建 + 任意阅读器；要全自动日报是 Horizon 或 TrendRadar 模板仓库起步；重度整理存档上 Karakeep 或 Linkwarden。

## 七、对照自建 DailyDigest 流水线

### 现状

本博客的资讯流水线分两端。上游是独立的 [DailyDigest](https://github.com/BingqiangZhou/DailyDigest) 仓库，负责资讯的抓取与整理产出；博客这边（`.github/workflows/sync-digest.yml` 与 `.github/scripts/sync-digest.mjs`）只做「接收与发布」：

1. GitHub Actions 每日 UTC 0 点定时触发（也支持手动）；
2. 浅克隆 DailyDigest 仓库，读取 `daily-digests/tech` 与 `daily-digests/podcast` 下的 Markdown；
3. 脚本为每篇拼接 frontmatter（title/published/lang/tags），注释掉正文 H1，用 autocorrect 统一中英文排版（先把链接 URL 掩码，防止排版器往 URL 里插空格破坏锚点）；
4. 已存在的文件跳过（幂等），有变更才提交推送，推送再触发博客部署。

### 对照开源项目后的可借鉴点

1. **上游采集**：如果 DailyDigest 目前是逐源写脚本，可以借鉴「每源一个模块 + 缓存 + 频控」三件套；没有 RSS 的源直接上 RSSHub，不必自己维护反爬。
2. **去重**：Horizon 的 URL + 主题两级去重是成熟范式，多源采集时同一条新闻反复出现是日报质量的第一杀手。
3. **筛选**：TrendRadar 的两阶段筛选（自然语言兴趣 → 结构化标签 → 批量打分设阈值）在中文语境下验证过，且失败自动回退关键词，适合作为渐进式改造路径——先纯关键词，再叠 AI。
4. **增强**：Horizon 的 Enrich 阶段（背景调研块、社区讨论摘要）能让日报从「链接列表」升级为「可读简报」，这是纯抓取流水线给不了的价值。
5. **投递**：目前只有博客页面一路输出；TrendRadar 的推送渠道清单（Telegram、Bark、邮件、飞书）几乎是现成的菜单，加一路即时推送成本很低。
6. **存档**：对日报里点名的关键文章，可以按 Linkwarden/Karakeep 的思路补一份单文件存档，防链接失效。
7. **已经做对的**：autocorrect 排版这一步——「内容的最后一公里」——在本次调研的所有项目里都没有对应物，反而是自家流水线的一个小优势。

需要说明的边界：上游 DailyDigest 仓库的内部实现不在本次调研范围内，以上是模式层面的借鉴；具体是否适用，取决于它现有的抓取与整理方式。

## 参考仓库一览

| 项目 | 仓库 | 一句话定位 | star（2026-08-17） |
| --- | --- | --- | --- |
| RSSHub | [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) | 万物皆可 RSS 的内容源工厂 | 45.8k |
| TrendRadar | [sansan0/TrendRadar](https://github.com/sansan0/TrendRadar) | AI 舆情监控与多渠道推送 | 61.5k |
| Folo | [RSSNext/Folo](https://github.com/RSSNext/Folo) | RSSHub 生态的全平台 AI 阅读器 | 38.8k |
| Karakeep | [karakeep-app/karakeep](https://github.com/karakeep-app/karakeep) | 「收藏一切」+ AI 自动打标签 | 28.4k |
| newsnow | [ourongxing/newsnow](https://github.com/ourongxing/newsnow) | 实时热榜聚合站，双层源设计 | 21.4k |
| Linkwarden | [linkwarden/linkwarden](https://github.com/linkwarden/linkwarden) | 协作书签 + 三格式网页存档 | 19.5k |
| FreshRSS | [FreshRSS/FreshRSS](https://github.com/FreshRSS/FreshRSS) | 全能自托管多用户 RSS 聚合器 | 15.8k |
| Wallabag | [wallabag/wallabag](https://github.com/wallabag/wallabag) | 老牌稍后读，graby 提取链 | 12.9k |
| linkding | [sissbruecker/linkding](https://github.com/sissbruecker/linkding) | 极简 Django 书签管理器 | 11.1k |
| Miniflux | [miniflux/v2](https://github.com/miniflux/v2) | 单二进制极简 feed 阅读器 | 9.6k |
| Horizon | [Thysrael/Horizon](https://github.com/Thysrael/Horizon) | 七阶段 AI 新闻雷达流水线 | 8.9k |
| DailyHotApi | [imsyy/DailyHotApi](https://github.com/imsyy/DailyHotApi) | 今日热榜 API，60+ 站点 | 约 4k |
