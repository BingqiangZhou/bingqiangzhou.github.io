---
title: 【学习笔记】Agentic 设计模式（三）：Memory / Learning / MCP / Goal Setting 高级模式
published: 2026-07-01
description: 深入讲解 Antonio Gulli《Agentic Design Patterns》第 8–11 章的高级模式——Memory Management（短期上下文记忆 vs 长期向量库记忆，及 Google ADK 的 Session/State/Memory 三概念）、Learning and Adaptation（RL/监督/在线学习 + PPO 与 DPO 对齐算法 + SICA 自改代码 Agent 案例）、Model Context Protocol（MCP 客户端-服务器架构、Resources/Prompts/Tools 三元素、与 function calling 的关键区别、Agent 接口契约陷阱）、Goal Setting and Monitoring（Planning 的另一半，把 Agent 从被动执行者变成有目标、能自评的目的性系统），给出机制、适用场景、陷阱与组合关系
lang: zh
tags: [学习笔记]
abbrlink: agentic-advanced-patterns
---

> 整理日期：2026-07-01
> 涵盖范围：Memory Management、Learning & Adaptation、MCP、Goal Setting & Monitoring（本书 Part Two Ch 8–11）
> 说明：这是 [Agentic 设计模式系列总览](/posts/agentic-design-patterns-overview/) 的第三篇分篇。这一层模式是「让 Agent 有**记忆、学习、互联、目标**」的基础设施——如果说前两篇是「怎么编排 LLM 调用」，本篇是「怎么让 Agent 持久存在并持续改进」。内容基于本书英文原书（经 `xindoo` 中文版核实），MCP/A2A 部分对照官方协议文档。标注「（未确认）」处以英文原书为准。

<!--
## 目录
- [一、核心结论（太长不看）](#一核心结论太长不看)
- [二、这一层的定位：从「单次编排」到「持久自治」](#二这一层的定位从单次编排到持久自治)
- [三、Memory Management：让 Agent 记得住](#三memory-management让-agent-记得住)
- [四、Learning and Adaptation：让 Agent 越用越聪明](#四learning-and-adaptation让-agent-越用越聪明)
- [五、Model Context Protocol (MCP)：工具的万能插座](#五model-context-protocol-mcp工具的万能插座)
- [六、Goal Setting and Monitoring：给 Agent 目标与自评](#六goal-setting-and-monitoring给-agent-目标与自评)
- [七、四模式横向对比](#七四模式横向对比)
- [八、按用途选型决策表](#八按用途选型决策表)
- [九、参考资料](#九参考资料)
-->

## 一、核心结论（太长不看）

1. **这一层四个模式解决的是「Agent 的存在性」问题**：前两篇的模式都是「一次性编排 LLM 调用」，跑完就忘；本篇让 Agent 能**记住跨会话信息（Memory）**、**根据经验自我改进（Learning）**、**用标准协议接驳万千工具（MCP）**、**带着目标自我管理（Goal Setting）**。
2. **Memory 的关键是「短期 vs 长期」二分**：短期 = LLM 上下文窗口（有限、易失、按 token 计费）；长期 = 外部存储（数据库/向量库），按**语义相似度**检索。⚠️ **长上下文模型不是持久记忆的替代品**——它仍然临时且昂贵。Google ADK 把它具象成 **Session（会话）/ State（状态）/ Memory（跨会话库）** 三概念。
3. **Learning 的核心是「不写死、根据经验改进」**：本书覆盖 RL/监督/在线学习，深入讲两个对齐算法——**PPO（带裁剪信任域，防灾难性更新）** 和 **DPO（跳过奖励模型，直接用偏好优化，更简单稳健）**，并给了 **SICA 自改代码 Agent** 这个震撼案例（Agent 迭代修改**自己的源码** + 异步主管监督防退化）。
4. **MCP 是 2024 年底至今最重要的 Agent 工具互联标准**：客户端 - 服务器架构，服务器暴露 **Resources（资源）/ Prompts（提示模板）/ Tools（工具）** 三类元素，客户端动态发现。与 function calling 的关键区别——**标准化、可发现、可复用、一对多**。最大陷阱：**MCP 是「Agent-接口契约」，其价值取决于底层 API 设计**——把对 Agent 不友好的旧 API 原样包一层往往没用。
5. **Goal Setting 是 Planning 的「另一半」**：Planning 负责「生成步骤」，Goal Setting 负责「定义目标 + 跟踪进度 + 判定达成」。两者 + Reflection 三者协同，才把 Agent 从「被动执行者」变成「目的性系统」。⚠️ **模糊/不可测的目标会让监控无从下手**。

> 来源：[xindoo 中文版 Ch8–11](https://github.com/xindoo/agentic-design-patterns) · [Model Context Protocol 官方](https://modelcontextprotocol.io)

---

## 二、这一层的定位：从「单次编排」到「持久自治」

| | 前两篇（Ch 1–7） | 本篇（Ch 8–11） |
|---|---|---|
| **关注点** | 怎么把 LLM 调用编排好 | 怎么让 Agent 持久存在、持续改进 |
| **状态** | 一次跑完即结束（或循环内临时） | 跨会话、跨时间持久 |
| **典型问题** | 任务怎么拆、怎么分流、怎么反思 | 怎么记住、怎么变聪明、怎么连工具、怎么自评 |
| **比喻** | 流水线 / 程序 | 有记忆、会成长的「员工」 |

一个贯穿性的认知：**Reflection（Ch4）的有效性被本书明确说成「显著增强于 LLM 保留对话记忆时」**——没有记忆，每次反思都是孤立的；有了记忆，反思可以累积，Agent 才学会避免重蹈覆辙。这就是为什么 Memory 是本篇的基石。

> 来源：[xindoo 中文版 Chapter 8: Memory Management](https://github.com/xindoo/agentic-design-patterns)

---

## 三、Memory Management：让 Agent 记得住

### 3.1 定义与机制

**定义**：管理 Agent 利用过往交互、观察和经验来决策、维持对话上下文、随时间改进的能力——分为**短期（上下文）记忆**和**长期（持久）记忆**。

**机制（二分法）**：

| 记忆类型 | 是什么 | 特点 | 管理 |
|---|---|---|---|
| **短期/上下文记忆** | LLM 上下文窗口：近期消息、Agent 回复、工具结果、当轮反思 | **容量有限、易失**（会话结束即丢）、按 token 计费 | 对旧轮次做摘要、突出关键细节 |
| **长期/持久记忆** | 外部存储（数据库、知识图谱、**向量数据库**） | 跨会话、按**语义相似度**检索（非关键词匹配） | 数据转数值向量，需要时检索并注回上下文 |

**Google ADK 的三概念具象**：**Session**（一个聊天线程，持有 Events + State）、**State**（`session.state`，线程作用域数据）、**Memory**（可搜索的跨会话/跨源仓库），由 `SessionService` 和 `MemoryService` 管理，后端可插拔（测试用内存，生产用 `DatabaseSessionService` 跑 SQLite/Postgres，云端用 `VertexAiSessionService`）。

### 3.2 适用场景

任何 Agent 需要保留信息或随时间改进的场景：对话式 AI 的连贯性、任务导向 Agent 跟踪多步进度、个性化（回忆偏好/历史）、从经验中学习、**RAG（知识库即长期记忆）**、自治系统（机器人/自动驾驶存地图/路线）。

### 3.3 陷阱与权衡

- 上下文窗口**有限且填满很贵**（窗口里每个 token 每轮都被重处理）。
- 向量库的**检索质量是瓶颈**——无关/噪声检索会劣化答案。
- 状态/会话管理复杂（持久化、并发、隐私）。
- ⚠️ **长上下文 ≠ 真正的持久结构化记忆**——它仍然临时且昂贵。

> 来源：[xindoo 中文版 Chapter 8: Memory Management](https://github.com/xindoo/agentic-design-patterns)

---

## 四、Learning and Adaptation：让 Agent 越用越聪明

### 4.1 定义与机制

**定义**：Agent 自主改进的能力——根据新经验和数据改变自己的推理、动作或知识，超越预设参数，无需持续人工干预就变得更聪明。

**机制**：本书调研多种学习范式——**强化学习**（奖惩学最优行为）、**监督学习**（从标签学输入→输出映射）、**无监督学习**（找隐藏模式）、**LLM few-shot/zero-shot**（从少量样本/指令快速适应）、**在线学习**（持续更新适应变化环境）、**基于记忆的学习**（回忆过往经验调整当前动作）。

**两个对齐算法深入**：

| 算法 | 核心思想 | 关键机制 |
|---|---|---|
| **PPO（Proximal Policy Optimization）** | 连续动作空间的 RL，小步谨慎更新避免灾难性变化 | **裁剪代理目标**造出「信任域/安全区」，防止更新离当前策略太远——像安全刹车 |
| **DPO（Direct Preference Optimization）** | 简化 LLM 对齐 | **跳过奖励模型**，直接把损失用策略重参数化：提高偏好响应概率、降低非偏好响应概率。比 PPO 高效稳健 |

> 为什么 DPO 更简单：传统 PPO 对齐是两步（先训练独立奖励模型，再 PPO 调 LLM 对抗它）——复杂且可被 LLM「钻空子 hack 奖励模型」。DPO 利用偏好与最优策略的数学关系直接优化。

**震撼案例——SICA（Self-Improving Coding Agent）**：一个迭代修改**自己源码**的 Agent——审阅自己过往版本归档 + 基准分，选最佳、分析改进、直接改代码库、重跑基准、记录结果，逐版演化出「智能编辑器」「diff 增强编辑器」「AST 符号定位器」「混合符号定位器」等工具，配一个**异步主管 LLM** 监控调用图、发现循环/停滞就介入。

### 4.2 适用场景

个性化助手优化交互模式、交易机器人调参适应实时市场、App Agent 适配 UI 行为、机器人/自动驾驶、欺诈检测、推荐、游戏 AI、知识库学习型 Agent（RAG 支撑、存成功策略）。

### 4.3 陷阱与权衡

- PPO 复杂/不稳；DPO 需要好偏好数据、仍可能敏感。
- ⚠️ **自改 Agent（SICA）有退化循环、回归、无界漂移风险**——所以才要主管 + 归档选优。
- 在线学习可能**灾难性遗忘**或漂移向不良行为。
- 训练/推理成本；需要评测/监控来发现性能退化。

> 来源：[xindoo 中文版 Chapter 9: Learning and Adaptation](https://github.com/xindoo/agentic-design-patterns)

---

## 五、Model Context Protocol (MCP)：工具的万能插座

### 5.1 定义与机制

**定义**：一个开放标准，充当**万能适配器**——让任意 LLM 连接任意外部系统/数据库/工具，标准化模型如何发现、通信、使用外部资源。

**机制（客户端 - 服务器架构）**：

- **MCP 服务器**暴露三类元素：**Resources**（静态数据如 PDF/DB 记录）、**Prompts**（引导 LLM 用资源/工具的交互模板）、**Tools**（可执行函数如发邮件/查 API）。
- **MCP 客户端**（LLM 宿主应用或 Agent）通过**动态查询**发现这些元素，再构造请求；服务器做认证/校验、经底层第三方服务执行、返回标准化响应。
- **交互流程**：发现 → 请求构造 → 客户端通信 → 服务器执行 → 响应 + 上下文更新。
- **传输**：本地走 STDIO 的 JSON-RPC；远程走流式 HTTP + SSE。

### 5.2 MCP vs Function Calling（关键区别）

| 维度 | Function Calling | MCP |
|---|---|---|
| **标准化** | 私有、厂商特定 | 开放标准，可互操作 |
| **范围** | 直接调预定义函数 | 更广的发现 + 通信框架 |
| **架构** | 一对一（LLM↔应用逻辑） | 客户端 - 服务器（一个客户端 ↔ 多个服务器） |
| **发现** | 工具得告诉 LLM | 客户端可动态查询服务器能力 |
| **可复用** | 与应用/LLM 紧耦合 | 独立「MCP 服务器」可被任意客户端复用 |

**比喻**：function calling = 给 AI 特定定制扳手；MCP = 一个任何工具都能插的标准化电源插座。

### 5.3 适用场景

DB 集成（自然语言查 BigQuery）、生成式媒体编排（Imagen/Veo/Chirp）、外部 API 交互、推理式信息抽取、自定义工具开发、标准化 LLM↔应用通信、复杂多步工作流编排、IoT 设备控制、金融服务自动化。

### 5.4 陷阱与权衡（本书特有，重要）

- ⚠️ **MCP 是「Agent-接口契约」，其价值取决于底层 API 设计**。陷阱：开发者只是把旧 API 原样包一层，而旧 API 往往对 Agent 不友好（如工单 API 只能逐个返回，让「总结高优先级工单」又慢又不准）。**底层 API 应增加确定性功能（过滤/排序）来帮非确定的 Agent**。
- **数据格式友好度**：MCP 服务器返回原始 PDF，若 Agent 不能解析 PDF 就没用——返回 Markdown 文本更好。**MCP 不保证数据是 Agent 能懂的**。
- **安全**：暴露工具/数据需强认证/授权。
- **复杂度**：实现非平凡，但 SDK（Anthropic、FastMCP）能减样板。

> 来源：[xindoo 中文版 Chapter 10: MCP](https://github.com/xindoo/agentic-design-patterns) · [Model Context Protocol 官方](https://modelcontextprotocol.io) · [Anthropic MCP 公告](https://www.anthropic.com/news/model-context-protocol)

---

## 六、Goal Setting and Monitoring：给 Agent 目标与自评

### 6.1 定义与机制

**定义**：给 Agent 一个明确的**工作目标** + 跟踪进度 + 判定目标是否达成的手段——把 Agent 从被动执行者变成有自我管理的目的性系统。

**机制（两半互补）**：

- **Planning（规划）**：Agent 取高层目标，自主/半自主生成一串中间步骤/子目标（顺序或更复杂，常组合 Tool Use、Routing、Multi-Agent），用搜索算法、逻辑推理或 LLM 生成计划。
- **Monitoring（监控）**：持续跟踪相对目标的进度，判定成功/升级。

二者合力处理非平凡、多步请求，并在条件变化时**重规划**。这是让自治、可靠运行在动态真实环境中成为可能的框架。

### 6.2 与 Planning / Reflection 的协同（本书明示）

本章是 **Planning（Ch6）和 Reflection（Ch4）的显式伴侣**。原话大意：「目标为 Agent 自评（反思）提供终极基准，而监控跟踪进度。」Reflection 充当**修正引擎**，用监控反馈检测偏差并调整策略。三者协同把 Agent「从被动执行者转成目的性系统」。还连 Memory（Ch8，跟踪历史）和 Learning（Ch9，随时间改进目标达成）。

### 6.3 适用场景

客服自动化（「解决账单问题」——监控对话、查 DB、调整、确认成功，否则升级）、个性化学习系统（跟踪学生进度、调教材、标记困难）、项目管理助手（确保里程碑 X 在日期 Y 达成、标记延误）、自治交易机器人（风险内最大化回报）、机器人/自动驾驶（「安全从 A 运到 B」）、内容审核。

### 6.4 陷阱与权衡

- ⚠️ **模糊/不可测的目标让监控无从下手**——目标必须定义得「成功」可被检查。
- 监控本身有开销，且可能出错（假成功/假失败信号）。
- 没有好的重规划时，被阻塞的子目标会卡住整个 Agent。
- 自治 vs 控制的张力——完全自治的目标追求可能偏离意图（需 [HITL，Ch13](/posts/agentic-production-patterns/)）。

> 来源：[xindoo 中文版 Chapter 11: Goal Setting and Monitoring](https://github.com/xindoo/agentic-design-patterns)

---

## 七、四模式横向对比

| 维度 | Memory | Learning | MCP | Goal Setting |
|---|---|---|---|---|
| **解决什么** | 跨会话信息会丢 | 行为写死后无法改进 | 工具集成碎片化 | 缺目标则无法自治 |
| **本质** | 状态持久化 | 自适应改进 | 工具互联标准 | 目标 + 自评 |
| **是哪层的** | 基础设施 | 基础设施 | Tool Use 之上的标准层 | Planning 的治理层 |
| **最大陷阱** | 检索质量瓶颈；长上下文非替代 | 灾难性遗忘/退化漂移 | 旧 API 包一层无用 | 模糊目标无法监控 |
| **强化谁** | Reflection 可累积；RAG 的基石 | 依赖 Memory + Goal | 让 Tool Use 可互操作 | Planning 的另一半 |

> 来源：[xindoo 中文版 Ch8–11](https://github.com/xindoo/agentic-design-patterns)

---

## 八、按用途选型决策表

| 你的用途 | 推荐方案 |
|---|---|
| **要 Agent 跨轮/跨会话记住信息** | Memory（短期用上下文摘要，长期用向量库） |
| **要让 Reflection 真正累积改进** | Memory + Reflection 组合 |
| **要 Agent 越用越聪明、自适应** | Learning & Adaptation（先评估偏好数据质量） |
| **要对齐 LLM 偏好** | 偏好数据好 → DPO；传统复杂管线 → PPO |
| **要统一接驳一堆工具/数据源** | MCP（注意底层 API 要对 Agent 友好） |
| **要工具能跨厂商/框架复用** | MCP（标准化、可发现） |
| **要给 Agent 明确目标 + 自评达成** | Goal Setting & Monitoring（目标必须可测） |
| **要让 Planning 有「终点判定」** | Goal Setting 作为 Planning 的伴侣 |

一句话总原则：**这一层是把「聪明的单次编排」升级成「持久、成长、互联、自治」的系统——Memory 是基石，MCP 是互联标准，Learning 与 Goal Setting 分别管「变聪明」和「知道自己变好了没」。**

---

## 九、参考资料

**原书与翻译**

- [evoiz/Agentic-Design-Patterns（官方仓库）](https://github.com/evoiz/Agentic-Design-Patterns) · [xindoo 中文翻译版](https://github.com/xindoo/agentic-design-patterns)

**MCP 官方协议**

- [Model Context Protocol 官网](https://modelcontextprotocol.io) · [Anthropic MCP 公告](https://www.anthropic.com/news/model-context-protocol)

**姊妹篇**

- 系列总览：[《Agentic Design Patterns 系列总览》](/posts/agentic-design-patterns-overview/)
- 上篇：[《（二）：Reflection / Tool Use / Planning / Multi-Agent》](/posts/agentic-reasoning-patterns/)
- 下篇：[《（四）：异常恢复 / 人在回路 / RAG》](/posts/agentic-production-patterns/)
