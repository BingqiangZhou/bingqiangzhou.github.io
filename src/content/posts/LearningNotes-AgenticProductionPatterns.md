---
title: 【学习笔记】Agentic 设计模式（四）：异常恢复 / 人在回路 / RAG 生产可靠性三件套
published: 2026-07-01
description: 深入讲解 Antonio Gulli《Agentic Design Patterns》第 12–14 章的生产可靠性模式——Exception Handling and Recovery（错误检测-处理-恢复三阶段，并与 Reflection 组合的「失败即反思重试」）、Human-in-the-Loop（人工监督/干预/反馈/决策增强/协作/升级六方面，以及 scalability 是首要短板 + Human-on-the-loop 变体）、Knowledge Retrieval RAG（embedding/分块/混合检索/向量库管线 + GraphRAG 知识图谱变体 + Agentic RAG 主动推理变体），给出机制、适用场景、陷阱与「上生产前」的工程要点
lang: zh
tags: [学习笔记]
abbrlink: agentic-production-patterns
---

> 整理日期：2026-07-01
> 涵盖范围：Exception Handling & Recovery、Human-in-the-Loop、Knowledge Retrieval (RAG)（本书 Part Three Ch 12–14）
> 说明：这是 [Agentic 设计模式系列总览](/posts/agentic-design-patterns-overview/) 的第四篇分篇。这一层是**上生产前的「可靠性三件套」**——demo 里能跑的 Agent 一进真实环境就会撞上网络异常、数据缺失、高风险决策、知识过时。本篇讲怎么让它扛得住。内容基于本书英文原书（经 `xindoo` 中文版核实）。标注「（未确认）」处以英文原书为准。

<!--
## 目录
- [一、核心结论（太长不看）](#一核心结论太长不看)
- [二、为什么「生产模式」是独立的一层](#二为什么生产模式是独立的一层)
- [三、Exception Handling & Recovery：让 Agent 扛得住失败](#三exception-handling--recovery让-agent-扛得住失败)
- [四、Human-in-the-Loop (HITL)：把人插进关键节点](#四human-in-the-loop-hitl把人插进关键节点)
- [五、Knowledge Retrieval (RAG)：给 Agent 接地外部知识](#五knowledge-retrieval-rag给-agent-接地外部知识)
- [六、三模式横向对比](#六三模式横向对比)
- [七、按用途选型决策表](#七按用途选型决策表)
- [八、参考资料](#八参考资料)
-->

## 一、核心结论（太长不看）

1. **这一层专治「demo 能跑、上生产就崩」**：真实环境里 Agent 必然撞上网络瞬断、DB 宕机、非法输入、验证码、坏文件；高风险领域（医疗/金融/法律）完全自治不安全；LLM 知识静态、易幻觉。这三个模式分别治「会失败」「不安全」「不知道」。
2. **Exception Handling 三阶段：检测 → 处理 → 恢复**。检测靠监控（格式错、API 错误码、异常延迟、不连贯响应）；处理靠日志/重试（带退避和调参）/回退/优雅降级/通知；恢复靠状态回滚/诊断/自纠重规划/升级。⚠️ **无脑「重试到死」会浪费资源或加重限流**——重试要带退避。本书还指出它与 [Reflection（Ch4）](/posts/agentic-reasoning-patterns/) 常组合：失败即反思、改 prompt 重试。
3. **HITL 六方面：人工监督、干预纠正、反馈供学习（RLHF 式）、决策增强（AI 建议、人决策）、人机协作、升级策略**。⚠️ 本书明示**首要短板是可扩展性差**——操作员盯不过来百万级任务，通常靠「自动化上规模 + HITL 保精度」的混合解。还有个有用的变体 **Human-on-the-loop**（人定总策略、AI 实时执行）。
4. **RAG 把 LLM 从「闭卷」变「开卷」**：查询 → 语义检索外部知识库 → 把检索片段拼进 prompt → 生成接地答案。底层概念是 embedding、语义相似度、分块、检索（向量/BM25 关键词/混合）、向量库。⚠️ **碎片化信息**是核心陷阱——答案散落多块时检索容易漏上下文。
5. **RAG 的两个进阶变体很关键**：**GraphRAG**（用知识图谱替代向量，擅长跨文档综合，但贵且复杂）、**Agentic RAG**（加一层推理 Agent，做信源核验、冲突调和、多步推理、缺口检测，代价是更贵更慢、Agent 本身可能成新错误源）。

> 来源：[xindoo 中文版 Ch12–14](https://github.com/xindoo/agentic-design-patterns) · [RAG 经典论文 Lewis et al. 2020 (arXiv:2005.11401)](https://arxiv.org/abs/2005.11401)

---

## 二、为什么「生产模式」是独立的一层

| | 前三层（Ch 1–11） | 本层（Ch 12–14） |
|---|---|---|
| **环境** | 假设环境相对友好 | 真实生产环境：会失败、有风险、知识会过时 |
| **目标** | 让 Agent 能力更强 | 让 Agent **可靠、安全、接地** |
| **哲学** | 性能与能力 | 韧性、可控性、事实性 |
| **没它会怎样** | 能 demo | 一上生产就崩 / 出事 / 胡说 |

一句话：**前三层管「能做什么」，本层管「做得稳、做得安全、做得有据」**。Anthropic 在其 agent 文章里也反复强调——agent 在每一步都要从环境获取「ground truth（地面真相）」来评估进度，而本层的三模式正是保证这种 ground truth 可得、可信、可控的工程手段。

> 来源：[Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

---

## 三、Exception Handling & Recovery：让 Agent 扛得住失败

### 3.1 定义与机制

**定义**：让 Agent 主动检测运行失败、用缓解策略响应、并恢复到稳定运行状态，而不是一出错就崩。

**机制（三阶段）**：

| 阶段 | 做什么 | 手段 |
|---|---|---|
| **① 错误检测** | 监控失败信号 | 格式错的工具输出、API 错误码（404/500）、异常延迟、不连贯响应 |
| **② 错误处理** | 响应与缓解 | 日志、重试（有时调参）、回退到替代方法、优雅降级（部分功能）、通知人/其他 Agent |
| **③ 恢复** | 恢复稳定运行 | 状态回滚、诊断分析、自纠/重规划、升级 |

本书的 ADK 示例：构建一个带 `primary_handler`、`fallback_handler`（检查 `state["primary_location_failed"]`）、`response_agent` 的 `SequentialAgent`。

### 3.2 与 Reflection 的组合（实用交叉引用）

本书明确点出：本模式常与 **Reflection（Ch4）** 组合——如果首次尝试抛异常，**Reflection 分析失败原因并用改进的 prompt 重试**。这是一个很好的「跨章节联动」例证，写笔记时值得强调。

### 3.3 适用场景

Agent 在真实环境里必然撞上的瞬态失败：网络、DB 宕机、非法输入、验证码、坏文件。没有结构化处理，系统会脆且整体崩溃；本模式把脆弱系统变韧性系统。

### 3.4 陷阱与权衡

- ⚠️ **无脑「重试到死」**会浪费资源或加重限流——重试要带退避（backoff）和参数调整。
- **回退/优雅降级会静默降质**——用户可能不知道拿到的是降级答案。
- 恢复逻辑本身若不测，会引入**新的失败面**。

> 来源：[xindoo 中文版 Chapter 12: Exception Handling and Recovery](https://github.com/xindoo/agentic-design-patterns)

---

## 四、Human-in-the-Loop (HITL)：把人插进关键节点

### 4.1 定义与机制

**定义**：战略性地把人的判断、监督和反馈整合进 AI 工作流，处理那些完全自治不安全或不可行的复杂、模糊、高风险场景。

**机制（六方面）**：

1. **人工监督**（靠日志/仪表盘监控）；
2. **干预与纠正**（人修错误、补缺失数据）；
3. **人工反馈供学习**（RLHF 式偏好数据）；
4. **决策增强**（AI 建议、人决策）；
5. **人机协作**（共同解题）；
6. **升级策略**（定义好的交接协议）。

ADK 示例用一个 `escalate_to_human` 工具和一个把客户上下文作为 system message 注入的 `personalization_callback`。

### 4.2 一个有用变体：Human-on-the-loop

值得记的区分——**Human-on-the-loop**：人设定总策略/政策，AI 处理实时操作来执行它们（如交易规则、客服路由）。这与「每个动作都等人批」的传统 HITL 不同，更可扩展。

### 4.3 适用场景

LLM 缺乏创造力、常识和细致道德推理；高风险领域（医疗、金融、法律、量刑）完全自治有严重安全/财务/伦理风险。HITL 是内容审核（边界案例人工审）、自动驾驶（罕见情况交接）、欺诈检测（分析师裁定）、RLHF 标注的主流部署范式。

### 4.4 陷阱与权衡（本书明示）

- ⚠️ **可扩展性差是首要短板**——操作员盯不过来百万级任务，迫使「质量 vs 体量」权衡，通常用混合解（自动化上规模 + HITL 保精度）。
- 效果严重依赖**操作员的领域专长**——识别细微代码错误需要熟练开发者；标注员可能要专门训练。
- **隐私问题**——敏感信息暴露给人之前要脱敏，增加流程复杂度。

> 来源：[xindoo 中文版 Chapter 13: Human-in-the-Loop](https://github.com/xindoo/agentic-design-patterns)

---

## 五、Knowledge Retrieval (RAG)：给 Agent 接地外部知识

### 5.1 定义与机制

**定义**：把 LLM 连到外部知识源，检索相关片段并在生成前拼进 prompt——把 LLM 从「闭卷考生」变「开卷推理者」。

**机制（标准管线）**：查询 → 对外部知识库做**语义检索** → 把检索到的「块」拼进 prompt（增强）→ LLM 生成接地答案。

**底层概念（本书深入讲）**：**embedding**（捕获语义的数值向量）、**语义相似度与距离**、**文档分块**（chunking，把大文档切成可管理的块）、**检索**（向量检索、BM25 关键词排序、**混合检索**）、**向量数据库**（Pinecone、Weaviate、Chroma、Milvus、Qdrant；Postgres 用 pgvector；FAISS/ScaNN 库；HNSW 索引算法）。

### 5.2 解决什么

LLM 知识静态、限于训练数据——访问不了实时/私有/领域专属信息，导致过时或幻觉答案。RAG 让响应接地于可验证数据，并支持引用。

### 5.3 两个进阶变体（写笔记重点）

| 变体 | 做法 | 擅长 | 代价 |
|---|---|---|---|
| **GraphRAG** | 用**知识图谱**（节点=实体、边=关系）替代向量；跨文档综合碎片信息 | 复杂互联推理（金融分析、基因 - 疾病发现） | 贵、复杂、需专家建图、灵活性低、延迟高，质量完全取决于图谱完整性 |
| **Agentic RAG** | 加一层推理「Agent」主动评估检索数据 | 信源核验（2025 政策优先于 2020 博客）、冲突调和（终报优先于初稿）、多步推理（把比较查询拆子查询）、缺口检测（KB 没有就调外部工具如实时网搜） | 复杂度/成本/延迟显著升高；Agent 本身可能成新错误源（推理循环错、丢相关信息） |

### 5.4 陷阱与权衡

- ⚠️ **碎片化信息**——答案散落多块/多文档时，检索器可能漏上下文 → 答案不完整。
- 检索质量高度依赖**分块与检索**；无关块注入噪声混淆 LLM。
- **综合矛盾信源**仍难。
- 需要把整个知识库**预处理并存储**进专用 DB，还要**持续更新**——运维工作量大、增延迟/成本/token。

> 来源：[xindoo 中文版 Chapter 14: Knowledge Retrieval (RAG)](https://github.com/xindoo/agentic-design-patterns) · [RAG 经典论文 (arXiv:2005.11401)](https://arxiv.org/abs/2005.11401)

---

## 六、三模式横向对比

| 维度 | Exception Handling | HITL | RAG |
|---|---|---|---|
| **解决什么** | 真实环境必然有失败 | 完全自治高风险不安全 | 知识静态易幻觉 |
| **核心动作** | 检测 - 处理 - 恢复 | 把人插关键节点 | 检索外部知识接地 |
| **本质属性** | 韧性 | 可控性 | 事实性 |
| **最大陷阱** | 无脑重试/降级静默 | 可扩展性差 | 碎片化信息漏上下文 |
| **常与谁组合** | Reflection（失败即反思重试） | Guardrails、Goal Setting | Memory（知识库即长期记忆） |

> 来源：[xindoo 中文版 Ch12–14](https://github.com/xindoo/agentic-design-patterns)

---

## 七、按用途选型决策表

| 你的用途 | 推荐方案 |
|---|---|
| **Agent 一报错就崩** | Exception Handling（检测 - 处理 - 恢复三阶段，重试带退避） |
| **失败后想自动诊断改进** | Exception Handling + Reflection 组合 |
| **高风险决策要人审一道** | HITL（决策增强型：AI 建议、人决策） |
| **要规模化的「人参与」** | Human-on-the-loop（人定策略、AI 实时执行） |
| **要基于私有/实时知识回答** | RAG（标准管线） |
| **答案散落多文档、要跨文档综合** | GraphRAG（知识图谱） |
| **要核验信源、调和冲突、补缺口** | Agentic RAG（推理层，代价更高更慢） |
| **要带引用、可验证** | RAG（检索片段可溯源） |

一句话总原则：**生产可靠性 = 韧性（Exception Handling）+ 可控（HITL）+ 事实（RAG）；三者按你的失败模式、风险敞口、知识时效性来配，缺哪条就会在对应的维度上翻车。**

---

## 八、参考资料

**原书与翻译**

- [evoiz/Agentic-Design-Patterns（官方仓库）](https://github.com/evoiz/Agentic-Design-Patterns) · [xindoo 中文翻译版](https://github.com/xindoo/agentic-design-patterns)

**RAG 与对照**

- [RAG 经典论文 Lewis et al. 2020 (arXiv:2005.11401)](https://arxiv.org/abs/2005.11401)
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

**姊妹篇**

- 系列总览：[《Agentic Design Patterns 系列总览》](/posts/agentic-design-patterns-overview/)
- 上篇：[《（三）：Memory / Learning / MCP / Goal Setting》](/posts/agentic-advanced-patterns/)
- 下篇：[《（五）：企业级七模式》](/posts/agentic-enterprise-patterns/)
