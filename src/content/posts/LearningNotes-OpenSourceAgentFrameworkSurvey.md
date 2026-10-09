---
title: 【学习笔记】自研 Agent 选型：十个开源框架与 Harness 深度对比（2026-10）
published: 2026-10-08
description: 系统梳理 2026 年 10 月十个开源 Agent/Harness 方案——Pydantic AI、LangGraph、CrewAI、OpenAI Agents SDK、Vercel AI SDK、Mastra、Microsoft Agent Framework、Claude Agent SDK、OpenCode、goose 的多维对比与分场景选型：Python 主线首推 Pydantic AI，需要持久化与审批时上 LangGraph，TS 阵营用 Vercel AI SDK，编码 harness 直接用成品；以及单 agent 内存态场景什么时候该抛开框架手写裸循环
tags: [学习笔记, Agent]
abbrlink: open-source-agent-frameworks-survey
---

> 整理日期：2026-10-08（调研完成于 2026-10-04，档案事实均附来源 URL，8 条关键事实经第二轮独立核查）
>
> 本文回答一个问题：**想自己动手开发一个 agent，现在的开源框架里用哪个合适？** 覆盖 LangGraph、Microsoft Agent Framework、CrewAI、Pydantic AI、OpenAI Agents SDK、Mastra、Vercel AI SDK、Claude Agent SDK、OpenCode、goose 共 10 个方案。
>
> **口径与来源层级**：本文基于 10 份深度调研档案（2026-10-04 完成调研，档案事实均经仓库 / PyPI / npm / 官方文档实测并附来源 URL，见文末来源列表）；初稿提交的 8 条关键事实已经第二轮独立核查，**全部确认**（核查细节已并入附录 B）。文中"普查"指任务起点提供的概览统计，与档案核实值有出入处在附录 B 逐条标注。凡读者需复核的数字，请直接访问来源列表中的 URL。"未经核实"标注的内容不作为结论依据，只作方向性参考。

## 0. 结论先行

- **Python 主线、想吃透 agent 每个环节：首推 Pydantic AI**（`pip install pydantic-ai`，文档 <https://pydantic.dev/docs/ai/agents/>）。十个方案里最接近"带类型安全外骨骼的裸 SDK"——核心只包执行循环、模型接入、类型化工具与输出，持久化和编排刻意留白，全 MIT。
- **需要持久化状态、人工审批、断点续跑、多 actor：次推 LangGraph**（`pip install langgraph`，文档 <https://docs.langchain.com/oss/python/langgraph/>）。开源侧经生产验证最充分的状态化 agent 运行时，1.0 后有 semver 稳定承诺；Functional API 还允许保留你自己的 while 循环、只用 `@task` 换 checkpoint/HITL。
- **TypeScript 阵营：Vercel AI SDK 起步**（`npm install ai`，文档 <https://ai-sdk.dev/docs>；积木箱、事实标准），要一站式平台再上 Mastra。
- **做编码类 harness：直接用成品**——Claude Agent SDK 最成熟但锁定 Claude 模型；OpenCode 是 MIT、模型无关的开放替代，其内核可经 `opencode serve` 嵌入自建应用。
- **单 agent、单会话、内存态、无审批、无恢复——这五个条件同时成立时，不要用任何框架**：官方 SDK + 一个 while 循环（骨架见 §4.3）就是最优解。

## 1. 先分清三种形态（以及"开源"的口径）

十个方案分布在一条光谱上，**掌控感由它决定**：

- **库（给积木）**：Pydantic AI、OpenAI Agents SDK、Vercel AI SDK，以及 LangGraph 的裸 Graph / Functional 层。执行循环每一步白盒可读、可替换，你写普通 Python/TS，库只管最难写对的部分（工具 schema、结构化输出、provider 接入）。
- **框架（替你包办）**：CrewAI、Mastra、Microsoft Agent Framework，以及全量使用概念时的 LangGraph。循环与状态机藏在框架内部，你操作它定义的词汇（role/task、workflow、executor），换来原型速度和内置生产件，代价是调试痛与迁出成本。
- **成品 harness（整机）**：Claude Agent SDK、OpenCode、goose。它们不是拿来"拼"的，是拿来"用"和"抄设计"的——Claude Agent SDK 捆绑 Claude Code 同款循环的黑盒进程；OpenCode、goose 是可直接安装的 agent 产品（内核开放、可嵌入）。

> **术语说明**：上文"成品 harness"是形态分类（一个自带循环、工具、上下文管理的完整 agent 运行时）。它与 Pydantic AI 的具体配套包 `pydantic-ai-harness`（本文一律用代码体书写）是两回事——后者是官方能力库包名，边界见 §2 表与 §4.1。

> **"开源"口径**：十个方案中九个为 OSI 许可（MIT 或 Apache-2.0）。Claude Agent SDK 是例外——Python 包 LICENSE 为纯 MIT，但捆绑的 Claude Code CLI 受 Anthropic Commercial Terms 约束，TS 包则是保留所有权利的专有许可（附录 B）。因其在编码 agent 赛道不可忽略，仍列入对比，但严格说不算"开源方案"。

选型的第一个判断不是"哪个框架最好"，而是**你在这条光谱上想站在哪里**。

## 2. 多维对比表

### 2.1 主表

| 框架（语言） | 当前版本 | 抽象层级与掌控感 | 学习曲线 | 多 agent | 记忆与状态 | 供应商锁定 | 成熟度 | 许可证 | 适合谁 |
|---|---|---|---|---|---|---|---|---|---|
| **Pydantic AI**（Python） | 2.54.0（2026-10-03） | 库。"library not a framework"，核心只包 loop/providers/hooks，存储刻意不包办 | 平缓，类型即文档 | 无内置引擎：子 agent 当工具、programmatic hand-off、pydantic-graph 状态机，全是自己写的普通 Python | 核心仅消息序列化原语；Memory / sub-agent 编排 / Step Persistence 在 0.x 的 `pydantic-ai-harness` 配套包 | 极低：`'provider:model'` 一个字符串换厂商（数十家） | 20.4k★，发版极勤；主版本节奏快（1.0=2025-09-05 → 2.0=2026-06-23，1.x 补丁线仍在维护，最新 1.107.7=2026-09-30） | MIT（五个包全 MIT） | 想深度掌控每一步的自建者、类型驱动团队 |
| **LangGraph**（Python） | 1.2.12（2026-09-21） | 积木型但概念多：裸 Graph / Functional / prebuilt 三层任选 | 陡：State/reducer/checkpointer/Command/interrupt/thread_id 等 6+ 自有概念 | 5 种官方模式（subagents / handoffs / skills / router / custom workflow），当前推荐 subagents-as-tools | 最强：checkpointer（InMemory/SQLite/Postgres）+ Store 跨线程长期记忆，支撑会话延续、HITL、时间旅行、容错 | 模型层低（核心依赖无厂商 SDK）；但消息/工具抽象硬依赖 langchain-core | 42.7k★，1.0（2025-10-17）后承诺 2.0 前公共 API 不破坏；PyPI 周下载约 1140 万；Klarna/Replit/Elastic 生产采用 | MIT | 需要持久化/审批/恢复/多 actor 的生产系统 |
| **OpenAI Agents SDK**（Python） | 0.23.1（2026-10-02） | 库。极少原语（Agent/Handoffs/Guardrails/Sessions），循环四步在文档白盒 | 平缓 | handoffs + agents-as-tools 管理者模式 | Sessions（SQLite/Redis/SQLAlchemy/MongoDB 等）+ RunState 可序列化、跨进程恢复审批；无 checkpoint/回放 | 中：默认 Responses API、tracing 回传 OpenAI；非 OpenAI 仅 LiteLLM/any-llm 两个 best-effort/beta 适配层 | 29.8k★，0.x 高速演进（19 个月 123 版，无 1.0 稳定承诺）；Temporal 官方集成已 GA | MIT | OpenAI 主力栈；想读最短参考实现的人 |
| **Vercel AI SDK**（TypeScript） | `ai@7.0.89`（2026-10-04） | 库/积木箱。ToolLoopAgent "intentionally shallow"，官方明说需要逐步控制时退回核心函数 | 平缓，cookbook 有 manual-agent-loop 配方 | 仅 subagent（agents-as-tools）一种模式 | 核心无长期记忆/持久化（官方指路外接）；WorkflowAgent 依赖 beta 的 workflow 运行时 | 极低：provider 层是 TS 事实标准（40+ provider，公开规范可自定义） | 27.1k★；`ai` 周下载 33,670,560（2026-09-25~10-01）、5167 个依赖项目；两年 v4→v7 | Apache-2.0 | TS 自建者做模型层/流式 UI/薄 agent |
| **CrewAI**（Python） | 1.15.23（2026-09-28） | 框架，包办型：ReAct 循环实现在框架的 CrewAgentExecutor 内部（核查方解包 wheel 证实），不可插手 | 平缓，role/goal/backstory 拟人抽象对直觉友好 | hierarchical（manager LLM 动态分派，无顺序保证）+ agent 间 delegation | 统一 Memory（LanceDB 默认，语义+新近度+重要性评分）+ Flows `@persist` SQLite | 模型层低（LiteLLM 通吃约 20 家）；默认值偏 OpenAI（记忆嵌入/分析默认 OpenAI 模型） | 59.3k★，每周约 2 版；生产调试口碑差（HN 高热度批评帖："abstraction soup makes debugging a nightmare"） | MIT | 快速搭多角色分工原型 |
| **Microsoft Agent Framework**（Python/.NET） | agent-framework 1.20.0（2026-10-02） | 积木 + 生产件齐全，Azure/Foundry 为第一语境 | 中偏陡：概念面宽，且 2026 年高频破坏性变更 | typed dataflow 工作流（superstep 执行）+ Handoff/Group Chat/Magentic 等 | checkpoint 按 superstep 自动存档、HITL 图原语（request/response）、OTel 1.6.0 起默认开启 | 低（官方 Provider 页覆盖主流 + Ollama）；但文档与示例语境偏 Azure | GA 仅 6 个月（2026-04-02），13.9k★，约每周发版；生态与第三方生产履历薄（未检索到具名第三方生产案例） | MIT | .NET/Azure 企业团队 |
| **Mastra**（TypeScript） | `@mastra/core@1.74.0`（2026-10-01） | 框架感重：全家桶 + 脚手架 + Studio，层层私有抽象 | 中：单 API 干净，完整体验依赖脚手架 | handoffs / supervisor / workflows / council 四模式 | Memory 四组件（消息历史/语义召回/工作记忆/观察式压缩——后台 agent 压缩旧消息，官方称 5–40 倍，未独立核实）+ durable workflow suspend/resume | 模型层零锁定（复用 AI SDK provider）；架构层锁定重 | 28.5k★，近逐日发版；官网自述 31 个客户案例（Salesforce/MongoDB/Workday 等，**厂商口径**，与 CrewAI 的宣传数字同等对待） | Apache-2.0 + `ee/` 企业许可（生产使用付费） | TS 团队要一站式 agent 平台 |
| **Claude Agent SDK**（Python/TS） | Py 0.2.163（2026-09-30）/ TS 0.3.289（2026-10-03） | 成品 harness 黑盒：捆绑 Claude Code CLI 子进程，你写配置而非组合积木 | 中：文档顶级，但循环不可见不可改 | subagent（独立上下文 + 后台并发，只回传最终消息） | session 落盘 jsonl、resume/fork、自动 compaction、成本硬上限 | 极高：仅 Claude 系模型（官方明示 BASE_URL 只改请求去向、不改模型身份） | 0.x 日更随 Claude Code；npm 周下载 1360 万；据 HN 多方报道 Apple Xcode 26.3（2026-02）内置其集成（本文未直接复核 Apple 官方页面） | Python 包 MIT（捆绑 CLI 受商业条款约束）；TS 包专有 | 一下午要一个能干活的 Claude 编码 agent |
| **OpenCode**（TypeScript） | v2.0.20（Homebrew，2026-10-04） | 可拆的整机：配置驱动 harness，内核可经 `opencode serve` 嵌入 | 中：产品用法简单，二开需读 TS 源码 | `@subagent` 显式委托 | session resume/share + AGENTS.md 分层规则 + `/compact` 压缩 | 低：75+ provider（AI SDK + 自维护 models.dev 模型目录） | 约 21 万★（本榜最高）；有未认证 RCE 前科（CVE-2026-22812，v1.1.10 修复）、6,251 个 open issues（2026-10-04 实测） | MIT | 编码 agent 直接用 / 内核嵌入自建应用 / 抄设计 |
| **goose**（Rust） | v1.48.0（2026-08-27，最后可核实版本） | 成品 harness，SDK 幼稚；更大价值是 MCP-first 参考实现 | 中偏陡（Rust 全栈） | summon subagent 委派 + recipes（YAML 工作流/定时） | SQLite session + memory 扩展 + Context Revision 自动压缩 | 低：15+ provider，会话内 `/model` 随时切 | 54.5k★，AAIF（Linux 基金会旗下、接纳 goose/MCP/AGENTS.md 的治理基金会）过渡期 | Apache-2.0 | 本机通用 agent 开箱用；MCP-first 架构参考 |

### 2.2 补充矩阵：MCP、本地模型、测试评测、上手入口

2026 年选 agent 框架的三个高频硬指标（信息全部来自调研档案；档案未记载的如实标注）：

| 框架 | MCP 支持 | 本地/私有模型 | 测试与评测 | 上手入口 |
|---|---|---|---|---|
| Pydantic AI | 核心包支持 MCP 客户端（档案：MCP/网络/限流自动重试为内建容错） | 官方 Provider 目录含 Ollama / vLLM / OpenRouter / LiteLLM，OpenAI 兼容私有端点可用 | `pydantic-evals`（同仓库、MIT、与主包同步发版 2.54.0） | `pip install pydantic-ai`；<https://pydantic.dev/docs/ai/agents/> |
| LangGraph | 档案未记载，选型前自行核实 | 官方支持 Ollama 与 vLLM（OpenAI 兼容 API） | 档案未记载（生态侧为付费 LangSmith） | `pip install langgraph`；<https://docs.langchain.com/oss/python/langgraph/> |
| OpenAI Agents SDK | Agent 的 `mcp_servers` 参数，一等公民 | 经 `set_default_openai_client` 指向任意 OpenAI 兼容端点（vLLM/Ollama 兼容层） | 档案未记载（tracing 免费看板可辅助调试） | `pip install openai-agents`；<https://openai.github.io/openai-agents-python/> |
| Vercel AI SDK | `createMCPClient`，一等公民；工具审批（needsApproval）配套 | 社区 Ollama provider（默认 `http://localhost:11434/api`） | 档案未记载 | `npm install ai`；<https://ai-sdk.dev/docs> |
| CrewAI | 支持（工具生态走 crewai-tools 与 MCP） | `crewai[litellm]` 后 Ollama、vLLM 类 OpenAI 兼容端点可用；注意记忆默认值偏 OpenAI | 档案未记载 | `crewai create flow` 脚手架；<https://docs.crewai.com/> |
| Microsoft Agent Framework | 内置三件套：`MCPStdioTool` / `MCPStreamableHTTPTool` / `MCPWebsocketTool` | Ollama（原生 + OpenAI 兼容）、ONNX、Foundry Local | 档案未记载 | `pip install agent-framework`；<https://learn.microsoft.com/agent-framework/> |
| Mastra | 有 MCP server 模块 | OpenAI 兼容 baseURL；注意 2026-02 有本地模型 tool calling 兼容 issue | 内置 evals 模块 | `npm create mastra@latest`；<https://mastra.ai/docs> |
| Claude Agent SDK | 进程内 MCP server（Python `@tool` + `create_sdk_mcp_server`）与外部 stdio MCP，可混用 | 不支持（仅 Anthropic 系端点） | 档案未记载 | `pip install claude-agent-sdk`；<https://code.claude.com/docs/en/agent-sdk/overview> |
| OpenCode | 可挂 MCP 扩展 | 75+ provider 含本地模型，自定义 baseURL/apiKey 即接私有端点 | 档案未记载 | Homebrew：`brew install opencode`（档案核实其在 homebrew-core）；<https://opencode.ai/docs/> |
| goose | MCP-first：所有扩展都是 MCP server，内置 70+ | Ollama/MLX/llama.cpp 等本地推理，声明式 OpenAI 兼容网关 | 档案未记载 | 仓库 <https://github.com/aaif-goose/goose>（档案未给安装命令） |

**评测现状的诚实结论**：十个方案中，开源评测只有 Pydantic AI 的 `pydantic-evals` 和 Mastra 的 evals 模块是档案明确记载的；LangGraph 生态的主流答案是付费 LangSmith。通用做法（本文建议，非档案事实）：对 agent 做回归测试时固定模型与采样参数、mock 工具返回、对消息序列做快照断言；评测可用上述开源包或自建 LLM-as-judge 管线。

## 3. 分场景推荐

### 场景 A：想一周内跑起来

- **Python 单 agent**：Pydantic AI。一个 `Agent` 类 + 几个 `@agent.tool` 函数即可跑通（第一个程序见 §4.2）；结构化输出、审批也是核心包原语。
- **要多角色分工的 POC/演示**：CrewAI 最快（官方模板十几行跑通 2-agent 流水线，`crewai create flow` 生成项目骨架）。代价：hierarchical 模式任务由 manager LLM 动态分派、官方文档只对 sequential 模式承诺顺序，调试痛是高热度社区批评。
- **TypeScript**：Vercel AI SDK（`generateText` + `tool` 起步）；如果一周内要"记忆 + 工作流 + playground 全都有"，直接 Mastra（`npm create mastra@latest`）。
- **如果"跑起来"指编码 agent 本身**：不要写，直接装 OpenCode（`brew install opencode`）/ goose / Claude Code。

### 场景 B：想深度掌控每个环节、边学边造

这是"自己开发 agent"的核心人群：

- **主线选 Pydantic AI**：抽象薄到"一个 Agent 类 + 装饰器 + run 循环"就是全部 API 表面。所谓"执行图十来个节点类型"指其内部基于 pydantic-graph 的运行时状态机（UserPromptNode → ModelRequestNode → CallToolsNode → … → End），可用 `agent.iter()` 手动逐步驱动——读源码成本最低。自建时最难写对的三块——类型化工具 schema、结构化输出三模式（ToolOutput/NativeOutput/PromptedOutput）+ ModelRetry 重试、OTel 埋点——都是现成 MIT 代码，可抄可 fork。
- **对照读物：OpenAI Agents SDK**（MIT，循环语义白盒写在官方文档，是最短的 canonical loop 参考实现，四步见 §4.3）。
- **TS 路线**：Vercel AI SDK，先照官方 cookbook 手写 manual-agent-loop，再换 ToolLoopAgent 对比；provider 层值得长期复用。
- **harness 设计课**：读 Claude Agent SDK 官方文档（权限分层、自动 compaction、session fork、成本核算，写到可据此做架构决策）+ OpenCode 源码（agent = 模型 + prompt + 工具白黑名单 + 三态权限的纯配置组合、plan/build 分相）。前者当教材，别当起点——其循环不可移植到其他模型。
- **升级路径**：Pydantic AI 写循环起步，出现持久化诉求时两条路——LangGraph Functional API（保留 while 循环，`@task` 换 checkpoint/HITL/重试），或 Pydantic AI + Temporal/DBOS 等第三方持久化执行引擎（官方记载的集成方含 Temporal/DBOS/Restate/AWS Lambda）。

### 场景 C：要上生产

- **有状态长流程**（跨请求恢复、工具前审批、断点续跑、多 actor 并行）：**LangGraph**。checkpoint 体系（InMemory/SQLite/Postgres 三后端）+ interrupt/Command 协议 + 时间旅行，是开源侧经生产验证最充分的答案——能力面上 MAF 同样齐备（checkpoint/HITL/OTel 亦有），差别在成熟史与履历：LangGraph 1.x 已一年、有 Klarna（LangChain 官方 1.0 博客）、Elastic（elastic.co 博客 2024-08 + LangChain 产品页）、Replit（LangChain 官方生产案例集）等具名采用；MAF GA 仅 6 个月且未检索到具名第三方生产案例。
- **LangGraph 的商业边界（界定清楚）**：库本身（含 checkpointer 三后端、`interrupt()`/`Command(resume=...)`、Store）MIT 免费；付费的是 LangSmith 平台——Deployment（云/混合/自托管）与 Studio 全功能可观测；本地开发服务器 `langgraph dev`（langgraph-cli 包）MIT 免费。**部署前提**：InMemorySaver 零依赖；SqliteSaver 单文件即可；PostgresSaver 需自备 PostgreSQL；HITL 必须配 checkpointer + thread_id。
- **请求作用域、状态轻**：Pydantic AI（Tiger Data 生产 Slack bot："a production AI Slack bot that handles thousands of concurrent conversations"，出处 <https://pydantic.dev/articles/tiger-data-ai-slack-bot-pydantic-logfire>）或 Vercel AI SDK（Thomson Reuters CoCounsel、Clay 的 Claygent——转引自第三方对比文，未独立核实）。记得开观测：Pydantic AI 的 `Agent.instrument_all()` 可导出任意 OTel 后端，不绑 Logfire（Pydantic 自家的可观测 SaaS，有永久免费层）。
- **"薄 SDK + 外部持久化引擎"路线**：OpenAI Agents SDK + Temporal（官方集成页 <https://docs.temporal.io/develop/python/integrations/openai-agents>，已 GA 并独立成包 temporalio-openai-agents 1.0.0；确切机制是 agent 循环跑在 Temporal Workflow 内、每次模型调用成为 Activity；GA 日期 2026-03-23 系第三方来源佐证，官方页未标注日期）。需自备 Temporal Server 或云。
- **.NET/Azure 企业**：Microsoft Agent Framework（checkpoint/HITL/OTel/DevUI 内核齐备，AutoGen 与 Semantic Kernel 的官方继任者）。必须锁 minor 版本并把官方 Upgrade Guides 纳入升级流程；引入前先做 spike（技术验证）——建议两周内用真实负载验证两件事：checkpoint 恢复是否符合业务语义、一次 minor 升级的破坏面多大。
- **TS 平台级**：Mastra（durable workflow + 记忆 + evals + Studio），接受逐日发版与 `ee/` 商业边界。**部署前提**：存储后端按需另装（如 `@mastra/libsql`），Studio playground 跑在本地 4111 端口。
- **稳定性档位要认清**：0.x 项目（OpenAI Agents SDK、Claude Agent SDK）无 semver 承诺，锁版本 + 回归测试是生存必需。

### 场景 D：想做编码类 harness

- **自己用/团队用，直接装成品**：Claude Agent SDK（最成熟：继承 Claude Code 实战打磨的循环、内置文件/命令工具）或 OpenCode（MIT、模型无关）。接受前者的模型锁定与 0.x 日更、后者的 issue 债与安全前科。token 开销对比：HN 706 分帖实测（2026-07）同任务下 Claude Code 首包（系统提示 + 工具定义等固定开销）约 33k token、OpenCode 约 7k——**单一实测帖，任务与模型口径未公开，未经独立核实，仅作方向性参考**。
- **嵌入自建产品**：`opencode serve` 起 headless HTTP 服务（OpenAPI 3.1 + SSE 事件流，官方 JS/Python/Go SDK——anomalyco org 下 opencode-sdk-js/python/go），把它的 agent 引擎当你的后端；TS 侧也可用 Vercel AI SDK 的 `@ai-sdk/harness-claude-code`（HarnessV1 规范适配器，官方标注实验性）。goose 的 goose-sdk（Rust + UniFFI 出 Python/Kotlin 绑定）较新、文档薄。
- **Claude Agent SDK 选 Python 侧还是 TS 侧**：两侧均为官方一等支持（Python 3.10+ / Node 18+）；TS 版本号直接跟踪 Claude Code（v0.3.289 发布说明自述 "parity with Claude Code v2.1.289"）、发布更频繁；档案未记载两侧的功能差异清单。许可上 Python 包 LICENSE 为纯 MIT（捆绑 CLI 受商业条款约束），TS 包为专有许可——**在意开源合规选 Python 侧**；纯 TS 技术栈且接受专有许可可用 TS 侧。注意 Python wheel 因捆绑 CLI 达 93–103MB，且 CLI 运行需 Node 18+。
- **抄设计清单**（均为开放源码/文档）：OpenCode 的三态权限 + bash 通配 deny、plan/build 分相、AGENTS.md 分层注入；goose 的 MCP-first 工具层（工具生态交给开放协议而非私有插件 API）；Claude Agent SDK 文档里的 session fork、自动 compaction、`max_budget_usd` 成本硬上限、token 四类成本核算（input / output / cache_creation / cache_read）。

### 多 agent 模式速查（何时用哪种）

模式名称来自各框架官方文档（档案记载）；"何时用"是本文的经验法则：

| 你的需求 | 用什么模式 | 在哪 |
|---|---|---|
| 分诊/路由：一个问题该交给谁处理 | handoffs（表现为 `transfer_to_*` 工具）或 router | OpenAI Agents SDK、LangGraph（5 模式之一） |
| 明确分工，主控 agent 保留控制权 | **subagents-as-tools（首选）** | LangGraph 与 OpenAI Agents SDK 官方共同的当前推荐；Vercel AI SDK 仅有此模式 |
| 流程确定、步骤固定 | 图/工作流（代码写死路径） | LangGraph StateGraph、MAF typed dataflow、Mastra workflows、CrewAI Flows |
| 多视角合成/互相评审 | 并行多 agent + 合成 | Mastra council（`.parallel()`）、LangGraph 并行节点 |
| 任务需要动态分派且接受非确定性 | hierarchical（manager LLM 调度） | CrewAI（manager_llm）、MAF（Group Chat/Magentic） |

## 4. 首推与"不用框架"的边界

### 4.1 首推：Pydantic AI（起点）+ LangGraph（持久化升级路径）

两者互补而非竞争——一个管"循环怎么写"，一个管"状态怎么活过进程"。

**为什么首推 Pydantic AI：**

1. 它是对"自己开发 agent"这个诉求最诚实的回答：核心/harness 边界有官方明文——core 只保留 "capabilities that require model or framework support"（精简 agent loop + provider 原生能力），"the Harness ships everything else, as a separate package"（跨会话 Memory、Subagents、Step Persistence 全在 `pydantic-ai-harness`，0.54.0）。记忆、持久化、编排留给应用代码。Tiger Data 的生产评价 "It was a library, not a framework." 是准确的。
2. 掌控感与学习价值最高：类型链路全静态检查（deps/tools/output），编排就是你自己写的普通函数，学到的每一课都可迁移。
3. 工程配套不绑架：OTel（OpenTelemetry）原生不绑 Logfire、HITL 审批原语（`requires_approval=True` / `ApprovalRequired` + DeferredToolRequests）在核心包、模型一个字符串切换、五个相关包（pydantic-ai、pydantic-ai-slim、pydantic-graph、pydantic-evals、pydantic-ai-harness）全 MIT。
4. 升级风险已知且有缓冲：主版本节奏快——据调研档案，官方把主版本间无破坏窗口从 6 个月缩到 3 个月（意为相邻主版本之间至少保 3 个月不破坏，之后即可发新主版本；1.0=2025-09-05 → 2.0=2026-06-23 即 9 个月内跨了一次破坏性升级）；但官方并行维护 1.x 补丁线（2.0 后仍发 1.107.6/1.107.7），1→2 的破坏集中在具体点位（如 `openai:` 默认改 Responses API）而非全盘重写。"抽象薄所以升级摩擦小"是本文判断，非实测结论。

**为什么次推 LangGraph：** 自己写 agent 的分水岭不在"能不能跑"，在"状态能不能活过进程"。一旦需要跨请求/跨进程恢复、工具调用前审批、长任务崩溃续跑、时间旅行调试、多 actor 并行这五条中出现**任意两条**（档案给出的收益分界），自实现等于要自己设计状态序列化 + 恢复协议 + 版本迁移，此时引入 LangGraph 开始回本——一个最小 StateGraph agent 的样板就是 §4.4 那十几行，加上 State 类型与 checkpointer 配置。代价也要认：概念税重、消息抽象依赖 langchain-core、观测/部署（LangSmith）在付费墙内。

**组合建议**：Pydantic AI 写循环与工具层 → 出现持久化诉求时评估 LangGraph Functional API 或 Pydantic AI + Temporal → 多 agent 编排始终优先 subagents-as-tools。

### 4.2 Pydantic AI 第一个程序（官方文档示例，档案转录）

```python
from pydantic_ai import Agent, RunContext

roulette_agent = Agent(
    'openai:gpt-5.2',
    deps_type=int,
    output_type=bool,
    instructions='Use the `roulette_wheel` function ...',
)

@roulette_agent.tool
async def roulette_wheel(ctx: RunContext[int], square: int) -> str:
    """check if the square is a winner"""
    return 'winner' if square == ctx.deps else 'loser'

result = roulette_agent.run_sync('Put my money on square eighteen', deps=18)
print(result.output)  #> True
```

### 4.3 什么时候不该用框架 + 裸循环骨架

**单 agent、单会话、内存态、无人工审批、无崩溃恢复——五条同时成立时，官方 SDK + 50 行 while 循环就是最优解**：零概念税、零升级税、每行代码都是你的。这是调研档案中反复出现的社区主流意见（LangGraph 档案引 Reddit/HN：此场景"自写 while 循环明显更优"；MAF 的 HN 讨论帖："an agent is a simple while loop...not worth pulling in a framework"；Vercel AI SDK 官方 cookbook 干脆提供 manual-agent-loop 配方）。

OpenAI Agents SDK 文档白盒写明的**循环四步**，也就是任何自写循环要实现的语义：① 调 LLM；② 若无工具调用 → 产出最终输出，结束；③ 若请求 handoff → 切换当前 agent 与输入，继续；④ 若产生工具调用 → 执行、结果回灌、继续。超过 `max_turns` 抛异常兜底。

裸循环骨架（本文示意代码，语法已经 `python3 ast.parse` 校验，**未实际运行验证**——无 API key；语义对照上述四步）：

```python
import json
from openai import OpenAI

client = OpenAI()
TOOLS = [...]  # 你的工具 JSON Schema 列表

def dispatch(name: str, args: dict) -> str:
    ...  # 按 name 分发到真实函数，返回字符串结果

def run_agent(prompt: str) -> str:
    messages = [{"role": "user", "content": prompt}]
    while True:
        resp = client.chat.completions.create(
            model="gpt-5.2", messages=messages, tools=TOOLS
        )
        msg = resp.choices[0].message
        messages.append(msg)
        if not msg.tool_calls:  # ① 无工具调用 → 返回最终回答
            return msg.content
        for call in msg.tool_calls:  # ② 有工具调用 → 执行并回灌
            result = dispatch(call.function.name,
                              json.loads(call.function.arguments))
            messages.append({"role": "tool", "tool_call_id": call.id,
                             "content": str(result)})
```

**中间档怎么办**（只命中一两条持久化诉求时）：

| 命中"持久化五诉求"的条数 | 建议 |
|---|---|
| 0 条 | 官方 SDK 手写循环（上文骨架） |
| 1 条，且只是工具前审批 | 不必上图框架：薄库原语即可（Pydantic AI `requires_approval` / OpenAI Agents SDK `needs_approval` + RunState 序列化），循环仍是你的 |
| 1 条，且只是跨请求会话延续 | 手写 + 自备存储（消息列表落库，档案估算约半天～1 天），或 OpenAI Agents SDK Sessions / `pydantic-ai-harness` 的 StepPersistence（0.x） |
| ≥2 条 | LangGraph（全量 checkpointer 体系）或 SDK + Temporal |

（条数分界来自 LangGraph 档案的收益判断；中间档建议为本文意见。）而且建议真的先手写一遍：上下文管理、工具 schema、失败重试、成本控制这些痛点，只有手写过才知道框架的哪些抽象对你有价值。**让痛点驱动选型，而不是让框架的功能列表驱动。**

### 4.4 LangGraph 最小样例（官方 quickstart，档案转录）

```python
agent_builder = StateGraph(MessagesState)
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)
agent_builder.add_edge(START, "llm_call")
agent_builder.add_conditional_edges("llm_call", should_continue, ["tool_node", END])
agent_builder.add_edge("tool_node", "llm_call")
agent = agent_builder.compile()
```

HITL 需要 checkpointer + thread_id：节点内 `interrupt("Do you approve?")` 暂停落盘，人审后 `graph.stream(Command(resume=True), config)` 恢复。

## 5. 避坑提示

1. **教程与版本时效是第一大坑。** 十个框架全部高频发版：LangGraph 0.x 时代留下大量过时教程（务必对照 1.x 文档）；MAF 2026 全年破坏性变更（AgentThread→AgentSession、ChatAgent→Agent、移除整包）；Pydantic AI 无破坏窗口缩到 3 个月；Vercel AI SDK 两年 v4→v7；OpenAI Agents SDK 19 个月 123 版；Claude Agent SDK 日更且实验 API 说删就删（unstable_v2_* 在 0.3.142 整体移除）。对策：锁精确版本（本文主表给了各框架当前版本号）、预留升级预算、只信官方 Upgrade Guides，把 6 个月前的博客和 AI 生成代码默认视为过时。
2. **"开源"要查许可证细则。** Mastra `ee/` 目录生产使用需付费（开发/测试免费）；Claude Agent SDK 的 TS 包是保留所有权利的专有许可，Python 包 MIT 但捆绑的 Claude Code CLI 受商业条款约束；CrewAI 默认开匿名遥测（`OTEL_SDK_DISABLED=true` 关），`share_crew` 开启还会上传任务内容；OpenAI Agents SDK tracing 默认回传 OpenAI 后端（无 key 时官方建议直接禁用）。
3. **锁定是分层的，"换模型容易"≠"换框架容易"。** 模型层锁定（Claude Agent SDK 仅 Claude）最显性；更隐蔽的是抽象层锁定（Mastra 全家桶、CrewAI 角色抽象、LangGraph 依赖 langchain-core 消息体系）。提示词与状态 schema 才是沉淀资产。迁出成本的实证案例见 §6。
4. **记忆默认值的隐性成本。** CrewAI 记忆默认用 OpenAI embedding（text-embedding-3-large）+ gpt-4o-mini 做分析，全本地栈要在多处显式配置；`pydantic-ai-harness` 尚是 0.x（Memory 无语义排序、FileStore 单写者），生产级记忆要么自建要么外接。
5. **审批 ≠ 授权。** Pydantic AI 官方明示 HITL 审批"不是针对不可信客户端的授权边界"；OpenAI Agents SDK 的 guardrails 是函数钩子而非权限/审计体系（无独立守卫模型、无审计日志）。安全边界要自己建。
6. **本地服务的暴露面。** OpenCode 出过未认证 RCE（CVE-2026-22812，2026-01 披露、v1.1.10 修复；自动启动的未认证 HTTP 服务器所致，披露者称多次联系无回应）。凡 agent 框架起本地 HTTP/SSE 服务，"默认只监听本机 + 显式授权"当第一需求。
7. **成本要看 harness 开销。** 见 §3D 的 7k vs 33k（未核实标注同前）；subagent 并发会让前缀缓存全 miss。`max_budget_usd` 类硬上限值得抄进任何自建 harness。
8. **厂商宣传数字别当选型依据。** CrewAI 的"65% Fortune 500 在用"、MAF 的"enterprise-ready"、Mastra 官网的 31 个客户案例，均为厂商口径、独立核实有限——执行同一标准，不厚此薄彼。凡关键版本号，以 GitHub Releases / PyPI / npm 当日实测为准。
9. **别一开始就上重框架。** CrewAI 的 "abstraction soup makes debugging a nightmare"（HN 高热度帖一手评论）、LangGraph 的 "bloated and overkill for most applications"（Reddit 高热度吐槽）都是同一种失败模式：在还没理解循环之前就接受了别人的认知架构。注意这类引语是单一讨论帖的高赞意见，不是受控调研，权重应低于可实测的许可证/版本/依赖事实。
10. **社区批评的证据等级。** 本文引用的 HN/Reddit 评论均为一手高热度帖子，但属个案观点；凡结论同时给出可实测佐证（版本、许可证、依赖清单）的，以实测为准。

## 6. 升级与迁出成本（实证案例）

档案中记载的真实破坏面，供评估"迁出要重写多少"：

- **Pydantic AI 1→2**（2026-06-23）：破坏集中在点位，如 `openai:` 默认从 Chat Completions 改 Responses API；1.x 补丁线并行维护（2.0 后仍发 1.107.7），存量用户有缓冲。
- **LangGraph 0.x→1.0**：0.x 时代 API 频繁破坏性变更是社区主要信任债来源（HN 用户抱怨迁移痛苦）；1.0 承诺 2.0 前公共 API 不破坏，尚需时间自证。
- **AutoGen→MAF**：官方 6070 词迁移指南明言，单 agent 迁移 straightforward，多 agent "require rethinking your approach from event-driven to data-flow based architectures"——重设计而非 drop-in。且 AutoGen 已冻结（最后发版 0.7.5，2025-09-30），老项目实质被逼迁移。
- **OpenAI Agents SDK v0.1.0**：改名 + 默认不再用 Claude Code 式系统提示词 + `settingSources` 默认值改了又回滚。
- **Claude Agent SDK**：实验性 unstable_v2_* 会话 API 整体发布后在 0.3.142 又整体移除。
- **MAF 2026 全年**：Upgrade Guides 记录连续破坏性变更（含 1.20.0 之后已公告未发布的），与 GA 时 "stable APIs" 承诺存在张力。

**评估迁出的通用问题清单**（本文建议）：你的状态 schema 能否导出为中立格式（JSON 消息列表）？提示词是否散在框架模板里？工具定义是否只是普通函数（可整体搬走）？前两项答"否"的成本远高于第三项。

## 7. 付费边界速查

本文只划边界、不报价格：调研档案未含任何价格数字，且价格易变，以各官网为准。

| 框架 | 免费可用的部分 | 付费触发点 |
|---|---|---|
| Pydantic AI | 全部（含 pydantic-evals、harness 包） | 无框架层付费；Logfire 为可选 SaaS（有永久免费层） |
| LangGraph | 库 + checkpointer 三后端 + 本地 `langgraph dev` | LangSmith 平台：Deployment（云/混合/自托管）与 Studio 全功能可观测 |
| OpenAI Agents SDK | 全部 | 无框架层付费；tracing 后端用 OpenAI 免费看板；模型用量按厂商计费 |
| Vercel AI SDK | 全部 | 无框架层付费；实验性 sandbox 层官方推荐 @ai-sdk/sandbox-vercel（Vercel 基础设施） |
| CrewAI | 核心全部 | AMP 可观测套件部分商业化 |
| MAF | 全部（MIT） | 无框架层付费；Azure Foundry 等托管服务按微软计费 |
| Mastra | 主体（Apache-2.0） | `ee/` 目录功能生产使用需商业许可（开发/测试免费） |
| Claude Agent SDK | SDK 本身 | 捆绑的 Claude Code CLI 受商业条款约束；模型用量按 Anthropic 计费（2026 年订阅/SDK 计费规则曾变动后暂停，见档案） |
| OpenCode | 全部（MIT） | OpenCode Zen 模型路由为可选商业服务 |
| goose | 全部（Apache-2.0） | 无框架层付费 |

## 附录 A：术语表

- **HITL**（human-in-the-loop）：人工介入——工具执行前审批、任务中途暂停/恢复。
- **OTel**（OpenTelemetry）：可观测标准；本文提到的框架大多原生埋点。
- **Logfire**：Pydantic 自家的可观测 SaaS（商业产品，永久免费层）。
- **DBOS / Temporal / Restate**：持久化执行引擎——agent 循环跑在其 Workflow 内，崩溃后可续跑。
- **models.dev**：OpenCode 自维护的模型元数据目录（75+ provider）。
- **AAIF**：Linux 基金会旗下治理基金会（Block 与 MCP 团队共同创立），接纳 goose、MCP、AGENTS.md。
- **首包开销**：agent 每次会话发送给模型的固定开销（系统提示 + 工具定义等），§3D 的 7k/33k 即此口径。
- **pydantic-ai-harness**：Pydantic AI 的官方能力库包名（0.x），与本文形态分类里的"成品 harness"是两个概念。

## 附录 B：数据口径、矛盾与核查结果

**第二轮独立核查（8 条关键事实）全部确认**，核查中修正/补充的细节：

- OpenCode open issues 实测 **6,251**（2026-10-04），初稿"约 6,145"为档案时点近似值；RCE 对应 **CVE-2026-22812**。
- Claude Agent SDK：Python 包 LICENSE 为**纯 MIT、无叠加条款文本**；商业条款的作用对象是捆绑的 Claude Code CLI。初稿"MIT 叠加商业条款"的表述已按此修正。
- Temporal×OpenAI Agents SDK 集成已 GA 并独立成包（temporalio-openai-agents 1.0.0）；GA 日期 2026-03-23 为第三方来源佐证（官方文档页未标注日期）。
- CrewAI 的 ReAct 循环位置经解包 wheel 证实：`crew_agent_executor.py` 内 "ReAct-loop iterations"，非用户可插拔接口；"hierarchical 执行顺序非确定"是对官方文档（只对 sequential 承诺顺序、hierarchical 由 manager 动态分派）的合理概括。
- Pydantic AI 五包 MIT、版本时间线（1.0.0=2025-09-05、2.0.0=2026-06-23、2.54.0=2026-10-03、harness 0.54.0）经 PyPI JSON API 逐一核实。
- LangGraph 1.0.0=2025-10-17、requires_dist 无厂商 SDK、checkpointer 三包（langgraph-checkpoint 4.2.0 / -sqlite 3.1.1 / -postgres 3.1.2）、PyPI 周下载 11,403,762 均核实；时间旅行由 checkpoint 体系支撑（多篇官方文档佐证，未定位单一官方页面直引）。

**档案与普查的已核实矛盾**（本文一律采用核实值）：

- CrewAI：最新稳定版 **1.15.23**（2026-09-28）；普查所称 3.1.1 在 GitHub Releases（近 8 个 release 全为 1.15.x）与 PyPI（遍历全部 458 个 release）均不存在。
- OpenCode：已进入 **v2.0.x**（Homebrew stable 2.0.20）；普查所引 v1.18.34 与 releases.atom 冲突。star 数 209,710（API 快照）与 211,665（普查）为抓取时间差。
- goose：三次独立抓取只能核实到 **v1.48.0**（2026-08-27），仓库 pushed_at 2026-09-19；普查所称 v1.53.0（2026-10-02）未能复现——可能是抓取代理快照滞后，以 GitHub 实时页面为准。
- Claude Agent SDK：TS 侧 LICENSE.md 实为专有许可——"普查未检出许可证"的实情是"检出为专有"。

**未核实项**（如实说明，不作结论依据）：多家档案的贡献者精确人数（GitHub API 限流）；MAF 的具名第三方生产案例（未检索到）；Mastra 的 npm 周下载（约 95 万为普查口径，npmjs 直连失败）；Thomson Reuters/Clay 的 Vercel AI SDK 采用（第三方对比文转述）；Xcode 26.3 内置 Claude Agent SDK（HN 多方报道，未复核 Apple 官方页面）；7k vs 33k token 与学习曲线对比（单一社区实测/评测，方法未公开）；厂商客户案例数字（官网自述）。

## 来源列表

**调研档案事实的来源**（按框架）：

- LangGraph：<https://github.com/langchain-ai/langgraph> · <https://pypi.org/project/langgraph/> · <https://pypistats.org/api/packages/langgraph/recent> · <https://docs.langchain.com/oss/python/langgraph/human-in-the-loop> · <https://www.langchain.com/blog/langchain-langgraph-1dot0> · <https://docs.langchain.com/langsmith/deployment> · <https://docs.langchain.com/oss/python/langchain/multi-agent>
- Microsoft Agent Framework：<https://github.com/microsoft/agent-framework> · <https://pypi.org/pypi/agent-framework/json> · <https://learn.microsoft.com/en-us/agent-framework/>（integrations/by-provider、migration-guide/from-autogen、support/upgrade/python-2026-significant-changes）· <https://github.com/microsoft/autogen> · <https://github.com/microsoft/semantic-kernel> · <https://news.ycombinator.com/item?id=46377537>
- CrewAI：<https://github.com/crewAIInc/crewAI> · <https://github.com/crewAIInc/crewAI/releases> · <https://pypi.org/pypi/crewai/json> · <https://docs.crewai.com/concepts/llms> · <https://docs.crewai.com/concepts/processes> · <https://news.ycombinator.com/item?id=47132187>
- Pydantic AI：<https://github.com/pydantic/pydantic-ai> · <https://pypi.org/pypi/pydantic-ai/json> · <https://pypi.org/pypi/pydantic-ai-harness/json> · <https://pydantic.dev/docs/ai/agents/> · <https://pydantic.dev/docs/ai/output/> · <https://pydantic.dev/docs/ai/deferred-tools/> · <https://pydantic.dev/docs/ai/core-concepts/persistence/> · <https://pydantic.dev/docs/ai/logfire/> · <https://pydantic.dev/docs/ai/harness/> · <https://pydantic.dev/articles/tiger-data-ai-slack-bot-pydantic-logfire>
- OpenAI Agents SDK：<https://github.com/openai/openai-agents-python> · <https://pypi.org/pypi/openai-agents/json> · <https://openai.github.io/openai-agents-python/models/> · <https://openai.github.io/openai-agents-python/running_agents/> · <https://openai.github.io/openai-agents-python/human_in_the_loop/> · <https://docs.temporal.io/develop/python/integrations/openai-agents>
- Mastra：<https://github.com/mastra-ai/mastra> · <https://mastra.ai/docs/agents/overview> · <https://mastra.ai/models> · <https://mastra.ai/customers> · <https://mastra.ai/reference/ai-sdk/with-mastra>
- Vercel AI SDK：<https://github.com/vercel/ai> · <https://api.npmjs.org/downloads/point/last-week/ai> · <https://ai-sdk.dev/docs/agents/overview> · <https://ai-sdk.dev/docs/agents/subagents> · <https://ai-sdk.dev/docs/ai-sdk-harnesses/overview> · <https://www.npmjs.com/package/@ai-sdk/harness-claude-code>
- Claude Agent SDK：<https://github.com/anthropics/claude-agent-sdk-python> · <https://github.com/anthropics/claude-agent-sdk-typescript>（LICENSE.md）· <https://pypi.org/project/claude-agent-sdk/> · <https://code.claude.com/docs/en/agent-sdk/overview> · <https://code.claude.com/docs/en/model-config> · <https://news.ycombinator.com/item?id=48883275>
- OpenCode：<https://github.com/anomalyco/opencode> · <https://opencode.ai/docs/agents/> · <https://opencode.ai/docs/providers/> · <https://opencode.ai/docs/server/> · <https://opencode.ai/docs/sdk> · CVE-2026-22812 · <https://news.ycombinator.com/item?id=46581095>
- goose：<https://github.com/aaif-goose/goose> · <https://thenewstack.io/block-goose-agentic-foundation/> · <https://news.ycombinator.com/item?id=42879323>

**第二轮核查新增**：PyPI JSON API（各包 license_expression 与 upload_time）、npm 官方下载 API、Temporal 官方集成页、CrewAI wheel 解包（crew_agent_executor.py）、Tiger Data 官方客座文章原文、OpenCode 官方 server/sdk 文档。

**文中标注"本文建议/经验法则/示意代码"的部分**（多 agent 模式选用、中间档分级、评测通用做法、迁出评估清单、裸循环骨架）为作者综合判断，不属于档案事实；骨架代码语法经 `python3 ast.parse` 校验，未运行验证。
