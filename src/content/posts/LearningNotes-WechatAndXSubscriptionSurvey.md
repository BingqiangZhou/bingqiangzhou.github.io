---
title: 【学习笔记】订阅公众号文章与 X 推文的开源方案调研：曲线救国、账号池与接口封锁
published: 2026-08-17
description: 调研 WeWe RSS、WeRSS、Wechat2RSS、wechat-article-exporter、Nitter、RSSHub Twitter 路由、twscrape 等开源方案如何订阅微信公众号文章与 X 推文，拆解微信读书借道、公众平台编辑器接口、真实账号会话池等实现原理，梳理 2026 年接口封锁后的最新格局，并总结六条可复用的规律。
lang: zh
tags: [学习笔记]
---

> **调研日期**：2026-08-17
> **调研对象**：WeWe RSS、WeRSS（we-mp-rss）、Wechat2RSS、wechat-article-exporter、RSSHub、Nitter、twscrape、Folo 等开源仓库
> **调研动机**：[上一篇《开源资讯获取与整理方案调研》](/posts/learningnotes-opensourcenewsaggregationsurvey/)把「资讯获取与整理」的流水线整体过了一遍，但留了两个最难的源没展开——微信公众号和 X（Twitter）。它们恰好是封闭生态、登录墙、反爬三者叠加的最强副本，RSSHub 这类通用方案在这里集体吃瘪。本篇专门回答一个问题：开源社区到底是怎么把这两个源订阅下来的。
> **说明**：信息主要来自各仓库 README、issue 讨论与官方文档；star 数为 2026-08-17 时点数据，会随时间变化。

## 一、为什么偏偏是这两个源最难

**公众号这边**：内容困在微信客户端里，官方从未提供 RSS。历史上的抓取入口一个接一个倒下——搜狗微信搜索曾是主通道，后来验证码地狱基本废掉；第三方聚合站（传送门等）陆续关停；新榜渠道也失效了（RSSHub [issue #18904](https://github.com/DIYgod/RSSHub/issues/18904)）。少数派 2025 年 4 月的文章说得直白：「RSSHub 上的微信路由似乎总在 404」。公众号是 RSSHub「万物皆可 RSS」版图上最著名的空洞，于是催生了一批专用工具。

**X 这边**：官方 RSS 早在 2013 年就停了。2023 年 API 定价大改后，免费档只写不读、Basic 档每月 200 美元、Pro 档每月 5000 美元；2026 年起又转向按量付费（读取一条约 0.005 美元）并逐步淘汰订阅档（见 [X API 定价文档](https://docs.x.com/x-api/getting-started/pricing)与[迁移公告](https://devcommunity.x.com/t/important-update-legacy-x-api-basic-plans-are-moving-to-pay-per-use-ppu/266305)）。更致命的是 2024 年 1 月匿名 guest 接口被关闭，Nitter 公共实例在一个月内集体阵亡——从那以后，「真实账号的会话」成了读取 X 内容的唯一通用货币。

两个平台的处境高度相似：**登录墙 + 反爬 + 无官方出口**。看完下面这些项目会发现，开源社区的应对思路也殊途同归：找一个带合法身份的内部接口曲线救国，然后把这个身份当稀缺资源省着用。

## 二、公众号：四条路线的生死簿

先把路线图摆出来：搜狗微信（已死）→ 第三方聚合站（已死）→ 公众平台编辑器接口（2026 年 7 月被官方掐死）→ **微信读书接口（当前主流活路）**，外加一条托管服务的商业路线。

### WeWe RSS：借道微信读书（曾经的头牌，已归档）

[WeWe RSS](https://github.com/cooderl/wewe-rss)（MIT，9.7k star）的思路堪称漂亮：**微信读书里可以搜索、订阅、阅读公众号文章**，那就不用去碰公众号本体，直接借微信读书的接口。

**它怎么做的：**

- **身份获取**：用微信读书账号扫码登录（README 特意提醒不要勾选「24 小时自动退出」），之后所有请求都以这个读书账号的身份发出。
- **数据链路**：提交公众号任意文章链接完成订阅，feed id 形如 `MP_WXS_123`；后台定时任务从微信读书接口拉取订阅列表和文章正文，转成 `.atom` / `.rss` / `.json` 三种格式，全文输出，支持 OPML 导出。
- **细节打磨**：支持标题过滤（`title_include` / `title_exclude` 参数）、访问 feed 时带 `?update=true` 手动触发更新、每分钟最大请求数（默认 60）、更新间隔延迟（默认 60 秒）、定时表达式默认每天两次——频控参数直接做成了环境变量。
- **风控应对**：加号太快太频繁会被微信读书关「小黑屋」24 小时，账号状态里有「今日小黑屋 / 禁用 / 失效」的显式标记。
- **不完全开源的点**：微信读书接口的部分请求（签名计算等）要经过作者的中转服务（`PLATFORM_URL` 默认指向 weread.111965.xyz）转发，README 声明不保存数据。换句话说，最核心的签名逻辑不在开源代码里——这也是它被评价为「不完全开源」的原因。
- **工程形态**：NestJS + Prisma + MySQL/SQLite，Docker Compose 一键部署，另有 Zeabur / Railway / Hugging Face 部署路线。

**结局**：2026 年 3 月仓库归档。作为曾经的社区默认方案，它的归档直接催生了下面的接棒者。

### WeRSS（we-mp-rss）：活跃的接棒者

[WeRSS](https://github.com/rachelos/we-mp-rss)（4.3k star，调研当周仍有提交）定位「微信公众号订阅助手」，是 WeWe RSS 归档后目前最活跃的专用方案。

**它怎么做的：**

- **工程形态**：Python 3.13 + FastAPI 后端、Vue 3 + Vite 前端、SQLite（默认）/MySQL，一条 `docker run` 起服务，扫码授权即用。
- **多通道采集**：README 明确「支持多种抓取方式」，并提供了可选的 `weread_mp` 模式来采集现有 `MP_WXS_*` 源——老 WeWe RSS 用户可以无痛迁移。
- **能力面比前辈宽一圈**：导出 md/docx/pdf/json；开放 API 与 WebHook（可接自动化流程和 AI Agent）；授权过期提醒加自定义通知渠道；13 套阅读主题。
- **最有意思的两个设计**：
  - **HTML 内容过滤规则**：全局规则 + 公众号专属规则两级，支持按 ID、class、CSS 选择器、属性、正则移除元素，带优先级——专门用来洗掉公众号文章里夹带的文末广告、推荐位这类「正文污染」。
  - **级联系统**：父子节点架构，父节点做管理，子节点分担采集任务——把「一个账号身份的采集配额不够」这个问题用横向扩展来解。
- **许可**：GitHub 标记为 NOASSERTION（自定义许可），商用前需要读一下仓库里的许可文件。

### wechat-article-exporter：公众平台接口路线（2026 年 7 月阵亡）

[wechat-article-exporter](https://github.com/wechat-article/wechat-article-exporter)（MIT，12.7k star，本篇调研里 star 最高的公众号项目）的原理一句话就能讲清，README 原文是：**「在公众号后台写文章时支持搜索其他公众号的文章功能，以此来实现抓取指定公众号所有文章的目的」**。

**它怎么做的：**

- **身份获取**：用户自己注册一个公众号，用它的管理员身份扫码登录微信公众平台（mp.weixin.qq.com）。
- **数据链路**：调用公众平台编辑器里「插入超链接 → 搜索文章」背后的内部接口（`searchbiz` / `appmsg` 一族），就能枚举**任意**公众号的全部历史文章——这个「借官方自家编辑器的搜索框」的思路非常聪明。
- **形态**：纯在线工具，无需搭建任何环境（也支持 Docker 和 Cloudflare 自部署）；导出 html（打包图片和样式文件，号称 100% 还原排版）/ json / excel / txt / md / docx；阅读量和评论数据的导出需要额外抓包拿 credentials。
- **通道细节**：开源版对微信接口的请求依赖「公共代理节点」转发，每天额度有限、需要抢额度。
- **一个值得记录的承诺**：README 声明「不会利用您扫码登录的公众号进行任何形式的私有爬虫」「不存在类似账号池的东西」——你的账号只服务你自己的抓取。

**结局**：2026 年 7 月 30 日官方宣布停止维护（[停维说明 issue #200](https://github.com/wechat-article/wechat-article-exporter/issues/200)）——微信官方关闭了它赖以工作的上游核心接口，且「大概率不会再开放」「无法通过修改代码绕过」。仓库转为只读归档，在线服务域名 2026 年 10 月底到期；同作者的商业版「公号三刀」同样失去了批量同步能力，只剩非群发文章和阅读量评论可抓。它是四条路线里唯一直接踩在「官方明确要关的接口」上的，所以死得也最干脆。

### Wechat2RSS：托管服务模式，核心闭源

[Wechat2RSS](https://github.com/ttttmr/wechat2rss)（1.5k star，仍在维护）从 2021 年 9 月启动，目标就一句话：**提供长期稳定可用的微信公众号 RSS 服务**，尽力把「作者发布到 RSS 收录」的周期压在 24 小时内。

**它怎么做的：**

- **免费部分**：[公开 300+ 公众号](https://wechat2rss.xlab.app/list/)的现成 RSS 源，任何人可直接订阅；通过 GitHub issue 推荐收录新号，watch 仓库能收到收录通知。
- **付费部分**：私有部署是付费软件，功能与公共服务一致。
- **产品化细节**：智能调整每个号的更新频率（平均时延约 6 小时）、全文输出、图片视频内置反向代理（解决阅读器里微信图片防盗链的问题）。
- **开源程度**：仓库本身没有开源许可证，抓取核心闭源——GitHub 仓库主要承担收录清单和 issue 反馈的职能。

### 公众号小结

| 方案 | 数据通道 | 开源程度 | 输出 | 状态（2026-08） |
| --- | --- | --- | --- | --- |
| WeWe RSS | 微信读书接口 | MIT，但签名经作者中转 | RSS/Atom/JSON 全文 | 已归档（2026-03） |
| WeRSS（we-mp-rss） | 多通道（含微信读书） | 自定义许可 | RSS + md/docx/pdf + API/WebHook | 活跃 |
| wechat-article-exporter | 公众平台编辑器接口 | MIT | html/md/docx/excel 等 | 停止维护（2026-07-30） |
| Wechat2RSS | 自有通道（闭源） | 核心闭源 | RSS（免费列表 300+） | 活跃（服务模式） |
| RSSHub 公众号路由 | 第三方渠道（新榜等） | AGPL-3.0 | RSS | 大多失效 |

一条清晰的观察：**活下来的路线都不碰「官方明确要封的接口」，而是寄生在微信体系内的其他产品上**（微信读书）。一旦寄生点本身被官方关闭（公众平台编辑器接口，2026-07），项目立刻死亡——这类工具的生命周期完全由上游接口的存亡决定，选型时要有这个心理预期。

## 三、X：一条主线，三种包装

X 这边所有活着的方案共享同一条主线：**拿真实账号的会话凭据（cookie 里的 auth_token），调用 X 网页端自己在用的内部 GraphQL API**。区别只在包装形态：替代前端（Nitter）、通用 RSS 基础设施（RSSHub 路由）、开发者库（twscrape）。

### Nitter：替代前端 + 账号会话

[Nitter](https://github.com/zedeus/nitter)（AGPL-3.0，13.4k star，截至调研日仍在活跃维护）是用 Nim 写的 X 替代前端：无 JavaScript、无广告、所有请求经后端中转（客户端不直连 X，防 IP 和指纹追踪）、使用非官方 API 无需开发者账号、页面轻量（同一位博主 60KB 对 784KB）、**自带 RSS 输出**——RSS 一直是它的一等公民功能。

**它怎么做的：**

- **前世**：靠匿名 guest 账号池读取数据，公共实例网络免费开放，是 2023 年之前订阅 X 的默认方案。
- **转折**：2024 年 1 月 guest 通道被 X 关闭，公共实例一个月内集体死亡。
- **现在**：README 顶部挂着醒目的说明——「运行 Nitter 实例现在需要提供真实账号」，自建者要按 [wiki 教程](https://github.com/zedeus/nitter/wiki/Creating-session-tokens)从真实账号提取 session token，写进 `sessions.jsonl` 挂载给容器。
- **工程形态**：Nim 编译 + libpcre/libsass + Redis 做缓存，Docker Compose 部署。
- **路线图**显示作者在往「账号系统 + 时间线支持、推文存档、开发者 API」方向走——本质上是在承认：想恢复昔日体验，需要更多账号权限。

### RSSHub 的 Twitter 路由：auth_token 直连

[上一篇](/posts/learningnotes-opensourcenewsaggregationsurvey/)把 RSSHub（AGPL-3.0，45.8k star）当作数据源层的基础设施，这里补上它在 X 上的具体玩法——它恰好是「公众号最弱、X 尚可」的有趣反差。

**它怎么做的：**

- **配置**：环境变量 `TWITTER_AUTH_TOKEN` 填浏览器登录 x.com 后 cookie 里的 `auth_token`；支持逗号分隔填多个账号的 token，RSSHub 会在它们之间轮换。
- **路由**：`/twitter/user/:id` 拉用户时间线，另有列表、关键词等路由，产出标准 RSS 给任何阅读器消费。
- **官方运维建议**就是三件套：多 token、轮换、低频访问（见 [issue #19956](https://github.com/DIYgod/RSSHub/issues/19956)、[issue #19420](https://github.com/DIYgod/RSSHub/issues/19420) 的维护者回复）——单 token 高频请求会间歇性失败。
- **本质**：和 Nitter 同源（真实账号 cookie + X 内部 Web API），只是把它做进了通用基础设施。Folo（AGPL-3.0，38.8k star）里「直接订阅 X 账号和列表」的体验，底层就是这条链路——要么走 Folo 官方云服务，要么自建 RSSHub 自备 token。

### twscrape：写给开发者的账号池库

前面两个都是「服务」，[twscrape](https://github.com/vladkens/twscrape)（MIT，2.7k star，活跃）是「库」：Python 异步库 + CLI，面向 X 的 Search 和 GraphQL 端点，官方自述「run on your own account pool」。如果要在自己的采集脚本里程序化地读 X，这是当前的事实标准。

**它怎么做的：**

- **账号池是一等公民**：`add_accounts` 按「用户名：密码：邮箱：邮箱密码」批量录入账号，登录流程支持经 IMAP 自动收取邮箱验证码；也支持直接灌 `auth_token` + `ct0` cookie 跳过密码登录。
- **会话管理**：所有账号会话存在 SQLite 里；每个账号对每个端点有独立的速率上限，**超限时自动切换到下一个账号，并把该账号锁定到配额重置时间**——「账号池」从口号落到了具体的数据结构。
- **已知边界**：用户时间线最多拉最近约 3200 条（与官方 API 的历史限制一致）。
- **代理三级粒度**：每账号、每方法、全局各可配代理；HTTP 后端可选 curl-cffi，模拟浏览器的 TLS 指纹对抗检测。
- **输出**：原始 JSON 或 snscrape 兼容的数据模型——直接接班了 2023 年 11 月起停更的 [snscrape](https://github.com/JustAnotherArchivist/snscrape)（GPL-3.0，5.4k star）。

### X 小结

| 方案 | 形态 | 需要提供什么 | 输出 | 主要风险 |
| --- | --- | --- | --- | --- |
| Nitter | 自建替代前端 | 真实账号 session token | 网页 + RSS | 账号封禁、上游接口变动 |
| RSSHub Twitter 路由 | 通用 RSS 服务 | auth_token（多号轮换更稳） | RSS | 同上 |
| twscrape | Python 库 / CLI | 账号池（密码或 cookie） | 程序接口 | 同上 |
| 官方 API | 官方 | 按量付费（读取约 0.005 美元/条） | JSON | 贵，但合法稳定 |

## 四、两个平台放一起看：六条规律

1. **身份即货币**。两个平台真正的稀缺资源都不是代码，而是「能读到内容的合法身份」——微信读书账号、公众平台账号、X 账号会话。所有方案的内核完全一致：搞到身份，省着用，坏了能换。
2. **曲线救国优于正面强攻**。公众号的活路全在「寄生微信体系内的其他产品」（微信读书）；X 的活路在「复用网页端自己的内部 API」。反过来，正面爬主界面的方案——搜狗微信、snscrape、Nitter 的 guest 模式——全都死了。
3. **账号池 + 轮换 + 锁定是标准三件套**。twscrape 把它做成了显式抽象（pool、lock until reset），RSSHub 做成环境变量列表，WeWe RSS 做成「小黑屋」式的被动等待——同一件事的三种工程化程度，越显式越可靠。
4. **封锁越强的源，越值得专用工具**。RSSHub 什么都能订，唯独公众号是短板；专用工具把一个源的签名、频控、代理、通知全做深。通用基础设施和专用工具不是竞争关系，是分工关系。
5. **接口会死，项目有生命周期**。snscrape（2023-11 停更）、Nitter 公共实例（2024-01 阵亡）、WeWe RSS（2026-03 归档）、wechat-article-exporter（2026-07 停维）——这个领域的项目死亡率远高于一般开源项目，选型时「维护活跃度」比 star 数重要得多，且要接受随时断供。
6. **灰色地带的不完全开源**。签名中转（WeWe RSS 的 weread 域名）、核心闭源（Wechat2RSS）、公共代理节点（wechat-article-exporter）——反爬知识本身就是护城河，完全开源反而活不长；但中转点和闭源核心同时也是单点故障和信任风险，选型时要掂量。

最后补一句风险预算：这些方案全部违反平台服务条款，封号风险真实存在（Hacker News 上有自建 Nitter 的用户账号被封的案例）。用小号、低频访问、做好断供预案，是玩这套东西的基本素养。

## 五、如果接进自己的 DailyDigest 流水线

- **公众号**：自部署 WeRSS（当前最活跃）产出 RSS，DailyDigest 当普通源消费；或者先用 Wechat2RSS 的免费公开列表试水——想订的号若已收录，连部署都省了。WeWe RSS 已归档，新部署不建议再选。
- **X**：自建 RSSHub，配若干小号的 `TWITTER_AUTH_TOKEN` 轮换，走 `/twitter/user` 路由；采集脚本场景则直接上 twscrape 的账号池。
- **存档**：这类源随时可能断供，点名要读的文章建议按上一篇的 Linkwarden / Karakeep 思路补一份单文件存档，防「想读时已 404」。
- **边界说明**：与上一篇相同，DailyDigest 仓库的内部实现不在本篇调研范围内，以上是选型层面的建议。

## 参考仓库一览

| 项目 | 仓库 | 一句话定位 | star | License | 状态（2026-08-17） |
| --- | --- | --- | --- | --- | --- |
| RSSHub | [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) | 通用 RSS 工厂；Twitter 路由可用、公众号路由大多失效 | 45.8k | AGPL-3.0 | 活跃 |
| Folo | [RSSNext/Folo](https://github.com/RSSNext/Folo) | 生态阅读器；订阅 X 依赖 RSSHub 链路 | 38.8k | AGPL-3.0 | 活跃 |
| Nitter | [zedeus/nitter](https://github.com/zedeus/nitter) | X 替代前端 + RSS；自建需真实账号会话 | 13.4k | AGPL-3.0 | 活跃 |
| wechat-article-exporter | [wechat-article/wechat-article-exporter](https://github.com/wechat-article/wechat-article-exporter) | 借公众平台编辑器接口批量导出公众号文章 | 12.7k | MIT | 停止维护（2026-07-30） |
| WeWe RSS | [cooderl/wewe-rss](https://github.com/cooderl/wewe-rss) | 微信读书路线的公众号 RSS | 9.7k | MIT | 已归档（2026-03） |
| snscrape | [JustAnotherArchivist/snscrape](https://github.com/JustAnotherArchivist/snscrape) | 通用社交爬虫库；X 部分已失效 | 5.4k | GPL-3.0 | 停更（2023-11） |
| WeRSS | [rachelos/we-mp-rss](https://github.com/rachelos/we-mp-rss) | 公众号订阅助手，多通道采集 + API/WebHook | 4.3k | 自定义 | 活跃 |
| twscrape | [vladkens/twscrape](https://github.com/vladkens/twscrape) | X 账号池爬虫库，snscrape 继任者 | 2.7k | MIT | 活跃 |
| Wechat2RSS | [ttttmr/wechat2rss](https://github.com/ttttmr/wechat2rss) | 托管式公众号 RSS 服务（核心闭源） | 1.5k | 无（闭源核心） | 活跃 |

主要参考来源：各仓库 README 与 issue（[#18904](https://github.com/DIYgod/RSSHub/issues/18904)、[#19420](https://github.com/DIYgod/RSSHub/issues/19420)、[#19956](https://github.com/DIYgod/RSSHub/issues/19956)、[#200 停维说明](https://github.com/wechat-article/wechat-article-exporter/issues/200)）、[少数派《WeWe RSS：更优雅的微信公众号订阅源》](https://sspai.com/post/93845)、[X API 定价文档](https://docs.x.com/x-api/getting-started/pricing)、[X API 按量付费迁移公告](https://devcommunity.x.com/t/important-update-legacy-x-api-basic-plans-are-moving-to-pay-per-use-ppu/266305)、[Nitter session tokens wiki](https://github.com/zedeus/nitter/wiki/Creating-session-tokens)。
