---
title: 【学习笔记】Agentic 设计模式（二）：Reflection / Tool Use / Planning / Multi-Agent 四大智能体模式
published: 2026-07-01
description: 深入讲解 Antonio Gulli《Agentic Design Patterns》第 4–7 章——即 Andrew Ng 经典的四大智能体设计模式：Reflection（Producer–Reviewer 自我反思循环）、Tool Use / Function Calling（六步工具调用循环与「工具即委派」泛化）、Planning（目标导向、可动态重规划，附「解法已知 vs 未知」的关键判据）、Multi-Agent Collaboration（任务分解 + 六种通信模型 + 多种协作拓扑），逐一给出机制、适用场景、陷阱、与 Andrew Ng/Anthropic 的对照，以及 Andrew Ng 的成熟度排序（Reflection/Tool Use 可靠，Planning/Multi-Agent 难预测）
lang: zh
tags: [学习笔记]
abbrlink: agentic-reasoning-patterns
---

> 整理日期：2026-07-01
> 涵盖范围：Reflection、Tool Use / Function Calling、Planning、Multi-Agent Collaboration（本书 Part One Ch 4–7，即 Andrew Ng 四模式）
> 说明：这是 [Agentic 设计模式系列总览](/posts/agentic-design-patterns-overview/) 的第二篇分篇，也是**全系列最重要的一篇**——因为这四个模式正是 Andrew Ng 那套被引用最广的「四大智能体设计模式」，也是让系统从「工作流」升级到「智能体」的核心。内容基于本书英文原书（经 `xindoo` 中文版核实）、Andrew Ng 的 DeepLearning.AI 四部分系列、Anthropic《Building Effective Agents》。标注「（未确认）」处以英文原书为准。

<!--
## 目录
- [一、核心结论（太长不看）](#一核心结论太长不看)
- [二、为什么这四个模式是「智能体」的心脏](#二为什么这四个模式是智能体的心脏)
- [三、Reflection：自我反思循环](#三reflection自我反思循环)
- [四、Tool Use / Function Calling：让 Agent 会行动](#四tool-use--function-calling让-agent-会行动)
- [五、Planning：目标导向与动态重规划](#五planning目标导向与动态重规划)
- [六、Multi-Agent Collaboration：分工协作](#六multi-agent-collaboration分工协作)
- [七、四模式横向对比](#七四模式横向对比)
- [八、按用途选型决策表](#八按用途选型决策表)
- [九、参考资料](#九参考资料)
-->

## 一、核心结论（太长不看）

1. **这四个模式 = Andrew Ng 的「四大智能体设计模式」**，也正是 Antonio Gulli 本书的第 4–7 章。Ng 在 2024 年 3 月那句「**Agent 工作流带来的进步，今年可能比下一代基础模型还大**」和「GPT-3.5 套循环达 95.1% 打败 GPT-4 零样本的 67%」就是讲它们。
2. **Reflection 是「自己批评自己、再改」**：生成 → 评估 → 修正的反馈循环。本书强调 **Producer–Reviewer（生成者–评审者）分离**——用两个不同角色/prompt，避免「自己审自己」的认知偏差。Anthropic 叫它 Evaluator-Optimizer，是同一个模式的不同名字。
3. **Tool Use 是「让 LLM 走出静态训练数据」**：通过 function calling 调外部 API/数据库/代码。本书给出**六步循环**（定义工具→LLM 决策→生成调用→执行→观察→处理），并把它泛化成「工具可以是委派给另一个专门 Agent」。
4. **Planning 是「给目标，自己拆步骤、还能动态重规划」**。但本书给了一个**关键判据**：当问题解法已经明确且可重复时，**把 Agent 限制在固定工作流里更高效**——Planning 只在「解法未知/需发现」时才用。
5. **Multi-Agent 是「多专职 Agent 分工协作」**：任务分解 + 标准通信协议 + 共享本体。本书列出**六种通信模型**（单 Agent/网络/主管/主管即工具/层级/自定义）和多种协作拓扑（顺序交接、并发、辩论共识、层级、专家团、评审）。
6. **Andrew Ng 的成熟度排序很关键**：Reflection 与 Tool Use **在生产里已相当可靠**；Planning 与 Multi-Agent「很强大但**不成熟、难预测**」。选型时先落地前两者，别一上来就堆后两者。

> 来源：[Andrew Ng, Agentic Design Patterns Part 1](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance) · [xindoo 中文版 Ch4–7](https://github.com/xindoo/agentic-design-patterns) · [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

---

## 二、为什么这四个模式是「智能体」的心脏

[第一篇](/posts/agentic-patterns-core-composition/) 讲的 Prompt Chaining/Routing/Parallelization 都属 Anthropic 的「Workflow」——流程由开发者编排，LLM 不掌舵。而**本篇这四个模式，恰好是 Anthropic 判据里「Agent」一侧的核心能力**：它们让 LLM 从「按既定路径执行」走向「自我评估、调用工具、自主规划、协作」。

Anthropic 的原话很到位——「Agent 通常就是**在循环里、基于环境反馈使用工具的 LLM**」。这条描述里，**「自我评估」对应 Reflection，「使用工具」对应 Tool Use，「规划循环」对应 Planning，「协作」对应 Multi-Agent**。换句话说，这四个模式共同构成了一个最小可用智能体的能力底座。Ng 选它们四个作为「能驱动进步」的关键模式，正是这个原因。

> 来源：[Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) · [Andrew Ng 四模式系列](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection)

---

## 三、Reflection：自我反思循环

### 3.1 定义与机制

**定义**：一种自我改进机制——Agent 评估自己的输出/过程，并用评估结果迭代地精修响应。

**机制**：引入一个**反馈循环**——① 执行，产生初始输出；② 按准则（准确性/连贯性/完整性/指令遵循）评估，由另一次 LLM 调用或规则集完成；③ 反思/修正——找出改进点并重新生成；④ 可选地迭代，直到达到质量阈值或停止条件。

**本书的关键强调——Producer–Reviewer（生成者–评审者）分离**：用两个专门的角色（或两次不同 system prompt 的 LLM 调用），让评审者用全新的、聚焦的视角和结构化反馈来指导生成者修改。**这避免了「Agent 审自己工作」的认知偏差**。

### 3.2 Andrew Ng 的版本

Ng 的具体编程示例非常直观：① 生成任务 X 的代码；② 重 prompt「这是为任务 X 写的代码：[代码]。仔细检查其正确性、风格和效率，给出建设性批评」；③ 用「原代码 + 反馈」重 prompt 让它重写；④ 重复批评/重写循环。他还给出两个扩展——(a) 给 LLM **工具**来评估输出（跑单测、网搜核对事实）；(b) 实现成**双 Agent**（一个专职生成、一个专职批评）。Ng 自评 Reflection「相对基础」但「带来惊人的性能提升」。

### 3.3 适用场景

有明确评估准则、且质量/准确率/约束遵循很重要的任务：代码生成 + 调试、创意写作润色、复杂问题求解（错了能回溯）、摘要精修、计划校验。Anthropic 推荐用于「有客观评分或迭代精修能带来可测价值」的任务——两个信号：(1) 人的反馈能明显改进 LLM 输出；(2) LLM 自己能提供这种反馈。

### 3.4 陷阱与权衡

- **延迟和算力随每次迭代增长**——质量收益 vs 额外调用。
- **没有好停止条件会陷入无意义或无限循环**。
- 评审者可能与生成者**共享盲点**（尤其同模型时）——角色分离能缓解但不消除。
- **收益递减**：后面的迭代通常加料很少。

> 来源：[xindoo 中文版 Chapter 4: Reflection](https://github.com/xindoo/agentic-design-patterns) · [Andrew Ng, Part 2: Reflection](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection) · [Anthropic, Evaluator-Optimizer](https://www.anthropic.com/research/building-effective-agents)

---

## 四、Tool Use / Function Calling：让 Agent 会行动

### 4.1 定义与机制

**定义**：通过（典型地是）function calling，让 Agent 调用外部 API、数据库、服务或代码执行，从而摆脱 LLM 静态训练数据的限制。

**机制（本书的六步循环）**：
1. **工具定义**：把每个函数的用途、名字、参数、类型描述给 LLM；
2. **LLM 决策**：给定请求 + 工具目录，模型决定是否/需要哪个工具；
3. **生成函数调用**：模型发出结构化（通常 JSON）请求，命名工具 + 参数；
4. **执行**：编排层拦截，跑真实函数；
5. **观察**：结果返回给 Agent；
6. **处理**（可选但常见）：LLM 把输出整合进最终答案，或决定下一步（再调工具、反思、作答）。

**本书的泛化**：把「function call」拓宽成「tool call」——一个工具可以是 API 端点、DB 查询，甚至**委派给另一个专门 Agent**。这个泛化为 Multi-Agent 埋下伏笔。

### 4.2 Andrew Ng 的版本

Ng 的两个标志性例子：(a) 网搜——问「按评论最好的咖啡机？」，LLM 发出 `{tool: web-search, query: "coffee maker reviews"}`，后处理调用函数把结果喂回；(b) 代码执行——问「100 美元 7% 复利 12 年」，LLM 发出 `{tool: python-interpreter, code: "100 * (1+0.07)**12"}`。他还点出**规模问题**：工具有几百个时塞不进上下文，要用启发式挑相关子集（类比文本的 RAG）——引 *Gorilla* 论文。

### 4.3 适用场景

几乎所有 Agent 必须「行动或取动态信息」的场景：实时数据（天气/股价）、DB/API 交互（电商库存/支付）、计算分析（计算器/数据科学库）、发通信（邮件/消息）、沙箱执行代码。

### 4.4 陷阱与权衡

- **幻觉/格式错的工具调用**——模型编参数或用错工具名。
- **错误传播**——坏的工具结果会污染最终答案，需要健壮的错误处理。
- 加**延迟**（往返）和复杂度；Agent 可能过度调用工具。
- 工具描述本身要写好，否则模型误用。
- ⚠️ **安全**：工具能采取真实世界动作（发邮件、花钱）——需要 [Guardrails（Ch18）](/posts/agentic-enterprise-patterns/) 和常需 [Human-in-the-Loop（Ch13）](/posts/agentic-production-patterns/)。

> 来源：[xindoo 中文版 Chapter 5: Tool Use](https://github.com/xindoo/agentic-design-patterns) · [Andrew Ng, Part 3: Tool Use](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-3-tool-use)

---

## 五、Planning：目标导向与动态重规划

### 5.1 定义与机制

**定义**：Agent 构思并承诺一串从初始状态走向目标状态的动作，并在新信息到来时动态修订计划的能力。

**机制**：规划 Agent 把复杂目标当黑箱——你定义**目标和约束**（如「组织团建，预算 X、N 人」），Agent 自主搞清**怎么做**：理解初始状态和目标状态，生成连接它们的最优动作序列。**关键是：初始计划只是起点，不是固定脚本**——自适应才是核心价值。当首选场地不可用时，好的 Agent 会记录新约束、重评估、重规划（建议替代方案），而不是直接失败。这本质是把状态空间遍历变成目标导向行为。

### 5.2 Andrew Ng 的版本与「智能体时刻」

Ng 的 HuggingGPT 例子：「画一个和这张男孩图姿势一样的女孩」分解成 ① 检测男孩图姿势 ② 按该姿势渲染女孩，发出结构化计划 `{tool: pose-detection, ...} {tool: pose-to-image, ...}`。他还有个难忘轶事——他的「AI 智能体时刻」：一次演示中研究 Agent 的网搜 API 撞了限流，**Agent 居然自己改用维基百科搜索工具**（Ng 都忘了自己给过它），完成了任务。这正是「Agent 以你没预料的方式自主行动」的写照。他坦承 Planning「不那么成熟」「很难预测它会做什么」。

### 5.3 本书的关键判据（重要）

本书给出一个**非常实用的灵活性 vs 可预测性权衡**，原话大意：「动态规划是个特定工具，不是万能解。当问题的解法已经明确且可重复时，**把 Agent 限制在预定的固定工作流里更高效**。」决策就一个问题：**「怎么做」是需要被发现的，还是已知的？** 已知 → 用 [Prompt Chaining/Routing](/posts/agentic-patterns-core-composition/)。

### 5.4 适用场景

流程自动化（入职流程拆子任务）、机器人/自主导航（约束下路径规划）、结构化信息综合（多阶段研究报告）、多步客服诊断、任何「需要一串相互依赖操作」的问题。

### 5.5 陷阱与权衡

- **比固定工作流更不可预测、更难调试**。
- 对简单任务**杀鸡用牛刀**，只增延迟成本。
- 计划质量受限于 LLM 推理能力，坏计划会传播。

> 来源：[xindoo 中文版 Chapter 6: Planning](https://github.com/xindoo/agentic-design-patterns) · [Andrew Ng, Part 4: Planning](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-4-planning)

---

## 六、Multi-Agent Collaboration：分工协作

### 6.1 定义与机制

**定义**：多个各具专门角色/工具/知识的 Agent 协作达成共同目标，通过任务分解把单 Agent 能力扩展到复杂、跨域任务。

**机制**：建立在任务分解上——把高层目标拆成子问题，按工具/数据/专长分给最合适的 Agent，通过标准通信协议 + 共享本体协调以保证输出连贯。本书详列两套维度：

**协作拓扑**：顺序交接、并发处理、辩论共识、层级（管理者委派工人）、专家团、评审 - 评审者。

**通信/交互模型（六种）**：

| 模型 | 描述 | 风险 |
|---|---|---|
| ① 单 Agent | 基线 | — |
| ② 网络（Network） | 去中心化点对点 | 协调复杂 |
| ③ 主管（Supervisor） | 中央枢纽 | **单点故障 + 瓶颈** |
| ④ 主管即工具 | 提供资源而非发号施令 | — |
| ⑤ 层级（Hierarchical） | 多层主管 | 复杂 |
| ⑥ 自定义 | 定制混合 | — |

### 6.2 Andrew Ng 的版本

Ng 的标志性例子：通过一个**虚拟公司**来构建软件——Agent 扮演软件工程师、产品经理、设计师、QA 工程师（引 **ChatDev**「一个跑虚拟软件公司的 Agent 集合」）。他特别澄清一个反直觉点：这些 Agent 往往是**同一个 LLM 被 prompt 成不同角色**，他给了三个理由：(1) 有效（AutoGen 论文消融显示多 Agent 优于单 Agent）；(2) 让 LLM 每次专注一个子任务（利于长上下文理解）；(3) 是有用的**开发者抽象**，类比把程序拆成进程/线程。他再次把它与 Planning 并列为「不那么可预测」。

### 6.3 适用场景

复杂研究/分析（搜索→摘要→趋势→综合）、软件开发（需求→编码→测试→文档）、创意活动、金融分析、客服升级、供应链优化、网络故障定位。

### 6.4 陷阱与权衡

- **通信开销与规模化时的连贯性**——跨多 Agent 管消息传递和一致决策很难。
- **主管模型引入单点故障和瓶颈**（过载时）。
- 成本和延迟随 Agent 数/调用数倍增。
- 协调 bug、冲突决策、「涌现」的非预期行为。
- ⚠️ **可能过度工程**——简单任务上一个 prompt 良好的单 Agent 可能优于多 Agent 系统。

> 来源：[xindoo 中文版 Chapter 7: Multi-Agent](https://github.com/xindoo/agentic-design-patterns) · [Andrew Ng, Part 5: Multi-Agent Collaboration](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-5-multi-agent-collaboration)

---

## 七、四模式横向对比

| 维度 | Reflection | Tool Use | Planning | Multi-Agent |
|---|---|---|---|---|
| **核心动作** | 自评 + 自改 | 调外部能力 | 自主拆步 + 重规划 | 分工协作 |
| **是否带循环** | 是（反馈循环） | 是（调用循环） | 是（规划 - 执行循环） | 是（协调循环） |
| **Anthropic 对应** | Evaluator-Optimizer | 增强 LLM 的 tools | Agent / Orchestrator-Workers | Agent / Orchestrator-Workers |
| **Ng 成熟度评价** | 可靠 | 可靠 | **难预测** | **难预测** |
| **主要代价** | 迭代延迟/算力 | 往返延迟 + 错误传播 | 不可预测 + 难调试 | 通信开销 + 成本倍增 |
| **过度使用风险** | 无意义循环 | 过度调工具 | 简单任务杀鸡牛刀 | 过度工程，单 Agent 更好 |

> 来源：[Andrew Ng 四模式系列](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection) · [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

---

## 八、按用途选型决策表

| 你的用途 | 推荐方案 |
|---|---|
| **想让输出能自我纠错、质量更高** | Reflection（Producer–Reviewer 分离） |
| **Agent 要查实时数据 / 调 API / 跑代码** | Tool Use / Function Calling |
| **目标复杂、步骤无法预设** | Planning（但先问「解法是否已知」，已知则退回工作流） |
| **单 Agent 搞不定、要分工** | Multi-Agent（简单任务别上，单 Agent 可能更好） |
| **要可靠落地，先选哪两个** | Reflection + Tool Use（Ng 评二者最可靠） |
| **要做「评审 - 改进」的轻量多 Agent** | Reflection 的双 Agent 版本（生成者 + 评审者） |
| **要工具能被发现/互通/跨厂商** | 把 Tool Use 升级成 [MCP](/posts/agentic-advanced-patterns/) |

一句话总原则：**先用 Reflection + Tool Use 把可靠收益拿到手；Planning 和 Multi-Agent 留给「解法未知」或「单 Agent 真不够」的场景——它们更强大，但也更贵、更难预测。**

---

## 九、参考资料

**Andrew Ng 四模式系列（DeepLearning.AI The Batch）**

- [Part 1：四模式总览与 GPT-3.5/GPT-4 基准](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance)
- [Part 2：Reflection](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection) · [Part 3：Tool Use](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-3-tool-use) · [Part 4：Planning](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-4-planning) · [Part 5：Multi-Agent Collaboration](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-5-multi-agent-collaboration)
- [Sequoia AI Ascent 演讲（YouTube）](https://www.youtube.com/watch?v=sal78ACtGTc)

**原书与对照**

- [evoiz/Agentic-Design-Patterns（官方仓库）](https://github.com/evoiz/Agentic-Design-Patterns) · [xindoo 中文翻译版](https://github.com/xindoo/agentic-design-patterns)
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

**姊妹篇**

- 系列总览：[《Agentic Design Patterns 系列总览》](/posts/agentic-design-patterns-overview/)
- 上篇：[《（一）：Prompt Chaining / Routing / Parallelization》](/posts/agentic-patterns-core-composition/)
- 下篇：[《（三）：Memory / Learning / MCP / Goal Setting》](/posts/agentic-advanced-patterns/)
