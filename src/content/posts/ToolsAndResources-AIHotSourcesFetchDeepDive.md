---
title: 【学习笔记】AIHOT 拆解（二）信源与抓取层：每分钟调度、六种读取器、判重时间线与出站防护的源码级拆解
published: 2026-09-29
description: AIHOT 系列第二篇，专拆抓取层：worker 每分钟调度到期信源（单例锁、批量 40、+10 分钟防重入）与单次抓取的公共管线（白名单过滤→首导入回灌限流→详情页按预算补齐→身份键判重→入队分析）；深读判重与时间线引擎 materials.ts 的五条规则（身份键三级回退、内容哈希、跨源不改写、历史版本回归不算新、U+FFFD 传输丢字符等价比较）与 48 小时陈旧/1 小时未来时间线裁决；逐行拆六种读取器——RSS 的 ETag 条件请求与诱饵摘要识别、网页列表的三种解析模式加为 MiMo 官网写的 JS chunk 逆向适配器、JSON 接口对 Next.js __NEXT_DATA__/flight payload 的嵌入式解析、X 账号与微信公众号的两种增量范式对比（X 是「查询即增量、响应即全文」：since_id 水位线服务端过滤、24 人分片搜索、snowflake 水位线、backlog 断点续读；公众号是「列表+本地判重+逐篇取正文」：付费窗口去重与正文重试）、脚本推送的安全设计；正文提取层 Readability+linkedom 与 Jina 兜底与「unconfirmed」状态；出站 HTTP 的 SSRF 防护、单超时预算、egress 路由与字符集嗅探；附频率自适应公式、18 个示范信源全名单与线上 865 信源规模。全部结论以源码为准（commit 589f79e）。
tags: [学习笔记, 工具分享, AI前沿]
abbrlink: aihot-sources-fetch-deep-dive
---

> 整理日期：2026-09-29
> 调研方式：完整克隆 [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT)，精读抓取层全部源码——`sources/collect.ts`（364 行调度与公共管线）、六种读取器（`rss.ts` 206 行 / `web-list.ts` 365 行 / `json-list.ts` 185 行 / `x.ts` 248 行 / `mp.ts` 140 行 / `apps/api/src/routes/ingest.ts`）、判重与时间线引擎 `content/materials.ts`（205 行）、正文提取 `content/extract.ts`（163 行）、出站 HTTP `lib/http-fetch.ts`（139 行）。行号与常数以 commit `589f79e` 为准。
> 本系列：[一·总览](/posts/aihot-framework-deep-dive/) · **二·信源与抓取（本篇）** · [三·精选与评分](/posts/aihot-selection-scoring-deep-dive/) · [四·聚簇与热度](/posts/aihot-clustering-hotrank-deep-dive/) · [五·模型榜](/posts/aihot-leaderboard-kemeny-deep-dive/) · [六·技术栈](/posts/aihot-tech-stack-explained/)
> 写作动机：总览篇里抓取层只占一节。但读下来这一层是全仓库「实战痕迹」最密的地方——每个函数注释几乎都是一个真实翻车故事（乱码 feed、丢字符、重定向换站、X 静默账号）。值得单独拆开。

## 一、太长不看

1. **调度极简**：worker 每分钟一次把到期信源（每次 ≤40 个、最老的先走）丢进 pg-boss 队列，单信源单例锁，入队即把 `next_fetch_at` 推 10 分钟防重入。没有更复杂的调度器。
2. **判重引擎是这个系统的地基**：每条资料按三级回退的身份键（显式指定 → X 推文 `x:<id>` → 规范化 URL）全局唯一；同身份只在自己**信源**的报道变化时才产生新版本，别的源再列出它只记一次「发现」；曾经出现过的版本再次出现（页面轮换促销位）不触发重分析。
3. **时间线只有一条规则且所有入口共用**：发现时已发布超过 48 小时 → 归档不进「今天」；声称的发布时间超过未来 1 小时 → 不信任置空；历史导入即使被分析也「不创建事件、不加热度」。
4. **六种读取器没有一个是通用爬虫**：RSS 带条件请求和诱饵摘要识别；网页列表为「没有链接的首页」写了 JS chunk 逆向；JSON 读取器能解 Next.js 的 flight payload；X 把 24 个账号打包成一次付费搜索；公众号每次列表调用按 10 分钟窗口去重；推送接口自动建的信源默认不公开。
5. **正文提取的哲学是「宁可没有，不可拿错」**：Readability 解析失败就标 `unconfirmed`（明确告诉下游「没拿到」），而不是拿页面导航文字凑数；付费的 Jina 渲染只做兜底。
6. **出站 HTTP 全部经过一个 139 行的守门函数**：SSRF 白名单校验、手动逐跳重定向检查、单一超时预算覆盖 DNS+重定向+正文、流式字节上限、`.cn`/`.local` 直连其余走出口代理、字符集嗅探（gb2312→gbk）。
7. **最有迁移价值的是判重规则集**：跨源不改写、历史版本记忆、U+FFFD 等价比较——这三条解决了聚合器最常见的「同一篇文章反复触发下游付费分析」问题。

## 二、公共管线：一次抓取发生了什么

`sources/collect.ts` 的 `collectSource()` 是所有主动抓取（RSS/网页/JSON/X）的公共入口，公众号和外部推送走各自路径但汇入同一个判重引擎：

```text
loadSource → fetch_runs 落一行「开始」
  → 按类型拉列表（各读取器）
  → allowed() URL 白名单过滤 + rewriteUrl() 前缀改写 + noiseFiltered() 关键词/分类噪声过滤
  → 首次导入：截 initialBackfillLimit（默认 30 条）/ initialBackfillMonths（默认 12 个月）
  → 非首抓截 60 条（X 除外，水位线自己保证不丢）
  → detail 规则：只对「库里没有的 URL」按预算抓详情页补日期/标题/摘要
  → store()：upsertMaterial 判重入库 → created/revised 的排队分析
  → 成功：游标推进、fail_count 清零、next_fetch_at = now() + interval
  → 失败：游标不动、退避 interval × (fail_count + 2)、上限 360 分钟
```

几个容易漏看的细节：

- **配置项白名单**（`config-keys.ts`）：每个信源类型只认自己实现的配置键，填了不认识的键，保存被拒、抓取直接失败并在后台显示原因——「不会悄悄退回通用解析」是设计原则，不是意外。
- **预算熔断不惩罚信源**：抓取因 `BudgetExceededError` 失败时，`fail_count` 不增、健康度不变、15 分钟后重试。区分「上游坏了」和「我没钱了」，后台的信源周报才可信。
- **详情页的克制**：`detail.maxFetches` 是每次抓取的硬预算；已经在库里的 URL 直接跳过；列表标题被详情页规则改写过的（`titleAuthoritative`），列表自己渲染的标题无权改回去。

## 三、判重与时间线：materials.ts 的五条规则

`content/materials.ts` 是「所有新资料的唯一入口」（文件头注释原话），采集、外部推送、历史导入都要过它。核心是五条规则：

**规则一：身份键三级回退。**`identityKeyFor()` 依次尝试：显式指定的 `identityKey`（X 推文是 `x:<tweetId>`，Docusaurus 段落是 `url:<页面#锚点>`）→ 规范化 URL（去跟踪参数）→ 兜底 `src:<信源>:<sha256(url+标题)[:32]>`。同一事实从任何入口来，落到同一个键上。

**规则二：跨源不改写。**注释讲了一个必然翻车的场景：聚合器和翻译镜像会列出同一条材料，如果每次抓取都拿对方的标题摘要覆盖，文章就会「在两个源的版本之间来回翻转」。所以**只有文章自己的源有权修订它**，其他源的列出只是一条 `article_discoveries` 记录。

**规则三：版本记忆。**内容哈希（标题+正文+摘要拼接的 SHA-256）对上历史任何一个版本，就不算新材料——「在两个渲染之间交替的列表、轮换促销位的页面」不会反复触发重分析。注释还处理了导入历史的边界：导入数据没有同构哈希时，第一次抓取只记录基线、不算修订，否则「一个还在列表里的源会把每篇存量文章重新送去付费分析」。

**规则四：传输丢字符等价。**`sameBarringLoss()` 把 U+FFFD（乱码占位符）当成「任意一个字符」做等价比较——注释说有些 feed 每次加载都会随机丢几个字符，「同一篇文章没有两次相同的文本」。这是被真实数据毒打出来的代码。

**规则五：时间线裁决。**`decideTimeline()`：声称为未来超过 1 小时的时间不信任（置空）；发现时距发布超过 48 小时（`STALE_ON_DISCOVERY_MS`，注释强调「不得宽于对外契约 v1 承诺的 72 小时」）→ 标记 backfill，按原文时间归档、不进「今天」、不推送。`isHistorical()` 进一步定义「历史」：backfill 且（无发布时间或发现时已超 48 小时）——历史会被正常分析，但**不创建事件、不产生热度**（聚簇层会再查一次这个函数）。

## 四、六种读取器逐一深拆

### 4.1 RSS（rss.ts）：最规矩，但把 HTTP 语义用满了

条件请求的标准做法之上有一个反直觉的细节：**304 响应也要校验重定向目标**。`RssValidator` 记录了 `responseUrl`（最终跳达的地址），如果这次 304 的落点和上次不同，就放弃条件请求强制重拉——注释的理由是「重定向可能换了目的地，那里的 ETag 命名空间和旧的无关」。也就是说：同域 304 是真没更新，跨域 304 只能当巧合。

正文与摘要的区分靠一个**诱饵摘要识别器**：文本短于 1200 字符且命中「appeared first on / read the full story / continue reading / 结尾省略号」等标记的（The Verge 是典型），只当摘要用、正文标 `pending` 等提取任务去抓原文。`content:encoded` 过 `sanitizeBody` 清洗，图片从 enclosure 和正文 `<img>` 各取（上限 6 张），日期解析处理「带中文星期的 RFC 822 变体」。校验器只在**入库成功之后**才持久化——失败的那次不算数。

### 4.2 网页列表（web-list.ts）：三种模式加一个特化适配器

- **html 模式**：cheerio + 选择器。自带导航链接过滤器（标签/分类/作者/年份归档/分页页）；`linksStartLine` 选项处理「正文里的内链不是条目」（Axios 式行文）；卡片链接先剥图片再取文本，标题属性比链接文本干净时用标题属性。
- **markdown 模式**：URL 写成 `https://r.jina.ai/<目标>`，走 Jina 付费渲染拿 Markdown 再解析链接（JS 渲染页专用）。
- **docusaurus_changelog 模式**：纯日期标题（「时间: 2026-09-10」）不是条目而是给它下面的段落定日期；条目 URL 是 `页面#锚点`，身份键显式为 `url:...#锚点`，正文直接入库。
- **`mimo_home` 适配器**（值得单独讲）：小米 MiMo 官网首页「有标题没链接、路由全靠脚本」。读取器下载首页加载的 JS，反序扫描找到路由表（`{path:"/",...}` 里 `.e("chunkId")` 的调用序列）和 chunk 文件名映射，逐个下载首页路由的 chunk 找到 `sectionTitle:"Blog"`，再把后面的 `blogs:[{title, link, desc}]` 用字符串正则抠出来。注释最后一句：「首页不再长这样就让抓取失败，而不是悄悄退回解析菜单」。

**详情页规则**（`fetchDetail`）有一条「权威日期」设计：`publishedAtAuthoritative` 为真时，规则没找到日期就**宁缺毋滥**——页面上其他时间戳（更新时间、相关文章时间）不许顶替。日期兜底链是 meta 标签 → JSON-LD（含 `@graph` 嵌套）→ 第一个 `<time datetime>`。

### 4.3 JSON 接口（json-list.ts）：连嵌入式 JSON 都解

常规能力：`itemsPath` 取数组、`urlTemplate` 支持 `{path}`（URL 编码）与 `{raw:path}`（原样）、日期单位 `epoch_s/epoch_ms/yyyymmdd`、`requireBoolean/minNumeric` 过滤、GitHub API 自动附 token。真正出彩的是两种**嵌在 HTML 里的 JSON**：

- `html_window_var`：正则定位 `window.xxx =` 后做**括号配平扫描**（带字符串和转义状态机）提取对象字面量；
- `html_json_key`：扫所有 `<script>` 块找目标键，能解 Next.js 的 `__NEXT_DATA__`，甚至处理 flight payload（`self.__next_f.push([1,"..."])` 里转义过的字符串中再找键）。

防御性收尾：「列表有条目但一条都没映射出来」直接抛错——配置写错了要显式失败，不装没事。

### 4.4 X 账号（x.ts）：把付费 API 的经济学写进算法

详见[总览篇 7.2](/posts/aihot-framework-deep-dive/)的接口契约，这里补机制。先说结论：X 的增量模式是**「查询即增量、响应即全文」**——不存在「拉全量列表再对比」这一步：

- **查询即增量**：增量过滤发生在服务端。游标里的 `lastTweetId` 水位线直接拼进查询（`from:handle -filter:replies since_id:<水位线>`），返回的本来就只有新推文。
- **响应即全文**：搜索响应里每条推文就是完整的（全文、作者、引用推文、媒体、互动数），入库即用，正常路径**没有第二步逐条获取**。唯二的例外：帖子里挂了 X 长文（`x.com/i/article/`）→ 正文标 pending，由提取任务再调一次付费的 `/twitter/article/<推文ID>`；单条接口 `getTweet` 只被 Codex 重置监控用来补回复/引用上下文，采集路径不用它。
- **分片打包**：查询形如 `from:handle -filter:replies` 且已有水位线的账号，按参与方式分组、按源 ID 稳定排序后打包成 `(from:a OR from:b OR …) -filter:replies`——单查询 ≤470 字符（SocialData 上限 512，`since_id` 占约 30）、≤24 个账号。稳定排序保证「增删一个账号只影响它之后的分片」。分片用**成员中最老的水位线**做下界保证没人漏帖，代价是部分成员重复看到自己已有的旧推文——没关系，入库层的身份键判重（`x:<推文ID>`）让重复变成无操作。
- **水位线的巧妙处**：X 推文 ID 是 snowflake（内嵌毫秒时间戳，`xIdAt()` 用 `(ms - 1288834974657) << 22` 换算）。一个安静账号的最新推文可能是三个月前的，但「上次成功检查时间 - 10 分钟」也能换算成 ID——取两者的较大值做水位线，避免「按推文卡位置导致每次重读分片里其他账号的旧推」。
- **backlog 断点续读**：一次搜索限 10 页，读不完的把「查询+游标」存进信源 cursor，下轮继续；每轮另给老段落最多 10 页；最多保留 5 段，超了放弃最老的并计数上报（`dropped`）。过期游标（400/422）丢弃。水位线只在成功后前进（取见过的最大 ID）。
- **产出物**：原生转推剔除、按 ID 去重；推文首行做标题（≤140 字符）；引用推文内联为「【引用 @handle】…」；点赞/转发/浏览数进 `raw`。

### 4.5 微信公众号（mp.ts）：按次付费下的窗口去重

每 15 分钟的 reconcile 把到期账号排进队列（并发 2，注释：「Dajiala 允许每秒几请求，两个并发足够安全」）。核心省钱机制：**每账号每 10 分钟窗口只有一次付费列表调用**——窗口号直接编进回执身份里，无论是调度还是手动触发，同窗口的重叠请求免费复用。首查只收 7 天内的帖子（更老是历史）；单次最多处理 8 条新帖；正文抓取因「可自行恢复的原因」（限流、服务端错误）失败时，3 天内最多重试 3 次，重试计数写在 `raw.dajiala.bodyRetry`。没正文的帖子照样入库——「预筛靠标题和摘要也能跑」。游标里存着 `remainMoney`（服务商余额），后台直接可见。

与 X 对照，公众号走的是**另一种增量范式：「列表 + 本地判重 + 逐篇取正文」**——先调付费列表接口（¥0.14/次）拿近期帖子的**元数据**（标题、链接、digest 摘要），在本地逐条算规范化 URL 的身份键查库判断新旧（判增靠身份键，不是时间戳），再对每条新帖单独调正文接口（¥0.03/次）。两段式是被接口形态逼出来的：极致了的列表只给元数据，正文要按篇另买。两种范式对比：

| | X（SocialData 搜索） | 微信公众号（极致了） |
|---|---|---|
| 增量方式 | `since_id` 水位线写进查询，服务端过滤 | 拉列表，本地按身份键判重 |
| 内容获取 | 随搜索响应一次到位 | 列表只有元数据，正文按篇另买 |
| 账号聚合 | 24 个号共享一次付费搜索 | 每号独立付费列表调用 |
| 第二次调用 | 仅 X 长文取正文 | 每篇新文章都要取正文 |
| 计费 | 按返回对象数 | 列表 ¥0.14 + 正文 ¥0.03 |

两家共同的一点：**都不信任时间戳做判增**，最终兜底都是身份键（X 是推文 ID，公众号是去跟踪参数的规范 URL）——时间戳会撒谎（改时区、重发、回灌），身份键不会。

### 4.6 外部推送（ingest 路由）：默认不公开的自主通道

`POST /api/ingest/items`：Bearer Token（≥16 位、`timingSafeEqual` 常数时间比较、占位符值一律 401），每 IP 每分钟 10 次、每批 ≤50 条、缺标题或 URL 的条目跳过、批内重复 URL 取第一条。两个设计点：`sourceId` 不存在时**自动创建 external 信源但默认 `isolated`**（不进任何公开页面，管理员手动升为 editorial 才上站）——防推送接口被用来直接污染公开内容；条目可带 `raw._aihot.backfill: true` 声明为历史回灌，走与采集完全相同的 48 小时时间线规则。

## 五、正文提取：宁可没有，不可拿错

`content/extract.ts` 的状态机只有三个值：`ok`（拿到了）、`pending`（还没试）、`unconfirmed`（试过但没拿到）——**没有「拿错了」这个状态，因为拿不到就明说**。`readable()` 用 linkedom 解析 HTML + Mozilla Readability 抽正文（`charThreshold: 200`，短于 200 字符的判失败），清洗后抽图片（≤12 张，带宽高）。页面直抓失败时，若 `allowJina`（`JINA_BODY_FALLBACK` 未关）则用付费的 Jina 渲染兜底，Markdown 经一个 30 行的迷你转换器（标题/列表/引用/代码块/行内标记）转 HTML。

两个特化路径：X 帖子若是长文链接，走 SocialData 的 article 接口把 DraftJS blocks 转成带 Markdown 记号的正文，且「帖子只有链接没有内容」时用文章标题做帖子标题；`pageFetchable()` 把 `x.com`、`twitter.com`、`mp.weixin.qq.com` 排除在页面抓取之外（这两类内容「要么整体到达，要么没有」）。提取到正文是**新内容新修订**——无正文时代的分析结果自动作废重跑。

## 六、出站 HTTP：一个 139 行的守门函数

所有采集、图片代理、付费 API 的出站请求都过 `guardedFetch()`（`lib/http-fetch.ts`）：

- **SSRF 防护**：`assertPublicUrl` 校验目标，DNS 解析用 `guardedLookup` 确认「实际拨号的地址」也合规——防 DNS rebinding；
- **手动重定向**：`redirect: "manual"` 逐跳跟随，**每一跳都过一遍 SSRF 检查**；上限 5 跳；
- **单一超时预算**：一个 `AbortSignal.timeout` 覆盖 DNS + 所有重定向 + 正文下载。注释解释了为什么：在每跳重启预算「会让一个名义 20 秒的图片请求占用 API 数分钟」；DNS 查询本身不可取消，用 `Promise.race` 保证超时的解析结果不会流入后续 fetch；
- **流式字节上限**：默认 8MB，边收边检查，超了即抛（不是收完再算）；
- **路由**：默认 `egress`（走 `EGRESS_PROXY_URL` 出口代理，大陆部署用），但 `.cn`/`.local` 后缀和 IP 直连域名**不走代理**（注释假设出口代理是「.cn 直连、其余出海」的规则型代理，直连域名自己处理保持地址检查仍生效）；付费 API（SocialData/Dajiala）标 `direct`；
- **字符集**：响应头没写 charset 时嗅探 HTML meta 和 XML 声明，`gb2312` 按 `gbk` 解码（前者是后者的子集）；连续的 U+FFFD 折叠成一个——和 materials.ts 的丢字符等价比较配套，「按长度截断的文本保持相同的截断点」。

User-Agent 是「站点自己的爬虫名 + 地址」（`industry/site.ts` 的 `crawlerName`），不是伪装浏览器。

## 七、频率自适应与健康运营

每天 04:20 `adapt-intervals` 重算每个信源的间隔：目标 ≈ `24×60 / (近 7 天日均条数 × 3)`，再按成本钳位——免费编辑源 15–60 分钟；X 与 Jina 付费列表上限 120 分钟；hot_signal 上限 180 分钟；Jina 列表额外下限 60 分钟（「高频列表会吃爆 Jina 日预算」）；X 分片成员跟随分片节奏（editorial 30 / hot_signal 60 分钟），不受自身产出影响。

健康运营面：每次抓取一行 `fetch_runs`（含 found/created/页数/backlog/复用等明细）；`health` 字段三态（ok/degraded/failing，连续 5 次失败进 failing）；每周一的 `reports.source-health` 任务把信源周报推进飞书运营群。所有这些在后台「信源」页逐条可见——**把「哪个源坏了多久」做成一等运营数据**，而不是等用户投诉内容变少。

## 八、批判与借鉴

1. **特化的维护税**：`mimo_home` 式适配器是亮点也是债务——上游改版即失效，且每个新信源都可能长出一个新适配器。作者用「不认识的配置即失败」「解析为空即失败」把失效显性化，算是把税变成了可观测的税。
2. **水位线依赖 snowflake 不变量**：X 的推文 ID 内嵌时间戳是未承诺的实现细节，若变更，`coveredTo` 的换算会系统性错位。好在这只会导致多读（浪费钱）而非漏读。
3. **判重三规则值得整体抄走**：跨源不改写、历史版本记忆、丢字符等价。任何「多源聚合 + 下游付费处理」的系统都会遇到同一篇文章反复触发处理的问题，这三条是现成答案。
4. **「宁可 unconfirmed 不可错」** 是内容系统的好不变量：错误正文的代价（幻觉、错误评分）远大于缺失正文的代价（判不了先不判）。
5. **推送默认隔离**：任何「自主写入口」都默认不进公开面、要人手动提升——这个默认值方向值得所有带 ingest 的系统参考。

## 附：示范信源与真实规模

仓库带 18 个示范信源（全为海外英文 RSS）：T1 官方 10 个——OpenAI News、Google DeepMind、Google Research、Hugging Face、Microsoft Research、NVIDIA Blog、AWS ML Blog、GitHub AI Blog、Mistral、BAIR；T2 媒体/个人 8 个——The Verge AI、TechCrunch AI、Ars Technica AI、MIT Tech Review AI、The Decoder、Simon Willison、Import AI、Latent.Space。CI 断言 `count(*) from sources = 18`。线上真实规模（[about 页](https://aihot.news/about)，2026-09-29）：865 个信源（X 519、RSS 179、网页 124、公众号 23、接口 20），36.7 万条入库，「活跃的源 15 分钟看一次」。
