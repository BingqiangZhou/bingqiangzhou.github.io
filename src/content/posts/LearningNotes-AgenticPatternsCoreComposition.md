---
title: 【学习笔记】Agentic 设计模式（一）：Prompt Chaining / Routing / Parallelization 三大工作流原语
published: 2026-07-01
description: 深入讲解 Antonio Gulli《Agentic Design Patterns》前三章的三大确定性工作流原语——Prompt Chaining（把任务拆成串行 LLM 步骤、用结构化输出和「门控」串接）、Routing（分类后路由到专门子流程，含 LLM/嵌入/规则/ML 四种路由器实现）、Parallelization（并发跑互不依赖的步骤再汇总，含 Sectioning 与 Voting 两变体），逐一给出定义、机制、适用场景、典型陷阱与组合关系，并对照 Anthropic「Building Effective Agents」的同名工作流
lang: zh
tags: [学习笔记]
abbrlink: agentic-patterns-core-composition
---

> 整理日期：2026-07-01
> 涵盖范围：Prompt Chaining、Routing、Parallelization 三大工作流原语（本书 Part One Ch 1–3）
> 说明：这是 [Agentic 设计模式系列总览](/posts/agentic-design-patterns-overview/) 的第一篇分篇。这三个模式是**所有更复杂模式的积木**——Routing 本质是「链里插一个条件分支」，Parallelization 是「链里开几路并发」，Reflection 是「给某一步套反馈循环」。内容基于本书英文原书（经中文翻译版 `xindoo` 核实）与 Anthropic《Building Effective Agents》。标注「（未确认）」处请以英文原书为准。

<!--
## 目录
- [一、核心结论（太长不看）](#一核心结论太长不看)
- [二、为什么这三个模式是「原语」](#二为什么这三个模式是原语)
- [三、Prompt Chaining：串行管道](#三prompt-chaining串行管道)
- [四、Routing：分流器](#四routing分流器)
- [五、Parallelization：并发与投票](#五parallelization并发与投票)
- [六、三模式横向对比](#六三模式横向对比)
- [七、按用途选型决策表](#七按用途选型决策表)
- [八、参考资料](#八参考资料)
-->

## 一、核心结论（太长不看）

1. **这三个模式都属于 Anthropic 定义的「Workflow（工作流）」**——流程由开发者用代码预先编排，LLM 不自己掌舵。它们简单、可预测，是上 Agent 之前最该先掌握的工程手段。
2. **Prompt Chaining 的本质是「分而治之 + 串接」**：把一个大 prompt 拆成几个单职责小步骤，前一步输出喂下一步，步骤间可用程序化「门控（gate）」决定继续/回退/循环。它治的是单大 prompt 的老毛病——**指令忽视、上下文漂移、错误传播、上下文窗口耗尽、认知负荷下的幻觉**。代价是串行带来的延迟与多次调用成本。
3. **Routing 的本质是「先分类，再分流」**：在决策点放一个分类器，把输入导向专门的处理器。本书给了**四种路由器实现**——LLM 路由、嵌入路由、规则路由、ML 模型路由，核心权衡是「灵活 vs 快/确定」。最大风险是**误分类会级联放大**——分错了，整条后续链路都白费。
4. **Parallelization 的本质是「并发互不依赖的步骤，再汇总」**：Anthropic 把它拆成两个变体——**Sectioning（把独立子任务并发跑再合并）** 和 **Voting（同一个 prompt 跑 N 次再聚合，用来抓异常/取多数）**。前提是任务**真的互不依赖**，否则并发就是错的。
5. **三者高度可组合，且都是后续模式的零件**：Routing 是链里的条件分支，Parallelization 是链里的并发扇出，二者常与 Multi-Agent 的「编排器分发」拓扑合用。

> 来源：[Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) · [xindoo 中文版 Ch1–3](https://github.com/xindoo/agentic-design-patterns)

---

## 二、为什么这三个模式是「原语」

本书 Part One 的前 7 章覆盖了「最基础的积木」。其中 **Ch 4–7（Reflection/Tool Use/Planning/Multi-Agent）是让系统真正「智能」的模式**（见[第二篇分篇](/posts/agentic-reasoning-patterns/)）；而 **Ch 1–3 这三个模式则是更基础的「确定性工作流编排」**——它们解决的是「怎么把多个 LLM 调用靠谱地组织起来」，本身不带反馈循环或目标规划。

一个关键认知：**这三个原语对应的就是 Anthropic 五大工作流里的前三个**（Prompt chaining、Routing、Parallelization），Anthropic 另两个工作流（Orchestrator-Workers、Evaluator-Optimizer）分别对应本书的 Multi-Agent 和 Reflection。所以学完这三章 + 后续四章，你就完整覆盖了 Anthropic 那篇经典文章的全部模式。

> 来源：[Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

---

## 三、Prompt Chaining：串行管道

### 3.1 定义与机制

**定义**：把一个复杂任务拆成一串更小、更聚焦的 LLM 步骤，每一步的输出作为下一步的输入，像流水线一样串起来。

**机制**：一个庞大的 prompt 被切成「分而治之」的单职责 prompt 链。每一步都更易设计、调试和校验；中间结果沿依赖链传递。**步骤间的结构化输出格式（JSON/XML）是关键**——它保证数据完整性、防止解析失败。Anthropic 还强调链里的每一步都可以被「**门控（gate）**」——一个程序化检查决定是否进入下一步、回退或循环。

**单大 prompt 的五个老毛病（链式要治的）**：指令忽视、上下文漂移、错误传播、上下文窗口耗尽、认知负荷下的幻觉。

### 3.2 适用场景

任务能干净地拆成**固定的串行子任务**，且你愿意用一点额外延迟换明显更高的准确率。典型例子：

- 多阶段文档处理（摘要 → 抽实体 → 起草邮件）
- 结构化数据抽取再转换
- 多阶段 RAG 流水线
- 「写大纲 → 检查 → 按大纲写正文」类先生成骨架再填充

**玩具示例**（本书）：市场报告分析链——①「总结这份报告」→ ②「从摘要里抽出 top 3 趋势 + 支撑数据点（输出 JSON）」→ ③「用这些趋势起草一封营销邮件」。每一步用不同角色（市场分析师 → 贸易分析师 → 文案）。

### 3.3 陷阱与权衡

- **延迟和成本随步骤累加**——只有质量收益值得时才用。Anthropic 明确：这是用延迟换准确率。
- **交接处脆弱**：任何一步输出模糊或格式错，下一步就崩。缓解靠严格的结构化输出 + 校验（门控）。
- **早期错误仍会沿链传播**——这是链式结构的固有弱点，门控只能拦住显性失败。

> 来源：[Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) · [xindoo 中文版 Chapter 1: Prompt Chaining](https://github.com/xindoo/agentic-design-patterns)

---

## 四、Routing：分流器

### 4.1 定义与机制

**定义**：引入条件逻辑，让 Agent 动态地把输入分类，并导向某条专门的执行路径、工具或子 Agent。

**机制**：一个分类器坐在决策节点上，输出一个标识符来选下一个处理器。**本书给出四种路由器实现**，这是本章最有价值的内容：

| 路由器类型 | 做法 | 优 | 缺 |
|---|---|---|---|
| **① LLM 路由** | 让模型输出一个类别标签 | 灵活、能处理新输入 | 加延迟、非确定，分类器本身会误判 |
| **② 嵌入路由** | 把查询向量化，按与路由嵌入的语义相似度分流 | 快、语义级 | 需维护路由嵌入 |
| **③ 规则路由** | 确定性关键词/模式 if-else | 快、确定、可控 | 对细微/新输入脆弱 |
| **④ ML 模型路由** | 微调一个判别分类器，权重里编码了路由逻辑 | 推理时无需 LLM、快 | 需训练数据、不灵活 |

路由可以发生在开头、中间，或在子例程里（比如挑工具）。

### 4.2 适用场景

不同类输入需要不同处理时。典型例子：客服 Agent 把意图分成「订单状态 / 商品咨询 / 技术支持」分流；工单/邮件分类；编码助手把片段分流到「调试器 vs 翻译器」工具。Anthropic 推荐用它做「关注点分离」——每类用专门的 prompt/模型。

**玩具示例**（本书）：协调器 prompt「分析请求并只输出一个词：booker/info/unclear」，再用 `RunnableBranch` 分发：booker→预订处理器，info→信息处理器，unclear→澄清处理器。

### 4.3 陷阱与权衡

- **核心权衡是「灵活 vs 快/确定」**——LLM 路由灵活但慢且非确定，规则路由快但脆。四种实现的差异本质就在这一条线上。
- **误分类会级联**——分错了专家，整个请求的后续处理全错。
- **过度细分**：路由太多太窄，会让分类器更难做。

> 来源：[xindoo 中文版 Chapter 2: Routing](https://github.com/xindoo/agentic-design-patterns) · [Anthropic, Building Effective Agents（Workflow: Routing）](https://www.anthropic.com/research/building-effective-agents)

---

## 五、Parallelization：并发与投票

### 5.1 定义与机制

**定义**：并发执行多个互不依赖的组件（LLM 调用、工具调用、整个子 Agent），而非串行，从而降低总延迟。

**机制**：找出输出互不依赖的步骤，并发跑，再在下一个依赖步骤前同步（join）汇总结果。LangChain/LangGraph/Google ADK 都提供原生 async/分支原语。**Anthropic 把它细分成两个变体**：

| 变体 | 做法 | 用途 |
|---|---|---|
| **Sectioning（分区）** | 把独立子任务并发跑再合并 | 多源信息采集（新闻 + 股价 + 社交 concurrently）、批量处理、多 API 扇出（旅行的机票/酒店/景点同时查） |
| **Voting（投票）** | 同一个 prompt 跑 N 次再聚合 | 抓异常值、取多数答案、多视角提置信（如一个模型答题、另一个并行审安全；多个 prompt 并行查代码漏洞） |

### 5.2 适用场景

多源信息采集、批量处理、多 API 扇出、多组件内容生成、校验/投票。**外部服务延迟高时尤其有效**——因为可以同时发很多请求。

**玩具示例**（本书）：串行版「搜 A → 总结 A → 搜 B → 总结 B → 综合」；并发版「同时搜 A、B → 同时总结 A、B → 综合」，墙钟时间约砍半。

### 5.3 陷阱与权衡

- **只在任务真正互不依赖时才有用**——藏着依赖关系时并发就是错的。
- **增加 token 成本 / API 并发量**（同时付 N 个调用的钱）。
- **join/同步那一步是串行瓶颈**。
- **投票的价值来自抓住方差**——如果 prompt 本身很确定，投票就是浪费钱。

> 来源：[Anthropic, Building Effective Agents（Workflow: Parallelization）](https://www.anthropic.com/research/building-effective-agents) · [xindoo 中文版 Chapter 3: Parallelization](https://github.com/xindoo/agentic-design-patterns)

---

## 六、三模式横向对比

| 维度 | Prompt Chaining | Routing | Parallelization |
|---|---|---|---|
| **结构** | 串行管道 | 条件分支 | 并发扇出再汇总 |
| **LLM 是否掌舵** | 否（开发者编排） | 否 | 否 |
| **解决什么** | 单大 prompt 质量不稳 | 不同输入该走不同处理 | 串行太慢 / 要多视角 |
| **主要代价** | 延迟 + 多次调用成本 | 误分类级联放大 | token 成本 + API 并发 |
| **关键前提** | 任务能干净拆成固定串行步 | 分类可靠 | 任务真正互不依赖 |
| **Anthropic 对应** | Workflow: Prompt chaining | Workflow: Routing | Workflow: Parallelization |
| **作为谁的零件** | 一切模式的基础 | 链里的条件分支 | 链里的并发扇出；Multi-Agent 扇出核心 |

> 来源：[Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

---

## 七、按用途选型决策表

| 你的用途 | 推荐方案 |
|---|---|
| **单次 LLM 总做不好，但任务能拆成固定几步** | Prompt Chaining，步骤间用结构化输出 + 门控 |
| **不同输入该走不同处理（分流/分级）** | Routing（按「需灵活选 LLM 路由，需快选规则/嵌入」） |
| **要快、或多视角投票提置信** | Parallelization（独立子任务用 Sectioning，校验用 Voting） |
| **任务有固定主干，但某些点要分流** | Prompt Chaining + 在分流点插 Routing |
| **想降低延迟且子任务互不依赖** | 把链里的串行段改成 Parallelization |
| **解法不固定、需 LLM 自己决定走哪** | 别用这三个——上 [Planning/Multi-Agent](/posts/agentic-reasoning-patterns/) |

一句话总原则：**这三个都是「开发者编排」的工作流，先用它们把确定性能榨干；只有当任务结构本身不确定、需要 LLM 自己决定流程时，才升级到真正的 Agent 模式。**

---

## 八、参考资料

**原书与翻译**

- [evoiz/Agentic-Design-Patterns（官方仓库）](https://github.com/evoiz/Agentic-Design-Patterns) · [xindoo 中文翻译版](https://github.com/xindoo/agentic-design-patterns)
- [ningg/Agentic-Design-Patterns-CN（双语批注版）](https://github.com/ningg/Agentic-Design-Patterns-CN)

**对照来源**

- [Anthropic, Building Effective Agents（五大工作流）](https://www.anthropic.com/research/building-effective-agents)

**姊妹篇**

- 系列总览：[《Agentic Design Patterns 系列总览》](/posts/agentic-design-patterns-overview/)
- 下一篇：[《Agentic 设计模式（二）：Reflection / Tool Use / Planning / Multi-Agent》](/posts/agentic-reasoning-patterns/)
