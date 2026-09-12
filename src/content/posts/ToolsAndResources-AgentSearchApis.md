---
title: 【工具分享】Tavily 深度调研与 Agent 搜索 API 全景实测：Exa、Brave、Serper、Perplexity、Firecrawl 谁更能打
published: 2026-09-12
description: 给 Agent 接一个联网搜索，是 2026 年做 AI 应用最常见的刚需。本文深度拆解这个赛道的头号选手 Tavily——五个端点、credit 计费、限流策略与 37 项集成生态——并横向对比 Exa、Brave、Serper、SerpAPI、Perplexity、Jina、Linkup、Firecrawl、Google CSE 和已退场的 Bing API；附国内家宽直连实测矩阵：Tavily、Exa、Serper、SerpAPI、Linkup、Firecrawl 全部可达，Brave、Perplexity、Jina、Google 全部超时，而 Firecrawl 的搜索端点甚至无需 API key 就能返回真实搜索结果。
lang: zh
tags:
  - 工具分享
  - 实践记录
---

这是「给 AI 找免费/便宜数据源」系列的第三篇：前有[免费拿推文数据](/posts/toolsandresources-tweetembedapis/)和 [YouTube 转录 API 全景实测](/posts/toolsandresources-youtubetranscriptapis/)，这次轮到更底层的需求——**给 Agent 接一个联网搜索**。无论做聊天机器人、深度研究还是工作流自动化，「让模型能搜网」几乎成了标配第一步；而 2025 年 8 月 Bing Search API 正式退役、Perplexity 把 Sonar 全家转进 Legacy、Tavily 和 Exa 相继拿下大额融资，这个赛道在过去一年彻底重新洗了一次牌。

这篇笔记分三部分：先按官方文档一手拆解 Tavily 的完整产品面；再把同类工具逐个过一遍（定价均于 2026-09-12 对照官网核对，第三方比价数据单独标注）；最后用国内家宽无代理环境把所有 API 端点实测一遍。先说结论：

> **给 Agent 框架即插即用**：Tavily，免费档 1,000 credits/月不要卡，LangChain / LlamaIndex / CrewAI / n8n 等 37 项官方集成最深；**要语义检索和结果质量**：Exa，\$20 注册赠金加每月 \$10 免费额度，是全场最肥的白嫖池；**要 Google 原味 SERP**：Serper，\$50 买 5 万次（\$1/1k，量大到 \$0.30/1k），比 SerpAPI 便宜一个数量级；**只要带引用的答案**：Perplexity Search API，\$5/1k 次且支持 5 个查询打包成一次计费；**国内无代理部署**：Tavily、Exa、Serper、SerpAPI、Linkup、Firecrawl 全部直连可达，Brave、Perplexity、Jina、Google、DuckDuckGo 全部超时；**零预算的玩具项目**：Firecrawl 的 `/v1/search` 实测**无需 API key** 即返回真实结果——但这更像一个没关严的门，随时可能收紧，别上生产。

## 一、赛道地图：Agent 为什么需要专门的搜索 API

传统的「搜索 API」是给人类看的：Google 自己的 Custom Search JSON API 每天免费 100 次、付费 \$5/1k 且硬顶每天 1 万次；SerpAPI 这类 SERP 代理则是把搜索结果页扒下来给你结构化 JSON——数据是「搜索结果页」的形状（排名、snippet、广告位），不是「喂给模型」的形状。LLM 需要的是：干净的相关性片段、可控的 token 预算、可选的答案生成与原文抽取、按次计费且便宜。于是 2023 年起长出了一个新层——**Agent 原生搜索 API**，Tavily 是这个品类里最常被当作默认值的那个。

2025–2026 年这个赛道大致分三层：

| 层 | 代表 | 特点 |
|---|---|---|
| Agent 原生搜索 API | Tavily、Exa、Brave、Linkup、Parallel、You.com API | 为 LLM 设计的响应格式（干净片段、相关性分、可选全文），按次/按 credit 计费 |
| 模型厂商内置 grounding | OpenAI web search（\$10/1k）、Anthropic web search（\$10/1k）、Gemini grounding（5k 次/月免费后 \$14/1k）、Azure「Grounding with Bing」 | 省事，搜索结果直接进上下文，但贵且绑定单一模型厂 |
| SERP 代理与野路子 | Serper、SerpAPI、Firecrawl、DuckDuckGo 内部接口、自建 SearxNG | 数据是 Google 眼中的网页，不是语义排序的网页；便宜或免费，但合规与稳定性自理 |

资本对这个品类的态度很能说明问题（以下均为公开报道）：Tavily 于 2025 年 8 月 6 日宣布 2,500 万美元融资，其中 2,000 万为 Insight Partners 领投的 A 轮；Exa 在 2025 年 9 月拿下 Benchmark 领投、Nvidia 参投的 8,500 万美元 B 轮（估值 7 亿美元），2026 年 5 月 Bloomberg 报道其新一轮融资估值已达 22 亿美元；由前 Twitter CEO Parag Agrawal 创办的 Parallel 更是五个月内连打两轮——2025 年 11 月 1 亿美元 A 轮（估值 7.4 亿）、2026 年 4 月 Sequoia 领投 1 亿美元 B 轮（估值 20 亿）。另有 Keenable（2,600 万美元种子轮，Accel 领投）、Seltz（1,250 万美元种子轮）等新面孔持续入场。行业分析（Infrastartups 的赛道复盘）给过一个有意思的数字：对做深度研究的 Agent 产品，搜索能占到可变成本的 10–30%——搜索 API 已经是 Agent 的水电煤。

## 二、Tavily 深度调研

### 公司与定位

Tavily 自我定位是「AI agent 的网页访问层」（the web access layer for AI applications / Internet of Agents），创始人 Rotem Weiss 是数据科学家出身，公司披露融资时 TechCrunch 称其成立约一年。它不是搜索引擎公司——Tavily 不自建全网索引，而是在多家数据源之上做聚合、清洗、相关性排序和内容抽取，把「搜网」这件事封装成对 LLM 友好的五端点 API。docs.tavily.com 的文档质量在同类里属于第一梯队，其 LangChain 集成页也自称为「LangChain's recommended search tool」。

### 五个端点：search / extract / crawl / map / research

**`POST /search`** 是主菜，一次请求拿到的不是 SERP 而是「LLM 形状」的结果。核心参数（2026 年 9 月的完整形态）：

| 参数 | 说明 |
|---|---|
| `query` | 查询本身，配合 `exact_match: true` 可强制按引号短语逐字匹配（尽调/合规场景） |
| `search_depth` | 四档：`basic` / `advanced`（2 credits）/ `fast` / `ultra-fast`，后两档为低延迟档，2025 年 12 月上线 |
| `topic` | `general`（默认）/ `news` / `finance`，金融垂直是 2026 年新加的 |
| `chunks_per_source` | 每个来源返回 1–3 个约 500 字符的相关性分块；2026 年 7 月起 basic 档也做了重排序 |
| `auto_parameters` | 让 Tavily 按查询意图自动调参——注意它可能自动升级到 advanced 档，**一次扣 2 credits** |
| `include_answer` | 直接返回一段针对查询生成的答案（可选 basic/advanced 两档） |
| `include_raw_content` | 附带每个结果的正文（可选 markdown 或纯文本格式） |
| `include_domains` / `exclude_domains` | 域名过滤（最多 300/150 个），2026 年 8 月新增 `include_domains_mode: boost/filter`——boost 是软加权不过滤，filter 是硬过滤 |
| `time_range` / `start_date` / `end_date` | 时间过滤 |
| `country` / `language` + `filter_by_language` | 地区加权与语言过滤（ISO 639-1） |
| `include_images` / `include_favicon` / `safe_search` | 图片与站点图标、成人内容过滤（2026 年 8 月起全套餐可用，fast/ultra-fast 不支持） |

响应里每个结果带 `title` / `url` / `content`（相关性片段）/ `raw_content` / `score`（相关性分）/ `favicon`，顶层有 `answer`、`response_time` 和 `usage.credits`（本次消耗的 credit 数，方便对账）。

**`POST /extract`** 把一批 URL（最多 50 个）转成干净正文，支持意图抽取（`query` + `chunks_per_source`）和 `timeout` 控制（1–60 秒）。**`POST /crawl`** 是 2025 年 4 月上线的图遍历式爬取（beta），声称能并行探索数百条路径并内置抽取。**`POST /map`** 只返回站点 URL 结构不做内容抓取，是做站点摸底最省的姿势（0.25 credits/URL）。**`POST /research`** 是最新的大件：提交一个研究主题，Tavily 自动多轮搜索、分析来源、生成带引用的研究报告——异步任务模式（返回 `request_id` 轮询状态，或 SSE 流式拿进度），支持 `model: mini/pro/auto`、JSON Schema 结构化输出（`output_schema`）、四种引用格式（numbered/mla/apa/chicago），以及 2026 年 5 月加的域名偏好与篇幅控制（short/standard/long）。

### Credit 计费：一笔算得清的账

Tavily 全部按 credit 计费，官方口径（docs.tavily.com/documentation/api-credits）：

| 端点 | 计费规则 |
|---|---|
| search | basic / fast / ultra-fast 每次 1 credit；advanced 每次 2 credits |
| extract | basic 每 5 个 URL 1 credit；advanced 每 5 个 URL 2 credits |
| crawl（beta） | basic 每个成功抓取的 URL 1 credit；advanced 每个 2 credits |
| map | 每个发现的 URL 0.25 credits |
| research | 动态计费（按 mini/pro 模型有各自的上下限区间，官网给出具体边界） |

套餐面：**免费档每月 1,000 credits、不要信用卡**；Pay-as-you-go 每 credit \$0.008（即 basic 搜索 \$8/1k 次）；包月档折合每 credit \$0.005–0.0075（入门档 4,000 credits/月，页面价格由 JS 渲染，按第三方比价站口径约 \$30/月）；学生认证免费，企业版定制。对比一下量级：Exa \$7/1k、Brave \$5/1k、Perplexity Search API \$5/1k、OpenAI 内置 \$10/1k——Tavily 处在「不算最便宜，但免费档和生态最顺手」的位置。

### 限流与错误码

免费/包月档：development 环境 100 RPM（可 30 秒 burst 到 50 RPS），production 环境 1,000 RPM（burst 300 RPS）；PAYG 档更高（官网表格按套餐列）。错误码设计得比较讲究：`429` 是常规限流，**`432` 是月度套餐 credit 用尽，`433` 是 PAYG 余额耗尽**——做 Agent 重试逻辑时值得区分对待。

### 生态：这可能是 Tavily 最深的护城河

llms.txt 索引列出的官方集成有 **37 项**：LangChain（recommended search tool）、LlamaIndex、CrewAI、Vercel AI SDK（专门的 `@tavily/ai-sdk` 包，2025 年 11 月随 AI SDK v5 发布）、OpenAI Agent Builder、Microsoft 365 Copilot、Dify、n8n、Zapier、Make、Devin、Zapier 之外的低代码全家桶基本齐了。工程侧的几个亮点：

- **远程 MCP Server**：`https://mcp.tavily.com/mcp/?tavilyApiKey=...`，支持 OAuth 2.0，Claude / Cursor 等任何 MCP 客户端直连；还自动注入 `X-Session-Id` / `X-Human-Id` 做会话追踪。
- **x402 按次付费**：与 Coinbase 的 x402 协议集成，可以用 USDC（Base 链）按请求付款——无账号、无订阅，适合 Agent 之间的机器对机器付费场景。
- **企业级 key 管理**（2026 年 3 月）：`/generate-keys`、`/deactivate-keys`、按 key 的用量报表，配 `X-Project-ID` 头做多项目成本归因。
- **云市场分发**：Amazon Bedrock AgentCore、Azure、Databricks、IBM watsonx、Snowflake 都有合作页面。
- 文档里甚至有一页「Try Tavily Without an API Key」的无 key 试用通道。

从 changelog 看，Tavily 保持每月一到两个能力上线的节奏：2025 年 4 月 crawl beta、6 月 `auto_parameters`、12 月 fast/ultra-fast 深度档，2026 年 3 月企业 key、5 月 research 域名过滤、7 月 basic 结果重排序、8 月 boost 域名模式 + safe_search 全套餐 + 语言过滤。这个迭代速度本身就是竞争力。

## 三、国内直连实测矩阵

方法论同前两篇：国内家宽、无代理、`curl` 裸测（2026-09-12）。「可达」以拿到任何 HTTP 响应为准——401/403/400 都说明网络通、只是没带 key；连接超时才是真的不通。

| API 端点 | 直连 | 延迟 | 无 key 时的响应 |
|---|---|---|---|
| `api.tavily.com/search` | ✅ 可达 | 0.9–2.1s | 401，错误信息明确 |
| `api.exa.ai/search` | ✅ 可达 | 2.1s | **402，`X402_PAYMENT_REQUIRED`**（详见下文彩蛋） |
| `google.serper.dev/search` | ✅ 可达 | 2.6s | 403 |
| `serpapi.com/search` | ✅ 可达 | 0.7–5.3s | 401 |
| `api.linkup.so/v1/search` | ✅ 可达 | 0.8–3.8s | 400（字段校验） |
| `api.firecrawl.dev/v1/search` | ✅ 可达 | 1.4–3.4s | **200，真实搜索结果** |
| `mcp.tavily.com/mcp` | ✅ 可达 | 0.9s | 405（GET 不允许，MCP 走 POST） |
| `api.search.brave.com` | ❌ 超时 | — | — |
| `api.perplexity.ai` | ❌ 超时 | — | — |
| `s.jina.ai` / `r.jina.ai` | ❌ 超时 | — | — |
| `customsearch.googleapis.com` | ❌ 超时 | — | — |
| `html.duckduckgo.com` / `lite.duckduckgo.com` | ❌ 超时 | — | — |
| `api.you.com` | ❌ 超时 | — | — |

几个值得展开的实测细节：

**Firecrawl 免 key 实测**。`POST https://api.firecrawl.dev/v1/search` 不带任何 `Authorization` 头，三个不同查询连续三次全部返回 200 和真实结果：

```bash
curl -X POST 'https://api.firecrawl.dev/v1/search' \
  -H 'Content-Type: application/json' \
  -d '{"query":"what is tavily api","limit":3}'
```

```json
{
  "success": true,
  "data": [
    {
      "url": "https://tavily.com/",
      "title": "Tavily",
      "description": "Tavily is the real‑time search engine for AI agents and RAG workflows — …"
    },
    …
  ]
}
```

换 "exa.ai pricing"、"parallel.ai funding" 等查询同样秒回真实结果（1.4–2.2s），结果相关性意外地好。官方文档口径是 search 每返回 10 条结果消耗 2 credits、需要 API key——所以这更像官方尚未对匿名请求收紧的免费口子（或按 IP 的隐形额度），性质和[上一篇的 kome.ai](/posts/toolsandresources-youtubetranscriptapis/) 类似：能白嫖，但别把生产流量押上去。

**Exa 的 402 彩蛋**。无 key 请求 `api.exa.ai` 返回的不是 401 而是 `402 Payment required to access this resource`，错误标签是 `X402_PAYMENT_REQUIRED`——Exa 把 x402 加密支付协议做进了 API 网关，这个报错本身就是协议的一部分。Tavily 的 x402 是「可选支付通道」，Exa 则更像「原生支持」。

**SerpAPI 的一次灵异事件**。首次探测 `serpapi.com/search?q=test` 时无 key 竟返回了 200 和完整的 `search_metadata` 成功响应，复测立刻变回 401 "Invalid API key"，后续再未复现——大概率是缓存层偶发，按 401 论处，特此分层记录。

**Tavily 延迟**。三连测 0.9–1.1s（TLS 握手后约 0.6–0.8s 往返），在国内可达的 API 里属于正常水平；根路径 `/` 有 `{"message":"Alive"}` 健康检查，1.2s。

**Linkup 的接口细节**。请求体字段是 `q` 而不是常见的 `query`，且 `outputType` 必填（`searchResults` / `sourcedAnswer` / `structured` 三选一）——接的时候别想当然。

## 四、同类工具逐个看

### Exa：语义检索起家，融资最猛

Exa（前身 Metaphor Systems，旧称 Exa AI）的差异化是**神经/语义检索**：不是「关键词匹配 + 排序」，而是按查询的语义去匹配网页 embedding，特别适合「找相似内容」「按意图找站点」类需求，也提供传统关键词模式。定价（exa.ai/docs，2026-08 更新，一手）：`/search` \$7/1k 次（含前 10 条结果，超出部分 \$1/1k 条）、`/answer` \$5/1k、`/contents` 每 1k 页 \$1（按内容类型分计）、Deep Search \$12–15/1k（deep-reasoning 档 12–40 秒）、AI 摘要 \$1/1k。注册赠 \$20（约 2,800 次搜索）+ 免费层每月再送 \$10 credits——**全场最肥的白嫖池**。2026 年还上了 Agent API：按「努力档」计费（minimal \$0.012 / low \$0.025 / medium \$0.10 / high \$0.50 / xhigh \$1.00 每次运行，metered 模式封顶 \$5–20），内部调用搜索工具每次 \$0.005。第三方比价（Bright Data 等）提到 2026 年 3 月从 \$5/1k 涨到了 \$7/1k（二手口径，注意）。生态上有 Websets（批量研究）、Monitors、MCP，官方文档甚至专门做了「Migrating from Bing」迁移页。融资线前文已述：\$85M B 轮（Benchmark + Lightspeed + Nvidia，估值 \$7 亿）→ 2026 年 5 月估值 \$22 亿。

### Brave Search API：自建索引的独立派，免费档被砍

Brave 是这批选手里少数**自建全网索引**的（另一家是 Google/Bing 这种巨头），不依赖 Google 数据，隐私卖点是明示的。2026 年的定价（brave.com/search/api，一手 + 第三方补充）：Web Search API 和 Data for AI 均 \$5/1k 起，AI Snippets \$5/1k（前 0.5k 免费），**Answers（生成式答案）\$4/1k 次 + \$5/1M tokens**——这是「搜索 + 生成」混合计费的典型样本。一个重要的近期变化：老的免费档（2,000 次/月、1 QPS）被计量制取代，新用户改为每月 \$5 赠金（约 1,000 次标准查询，第三方报道口径），老免费档用户是否保留存量待确认。对国内用户更致命的是 `api.search.brave.com` 直连超时——自建索引的独立派，反而是可达性最差的。

### Serper 与 SerpAPI：Google SERP 代理的两代打法

这两个名字长得很像但完全是两家公司。**Serper**（google.serper.dev）是新一代：注册送 2,500 次查询（一次性，无需信用卡），之后 \$50 起充——\$50 = 50,000 credits，折合 \$1/1k；买得越多越便宜，最大包折到 \$0.30/1k，支持最高 300 QPS。**SerpAPI** 是老牌：引擎覆盖最全（Google、Bing、百度、Naver 等几十种），带「Legal Shield」合规姿态，但价格贵一个量级——免费档每月仅 100 次，Starter \$25/月 1,000 次（合 \$25/1k），Developer \$75/月 5,000 次，Big Data \$275/月 30,000 次（折合约 \$9.2/1k）。简单说：**只要 Google 数据选 Serper，要多引擎 + 合规背书选 SerpAPI**。两家国内都直连可达。

### Perplexity：Sonar 转 Legacy，新推 Search API + Agent API

Perplexity 的 API 策略在 2026 年来了次大转向（docs.perplexity.ai，一手）：曾经常被拿来跟 Tavily 对比的 **Sonar 全家（sonar / sonar-pro / sonar-reasoning-pro）已整体挪进 Legacy 章节**——token 价 sonar \$1/\$1、sonar-pro \$3/\$15（每 1M 输入/输出），外加按搜索上下文档位收请求费（sonar \$5/\$8/\$12 每 1k 次，pro \$6/\$10/\$14，Pro Search 模式 \$14/\$18/\$22）。接班的是两个新产品：

- **Search API**：纯搜索不带模型，\$5/1k 次请求，且**一个请求可打包至多 5 个查询、仍按一次计费**——批量场景折合 \$1/1k 查询，是全场最激进的定价之一。
- **Agent API**：OpenAI 兼容接口，底层是 OpenAI / Anthropic / Google / xAI / Z.AI / Moonshot / NVIDIA 的第三方模型，工具单独计价——`web_search` \$0.0025/次（\$2.5/1k）、`fetch_url` \$0.0005/次、`people_search` 和 `finance_search` 各 \$0.005/次。另有纯转发的 Router API。

对开发者来说，这是从「卖一个带搜索的模型」转向「卖搜索和 Agent 基础件」——正好和 Tavily/Exa 的地盘正面重叠。可惜 `api.perplexity.ai` 国内直连超时。

### Jina AI：按 token 计费的另类

Jina 的打法是把搜索和网页转 Markdown 都按 **token** 计。`r.jina.ai`（Reader，任意 URL → 干净 Markdown）可以**无 key 白嫖**：按 IP 限 20 RPM（Simon Willison 2024 年的著名安利，二手口径），注册 key 送 10M tokens 且限速更高；token 包价格第三方口径约 \$0.02–0.045/1M。`s.jina.ai`（Search）必须带 key，每次搜索固定按 10k tokens 起计——折算下来纸面价格低得惊人，但注意搜索质量与中文支持一般。国内 `r.jina.ai` / `s.jina.ai` 全部超时，白嫖党需要代理。

### Linkup：法国小而美

Linkup 是巴黎团队做的搜索 API，标准搜索 \$0.005–0.006/次、深度搜索 \$0.05–0.055/次（按输出类型），免费层每月约 \$5 额度（第三方口径，约合 1,000 次标准或 100 次深度）。`api.linkup.so` 国内直连可达且响应快，接口字段 `q` + `outputType` 的设计前面提过。

### Firecrawl：爬虫转全家桶

Firecrawl 靠「网页转 LLM 干净数据」的爬取/抽取起家，search 是后加的能力：每 10 条结果 2 credits，免费层每月 1,000 credits（第三方口径），Hobby \$16/月、Standard \$83/月约 10 万 credits。加上实测发现的免 key 通道，它适合「搜索 + 抓取 + 结构化」一条龙的场景；官方博客甚至做了 Web Search API 横评，把自家的 Research Index 端点免费开放给学术用途。

### Google 与 Bing：巨头的进与退

Google 这边是双通道：**Custom Search JSON API**（100 次/天免费，\$5/1k，硬顶 1 万次/天——再有钱也买不到更多）适合小量、精确、站内检索；**Gemini grounding**（Gemini 3.x：每月 5,000 次免费后 \$14/1k；Gemini 2.x 旧价 1,500 次/天免费后 \$35/1k）适合已在 Gemini 生态里的场景。两个域名国内都不通。Bing 那边则是 2025 年 8 月 11 日 **Bing Search API 正式退役**（Microsoft Learn 公告），官方替代是 Azure AI Agents 里的「Grounding with Bing」——需要完整 Azure 环境，PPC Land 用「贵 40,483%」的标题吐槽过替代方案的定价（按最低用量档对比最高用量档的标题党算法，但方向没错：确实贵了一个量级）。这次退役直接给 Tavily/Exa/Parallel 们送了一波迁移流量——Exa 和 Parallel 的官方博客都专门做了 Bing 迁移指南。

### 模型厂商内置搜索：省事但贵

OpenAI Responses API 的 web search 工具 \$10/1k 次调用（社区反馈推理模型档收 \$25/1k，二手口径），搜索注入上下文的内容还按 input token 计费（一次搜索常见 8k tokens 上下）；Anthropic 的 web search 工具同样 \$10/1k 次 + token 费。对比之下独立搜索 API 的 \$5–8/1k 且 token 自己可控，就是它们存在的理由。You.com 也完成了从消费级搜索到 API 优先的转型（2025 年 10 月上 MCP、11 月上 Deep Search API、2026 年 7 月更新 Research API），定价第三方口径 \$5/1k，但 `api.you.com` 国内不通。

## 五、横向对比矩阵

按 2026-09-12 官网标价整理；「1 万次成本」按 basic 档粗算、不计免费额度与 token 费，仅供量级参考：

| 服务 | 免费额度 | 标准搜索单价 | 1 万次约 | 答案生成 | 抽取/爬取 | MCP | 国内直连 |
|---|---|---|---|---|---|---|---|
| Tavily | 1,000 credits/月 | \$8/1k（PAYG） | \$80 | ✅ include_answer | ✅ extract/crawl/map | ✅ 官方远程 | ✅ |
| Exa | \$20 注册 + \$10/月 | \$7/1k | \$70 | ✅ /answer | ✅ /contents | ✅ | ✅ |
| Brave | 每月 \$5 赠金 | \$5/1k | \$50 | ✅ Answers（+token 费） | ✗ | ✗ | ❌ |
| Serper | 2,500 次（一次性） | \$1/1k 起 | \$10 | ✗ | ✗（SERP 数据） | ✗ | ✅ |
| SerpAPI | 100 次/月 | \$25/1k 起 | 约 \$100–150 | ✗ | ✗ | ✗ | ✅ |
| Perplexity Search API | 无 | \$5/1k（5 查询打包 1 计费单位） | \$10–50 | ✗（纯搜索） | ✗ | ✅ | ❌ |
| Perplexity Agent API | 无 | web_search \$2.5/1k 次 | \$25 + 模型费 | ✅ | ✅ fetch_url | ✅ | ❌ |
| Jina s.jina.ai | key 送 10M tokens | 按 token，1 次 10k tokens 起 | 纸面 \$2–5 | ✗ | ✅ r.jina.ai | ✅ | ❌ |
| Linkup | 约 \$5/月 | \$5–6/1k | \$50–60 | ✅ sourcedAnswer | ✗ | ✅ | ✅ |
| Firecrawl | 1,000 credits/月 | 2 credits/10 条结果 | 约 \$17（套餐折算，二手） | ✗ | ✅ 强项 | ✅ | ✅（且实测免 key） |
| Google CSE | 100 次/天 | \$5/1k | \$50（日上限 1 万次） | ✗ | ✗ | ✗ | ❌ |
| Gemini 3 grounding | 5,000 次/月 | \$14/1k | \$70 + 模型费 | ✅ | ✗ | ✗ | ❌ |
| OpenAI web search | 无 | \$10/1k + token 费 | \$100 + token 费 | ✅ | ✗ | ✗ | 看模型端点 |
| Anthropic web search | 无 | \$10/1k + token 费 | \$100 + token 费 | ✅ | ✗ | ✗ | 看模型端点 |

几个不在表里的补充：Parallel（搜索「每次不到 1 分钱」的按次计费，具体价目未公布全量）、You.com（\$5/1k，二手口径）、SearxNG 自建（免费但出口 IP 自己解决）、DuckDuckGo 内部接口（Python 的 `ddgs` 库最方便，但国内同样不通）。

## 六、选型指南

- **LangChain / CrewAI / n8n 等框架里即插即用**：Tavily。集成深度第一，免费档够跑原型，credit 模型好核算；记得关掉或留意 `auto_parameters` 的隐性升档。
- **语义检索、找相似站点、批量研究**：Exa。神经检索的质量优势明显，\$20 + \$10/月 的赠金池可以先把真实用量跑出来再谈付费。
- **要 Google 的排序原味（SEO 监控、竞品追踪）**：Serper。\$1/1k 的价格基本就是「自己爬 Google」的成本价，还不用维护代理池；要多引擎和合规背书再上 SerpAPI。
- **只要带引用的答案、不想管 prompt 工程**：Perplexity Search API（批量打包计费便宜到离谱）或 Agent API 的 web_search 工具；但国内部署需代理。
- **重视隐私与独立数据源**：Brave（自建索引）——前提是你的服务器不在中国大陆。
- **搜索 + 网页抽取一条龙**：Firecrawl（有正式预算时）或 Jina（按 token 计费、Reader 适合轻量转 Markdown）。
- **国内无代理直连部署**：可选面是 Tavily、Exa、Serper、SerpAPI、Linkup、Firecrawl 六家；纯白嫖试验可用 Firecrawl 的免 key 端点（自担风险）。
- **已在 Azure / Gemini 生态**：Grounding with Bing / Gemini grounding 贵但省事，搜索质量和模型上下文管理不用自己操心。

最后一点观察：这个赛道 2026 年同时存在两个方向相反的力——模型厂商的内置 grounding 在「往上挤压」（OpenAI/Anthropic 都收 \$10/1k，但开发者要的是多源可控），而独立层在「往下内卷」（Serper 卷到 \$0.30/1k、Perplexity 打包计费、Exa 反而逆势涨价到 \$7/1k 还能涨估值）。搜索正在从「产品功能」变成「Agent 的基础设施」，而基础设施的宿命就是又便宜又可靠、且没人注意得到——Tavily 们正在赌这个未来。

## 参考资料

- [Tavily 官网定价](https://www.tavily.com/pricing) / [API Credits 文档](https://docs.tavily.com/documentation/api-credits) / [Rate Limits](https://docs.tavily.com/documentation/rate-limits) / [Search 端点参考](https://docs.tavily.com/documentation/api-reference/endpoint/search) / [Research 端点参考](https://docs.tavily.com/documentation/api-reference/endpoint/research) / [Changelog](https://docs.tavily.com/changelog)
- [Insight Partners：Tavily Raises \$25 Million](https://www.insightpartners.com/ideas/tavily-raises-25-million-to-power-the-internet-of-agents/)（2025-08-06）；[TechCrunch 报道](https://techcrunch.com/2025/08/06/tavily-raises-25m-to-connect-ai-agents-to-the-web/)；[Calcalist：\$20M Series A](https://calcalistech.com/)
- [Exa 定价文档](https://exa.ai/docs/reference/pricing)（2026-08 更新）；[Exa Series B 公告](https://exa.ai/blog/announcing-series-b)；[Latham & Watkins：\$85M B 轮](https://www.lw.com/en/news/2025/09/latham-watkins-advises-exa-in-us85-million-series-b-financing-with-benchmark-and-lightspeed)；[Bloomberg：Exa 估值 \$22 亿](https://www.bloomberg.com/news/articles/2026-05-20/andreessen-backed-ai-search-startup-exa-valued-at-2-2-billion)
- [Brave Search API](https://brave.com/search/api/)；[Implicator.ai：Brave 砍免费档](https://www.implicator.ai/brave-drops-free-search-api-tier-puts-all-developers-on-metered-billing/)
- [Serper 官网](https://serper.dev/)；[SerpAPI 定价](https://serpapi.com/pricing)
- [Perplexity API 定价文档](https://docs.perplexity.ai/docs/getting-started/pricing)
- [Jina Reader](https://jina.ai/reader/)；[Simon Willison 对 r.jina.ai 的安利](https://simonwillison.net/2024/Jun/16/jina-ai-reader/)；[Spider vs Jina](https://spider.cloud/blog/spider-vs-jina-reader/)
- [Linkup 定价](https://www.linkup.so/pricing)；[Firecrawl Search 文档](https://docs.firecrawl.dev/features/search) / [定价](https://www.firecrawl.dev/pricing)
- [Google Custom Search JSON API 概览](https://developers.google.com/custom-search/v1/overview)；[Gemini API 定价](https://ai.google.dev/gemini-api/docs/pricing)
- [Microsoft Learn：Bing Search API 退役公告](https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement)（2025-08-11）；[PPC Land：替代方案价格对比](https://ppc.land/microsoft-ends-bing-search-apis-on-august-11-alternative-costs-40-483-more/)
- [Anthropic Web Search Tool 文档](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)；[OpenAI API 定价](https://developers.openai.com/api/docs/pricing)
- [TechCrunch：Parallel \$2B 估值](https://techcrunch.com/2026/04/29/parallel-web-systems-hits-2b-valuation-five-months-after-its-last-big-raise/)；[Parallel 官网](https://parallel.ai/)
- [Firecrawl：Best Web Search APIs 2026 横评](https://www.firecrawl.dev/blog/best-web-search-apis)；[Infrastartups：Search API 赛道复盘](https://www.infrastartups.com/p/sector-deep-dive-5-search-api-products)
