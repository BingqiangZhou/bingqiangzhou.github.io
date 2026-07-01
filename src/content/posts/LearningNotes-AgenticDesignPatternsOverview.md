---
title: 【学习笔记】Agentic Design Patterns 系列总览：Agent 设计模式的 21 种模式全景图
published: 2026-07-01
description: 系统梳理 Antonio Gulli《Agentic Design Patterns》一书的 21 种核心设计模式——从 Prompt Chaining、Routing、Parallelization 三大确定性工作流原语，到 Andrew Ng 经典的 Reflection/Tool Use/Planning/Multi-Agent 四大智能体模式，再到 Memory、MCP、RAG、A2A、Guardrails、Evaluation 等高级/生产/企业级模式；并交叉对照 Andrew Ng 四模式与 Anthropic「Building Effective Agents」五大工作流，给出一份「模式 × 解决什么问题 × 何时用 × 典型陷阱」的全景索引
lang: zh
tags: [学习笔记]
abbrlink: agentic-design-patterns-overview
---

> 整理日期：2026-07-01
> 涵盖范围：Agent 设计模式全图、本书 4 大 Part / 21 章 / 7 附录结构、Andrew Ng 四模式映射、Anthropic 工作流对照、选型决策、系列导航索引
> 说明：本系列笔记主要基于 Antonio Gulli 著《Agentic Design Patterns: A Hands-On Guide to Building Intelligent Systems》（官方仓库 `evoiz/Agentic-Design-Patterns`，含 424 页完整 PDF + 每章 Jupyter notebook），交叉核实中文翻译版 `xindoo/agentic-design-patterns`（截至发稿仍为「pending review」状态，故引用细节标注「（未确认）」处请以英文原书为准）与双语版 `ningg/Agentic-Design-Patterns-CN`，并对照 Andrew Ng 的四模式系列与 Anthropic 的「Building Effective Agents」一文。术语遵循：本文用「模式」一词指代 design pattern。本文是系列**导航枢纽**，文末「七、系列导航索引」可跳转到各分篇。

<!--
## 目录
- [一、核心结论（太长不看）](#一核心结论太长不看)
- [二、先厘清一个根本问题：什么才叫「Agent」？](#二先厘清一个根本问题什么才叫agent)
- [三、为什么需要「设计模式」：GPT-3.5 套个循环就打败 GPT-4](#三为什么需要设计模式gpt-35-套个循环就打败-gpt-4)
- [四、本书结构：4 大 Part × 21 模式 + 7 附录](#四本书结构4-大-part--21-模式--7-附录)
- [五、21 模式速查总表](#五21-模式速查总表)
- [六、跨来源对照：本书 × Andrew Ng × Anthropic](#六跨来源对照本书--andrew-ng--anthropic)
- [七、按用途选型决策表](#七按用途选型决策表)
- [八、系列导航索引](#八系列导航索引)
- [九、参考资料](#九参考资料)
-->

## 一、核心结论（太长不看）

1. **「Agent 设计模式」不是一个玄学概念，而是一套可复用的工程脚手架**：把 LLM 从「一次性提问、一次性回答」变成「能拆任务、能反思、能用工具、能与其他 Agent 协作」的系统。Antonio Gulli 在《Agentic Design Patterns》里把它们归纳成 **21 种核心模式 + 7 篇附录**，按「核心 → 高级 → 生产 → 企业」四层递进。
2. **核心心智模型只有一句话——「谁在掌舵」**：Anthropic 给出最被广泛引用的判据——**Workflow（工作流）是开发者预先用代码编排好的固定路径；Agent 是 LLM 自己动态决定下一步走哪、用什么工具**。所谓「设计模式」，就是介于「单次 LLM 调用」和「完全自治 Agent」之间那一整片中间地带的标准做法。
3. **三股力量在收敛**：本书的 21 模式、Andrew Ng 的 4 模式（Reflection / Tool Use / Planning / Multi-Agent）、Anthropic 的 5 工作流（Prompt Chaining / Routing / Parallelization / Orchestrator-Workers / Evaluator-Optimizer）——三者高度重叠又互为补充。**看懂这三者的对应关系（见第六节），就掌握了这套领域的话语体系**。
4. **最重要的工程直觉是「能简单就别复杂」**：Anthropic 反复强调「先找最简单的方案，不够了再加复杂度」；本书的 Planning 章也直言「当解法已经明确且可重复时，把 Agent 限制在固定工作流里更高效」。**多 Agent + MCP + Reflection 的堆叠带来的不只是能力，还有延迟、成本和新的失败面**。
5. **当前最值得重点关注的几条线**：工业层面，**MCP（工具互联标准）**、**A2A（Agent 间通信标准）**、**RAG/GraphRAG/Agentic RAG（知识接地）**、**推理模型与 Deep Research（推理扩展定律）**、**Coding Agent（最高频商业落地）** 是 2025–2026 的主战场。

> 来源：[Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) · [Andrew Ng, Agentic Design Patterns Part 1](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance) · [evoiz/Agentic-Design-Patterns 仓库](https://github.com/evoiz/Agentic-Design-Patterns)

---

## 二、先厘清一个根本问题：什么才叫「Agent」？

这个词在 2024–2026 被用得很滥。所幸业界有三股相对收敛的界定，抓住这条主线即可。

### 2.1 最被引用的一刀：Anthropic 的「Workflow vs Agent」

Anthropic 在 2024 年 12 月的《Building Effective Agents》里把所有「用 LLM 完成任务」的系统统称为 agentic systems，然后画了一条架构分界线：

| | Workflow（工作流） | Agent（智能体） |
|---|---|---|
| **谁决定流程** | 开发者用**预定义的代码路径**编排 LLM 和工具 | **LLM 自己动态决定**流程和工具用法 |
| **特点** | 可预测、一致，适合任务定义明确的场景 | 灵活、模型驱动决策，适合开放/多变任务 |
| **代价** | 灵活性有限 | 用**延迟和成本**换更高任务表现 |
| **最朴素描述** | — | Anthropic 原话：「Agent 通常就是**在循环里、基于环境反馈使用工具的 LLM**」 |

一句话总结这条判据：**agency 的本质是「谁拥有控制循环」**——单次 LLM 调用没有循环；workflow 把循环硬编码；agent 自己掌舵循环（感知状态 → 选下一步动作/工具 → 直到目标达成或触发停止条件）。

> 来源：[Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

### 2.2 2025 共识：自治 + 目标导向 + 环境交互

2025 年的文献不再执着于单一定义，而是收敛到一组属性簇：

- **自治（Autonomy）**：能在较长时间内、较少人工干预下独立运行。
- **目标导向（Goal-directedness）**：被给的是一个**目标**而非脚本，要自己拆解成多步推理与动作。
- **环境交互（Environment interaction）**：感知一个环境（工具、API、数字/物理世界）并在其中行动。
- **控制循环（Control loop）**：感知 → 决策 → 行动 的循环，常带自我纠错与规划。

一个代表性的 practitioner 定义：**「AI Agent 是一个为达成特定目标、能感知环境、做出决策并采取行动的自治系统。」** 学术上，Sapkota 等人 2025 年的综述进一步把「AI Agent（任务级模块化自动化）」与「Agentic AI（带多 Agent 协作、动态任务分解、持久记忆的范式跃迁）」做了分层。

> ⚠️ 没有唯一公认定义——这本身就是一个可引用的事实。

> 来源：[Sapkota et al., AI Agents vs. Agentic AI (arXiv:2505.10468)](https://arxiv.org/abs/2505.10468) · [Center for AI Policy — Governing Autonomy](https://www.centeraipolicy.org/work/ai-agents-governing-autonomy-in-the-digital-age) · [MIT 2025 AI Agent Index](https://aiagentindex.mit.edu/)

### 2.3 一个有用的渐进光谱

与其纠结二元划分，不如把系统看成一个**自治度阶梯**：chatbot（单轮、被动）→ workflow（开发者编排）→ agentic workflow（LLM 在结构化流程内决策）→ agent（给目标，自己搞定工具/步骤/自适应）。**本文（和本书）讨论的「设计模式」，主要分布在这条阶梯的中后段**。

> 来源：[Prompting Guide: AI Workflows vs. AI Agents](https://www.promptingguide.ai/agents/ai-workflows-vs-ai-agents)

---

## 三、为什么需要「设计模式」：GPT-3.5 套个循环就打败 GPT-4

理解 Agent 设计模式的价值，最好的入口是 Andrew Ng 2024 年 3 月在 Sequoia AI Ascent 那场演讲里给出的著名数据点（HumanEval 编程基准）：

| 配置 | 正确率 |
|---|---|
| GPT-3.5（zero-shot） | **48.1%** |
| GPT-4（zero-shot） | **67.0%** |
| GPT-3.5（套进 Agent 循环后） | **最高 95.1%** |

Ng 的原话：**「从 GPT-3.5 到 GPT-4 的提升，被引入迭代式 Agent 工作流带来的提升彻底盖过。」** 他的核心论点——**Agent 工作流带来的进步，今年可能比下一代基础模型还大**——正是「设计模式」之所以重要的根本理由：我们今天大多在用 LLM 的 zero-shot 模式，就像要求一个人「从头到尾一口气写完一篇文章、不许回退修改」。Agent 模式让 LLM 学会**迭代**。

但「让 LLM 迭代」有很多种做法，而且各有陷阱。**这就是「设计模式」要解决的问题——把已经验证有效的 Agent 编排方式沉淀成可复用的模式**，而不是每次从零摸索。

> 来源：[Andrew Ng, Four AI Agent Strategies That Improve GPT-4 and GPT-3.5 Performance](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance) · [Sequoia AI Ascent 演讲（YouTube）](https://www.youtube.com/watch?v=sal78ACtGTc)

---

## 四、本书结构：4 大 Part × 21 模式 + 7 附录

Antonio Gulli 这本书（424 页）按「从简单到复杂、从原理到生产」组织成 4 大部分。**这个分层本身就是一条学习路线**：先掌握确定性工作流原语（Part One 前 3 章），再学让系统真正「智能」的四大模式（Part One 后 4 章），然后补上状态/记忆/互联等基础设施（Part Two），最后才谈生产可靠性与企业规模（Part Three/Four）。

| Part | 主题 | 章节 | 页数（约，未确认） | 一句话定位 |
|---|---|---|---|---|
| **Part One** | Core Patterns 核心模式 | Ch 1–7 | ~103 | 最基础的「积木」：3 个确定性工作流原语 + Andrew Ng 四模式 |
| **Part Two** | Advanced Patterns 高级模式 | Ch 8–11 | ~61 | 让 Agent 有「记忆、学习、互联、目标」的基础设施 |
| **Part Three** | Production Patterns 生产模式 | Ch 12–14 | ~34 | 上生产前的「可靠性三件套」：异常恢复、人在回路、知识接地 |
| **Part Four** | Enterprise Patterns 企业模式 | Ch 15–21 | ~114 | 规模化、安全与运维：Agent 互联、资源优化、推理、护栏、评测、调度、探索 |

**附录 A–G**（~74 页）是参考资料向：高级提示工程、从 GUI 到真实环境、框架概览、AgentSpace、CLI Agent、推理引擎内幕、Coding Agent。

> 说明：页数为仓库 README 自报，未能独立核验，标注「（约）」。Part Four 在 evoiz 官方称「Enterprise Patterns」，双语版 ningg 仓库称「Multi-Agent Architectures」，二者指同一批章节（其中只有 Ch 15 严格属多 Agent，故「Enterprise Patterns」更准确）。

> 来源：[evoiz 仓库 README](https://raw.githubusercontent.com/evoiz/Agentic-Design-Patterns/main/README.md) · [ningg 双语版](https://github.com/ningg/Agentic-Design-Patterns-CN)

---

## 五、21 模式速查总表

下表是全文的索引——每个模式配一句话定义、解决什么问题、对应分篇。**先看这张表建立全局印象，再按需跳到分篇细读**。

| # | 模式 | 一句话定义 | 解决什么 | 所属 Part | 分篇 |
|---|---|---|---|---|---|
| 1 | **Prompt Chaining** | 把任务拆成一串串行 LLM 步骤，前一步输出喂给下一步 | 单大 prompt 的指令忽视/上下文漂移/幻觉 | One | [#1 核心组合](/posts/agentic-patterns-core-composition/) |
| 2 | **Routing** | 先分类输入，再路由到专门的子流程/工具/Agent | 不同输入该走不同处理 | One | [#1 核心组合](/posts/agentic-patterns-core-composition/) |
| 3 | **Parallelization** | 并发跑多个互不依赖的步骤再汇总（含投票） | 串行太慢；要多视角提置信 | One | [#1 核心组合](/posts/agentic-patterns-core-composition/) |
| 4 | **Reflection** | 让 Agent 评估并迭代改进自己的输出 | 单次生成质量不稳 | One | [#2 推理四模式](/posts/agentic-reasoning-patterns/) |
| 5 | **Tool Use / Function Calling** | 让 Agent 调外部 API/数据库/代码 | 受限于训练数据的静态知识 | One | [#2 推理四模式](/posts/agentic-reasoning-patterns/) |
| 6 | **Planning** | 让 Agent 自己规划并动态调整行动序列 | 复杂目标无法预设固定流程 | One | [#2 推理四模式](/posts/agentic-reasoning-patterns/) |
| 7 | **Multi-Agent Collaboration** | 多个专职 Agent 分工协作达成共同目标 | 单 Agent 搞不定跨域复杂任务 | One | [#2 推理四模式](/posts/agentic-reasoning-patterns/) |
| 8 | **Memory Management** | 短期上下文记忆 + 长期持久化记忆（向量库） | 跨轮/跨会话信息会丢 | Two | [#3 高级模式](/posts/agentic-advanced-patterns/) |
| 9 | **Learning & Adaptation** | Agent 根据经验数据自适应改进（RL/DPO/自改代码） | 行为写死后无法越用越聪明 | Two | [#3 高级模式](/posts/agentic-advanced-patterns/) |
| 10 | **Model Context Protocol (MCP)** | 标准化「万能插座」，让任意 LLM 接任意工具/数据 | 工具集成碎片化、不互通 | Two | [#3 高级模式](/posts/agentic-advanced-patterns/) |
| 11 | **Goal Setting & Monitoring** | 给 Agent 明确目标 + 进度跟踪 + 成功判定 | 缺目标与自我管理则无法自治 | Two | [#3 高级模式](/posts/agentic-advanced-patterns/) |
| 12 | **Exception Handling & Recovery** | 主动检测失败、缓解、恢复到稳定态 | 真实环境必然有网络/数据异常 | Three | [#4 生产模式](/posts/agentic-production-patterns/) |
| 13 | **Human-in-the-Loop (HITL)** | 在关键节点插入人的判断/审批/反馈 | 高风险场景完全自治不安全 | Three | [#4 生产模式](/posts/agentic-production-patterns/) |
| 14 | **Knowledge Retrieval (RAG)** | 检索外部知识片段拼进 prompt 再生成 | LLM 知识静态、易幻觉 | Three | [#4 生产模式](/posts/agentic-production-patterns/) |
| 15 | **Inter-Agent Communication (A2A)** | 标准化协议让不同框架的 Agent 互通任务 | 跨框架 Agent 无法协作 | Four | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| 16 | **Resource-Aware Optimization** | 按复杂度动态选模型/工具，控成本 | 一律用最强模型太贵太慢 | Four | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| 17 | **Reasoning Techniques** | CoT/ToT/ReAct/RLVR 等显式多步推理 | 复杂问题一步答不对 | Four | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| 18 | **Guardrails / Safety** | 输入校验/输出过滤/行为约束/护栏的多层防御 | 无约束自治会出有害/被攻击输出 | Four | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| 19 | **Evaluation & Monitoring** | 持续度量 Agent 有效性/效率/合规（含轨迹评估） | Agent 概率性、传统测试不够 | Four | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| 20 | **Prioritization** | 按重要性/紧急度/依赖/成本给任务排序 | 多目标多任务下资源有限 | Four | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| 21 | **Exploration & Discovery** | 主动探索、发现「未知的未知」 | 预设静态知识不足以创新 | Four | [#5 企业模式](/posts/agentic-enterprise-patterns/) |

---

## 六、跨来源对照：本书 × Andrew Ng × Anthropic

这三套来源是 Agent 设计模式领域被引用最多的「话语体系」。**它们高度重叠又各有侧重，搞清楚对应关系，读任何一篇相关文章都不会迷路**。

### 6.1 三来源定位差异

| 来源 | 时间 | 侧重点 | 数量 |
|---|---|---|---|
| **Andrew Ng** | 2024-03 | 强调「迭代工作流」比换更强模型更值钱；面向**能驱动进步的少数关键模式** | **4 模式** |
| **Anthropic** | 2024-12 | 工程实战导向；区分 workflow/agent；强调**最简方案优先** | **5 工作流 + agent 循环** |
| **本书（Gulli）** | 2025–2026 | 最全面系统；从核心积木一路覆盖到企业运维与科研前沿 | **21 模式 + 7 附录** |

### 6.2 模式级对应表

| 本书模式 | Andrew Ng 四模式？ | Anthropic 框架？ | 关系说明 |
|---|---|---|---|
| 1 Prompt Chaining | — | **Workflow: Prompt chaining** | 完全对应 |
| 2 Routing | — | **Workflow: Routing** | 完全对应 |
| 3 Parallelization | — | **Workflow: Parallelization**（含 Sectioning/Voting 两变体） | 完全对应 |
| 4 Reflection | **✅ Reflection** | **Workflow: Evaluator-Optimizer** | 同一模式不同名（本书叫 Producer–Reviewer） |
| 5 Tool Use | **✅ Tool Use** | 增强型 LLM 的核心能力 / agent 的基石 | 对应 |
| 6 Planning | **✅ Planning** | 归入「Agent」+ Orchestrator-Workers | Anthropic 不单列 Planning |
| 7 Multi-Agent | **✅ Multi-Agent** | 「Agent」/ Orchestrator-Workers | Anthropic 不单列 Multi-Agent |
| 8–11 Memory/Learning/MCP/Goal | — | 基础设施层（增强型 LLM 的 retrieval/tools/memory） | 本书更细 |
| 12–14 异常/HITL/RAG | — | 生产可靠性（HITL、RAG 散见其附录） | 本书更系统 |
| 15–21 A2A 等 | — | 企业规模与运维 | 本书独有的大块 |

> 来源：[Andrew Ng 四模式系列](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection) · [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) · [evoiz/Agentic-Design-Patterns](https://github.com/evoiz/Agentic-Design-Patterns)

### 6.3 一个易混点：Andrew Ng 的「成熟度排序」

Ng 多次表态：**Reflection 与 Tool Use 在生产里已经相当可靠；Planning 与 Multi-Agent「很强大但不那么成熟、更难预测」**。这个排序对选型很有参考价值——别一上来就堆 Planning + Multi-Agent，先用 Reflection/Tool Use 落地。

---

## 七、按用途选型决策表

带着具体问题来时，先定位「你要解决的属哪一类」，再跳对应分篇。

| 你的诉求 | 推荐先看的模式 | 跳转分篇 |
|---|---|---|
| **任务能拆成固定几步串行，但单次 LLM 总做不好** | Prompt Chaining（必要时加 Routing 分流） | [#1 核心组合](/posts/agentic-patterns-core-composition/) |
| **不同输入该走不同处理（客服分流、简单/复杂分流）** | Routing | [#1 核心组合](/posts/agentic-patterns-core-composition/) |
| **要快、或多视角投票提置信** | Parallelization | [#1 核心组合](/posts/agentic-patterns-core-composition/) |
| **想让输出质量更高、能自我纠错** | Reflection（Producer–Reviewer） | [#2 推理四模式](/posts/agentic-reasoning-patterns/) |
| **Agent 要查实时数据/调 API/执行代码** | Tool Use / Function Calling | [#2 推理四模式](/posts/agentic-reasoning-patterns/) |
| **目标复杂、步骤无法预设** | Planning（但先问「解法是否已知」，已知则退回工作流） | [#2 推理四模式](/posts/agentic-reasoning-patterns/) |
| **单 Agent 搞不定、要分工** | Multi-Agent Collaboration | [#2 推理四模式](/posts/agentic-reasoning-patterns/) |
| **要跨轮/跨会话记住信息** | Memory Management | [#3 高级模式](/posts/agentic-advanced-patterns/) |
| **要统一接一堆工具/数据源** | MCP | [#3 高级模式](/posts/agentic-advanced-patterns/) |
| **要让 Agent 有目标、能自评** | Goal Setting & Monitoring | [#3 高级模式](/posts/agentic-advanced-patterns/) |
| **Agent 一报错就崩** | Exception Handling & Recovery | [#4 生产模式](/posts/agentic-production-patterns/) |
| **高风险场景要人审一道** | Human-in-the-Loop | [#4 生产模式](/posts/agentic-production-patterns/) |
| **要基于私有/实时知识回答** | RAG（含 GraphRAG / Agentic RAG） | [#4 生产模式](/posts/agentic-production-patterns/) |
| **要让不同框架的 Agent 互通** | A2A（配合 MCP） | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| **要降本、按难度选模型** | Resource-Aware Optimization | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| **要更强推理、做 Deep Research** | Reasoning Techniques | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| **要防 prompt 注入/越狱/有害输出** | Guardrails / Safety | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| **要持续度量 Agent 表现** | Evaluation & Monitoring | [#5 企业模式](/posts/agentic-enterprise-patterns/) |
| **想了解提示工程 / 框架选型 / CLI 与 Coding Agent** | 附录 A–G | [#6 附录](/posts/agentic-patterns-appendices/) |

一句话总原则：**永远先问「这是 workflow 还是 agent 问题」——解法已知就用最简单的工作流，解法未知才上 Planning/Agent；每多加一层模式，都要为它带来的延迟、成本和失败面买单。**

---

## 八、系列导航索引

本系列共 **7 篇**（含本总览）。建议阅读顺序：先读本篇建立全局，再按 Part 顺序读分篇。

| # | 标题 | 覆盖 | 链接 |
|---|---|---|---|
| 0 | **系列总览（本文）** | 全景图 + 跨来源对照 + 选型决策 + 导航 | 本文 |
| 1 | **核心组合模式** | Ch 1–3：Prompt Chaining、Routing、Parallelization | [《Agentic 设计模式（一）：Prompt Chaining / Routing / Parallelization》](/posts/agentic-patterns-core-composition/) |
| 2 | **推理四模式** | Ch 4–7：Reflection、Tool Use、Planning、Multi-Agent（Andrew Ng 经典四模式） | [《Agentic 设计模式（二）：Reflection / Tool Use / Planning / Multi-Agent》](/posts/agentic-reasoning-patterns/) |
| 3 | **高级模式** | Ch 8–11：Memory、Learning & Adaptation、MCP、Goal Setting | [《Agentic 设计模式（三）：Memory / Learning / MCP / Goal Setting》](/posts/agentic-advanced-patterns/) |
| 4 | **生产模式** | Ch 12–14：Exception Handling、Human-in-the-Loop、RAG | [《Agentic 设计模式（四）：异常恢复 / 人在回路 / RAG》](/posts/agentic-production-patterns/) |
| 5 | **企业模式** | Ch 15–21：A2A、Resource Optimization、Reasoning、Guardrails、Evaluation、Prioritization、Exploration | [《Agentic 设计模式（五）：A2A / Resource / Reasoning / Guardrails / Eval / Prioritization / Exploration》](/posts/agentic-enterprise-patterns/) |
| 6 | **附录参考** | 附录 A–G：高级提示、GUI→真实环境、框架概览、AgentSpace、CLI、推理引擎内幕、Coding Agent | [《Agentic 设计模式（六）：附录 A–G 速览》](/posts/agentic-patterns-appendices/) |

---

## 九、参考资料

**原书与仓库**

- [evoiz/Agentic-Design-Patterns（官方仓库，含完整 PDF + notebook）](https://github.com/evoiz/Agentic-Design-Patterns) · [README（目录结构）](https://raw.githubusercontent.com/evoiz/Agentic-Design-Patterns/main/README.md)
- [xindoo/agentic-design-patterns（中文翻译版，仍 pending review）](https://github.com/xindoo/agentic-design-patterns) · [在线阅读](https://adp.xindoo.xyz/)
- [ningg/Agentic-Design-Patterns-CN（双语批注版）](https://github.com/ningg/Agentic-Design-Patterns-CN)

**Andrew Ng 四模式系列**

- [Part 1：四模式总览与 GPT-3.5/GPT-4 基准](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance)
- [Part 2：Reflection](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection) · [Part 3：Tool Use](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-3-tool-use) · [Part 4：Planning](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-4-planning) · [Part 5：Multi-Agent Collaboration](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-5-multi-agent-collaboration)
- [Sequoia AI Ascent 演讲（YouTube）](https://www.youtube.com/watch?v=sal78ACtGTc)

**Anthropic**

- [Building Effective Agents（workflow vs agent、五大工作流、agent 循环）](https://www.anthropic.com/research/building-effective-agents)

**Agent 定义与分类**

- [Sapkota et al., AI Agents vs. Agentic AI: A Conceptual Taxonomy (arXiv:2505.10468)](https://arxiv.org/abs/2505.10468)
- [Prompting Guide: AI Workflows vs. AI Agents](https://www.promptingguide.ai/agents/ai-workflows-vs-ai-agents) · [MIT 2025 AI Agent Index](https://aiagentindex.mit.edu/)

**姊妹篇**

- [《Agentic 设计模式（一）：Prompt Chaining / Routing / Parallelization》](/posts/agentic-patterns-core-composition/)
- [《Agentic 设计模式（二）：Reflection / Tool Use / Planning / Multi-Agent》](/posts/agentic-reasoning-patterns/)
- [《Agentic 设计模式（三）：Memory / Learning / MCP / Goal Setting》](/posts/agentic-advanced-patterns/)
- [《Agentic 设计模式（四）：异常恢复 / 人在回路 / RAG》](/posts/agentic-production-patterns/)
- [《Agentic 设计模式（五）：企业级七模式》](/posts/agentic-enterprise-patterns/)
- [《Agentic 设计模式（六）：附录 A–G 速览》](/posts/agentic-patterns-appendices/)
