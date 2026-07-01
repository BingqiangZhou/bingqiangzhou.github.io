---
title: 【学习笔记】Karpathy 的 LLM Wiki：让 LLM 帮你构建会"复利"的个人知识库
published: 2026-07-01
description: 整理 Andrej Karpathy 2026 年 4 月发布的 LLM Wiki 模式——一套用 LLM 增量构建和维护个人知识库的方法论。核心是抛弃 RAG"每次从零检索"的范式，转而让 LLM 把知识只编译一次、持续整合进一个持久、会复利增长的 markdown wiki。覆盖三层架构（raw / wiki / schema）、三大操作（Ingest / Query / Lint）、index.md 与 log.md 的设计技巧、以及社区把它做成 Claude Code / Codex / Cursor skill 的实现
lang: zh
tags: [学习笔记]
abbrlink: karpathy-llm-wiki
---

> 整理日期：2026-07-01
> 来源：[Andrej Karpathy 的 GitHub Gist《llm-wiki》（2026-04）](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
> 一句话：**不要让 LLM 每次都从零检索你的资料，而要让它在读资料时就把知识"编译"进一个持久的、会复利增长的 wiki。你读，LLM 写。**

## 一、核心结论（太长不看）

1. **Karpathy 这篇 gist 提出的不是工具，而是一个范式**：把"用 LLM 处理文档"从 RAG 式的「查询时检索」改造成「摄入时编译」——每加一个新资料，LLM 就把它的关键信息整合进现有 wiki，而不是建索引留待以后检索。
2. **关键洞察是"记账成本"**：维护知识库累人的地方不是读和想，而是更新交叉引用、保持摘要最新、标注矛盾、维护几十个页面一致性。人会抛弃 wiki，因为**维护成本增长得比价值快**。LLM 不会无聊、不会忘更新交叉引用、一次能改 15 个文件——所以 wiki 能保持维护，是因为**维护成本趋近于零**。
3. **分工很彻底——你读，LLM 写**：你负责策展资料、引导分析、问好问题、思考意义；LLM 负责总结、交叉引用、归档、记账等全部脏活。Karpathy 的原话比喻：「Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase.」
4. **结果是一个会复利的知识产物**：The wiki is a persistent, compounding artifact。知识只编译一次，然后保持最新，而不是每次查询都重新推导。
5. **已经有人在 GitHub 上把它做成 Claude Code / Codex / Cursor 的 skill**——本笔记末尾列了主要实现。

## 二、先理解它要解决什么问题：RAG 为什么"不复利"

大多数人现在用 LLM 处理文档的方式都像 RAG（Retrieval-Augmented Generation）：

```
上传文件 → 建索引/embedding → 查询时检索相关片段 → 生成答案
```

Karpathy 点出这种范式的根本问题：**LLM 每次都在从零重新发现知识，没有积累。**

打个比方：这就像你有一个堆满原始论文的书房，每次有人提问，你都要重新通读相关论文、重新提炼结论。你读了 100 篇论文和读了 1 篇，对 LLM 来说没有区别——因为知识没有被"固化"下来，每次查询都是一次性的推理。

LLM Wiki 的方案反过来：**在摄入资料时就完成"编译"**。每加一篇新论文，LLM 立刻读完它、提取要点、跟现有 wiki 里的知识做交叉验证、更新相关的实体页和概念页、标注新旧数据的矛盾。这样你的 wiki 就是一个**持续增长、持续被维护的知识总和**，查询时直接读 wiki 而不是检索原始资料。

## 三、三层架构：Raw / Wiki / Schema

Karpathy 把整个系统分成三层，每一层有明确的"所有权"：

| 层 | 内容 | 谁拥有 | 可变性 |
|---|---|---|---|
| **Raw sources（原始资料）** | 你精心策展的来源——文章、论文、图片、数据集 | 你的事实来源 | **不可变**，LLM 只读不写 |
| **The wiki** | LLM 生成的 markdown 文件——摘要页、实体页、概念页、对比表、综述、综合判断 | **LLM 完全拥有** | 你读，LLM 写 |
| **The schema（配置文件）** | 一个文档（Claude Code 的 `CLAUDE.md` / Codex 的 `AGENTS.md`），告诉 LLM wiki 的结构、命名约定、工作流 | 你和 LLM 共同迭代 | 持续演进 |

### 3.1 Raw 层：不可变的事实来源

这一层是你收集的原始资料，**LLM 只读不写**。它代表了你的"事实底座"——所有 wiki 里的论断都应该能追溯到 raw 层的某个来源。这保证了 wiki 的可信度：如果 LLM 的某个综合判断有问题，你可以回到 raw 层核对。

Karpathy 强调 raw 层的关键是**策展（curation）**——不是什么都往里塞，而是你判断值得纳入的来源。这是人不可替代的职责之一。

### 3.2 Wiki 层：LLM 完全拥有的知识产物

这是整套系统的核心。Wiki 是一坨**结构化、互相链接**的 markdown 文件，类型大致包括：

- **摘要页（summary）**：一篇资料的核心要点提炼
- **实体页（entity）**：一个具体对象（人物、产品、公司、技术）的累积档案
- **概念页（concept）**：一个主题/理论/方法的综合论述
- **对比页（comparison）**：多个对象的横向对比表
- **综述页（synthesis）**：跨多篇资料的综合判断

关键点：**你几乎不自己写 wiki，全是 LLM 写和维护**。你的角色是浏览、质疑、引导，而不是动手写。Karpathy 的工作流是一边开着 LLM agent（Claude Code/Codex），一边开着 Obsidian——LLM 根据对话改 wiki，他实时在 Obsidian 里浏览：跟链接、看 graph view、读更新后的页面。

### 3.3 Schema 层：CLAUDE.md / AGENTS.md

这一层是一个配置文件，告诉 LLM「这个 wiki 长什么样、文件怎么命名、遇到新资料该怎么处理」。它是你和 LLM 共同迭代的"宪法"。Karpathy 把整个 gist 本身就看成一份可以直接 copy-paste 进 `CLAUDE.md` 的 schema。

## 四、三大操作：Ingest / Query / Lint

整个 wiki 的生命周期围绕三个核心操作展开。

### 4.1 Ingest（摄入）：知识进入 wiki 的入口

你丢一个新资料给 LLM，触发一次 ingest。LLM 会：

1. **读完资料**，跟你讨论要点（确认理解对齐）
2. 在 wiki 里**写一篇摘要页**
3. **更新 `index.md`**，登记这个新页
4. **更新相关的实体页/概念页**——一篇资料可能牵动 10–15 个页面的修改
5. 在 **`log.md`** 里追加一条记录

Ingest 是 wiki 增长的主引擎。每做一次 ingest，wiki 就变得更厚、更互联、更接近你的"知识总和"。

### 4.2 Query（查询）：把探索也变成复利

你向 LLM 提问，它搜相关页、读、综合出一个带引用的答案。答案的形态很灵活——可以是 markdown 段落、对比表、Marp 幻灯片、甚至 matplotlib 图表。

这里有个关键设计：**好的查询答案要回填进 wiki 当新页**。这样连"探索"本身都能复利——你问过的每个好问题、得到过的每个好答案，都不会消失，而是沉淀成 wiki 的一部分。

### 4.3 Lint（体检）：保证 wiki 长大了也不烂

定期让 LLM 对整个 wiki 做健康检查，找这些问题：

- **矛盾**：两个页面针对同一事实给出不同结论
- **过期论断**：被新资料推翻但还没更新的旧判断
- **孤儿页（orphan）**：没有任何链接指向的页面
- **缺页**：index 提到但实际不存在的页
- **缺交叉引用**：本该互链却没链接的页面

Lint 是这套系统能长期可持续的关键——它把"维护"自动化了，所以 wiki 不会随着规模增长而腐化。

## 五、两个特殊文件：index.md 与 log.md

Karpathy 特意强调了这两个文件的"元数据"角色——它们让整个 wiki 可导航、可审计。

### 5.1 index.md（按内容组织的目录）

整个 wiki 的总目录，每页一条，格式大致是：

```
- [[实体页: GPT-4]] | OpenAI 2023 年发布的多模态旗舰模型 | 更新: 2026-04-15
- [[概念页: 测试时计算]] | 推理时分配更多算力以提升答案质量 | 更新: 2026-04-20
```

LLM 每次做 ingest 都会更新 index。查询时，LLM 的策略是**先读 index 定位相关页，再钻进去读具体内容**——而不是把整个 wiki 都塞进上下文。

Karpathy 的一个重要发现：**在中等规模（约 100 个来源、几百个页面）下，光靠 index + 直接读 markdown，竟然就够用了，不需要 embedding/RAG 基础设施**。这大幅降低了实现门槛。

### 5.2 log.md（按时间组织的流水）

一个 append-only 的事件日志，记录每次 ingest / query / lint：

```
## [2026-04-02] ingest | Attention Is All You Need 论文
## [2026-04-03] query | 比较 Transformer 与 Mamba 的长序列表现
## [2026-04-05] lint | 修复 3 处矛盾、补 2 个孤儿页链接
```

一个实用技巧：每条用统一前缀（如 `## [日期] 类型 | 标题`），就能用 unix 命令快速解析，例如 `grep "^## \[" log.md | tail -5` 看最近 5 次操作。这让整个 wiki 的演进史变得可审计、可回溯。

## 六、为什么这套方案"现在"能成：一个历史脉络

Karpathy 特意把这个想法追溯到 1945 年 Vannevar Bush 的 **Memex** 设想——一种个人化的、主动策展、文档之间有关联轨迹（trails）的知识存储设备。Bush 当年设想的 Memex 一直没真正实现，核心障碍是**"谁来维护那些关联轨迹"**——靠人手动维护成本太高，没人坚持得下去。

LLM 恰好解决了这个 80 年悬而未决的问题：

> 维护知识库累人的地方不是读和想，是记账。人会抛弃 wiki，因为维护成本增长得比价值快。LLM 不会无聊、不会忘更新交叉引用、一次能改 15 个文件。**wiki 能保持维护，是因为维护成本趋近于零。**

这是整套方案的"第一性原理"——不是 LLM 比人更聪明，而是它把**维护的边际成本压到了几乎为零**，从而让"持续维护的知识库"第一次在经济上成立。

## 七、分工：人与 LLM 各干什么

Karpathy 把职责切得很干净，值得单独拎出来：

| 角色 | 人 | LLM |
|---|---|---|
| **策展资料** | ✅ 决定什么值得纳入 raw 层 | ❌ |
| **引导分析方向** | ✅ 提出关心的角度、追问 | 辅助 |
| **问好问题** | ✅ 核心人的价值 | ❌ |
| **思考意义与判断** | ✅ 质疑、校准 | 辅助 |
| **写摘要/实体页/概念页** | ❌ | ✅ |
| **维护交叉引用** | ❌ | ✅ |
| **标注矛盾/更新过期论断** | 质疑触发 | ✅ 执行 |
| **维护 index / log** | ❌ | ✅ |
| **lint 体检** | 触发 | ✅ 执行 |

一句话：**人负责"输入"（资料、问题、判断），LLM 负责"输出"和"维护"（写 wiki、记账、体检）。** 这也呼应了标题里说的"输入输出系统"——人是输入端，wiki 是输出端，LLM 是中间那台持续运转的编译器。

## 八、社区实现：已经有人做成 Claude Code / Codex / Cursor 的 skill

这篇 gist 发布后迅速引爆（评论区 5000+ star），社区把它包装成各种可直接用的 skill / 插件：

| 项目 | 形态 | 支持 |
|---|---|---|
| **[Astro-Han/karpathy-llm-wiki](https://github.com/Astro-Han/karpathy-llm-wiki)** | 通用 Agent Skill，带引用和 linting | Claude Code / Cursor / Codex |
| **[praneybehl/llm-wiki-plugin](https://github.com/praneybehl/llm-wiki-plugin)** | Claude Code 插件 | Claude Code（也兼容 Codex / OpenCode / Cursor / Gemini CLI） |
| **[neusse/codex-karpathy-llm-wiki-skills](https://www.awesomeskills.dev/en/skill/neusse-codex-karpathy-llm-wiki-skills)** | Codex 专用 skills | Codex / Claude Code / Cursor |
| **[Benboerba620/karpathy-claude-wiki](https://github.com/Benboerba620/karpathy-claude-wiki)** | 用户策展、LLM 维护 | Claude Code |
| **[projectbrain.md](https://projectbrain.md/)** | Git 原生的开放标准 | 跨工具 |
| **Obsidian 官方插件（karpathywiki）** | Obsidian 插件，多页知识生成 | Obsidian |

另外 Karpathy 自己推荐了一个配套工具 **qmd**——一个本地 markdown 搜索引擎（BM25 + 向量混合 + LLM 重排，带 CLI 和 MCP server），适合在 wiki 长大后做更精准的查询定位。

## 九、我的几点思考与实践提示

把这套方法论套到自己的工作流上时，有几个点值得注意：

1. **门槛最低的起点是"一个目录 + 一个 CLAUDE.md"**。不需要 Obsidian、不需要向量库——先建个 `wiki/` 目录、写个 `CLAUDE.md` 定义 ingest/query/lint 流程，丢两三篇资料进去跑通闭环，再谈扩展。Karpathy 反复强调中等规模下 index + 直读就够用。

2. **raw 层的策展质量决定 wiki 上限**。LLM 只能在你给的资料上做综合，"垃圾进垃圾出"依然成立。花在挑资料上的时间，比花在调 prompt 上更值。

3. **query 回填 wiki 是复利的关键开关**。很多人会漏掉这步——如果问完就丢，wiki 还是只靠 ingest 单引擎增长。养成"好答案回写成页"的习惯，探索本身才会复利。

4. **lint 要定期做，但别过度**。wiki 还小的时候 lint 几乎没东西可查；等长到几十上百页再开始周期性体检，主要抓矛盾和孤儿页。

5. **本博客其实天然适合套这套模式**。Jekyll/Astro 的 markdown 笔记站本身就是个 wiki——可以把某个目录（如 `_notes/` 或现有的 `src/content/posts/`）当 wiki 层、原始资料放 `raw/`、再写个 `CLAUDE.md` 定义摄入/查询/lint 工作流，就能把零散的学习笔记变成一个会复利的知识库。

## 十、参考资料

**原始来源**

- [Andrej Karpathy 的 GitHub Gist《llm-wiki》（2026-04，原始全文）](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [Karpathy 在 X 上的补充说明](https://x.com/karpathy/status/2040470801506541998)

**社区 skill / 插件实现**

- [Astro-Han/karpathy-llm-wiki（通用 Agent Skill）](https://github.com/Astro-Han/karpathy-llm-wiki)
- [praneybehl/llm-wiki-plugin（Claude Code 插件）](https://github.com/praneybehl/llm-wiki-plugin)
- [neusse/codex-karpathy-llm-wiki-skills（Codex skills）](https://www.awesomeskills.dev/en/skill/neusse-codex-karpathy-llm-wiki-skills)
- [Benboerba620/karpathy-claude-wiki](https://github.com/Benboerba620/karpathy-claude-wiki)
- [projectbrain.md（Git 原生开放标准）](https://projectbrain.md/)
- [GitHub Topic: karpathy-wiki（更多实现合集）](https://github.com/topics/karpathy-wiki)

**解读与实践文章**

- [What Is Andrej Karpathy's LLM Wiki? — MindStudio](https://www.mindstudio.ai/blog/andrej-karpathy-llm-wiki-knowledge-base-claude-code)
- [Karpathy's LLM knowledge base architecture that bypasses RAG — VentureBeat](https://venturebeat.com/data/karpathy-shares-llm-knowledge-base-architecture-that-bypasses-rag-with-an)
- [Compounding Knowledge With LLMs — Towards AI](https://pub.towardsai.net/compounding-knowledge-with-llms-karpathys-wiki-pattern-in-action-d01db84d5b8b)
- [Self-Updating AI Knowledge Base — Substack](https://startupgtm.substack.com/p/self-updating-ai-wiki-knowledge-base)
