---
title: 【学习笔记】Agentic 设计模式（六）：附录 A–G 速览——提示工程 / GUI 真实环境 / 框架 / AgentSpace / CLI / 推理引擎 / Coding Agent
published: 2026-07-01
description: 速览 Antonio Gulli《Agentic Design Patterns》附录 A–G——A 高级提示技术（基础/结构化/推理/行动/高级/任务特定全谱系，含 context engineering 取代 prompt engineering 的趋势）、B 从 GUI 到真实环境（Agent-Computer Interface 含 Operator/Mariner/Computer Use/Browser Use + 多模态环境 + vibe coding）、C 框架概览（LangChain/LangGraph/ADK/CrewAI/AutoGen/LlamaIndex 等 12 框架对比）、D AgentSpace 无代码平台、E CLI Agent（Claude Code/Gemini CLI/Aider/Copilot CLI + Terminal-Bench）、F 推理引擎内幕（让六大模型自述推理步骤的收敛框架 + 模拟非符号逻辑的警示）、G Coding Agent（人主导的专家 Agent 团队框架，从 vibe coding 进化到结构化协作）
lang: zh
tags: [学习笔记]
abbrlink: agentic-patterns-appendices
---

> 整理日期：2026-07-01
> 涵盖范围：附录 A–G（本书 ~74 页参考资料向内容）
> 说明：这是 [Agentic 设计模式系列总览](/posts/agentic-design-patterns-overview/) 的第六篇、也是末篇。附录不是「核心 21 模式」，而是**横向参考资料**——提示工程方法库、框架选型、CLI/Coding Agent 工具图鉴、推理引擎内幕。本篇采用「速览」形式，每则附录给定位、要点和坑。附录 F 的「模型自述推理」是模型行为模式示例、非内部计算的真实描述，请注意这一警示。内容基于本书英文原书（经 `xindoo` 中文版核实）。标注「（未确认）」处以英文原书为准。

<!--
## 目录
- [一、核心结论（太长不看）](#一核心结论太长不看)
- [二、附录 A：高级提示技术](#二附录-a高级提示技术)
- [三、附录 B：从 GUI 到真实环境](#三附录-b从-gui-到真实环境)
- [四、附录 C：框架概览](#四附录-c框架概览)
- [五、附录 D：用 AgentSpace 构建 Agent](#五附录-d用-agentspace-构建-agent)
- [六、附录 E：CLI 上的 AI Agent](#六附录-ecli-上的-ai-agent)
- [七、附录 F：推理引擎内幕](#七附录-f推理引擎内幕)
- [八、附录 G：Coding Agent](#八附录-g-coding-agent)
- [九、按用途选型决策表](#九按用途选型决策表)
- [十、参考资料](#十参考资料)
-->

## 一、核心结论（太长不看）

1. **附录是横向参考资料，不是新模式**：A 讲方法库（提示工程）、B/C/E/G 讲工具与图鉴（GUI/框架/CLI/Coding Agent）、D 讲无代码平台、F 讲推理内幕。读完能补齐「实战落地」所需的具体手段与选型。
2. **附录 A 的要点是「提示即工程」**：覆盖零/少样本、结构化输出（JSON + Pydantic）、CoT/自洽/Step-back/ToT、ReAct、APE、persona 等全谱系。⚠️ 一个趋势信号——**「context engineering（上下文工程）」正在取代「prompt engineering」**成为新术语；结构化输出不是便利而是**组件/Agent 间可靠通信的必需**。
3. **附录 B 把 Agent 环境分两类**：**Agent-Computer Interface / GUI 自动化**（Operator、Mariner、Computer Use、Browser Use）和**多模态/具身环境**（Astra、Gemini Live、GPT-4o、ChatGPT Agent）。还讲了 **vibe coding**（Karpathy 推广的高层目标驱动迭代式 AI 编程范式）。⚠️ GUI 自动化对 UI 变化脆（远不如稳定 API）。
4. **附录 C 是一份框架选型表**：12 个框架的核心权衡是「细粒度图控制（LangGraph）vs 引导式平台简单（CrewAI/ADK）vs 数据中心（LlamaIndex）」。选型看你要简单序列、动态推理循环、还是托管专家团队。
5. **附录 E 四大 CLI 各有所长**：Claude Code（架构级深度 + MCP 扩展）、Gemini CLI（开源 + 多模态 + 大上下文）、Aider（Git 中心、直接改文件自动提交）、Copilot CLI（GitHub 生态原生）。无单一最优。Terminal-Bench 是评测 CLI Agent 能力的基准。
6. **附录 F 的关键警示**：本书让 Gemini/ChatGPT/Grok/Kimi/Claude/DeepSeek **自述推理步骤**，发现六者收敛到「解构→模式识别检索→选推理法→CoT 模拟思考→构造响应→审查精修」的多阶段框架——这正是 CoT 范式让 LLM 适合当 Agent 计算核心的原因。⚠️ **但这是模型的自述行为示例，不是内部计算的真实描述**；LLM 推理是模拟/概率的，**貌似合理 ≠ 正确**。
7. **附录 G 把 Coding Agent 定位成「人主导的专家 Agent 团队」**：开发者是架构师/最终裁决者，Agent 是支持协作者。三原则——**人主导编排、上下文至上（输入质量决定输出质量）、直连前沿模型**。把 vibe coding 当快速原型手段，但稳健可维护的软件要结构化 Agent 团队。

> 来源：[xindoo 中文版 附录 A–G](https://github.com/xindoo/agentic-design-patterns)

---

## 二、附录 A：高级提示技术

### 定位
一份全面的工程参考，把通用 LLM 变成专门、可靠的工具——**把提示当有纪律的工程，而非「随便问问题」**。

### 要点（全谱系）

- **核心原则**：清晰具体、简洁、强动词、**指令优于约束**（正向指令胜过负向约束）、实验迭代。
- **基础**：Zero-shot、One-shot、Few-shot。
- **结构化**：system prompt、角色提示、分隔符、**context engineering**、结构化输出（JSON + Pydantic 校验）。
- **推理**：CoT、**自洽（self-consistency）**、**Step-back prompting**、ToT。
- **行动/交互**：Tool use / function calling、ReAct。
- **高级**：**APE（自动提示工程）**、迭代精修、负例、类比、分解、RAG、**persona patterns**、Google Gems、用 LLM 改进 prompt（元方法）。
- **任务特定**：代码提示、多模态提示。

### 坑
- 过度复杂的 prompt 反而让模型困惑。
- 负向约束可能适得其反。
- ⚠️ **结构化输出（JSON+Pydantic）不是便利而是组件/Agent 间可靠通信的必需**。
- few-shot 样本塑造语气/风格，和塑造正确性一样重要。

> 来源：[xindoo 中文版 Appendix A](https://github.com/xindoo/agentic-design-patterns)

---

## 三、附录 B：从 GUI 到真实环境

### 定位
调研 Agent 如何与数字界面（Agent-Computer Interface / GUI 自动化）和物理/多模态环境交互，外加 vibe coding 范式。

### 要点（两个交互域）

**① Agent-Computer Interface (ACI) / GUI 自动化**：视觉感知（截图）→ GUI 元素识别 → 上下文理解 → 动态执行（鼠标/键盘控制）+ 持续视觉反馈。代表系统：**ChatGPT Operator**（OpenAI）、**Google Project Mariner**（Chrome 浏览器 Agent）、**Anthropic Computer Use**（Claude 靠截图 + 鼠标键盘控制桌面）、**Browser Use**（开源、DOM 浏览器自动化）。

**② Agent-环境（多模态/具身）**：**Google Project Astra**（靠摄像头/麦克风看听，实时多模态助手）、**Gemini Live**（低延迟对话、可打断、摄像头/屏幕/文件输入）、**OpenAI GPT-4o**（全模态语音/视觉/文本推理、Realtime API）、**OpenAI ChatGPT Agent**（自治浏览 + 代码执行 + 第三方应用交互，内置授权安全防护）、**Microsoft Seeing AI**（视障辅助 App）、**Anthropic Claude 4**（强视觉 + 多步分析）。

**Vibe coding**：对话式、迭代、高层目标驱动的 AI 编程协作（重意图/「vibe」轻逐步规格）；迭代精修；AI 当创意伙伴；可选记忆库。由 GPT-4/Claude/Gemini 在开发环境里促成。

### 坑
- ⚠️ **GUI 自动化对 UI 变化脆**（远不如稳定 API）。
- 全模态 Agent 带来新安全/滥用问题（ChatGPT Agent 配系统卡 + 需用户授权某些动作）。
- vibe coding 降低门槛但无结构化跟进时风险低质量/不可维护代码。

> 来源：[xindoo 中文版 Appendix B](https://github.com/xindoo/agentic-design-patterns)

---

## 四、附录 C：框架概览

### 定位
一份主要 Agent 构建框架及其权衡的对比调研，指导框架选型。

### 要点（12 框架）

| 框架 | 定位 | 适合 |
|---|---|---|
| **LangChain** | LCEL（管道符）做线性/DAG 工作流 | 简单 RAG、摘要、抽取；无循环 |
| **LangGraph** | 基于 LangChain 的**有状态有环图**（节点 + 条件边，支持循环/重试/HITL） | 多 Agent、规划 - 执行、HITL |
| **Google ADK** | 编排有预定角色的 Agent 团队 | 多 Agent + 模型灵活（Gemini Pro/Flash、LiteLLM） |
| **CrewAI** | 编排有预定角色的 Agent 团队 | 多 Agent 团队 |
| **Microsoft AutoGen** | 对话驱动的多 Agent 编排 | 灵活但执行路径欠可预测，需复杂 prompt 收敛 |
| **LlamaIndex** | 数据框架，连接 LLM 到外部/私有数据 | RAG 管线强；复杂 Agent 控制流/多 Agent 弱 |
| **Haystack** | 可扩展搜索/QA 的模块化管线 | 检索优化；动态 Agent 行为偏僵 |
| **MetaGPT** | SOP 驱动多 Agent（模拟软件公司 PM/工程师） | 高度结构化输出；专门、欠通用 |
| **SuperAGI** | 全生命周期管理（监控+GUI+ 循环处理） | 生产向但比轻量库重 |
| **Semantic Kernel**（MS） | SDK，靠「插件」+「规划器」整合 LLM 与传统代码 | .NET/Python 企业集成强；学习曲线陡 |
| **Strands Agents**（AWS） | 轻量、模型驱动、模型无关 SDK，原生 MCP | 简单灵活但运维基础设施自建更多 |

### 核心权衡（本书论点）
细粒度图控制（LangGraph）vs 引导式平台简单（CrewAI/ADK）vs 数据中心（LlamaIndex）。选型取决于你要简单序列、动态推理循环、还是托管专家团队。

> 来源：[xindoo 中文版 Appendix C](https://github.com/xindoo/agentic-design-patterns)

---

## 五、附录 D：用 AgentSpace 构建 Agent

### 定位
一份在 **Google AgentSpace**（「Agent 驱动的企业」平台）上无代码构建 Agent 的实战指南。**仅在线提供**。

### 要点
AgentSpace 用 Gemini 对组织数字资产（文档、邮件、DB）做统一搜索，建**企业知识图谱**（映射人/文档/数据关系），并提供 **Agent Designer**——一个无代码 UI，可创建连接服务（Calendar、Gmail、Workday、Jira、Outlook、ServiceNow）的 Agent，用自定义或 Google 预置 prompt 库。支持经 **A2A 协议**的多 Agent 协作。安全靠 RBAC + 加密。经 Google Cloud Console → AI Applications 访问。

### 坑
- 云平台锁定（Google 生态）。
- 无代码抽象隐藏技术复杂度（控制更少）。

> 来源：[xindoo 中文版 Appendix D](https://github.com/xindoo/agentic-design-patterns)

---

## 六、附录 E：CLI 上的 AI Agent

### 定位
调研四大 AI Agent 命令行界面，以及它们如何把终端变成协作工作台。

### 要点（四 CLI 对比）

| CLI | 亮点 |
|---|---|
| **Claude Code**（Anthropic） | 资深编程 Agent，对项目架构有深度全局理解；像结对编程的对话；适合大重构/API 集成/文档；深 Git 集成；靠 **MCP** 扩展（私有 API、DB 查询、脚本的定制工具） |
| **Gemini CLI**（Google） | 开源、Gemini 2.5 Pro、超大上下文、**多模态**（图 + 文）；开源 + 慷慨免费层；ReAct 循环；内置工具（文件系统、shell、网搜/抓取、记忆）；沙箱保安全；MCP 接本地/API；Google Cloud 强 |
| **Aider** | 开源、模型无关结对程序员；直接改文件 + 每次改动自动提交 Git；TDD 友好（写失败测试→实现→验证）；透明可审计；Git 中心 |
| **GitHub Copilot CLI** | GitHub 生态原生集成；可被指派一个 issue、建分支、写修复、开 PR；仓库感知问答；shell 命令协助（`gh? ...`） |

**Terminal-Bench**：测 CLI Agent 熟练度的基准框架（Terminal-Bench-Core-v0 = 80 个人类设计任务；「Terminus」最小 Agent 当标准化测试床）；终端是理想的 Agent 文本沙箱环境。

### 坑
- 无单一最优工具——各有强项：Claude=架构、Gemini=多模态通用、Aider=Git 中心直接、Copilot=GitHub 工作流。

> 来源：[xindoo 中文版 Appendix E](https://github.com/xindoo/agentic-design-patterns) · [Terminal-Bench](https://www.tbench.ai/)

---

## 七、附录 F：推理引擎内幕

### 定位
探索主流 LLM（Agent 的认知核心）的内部推理机制——让每个模型自述其逐步推理过程。

### 要点（六模型自述 + 收敛框架）
本书向 **Gemini、ChatGPT、Grok、Kimi、Claude、DeepSeek** 提「逐步解释你怎么推理」并综合其（自述）答案。收敛的多阶段框架：① 解构 prompt（意图、约束）；② 靠**模式识别**（非数据库查询）做信息检索/综合；③ 选推理方法；④ 经 **CoT** 模拟思考；⑤ 构造响应（格式/语气/指令遵循）；⑥ 审查精修。Claude（宪法/分析式）和 DeepSeek（经 `<think>` token 显式暴露 CoT——可见推理轨迹）有额外细节。

### 关键洞见（本书结论）
所有主流模型共享一个高度一致的、根植于 CoT 范式的多阶段推理框架。这种系统化处理正是让 LLM 适合当**自治 Agent 的中央「计算心智」（规划者/决策者）**的原因。提升这种**模拟**推理的可靠性是更强大、可信 Agent 的关键。

### ⚠️ 关键警示
这些是模型对自身推理的**自述**——是**行为模式示例，不是内部计算的真实描述**。LLM 推理是模拟/概率的，非符号逻辑；**貌似合理 ≠ 正确**。

> 来源：[xindoo 中文版 Appendix F](https://github.com/xindoo/agentic-design-patterns)

---

## 八、附录 G：Coding Agent

### 定位
一个组织「人主导的专家 Coding Agent 团队」的框架——从原始 vibe coding 进化成开发者当编排者/架构师的结构化人机协作。

### 要点（「增强团队」框架，三原则）

1. **人主导编排**：开发者是团队负责人/架构师/最终决策者；Agent 是支持协作者；开发者始终持有最终裁决。
2. **上下文至上**：Agent 输出质量直接镜像输入质量——优先精心的人管上下文（全代码库 + 外部知识 + 人工任务简报），避免自动化黑箱上下文检索。
3. **直连模型**：Agent 必须由前沿模型（Gemini 2.5 Pro、Claude Opus 4、OpenAI、DeepSeek）驱动，用最干净通道——弱模型或搅浑上下文的中间件会降性能。

**专家 Agent 团队**（按角色 prompt 调用）：Scaffold/Implementation（按规格写代码）、Test Engineer（单测/集成/E2E）、Documenter（API/技术文档）、Optimizer（重构/性能）、**Reviewer/Process**（既做批评类静态分析，又做元反思——优先级排序、滤琐碎、给可执行摘要）。上下文准备放专门 `task-context/` 目录配 `01_BRIEF.md`。

**实施清单**：2+ 前沿模型 API key（双厂商对比/韧性）、轻量本地上下文编排器（`context.toml`）、Git 里版本化的 `/prompts` prompt 库、Git hook 集成（如 pre-commit 触发 reviewer Agent）。

### 行业锚点
Sundar Pichai（2025）：Google 新代码 >30% 由 Gemini 协助/生成；Satya Nadella：微软约 30% 代码 AI 生成。论点是「**增强胜于替代**」——人拥有架构/创造性解题；Agent 做专门、可规模化的任务（测试、文档、评审）。Vibe coding 定位为快速构思/原型手段（治空白页瘫痪、探不熟 API），但稳健可维护软件要结构化 Agent 团队。

> 来源：[xindoo 中文版 Appendix G](https://github.com/xindoo/agentic-design-patterns)

---

## 九、按用途选型决策表

| 你的用途 | 推荐参考 |
|---|---|
| **系统学提示工程方法库** | 附录 A（注意 context engineering 趋势） |
| **要让 Agent 操作浏览器/桌面/多模态** | 附录 B（GUI 自动化 vs 多模态环境） |
| **选 Agent 构建框架** | 附录 C（按「图控制 / 平台简单 / 数据中心」选） |
| **企业内无代码搭 Agent** | 附录 D（AgentSpace） |
| **选 CLI 编程 Agent** | 附录 E（Claude=架构、Gemini=多模态、Aider=Git、Copilot=GitHub） |
| **理解 LLM 推理机制** | 附录 F（⚠️ 自述行为示例，非内部计算真相） |
| **组织 Coding Agent 团队做生产级开发** | 附录 G（人主导 + 上下文至上 + 直连前沿模型） |

一句话总原则：**附录是「实战落地」的工具箱与图鉴——A 给方法、C 给框架、E/G 给工具、B/F 给认知；按你卡在「不会提示 / 不会选框架 / 不会选工具 / 不懂原理」哪一环去取。**

---

## 十、参考资料

**原书与翻译**

- [evoiz/Agentic-Design-Patterns（官方仓库）](https://github.com/evoiz/Agentic-Design-Patterns) · [xindoo 中文翻译版](https://github.com/xindoo/agentic-design-patterns)

**附录涉及的工具与基准**

- [Terminal-Bench](https://www.tbench.ai/) · [Anthropic Computer Use](https://www.anthropic.com/news/3-5-hours-of-computer-use) · [Browser Use](https://github.com/browser-use/browser-use)

**姊妹篇**

- 系列总览：[《Agentic Design Patterns 系列总览》](/posts/agentic-design-patterns-overview/)
- 上篇：[《（五）：企业级七模式》](/posts/agentic-enterprise-patterns/)
- 全系列：[（一）核心组合](/posts/agentic-patterns-core-composition/) · [（二）推理四模式](/posts/agentic-reasoning-patterns/) · [（三）高级模式](/posts/agentic-advanced-patterns/) · [（四）生产模式](/posts/agentic-production-patterns/) · [（五）企业模式](/posts/agentic-enterprise-patterns/) · [（六）本文](/posts/agentic-patterns-appendices/)
