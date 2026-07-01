---
title: 【学习笔记】Agentic 设计模式（五）：企业级七模式——A2A / 资源优化 / 推理 / 护栏 / 评测 / 优先级 / 探索
published: 2026-07-01
description: 系统讲解 Antonio Gulli《Agentic Design Patterns》第 15–21 章的企业级模式——Inter-Agent Communication A2A（Google 协议，Agent 间发现与委派，与 MCP 的 agent-to-tool vs agent-to-agent 关键区分）、Resource-Aware Optimization（路由 Agent 按复杂度选模型 + OpenRouter 自动选/回退）、Reasoning Techniques（CoT/ToT/ReAct/PALMs/RLVR/Chain-of-Debates/Deep Research + 推理扩展定律）、Guardrails Safety（输入/输出/行为/工具多层防御 + NeMo Guardrails，2025 研究证实护栏可被绕过故需纵深防御）、Evaluation and Monitoring（指标+反馈环+LLM-as-Judge+轨迹评估+「高级承包商」模型）、Prioritization（四要素+多级+动态重排）、Exploration and Discovery（Google AI Co-Scientist 与 Agent Laboratory 两个真实系统 + 探索-利用困境），并指出贯穿 Part Four 的「推理质量 vs 成本延迟」张力
lang: zh
tags: [学习笔记]
abbrlink: agentic-enterprise-patterns
---

> 整理日期：2026-07-01
> 涵盖范围：A2A、Resource-Aware Optimization、Reasoning Techniques、Guardrails/Safety、Evaluation & Monitoring、Prioritization、Exploration & Discovery（本书 Part Four Ch 15–21，共 7 模式）
> 说明：这是 [Agentic 设计模式系列总览](/posts/agentic-design-patterns-overview/) 的第五篇分篇，也是覆盖章节最多的一篇。这一层是「**规模化、安全与运维**」——当 Agent 系统要跨框架协作、控制成本、强化推理、保证安全、持续度量、智能调度、自主探索时，就用这七个模式。内容基于本书英文原书（经 `xindoo` 中文版核实），A2A/MCP/Guardrails 部分对照官方文档与开源项目。标注「（未确认）」处以英文原书为准。

<!--
## 目录
- [一、核心结论（太长不看）](#一核心结论太长不看)
- [二、贯穿 Part Four 的一条主线](#二贯穿-part-four-的一条主线)
- [三、A2A：Agent 间通信标准](#三a2aagent-间通信标准)
- [四、Resource-Aware Optimization：资源感知优化](#四resource-aware-optimization资源感知优化)
- [五、Reasoning Techniques：显式多步推理](#五reasoning-techniques显式多步推理)
- [六、Guardrails / Safety：多层纵深防御](#六guardrails--safety多层纵深防御)
- [七、Evaluation & Monitoring：持续度量](#七evaluation--monitoring持续度量)
- [八、Prioritization：任务优先级](#八prioritization任务优先级)
- [九、Exploration & Discovery：主动探索](#九exploration--discovery主动探索)
- [十、七模式横向对比](#十七模式横向对比)
- [十一、按用途选型决策表](#十一按用途选型决策表)
- [十二、参考资料](#十二参考资料)
-->

## 一、核心结论（太长不看）

1. **这一层七模式是「企业规模化」的完整运维栈**：A2A（跨框架协作）、Resource Optimization（控成本）、Reasoning（强化推理）、Guardrails（保安全）、Evaluation（持续度量）、Prioritization（智能调度）、Exploration（自主探索）。
2. **A2A vs MCP 是本层最重要的协议区分**：**MCP（Anthropic）= Agent↔工具/上下文**；**A2A（Google）= Agent↔Agent**。二者**互补不竞争**，都用 JSON-RPC 2.0。A2A 用 Agent Card（`/.well-known/agent.json`）做发现、用异步 Task 状态机管协作、支持 SSE 流/webhook 推送/mTLS 安全。
3. **Resource-Aware Optimization 的核心是「按复杂度动态选模型」**：路由 Agent 把简单请求送便宜模型（Gemini Flash）、复杂的送强模型（Gemini Pro），critic Agent 反馈改进路由。OpenRouter 的 `openrouter/auto`（自动选模型）和有序 fallback 是现成实现。⚠️ 质量/成本权衡是固有的。
4. **Reasoning Techniques 是个密集章节**，覆盖 CoT、ToT、自我纠错、PALMs（生成并执行代码）、**RLVR（带可验证奖励的 RL，训练推理模型）**、ReAct（Think→Act→Observe 循环，Agent 操作循环的核心）、Chain/Graph of Debates、**Deep Research**。**底层原则是「推理扩展定律」**——给小模型更多「思考预算」能超过用简单生成的大模型。
5. **Guardrails 不是「限制能力」而是「引导行为」**：输入校验/输出过滤/行为约束/工具限制/审核 API/HITL 多层防御。⚠️ **2025 研究（arXiv:2504.11168）证实坚定攻击者能绕过护栏检测——所以必须纵深防御，单层不够**。NVIDIA NeMo Guardrails 是标杆开源库。
6. **Evaluation 的核心洞见是「传统测试对概率性 Agent 不够」**：要评**轨迹**（Agent 走的步骤序列）而非只看最终输出；**LLM-as-a-Judge** 评主观质量；本书还提出**「高级承包商」模型**（形式化契约 + 动态协商 + 自我验证 + 层级分解）作为生产可靠性的范式。
7. **Prioritization 四要素**（紧急/重要/依赖/成本）+ 多层级（目标/子任务/即时动作）+ 动态重排。⚠️ 过度重排会 thrashing（不停重规划不前进）；过度重紧急会饿死重要不紧急任务。
8. **Exploration 用两个真实系统当样板**：**Google AI Co-Scientist**（Gemini 多 Agent 科研协作，含生成/反思/排名/演化/邻近/元评审六类 Agent，已在药物重定位上获体外验证）和 **Agent Laboratory**（MIT 许可，按学术角色分层）。共同强调**增强而非自动化**（scientist-in-the-loop），受限于开放文献与负结果缺失，且要防危险研究（Co-Scientist 对 1200 个对抗研究目标做筛查）。

> 来源：[xindoo 中文版 Ch15–21](https://github.com/xindoo/agentic-design-patterns) · [Google A2A 协议](https://github.com/a2aproject/A2A) · [NVIDIA NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails)

---

## 二、贯穿 Part Four 的一条主线

读这七个模式时，要抓住一条贯穿的张力——**「推理质量 vs 成本延迟」**：

- 想要更强推理（**Reasoning Techniques, Ch17**）→ 但推理算力更贵更慢（**Resource-Aware Optimization, Ch16** 要管这个）→ 所以必须**评测监控**（**Evaluation, Ch19**）来判断质量是否值这个成本。
- 同时，规模化和强能力带来更大风险 → 要**护栏**（**Guardrails, Ch18**）；任务一多就要**排序**（**Prioritization, Ch20**）；要跨框架协作就要**A2A**（**Ch15**）；要发现未知就要**探索**（**Exploration, Ch21**）。

这条主线能帮你把这七个看似分散的模式串成一个连贯的「企业运维」故事。

> 来源：[xindoo 中文版 Part Four](https://github.com/xindoo/agentic-design-patterns)

---

## 三、A2A：Agent 间通信标准

### 3.1 定义与机制

**定义**：一个开放的、基于 HTTP 的协议（Google 的 Agent2Agent），让**不同框架**构建的 AI Agent 能互相发现、委派任务、协作，不管底层技术如何。

**机制（几大支柱）**：

- **核心角色**：User、A2A Client（客户端 Agent）、A2A Server（远端 Agent，「不透明」运行）。
- **Agent Card**：一个 JSON 文件（位于 `/.well-known/agent.json`），声明身份、端点 URL、版本、能力（流式、pushNotifications）、技能、I/O 模式、认证要求——是**发现**的基础（标准 URI、精选注册表、或直接配置）。
- **通信与任务**：工作组织成带唯一 ID、走状态生命周期的异步 **Task**；通信用 **JSON-RPC 2.0 over HTTP(S)**，有 Messages（元数据 + 含内容的 Parts）和 Artifacts（可交付输出）；`contextId` 把相关 Task 分组。
- **交互机制**：同步请求/响应（`tasks/send`）、异步轮询、SSE 流式（`tasks/sendSubscribe`）、webhook 推送通知。
- **安全**：mTLS、审计日志、Agent Card 认证声明、HTTP 头传凭证（OAuth 2.0/API key）。

### 3.2 A2A vs MCP（关键区分，本书明示）

| | MCP（Anthropic） | A2A（Google） |
|---|---|---|
| **连接对象** | 单个 Agent ↔ 外部**工具/数据/上下文** | **Agent ↔ Agent** |
| **定位** | agent-to-tool | agent-to-agent 发现、通信、任务委派 |
| **关系** | **互补，不竞争** | **互补，不竞争** |

### 3.3 解决什么

以前没有通用协议让不同框架（LangGraph、CrewAI、ADK）的 Agent 通信；集成都 bespoke 且昂贵，阻塞了复杂多 Agent 系统。

### 3.4 陷阱与权衡

- Agent Card 端点安全很重要（携带敏感但非机密信息）——要用访问控制、mTLS、网络限制。
- 主要复杂度在分布式 Agent 的编排/安全开销。

> 来源：[xindoo 中文版 Chapter 15: A2A](https://github.com/xindoo/agentic-design-patterns) · [Google A2A 协议仓库](https://github.com/a2aproject/A2A) · [Google A2A 博客](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)

---

## 四、Resource-Aware Optimization：资源感知优化

### 4.1 定义与机制

**定义**：让 Agent 动态监控和管理算力、时间、财务资源，在预算内做执行路径决策（模型/工具选择）——区别于单纯的动作序列规划。

**机制**：

- **路由 Agent**：按复杂度分类请求，转发给最便宜的够用模型（如简单的送 Gemini Flash、复杂推理送 Gemini Pro）。
- **critic Agent**：评估响应质量并反馈，改进路由逻辑。
- 实现可走 ADK 多 Agent 架构、LiteLLM，或 **OpenRouter**（提供 `openrouter/auto` 自动选模型 + 有序模型 fallback 自动故障转移）。
- 此外还有：自适应工具选择、上下文裁剪/摘要、主动资源预测、成本敏感探索、能耗感知部署、并行/分布式感知、学习型分配策略、优雅降级。

### 4.2 解决什么

LLM 应用可能又慢又贵；总用最强模型低效。输出质量和资源消耗之间有根本权衡，没有动态管理就无法适应任务复杂度或守预算。

### 4.3 陷阱与权衡

- 质量/成本权衡是固有的——更快更便宜的模型牺牲深度/准确率。
- 路由误分类（把复杂查询送便宜模型）会降质；critic Agent 专门抓这个但自带成本/延迟。
- Fallback 增韧性但可能掩盖底层可用性问题。

> 来源：[xindoo 中文版 Chapter 16: Resource-Aware Optimization](https://github.com/xindoo/agentic-design-patterns) · [OpenRouter](https://openrouter.ai)

---

## 五、Reasoning Techniques：显式多步推理

### 5.1 定义与机制

**定义**：一族让 Agent 内部推理显式化、多步化的方法，使其能分解复杂问题、权衡备选、得出更可靠结论。

**机制——本章覆盖的技术（密集章节）**：

| 技术 | 核心 |
|---|---|
| **Chain-of-Thought (CoT)** | 让模型生成中间推理步；把难单步问题转成简单多步；奠基性 |
| **Tree-of-Thought (ToT)** | 分支成多推理路径形成树；支持回溯和探索备选 |
| **自我纠错/自我改进** | Agent 内部批评自己的输出和中间思考，迭代精修 |
| **PALMs（程序辅助）** | LLM 生成并执行代码（如 Python）卸载确定性计算/逻辑 |
| **RLVR（带可验证奖励的 RL）** | 训练专门的「推理模型」，花可变算力「思考」，生成超长动态 CoT 链，支持自纠和回溯；用有已知答案的问题（数学/代码）训练 |
| **ReAct（推理 + 行动）** | 交错推理（计划）与行动（工具调用）和观察（结果），Think→Act→Observe 循环；**Agent 操作循环的核心** |
| **Chain of Debates (CoD)** | 多模型协作争论，像 AI 委员会/同行评审 |
| **Graph of Debates (GoD)** | 论点节点 + 支持/反驳边的非线性网络 |
| **MASS** | 三阶段自动多 Agent 设计（块级 prompt 优化→拓扑优化→工作流级优化） |
| **Deep Research** | 给时间预算，自主探索→推理→追问→综合带引用报告（Perplexity、Gemini Deep Research、OpenAI） |

### 5.2 关键原则——推理扩展定律（Inference Scaling Law）

区别于训练扩展定律：性能随**推理时算力**增加而可预测地提升。**给小模型更多「思考预算」能超过用简单生成的大模型**。这重构了「越大越好」的直觉，也是资源感知设计的基础。

### 5.3 陷阱与权衡

- 更多推理算力 = 更多延迟和成本（与 Ch16 直接冲突）。
- Deep Research 式多步循环可能徒劳打转。
- 推理透明有助可审计，但不保证正确（模型仍可能「plausible-but-wrong」）。

> 来源：[xindoo 中文版 Chapter 17: Reasoning Techniques](https://github.com/xindoo/agentic-design-patterns)

---

## 六、Guardrails / Safety：多层纵深防御

### 6.1 定义与机制

**定义**：分层防御机制（输入校验、输出过滤、行为约束、工具限制、审核 API、人工监督），让自治运行中的 Agent 保持安全、伦理、不跑偏。

**机制（实现阶段）**：输入校验/净化（滤恶意内容）、输出过滤/后处理（分析毒性/偏见）、prompt 级行为约束、工具使用限制（限 Agent 能力）、Agent 核心处的外部审核 API、HITL 监督。可用一个便宜低算力模型当快速预筛/复核。CrewAI 示例用专门的策略执行 Agent + `PolicyEvaluation` Pydantic schema + `validate_policy_evaluation` 护栏函数；prompt 护栏防**越狱（jailbreak）**——绕过安全的对抗 prompt。

### 6.2 解决什么

无约束自治 Agent 不可预测，可能产出有害/偏见/不伦理/事实错的输出；易受对抗攻击（prompt 注入、越狱），危及信任、法律和声誉。

### 6.3 陷阱与权衡

- 护栏**不是限制能力而是引导行为**——过度限制损害可用性。
- ⚠️ **必须纵深防御**——组合多技术才稳健，单层不够。
- ⚠️ **2025 研究（arXiv:2504.11168）证实坚定攻击者能绕过护栏检测——分层防御是必需的**。
- 护栏要随风险演进持续监控/评测/迭代。

> 来源：[xindoo 中文版 Chapter 18: Guardrails/Safety](https://github.com/xindoo/agentic-design-patterns) · [NVIDIA NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) · [护栏绕过研究 (arXiv:2504.11168)](https://arxiv.org/html/2504.11168v1)

---

## 七、Evaluation & Monitoring：持续度量

### 7.1 定义与机制

**定义**：一个框架，在动态真实环境里持续度量 Agent 的有效性、效率和合规——因为 Agent 行为概率性，超越了传统 pass/fail 测试。

**机制**：定义**指标**（准确率、延迟、token 用量/成本）、建**反馈环**、做报告。具体子题：

- **响应评估**：准确率（本书指出陷阱——精确字符串匹配在改写下失效，如「巴黎是法国首都」vs「法国首都是巴黎」）。
- **延迟监控** + **token 跟踪**（记到 InfluxDB/Prometheus 等时序库、BigQuery/Snowflake 数仓、Datadog/Splunk/Grafana 可观测平台）。
- **LLM-as-a-Judge**：用 LLM 按评分标准评主观质量（如「有用性」）。
- **Agent 轨迹评估**：评 Agent 走的**步骤序列**而非只看最终输出；对照理想轨迹用指标（精确匹配、有序匹配、任意序匹配、precision/recall/单工具使用）。
- **ADK 评测**：测试文件（JSON，单会话，单元测试）和评测集文件（多轮，集成测试），可走 Web UI（`adk web`）、pytest、CLI（`adk eval`）。
- **多 Agent 评测**：查协作质量、计划遵循、是否正确选 Agent-for-task、加 Agent 是改进还是损害。

### 7.2「高级承包商」模型（Agent Companion，Gulli 等）——重要概念

从模糊 prompt 驱动的 Agent 进化成可问责「承包商」，四支柱：① **形式化契约**（交付物/范围/数据源/成本时间的精确规格，客观可验证）；② **动态协商/反馈生命周期**（Agent 执行前可标记不可得数据或歧义）；③ **质量优先的迭代执行**（对照契约单元测试自验证）；④ **层级分解的子契约**（主承包商把任务拆子契约委派专家）。

### 7.3 陷阱与权衡

- 精确匹配准确率对 LLM 输出有误导。轨迹评估可能脆（过度约束到一个「理想」路径）。LLM-as-Judge 有自身偏差。多 Agent 评测指数级更难。

> 来源：[xindoo 中文版 Chapter 19: Evaluation and Monitoring](https://github.com/xindoo/agentic-design-patterns)

---

## 八、Prioritization：任务优先级

### 8.1 定义与机制

**定义**：让 Agent 按重要性、紧急度、依赖和成本评估排序任务/目标/动作，在资源受限、多目标环境里聚焦最关键工作。

**机制（四核心要素）**：① **准则定义**（紧急/重要/依赖/资源/成本收益/用户偏好）；② **任务评估**（按准则打分，从简单规则到 LLM 评分）；③ **调度/选择逻辑**（队列或高级规划）；④ **动态重排**（新关键事件出现或截止临近时适应）。在多层级运作：高层目标优先级、计划内子任务排序、即时动作选择。

### 8.2 陷阱与权衡

- 准则权重主观且依赖上下文；权重错 → 排序错。
- ⚠️ 动态重排可能 thrashing（不停重规划不前进）。
- ⚠️ 过度重紧急会饿死重要不紧急工作（经典艾森豪威尔矩阵陷阱）。

> 来源：[xindoo 中文版 Chapter 20: Prioritization](https://github.com/xindoo/agentic-design-patterns)

---

## 九、Exploration & Discovery：主动探索

### 9.1 定义与机制

**定义**：让 Agent 在开放式环境里**主动**寻找新信息、发现可能性、识别「未知的未知」——区别于被动行为或在预定义解空间内优化。

**机制——两个真实系统当样板**：

**① Google AI Co-Scientist**（Gemini，Google Research）：多 Agent 科研协作者，含专门 Agent——**Generation**（文献辩论提假设）、**Reflection**（同行评审查正确/新颖）、**Ranking**（Elo 锦标赛比假设）、**Evolution**（精修顶级假设）、**Proximity**（聚类相似想法）、**Meta-review**（综合洞见）。用测试时算力扩展。已在药物重定位（AML——提了新药 KIRA6，体外确认）、新肝纤维化表观靶点、独立复现一个未发表抗菌耐药发现上验证。GPQA Diamond top-1 达 78.4%。强调**增强非自动化**（scientist-in-the-loop）。

**② Agent Laboratory**（Samuel Schmidgall，MIT 许可）：自治研究流，按学术角色分层——Professor（设议程、委派）、Postdoc（执行研究、写跑代码）、Reviewer（同行评审）、ML Engineer & Software Engineer（数据准备代码）。三 Agent 评审机制模拟人类同行评审。集成 **AgentRxiv**（自治研究产出去中心化仓库）。阶段：文献综述 → 实验 → 报告 → 知识分享。

### 9.2 陷阱与权衡

- 知识限于**开放获取文献**——可能漏付费墙的前作。
- **负结果**访问有限（很少发表）——但资深科学家依赖它。
- 继承 LLM 局限含**幻觉**——生成假设需实验验证。
- 安全关键：Co-Scientist 对全部输入/输出筛查 1200 个对抗研究目标以拒危险研究。
- 关联经典**探索 - 利用困境**（exploration-exploitation dilemma）。

> 来源：[xindoo 中文版 Chapter 21: Exploration and Discovery](https://github.com/xindoo/agentic-design-patterns) · [Google AI Co-Scientist](https://research.google/blog/accelerating-scientific-breakthroughs-with-an-ai-co-scientist/) · [Agent Laboratory](https://github.com/SamuelSchmidgall/AgentLaboratory)

---

## 十、七模式横向对比

| 模式 | 解决什么 | 核心动作 | 最大陷阱 |
|---|---|---|---|
| **A2A** | 跨框架 Agent 无法协作 | 标准化 Agent 间发现/委派 | 分布式编排/安全开销 |
| **Resource Optimization** | 一律用最强模型太贵 | 按复杂度动态选模型 | 路由误分类降质 |
| **Reasoning** | 复杂问题一步答不对 | 显式多步推理 + 推理扩展定律 | 推理算力贵且可能打转 |
| **Guardrails** | 自治会出有害/被攻击输出 | 多层纵深防御 | 单层可被绕过（2025 已证） |
| **Evaluation** | Agent 概率性、传统测试不够 | 评轨迹 + LLM-as-Judge | 精确匹配误导；轨迹评估脆 |
| **Prioritization** | 多目标多任务资源有限 | 按多准则排序 + 动态重排 | thrashing；紧急饿死重要 |
| **Exploration** | 预设静态知识不足以创新 | 主动探索发现未知 | 限于开放文献；幻觉需验证 |

> 来源：[xindoo 中文版 Ch15–21](https://github.com/xindoo/agentic-design-patterns)

---

## 十一、按用途选型决策表

| 你的用途 | 推荐方案 |
|---|---|
| **要让不同框架的 Agent 互通** | A2A（配合 MCP：A2A 管 Agent 间，MCP 管 Agent↔工具） |
| **要降本、按难度选模型** | Resource-Aware Optimization（路由 + critic，或 OpenRouter auto/fallback） |
| **要更强推理、做 Deep Research** | Reasoning Techniques（CoT/ReAct/RLVR；注意与成本冲突） |
| **要防 prompt 注入/越狱/有害输出** | Guardrails（纵深防御；NeMo Guardrails） |
| **要持续度量 Agent 表现** | Evaluation & Monitoring（评轨迹，不只看结果） |
| **要让生产 Agent 可问责** | 「高级承包商」模型（形式化契约 + 自验证） |
| **多任务要智能排序** | Prioritization（四准则 + 动态重排） |
| **要让 Agent 主动发现未知** | Exploration（参考 Co-Scientist / Agent Laboratory 范式） |

一句话总原则：**Part Four 是「Agent 系统从能跑走向能规模化、安全、可运维」的关键——抓住「推理质量 vs 成本延迟」这条主线，按协作/成本/推理/安全/度量/调度/探索七个维度补齐运维栈。**

---

## 十二、参考资料

**原书与翻译**

- [evoiz/Agentic-Design-Patterns（官方仓库）](https://github.com/evoiz/Agentic-Design-Patterns) · [xindoo 中文翻译版](https://github.com/xindoo/agentic-design-patterns)

**协议与开源项目**

- [Google A2A 协议仓库](https://github.com/a2aproject/A2A) · [Google A2A 博客](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [Model Context Protocol 官网](https://modelcontextprotocol.io)
- [NVIDIA NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) · [护栏绕过研究 (arXiv:2504.11168)](https://arxiv.org/html/2504.11168v1)
- [OpenRouter](https://openrouter.ai)
- [Google AI Co-Scientist](https://research.google/blog/accelerating-scientific-breakthroughs-with-an-ai-co-scientist/) · [Agent Laboratory](https://github.com/SamuelSchmidgall/AgentLaboratory)

**姊妹篇**

- 系列总览：[《Agentic Design Patterns 系列总览》](/posts/agentic-design-patterns-overview/)
- 上篇：[《（四）：异常恢复 / 人在回路 / RAG》](/posts/agentic-production-patterns/)
- 下篇：[《（六）：附录 A–G 速览》](/posts/agentic-patterns-appendices/)
