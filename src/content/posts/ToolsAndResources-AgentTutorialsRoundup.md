---
title: 【工具分享】Agent 教程资源整理：方法论、系统课程、框架实战与生态学习地图
published: 2026-10-14
updated: 2026-10-25
description: 把网上散落的 Agent 教程系统整理成一张学习地图：Anthropic 与 OpenAI 的官方方法论长文、HuggingFace 与 DeepLearning.AI 的免费认证课程、Datawhale hello-agents 等中文开源系统教程、框架上手与 2026 选型对比、Claude Code 与 Agent Skills、MCP 专题、B 站视频，共 40 余个资源，按七类组织并附一条从概念到落地的学习路径。2026-10-25 增补：据王吉伟频道万字盘点整理的 20 个 Agentic AI 框架速览表与场景选型速查。所有链接于 2026-10-14 检索验证。
tags:
  - 工具分享
  - Agent
---

博客里陆陆续续写过一些 Agent 相关的笔记——[设计模式](/posts/learningnotes-aiagentdesignpatterns/)、[十框架选型](/posts/open-source-agent-frameworks-survey/)、[Claude Code 插件系统](/posts/learningnotes-claudecodeskill/)——但一直缺一张「从零学 Agent」的全景地图。这篇把搜到的教程按七类整理：**方法论、免费课程、中文系统教程、框架实战、Claude Code 与 Skills、MCP、视频**，每条附一句话定位和适合人群。所有链接于 2026-10-14 检索验证；语言和费用均已标注，好消息是这份清单里几乎没有要花钱的东西。2026-10-25 增补：框架选型一节加入 20 框架中文盘点速览。

## 总表

| 分类 | 资源 | 形式 | 语言 | 费用 |
| --- | --- | --- | --- | --- |
| 方法论 | Anthropic《Building Effective Agents》 | 长文 | 英 | **免费** |
| 方法论 | OpenAI《A Practical Guide to Building Agents》 | 长文 | 英 | **免费** |
| 系统课程 | HuggingFace AI Agents Course | 课程 + 认证 | 英 | **免费** |
| 系统课程 | DeepLearning.AI Agents 短课系列 | 视频 + Notebook | 英 | **免费** |
| 中文系统教程 | Datawhale《hello-agents》 | 开源书 + 代码 | **中** | **免费** |
| 中文系统教程 | 《智能体 AI 权威指南》 | GitBook | **中** | **免费** |
| 框架实战 | OpenAI Agents SDK Quickstart | 官方文档 | 英 | **免费** |
| 框架选型 | 五篇 2026 框架对比长文 | 长文 | 英 | **免费** |
| 框架全景 | 王吉伟《20 个 Agentic AI 框架盘点》 | 长文 | **中** | **免费** |
| 编码智能体 | Claude Code Best Practices 系列 | 长文 + PDF | 英 | **免费** |
| Agent Skills | 官方文档 + awesome-agent-skills | 文档 / 仓库 | **中** | **免费** |
| MCP | 中文极速入门 + 官方中文教程 | 教程 | **中** | **免费** |
| 视频 | B 站 Agent 开发系列 | 视频 | **中** | **免费** |

## 方法论：先读两家官方指南

动手上框架之前，先花半天把两篇「为什么这么设计」读完，后面少走很多弯路。

- **[Anthropic：Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** ——Agent 领域被引用最多的一篇文章。核心贡献是区分了 workflow（代码编排的固定流程）和 agent（模型自主决定路径的循环），并给出五种模式：提示链、路由、并行化、编排者 - 执行者、评估者 - 优化者。中心思想就一句：**从最简单的方案开始，组合原语，而不是上来就套框架**。配套的续篇 [Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) 讲多轮 Agent 怎么做评测，社区还有一篇[整合了后续刊物的 markdown 汇总版](https://github.com/machinededge/building-effective-agents/blob/main/building-effective-agents.md)。
- **[OpenAI：A Practical Guide to Building Agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents)**（2026-01 更新）——OpenAI 的对位文章，更偏落地清单：怎么选场景、按步骤选模型、工具定义怎么写、护栏（启发式 + LLM 检查）怎么设、单 Agent 还是管理者模式编排、上线后怎么评测部署。
- **[OpenAI：Agents 指南（API 选型）](https://developers.openai.com/api/docs/guides/agents)** ——回答「Agents API、Agents SDK、Responses API 到底用哪个」的官方对比，接 OpenAI 生态前必读。

中文读者可以配合我之前的 [AI Agent 设计模式入门教程](/posts/learningnotes-aiagentdesignpatterns/)（21 个 Agentic Design Patterns 的中文梳理）一起看。

## 免费系统课程

想成体系学、有人带着练，这三家都是免费且质量过硬的：

- **[HuggingFace AI Agents Course](https://huggingface.co/learn/agents-course/en/unit0/introduction)** ——HF 官方免费课程，从 Agent 基础概念讲到结业认证：每个主流库一个 Unit（smolagents、LlamaIndex、[LangGraph](https://huggingface.co/learn/agents-course/en/unit2/langgraph/introduction)），最后有一个上基准测试的结业作业，通过后发证书。课程[源码和材料在 GitHub](https://github.com/huggingface/agents-course) 开放。
- **[DeepLearning.AI 短课系列](https://www.deeplearning.ai/courses)** ——[AI Agents in LangGraph](https://learn.deeplearning.ai/courses/ai-agents-in-langgraph/) 讲用 LangGraph 搭可控的 Agentic 工作流（含多智能体通信，Coursera 上还有 2 小时引导项目版）；[Multi AI Agent Systems with crewAI](https://www.deeplearning.ai/courses/multi-ai-agent-systems-with-crewai) 专讲多智能体分工协作；吴恩达本人还有一门 10 小时左右的 Agentic AI 系统课。短课全部免费旁听。
- **[IBM：The 2026 Guide to AI Agents](https://www.ibm.com/think/ai-agents)** ——概念讲解 + 动手教程 + 播客的合集，适合当中英文之间的过渡阅读。

## 中文系统教程（开源）

不想啃英文、想要成册的深度内容，首选这几份：

- **[Datawhale《hello-agents：从零开始构建智能体》](https://github.com/datawhalechina/hello-agents)** ——目前最系统的国产开源 Agent 教程，[官网 helloagents.pro](https://helloagents.pro) 免费开放，完整 PDF 也已免费发布。定位是「穿透框架表象」：16 章从核心原理和经典范式出发，带你**从零手写一个自己的智能体框架**。2025-11 开源一周 star 破 2.2k，目前已近 4 万。Datawhale 还有姊妹教程 [《Hello, Generic Agent》](https://datawhalechina.github.io/hello-generic-agent)，专讲通用型 Agent 的构建方法。
- **[《智能体 AI 权威指南》（yeasy 的 GitBook）](https://yeasy.gitbook.io/agentic_ai_guide)** ——作者 yeasy 是《Docker——从入门到实践》的作者，书的质量有保证。深入讲解感知、规划、记忆、行动四大模块的原理，覆盖 ReAct、规划 - 执行等主流设计模式和多智能体架构，适合当「原理参考书」。
- **[AI 智能体实战速成指南：从零到企业级落地](https://didilili.github.io/ai-agents-from-zero)** ——零基础和工程师都适用的路线：先把大模型、Agent、RAG、MCP、Tool Calling 这些概念讲透，再进源码、框架、部署和项目设计。
- 快速入门补充：[菜鸟教程 AI Agent](https://www.runoob.com/ai-agent/ai-agent-tutorial.html)（一页纸建立「Agent 是按步骤完成任务而不只是回答问题」的认知）、[知乎：AI 智能体保姆级入门指南](https://zhuanlan.zhihu.com/p/1995097301845309381)（含 LangChain/LangGraph 框架与模型选型）、[CSDN：从 0 到 1 开发 AI Agent](https://blog.csdn.net/xx_nm98/article/details/144222993)（含分阶段学习路线和 30 天进阶计划）。

## 框架实战与选型

概念清楚了就该写代码。建议按「官方 Quickstart → 一个框架深挖 → 读选型对比」的顺序来：

- **[OpenAI Agents SDK Quickstart](https://openai.github.io/openai-agents-python/quickstart)** ——一小时跑通「创建 Agent → 给工具 → 定义 handoffs」的完整链路，是目前上手成本最低的官方 SDK。TypeScript 用户可以看 [CodeSignal 的 TS 版课程](https://codesignal.com/learn/courses/introduction-to-openai-agents-sdk-in-typescript/lessons/getting-started-with-openai-agents)。
- **LangGraph** ——上面 HF 课程 Unit 2 和 DeepLearning.AI 短课都覆盖了它，主打对 Agent 流程的精细控制，是「workflow 与 agent 之间」的平衡点。
- **不用框架、纯手写**：[Building an AI Agent from Scratch with Pure Python (2026)](https://medium.com/@iamanraghuvanshi/building-an-ai-agent-from-scratch-with-pure-python-in-2026-229af2a9b8ce) 和 [IIT Kanpur 的 ReAct 实操指南](https://www.eicta.iitk.ac.in/knowledge-hub/artificial-intelligence/how-to-build-ai-agent-from-scratch)——先裸写一个 Agent 循环再谈框架，对理解本质帮助极大。
- **2026 选型对比**（读完再决定押注哪个框架）：[Spheron（2026-08）](https://www.spheron.network/blog/langgraph-vs-crewai-vs-autogen-2026)含 CrewAI 生产部署与 GPU 配置；[Towards AI 企业版指南](https://pub.towardsai.net/langgraph-vs-crewai-vs-autogen-which-ai-agent-framework-should-your-enterprise-use-in-2026-3a9ebb407b09)（原型选 CrewAI、Azure 环境选 AutoGen）；[Dev.to 多智能体编排指南](https://dev.to/pockit_tools/langgraph-vs-crewai-vs-autogen-the-complete-multi-agent-ai-orchestration-guide-for-2026-2d63)带代码对比；[Gurusup 六框架盘点](https://gurusup.com/blog/best-multi-agent-frameworks-2026)（含 Google ADK）；[Splunk 框架评测](https://www.splunk.com/en_us/blog/learn/agent-frameworks.html)（含 Microsoft Agent Framework）。

中文视角可以配合我上个月写的 [自研 Agent 选型：十个开源框架与 Harness 深度对比](/posts/open-source-agent-frameworks-survey/)，结论类似：单 Agent 内存态场景甚至可以抛开框架手写裸循环。

中文生态里还有一篇值得收藏的盘点：**[王吉伟频道《万字长文：2026 年应该了解的 20 个 Agentic AI 框架，特征、场景、优劣势一文看明白》（2025-12）](https://mp.weixin.qq.com/s/_UcwSkRNzOuGTipc9Dadrw)**——全文约 1.1 万字，对 20 个框架逐一给出主要特征、应用案例、优劣势和 GitHub 链接；开篇还引用综述论文 [《Agentic AI Frameworks: Architectures, Protocols, and Design Challenges》](https://arxiv.org/abs/2508.10146) 给现代智能体下的定义：一种具备自主性与协作性的实体，拥有推理与沟通能力，能够动态解读结构化语境、编排工具，并通过分布式系统中的记忆与交互调整行为。作者王吉伟也是《一本书读懂 AI Agent：技术、应用与商业》的作者。下面把 20 个框架压缩成一张速览表（各框架的优劣势细节与 GitHub 链接见原文）：

| 框架 | 一句话定位 | 亮点 | 局限 |
| --- | --- | --- | --- |
| CrewAI | 角色驱动的多智能体编排，Crews 自主协作 + Flows 精确编排 | 几行代码起一套多智能体系统，社区活跃 | 文档分散，大规模团队有性能瓶颈 |
| AutoGen | 微软开源的多智能体对话框架（Python/.NET） | 智能体间自然语言对话协作，AutoGen Studio 可视化开发 | 学习曲线陡，多智能体并行对算力要求高 |
| LlamaIndex | 连接 LLM 与私有数据的 RAG 框架（前身 GPT-Index） | 数据摄入、索引、检索流水线完整 | 自身无自主决策能力，需与 Agent 框架组合 |
| LangChain | LLM 应用开发的「全家桶」平台 | 模型无关接口 + LangSmith/LangGraph 配套生态 | 抽象层厚，复杂应用配置繁琐 |
| LangGraph | LangChain 生态的图结构状态化工作流 | 原生支持循环、条件分支、持久化、人工干预 | 图工作流设计有学习成本，生态较新 |
| MetaGPT | 模拟软件公司组织（产品经理/架构师/工程师） | 一句话需求产出代码 + PRD 等全套文档 | 主要适合中小型应用 |
| Atomic Agents | 「原子设计」组件化框架（基于 Instructor + Pydantic） | 单一用途、可组合、行为可预测的组件 | 去中心化架构调试困难 |
| Semantic Kernel | 微软的企业级轻量 SDK（C#/Python/JS） | 函数调用 + 语义记忆，与 Azure/Office 深度集成 | 微软技术栈之外体验一般 |
| RASA | 对话式 AI 框架（确定性对话管理 + LLM 增强） | 复杂多轮对话管理成熟，企业验证充分 | 偏对话场景，需掌握专门 DSL |
| Trigger.dev | TS/JS 长时后台任务与工作流框架 | 无超时限制，事件驱动，监控/重试/调度齐备 | 生态相对年轻 |
| Botpress | 聊天机器人工具转型的无代码/低代码 Agentic 平台 | 可视化拖拽设计，业务人员也能上手 | 复杂逻辑仍需写代码 |
| SmolAgents | HuggingFace 出品的极简轻量框架 | Code Agent 原生支持，三行代码创建智能体 | 高级特性与扩展性有限 |
| Agno | 高性能多智能体框架、运行时与控制平面 | 多模态原生、注重隐私、吞吐量高 | 文档与生态较新 |
| ElizaOS | 多平台连接的多智能体开发框架 | Discord/Telegram 等连接器开箱即用，自带 Web 仪表盘 | 依赖外部模型服务 |
| Motia | 统一「步骤」原语的多语言后端框架 | 同一工作流可混跑 TS/JS 与 Python，内置 Agent 能力 | 框架较新，上手要学的技术面广 |
| Mastra | TypeScript 原生的 AI 应用与 Agent 框架 | 模型路由、工作流、上下文管理、MCP 支持齐备 | 绑定 TypeScript 技术栈 |
| Pydantic AI | Pydantic 团队的 Python Agent 框架 | FastAPI 式开发体验，完全类型安全，支持 MCP/A2A | 严格数据模型会限制灵活性 |
| AutoAgent | 港大开源的全自动零代码框架 | 自然语言即可创建与部署 Agent | 输出质量依赖需求描述的清晰度 |
| OpenHands | 完全重构的开源软件开发多智能体框架（V1） | 主 Agent + 子智能体分层协作，被称为「Manus 开源平替」 | 多智能体调度学习曲线陡 |
| Akka | Java/Scala 的 Actor 模型分布式框架 | 高吞吐、高容错，久经生产环境验证 | 非 AI 专用，接入 LLM 需自行集成 |

**场景速查**（整理自原文后记的选型指南）：

- **多智能体协作编排**：AutoGen、CrewAI、LangGraph、MetaGPT、OpenHands——新手从 CrewAI 入手，企业级选 AutoGen/OpenHands，软件开发专项选 MetaGPT，复杂流程上 LangGraph。
- **开发模式**：低代码/无代码选 Botpress、AutoAgent；轻量快速原型选 SmolAgents、Agno；企业级部署选 Semantic Kernel、Akka、RASA。
- **功能侧重**：RAG 与私有数据选 LlamaIndex、LangChain；多轮对话选 RASA、elizaOS；TypeScript 应用选 Mastra；分布式高可靠选 Atomic Agents、Akka；长时后台任务选 Trigger.dev。
- **技术栈**：Python 生态——CrewAI、AutoGen、LlamaIndex、MetaGPT；TS/JS 生态——Mastra、Trigger.dev、Botpress；多语言——Semantic Kernel、Motia；Java/Scala——Akka。

原文的选型心法与上面两家官方方法论是一致的：先对齐使用场景、技术栈与需求复杂度——新手看入门门槛，企业级看可靠性与集成性，专项场景选垂直优化的框架——再决定押注谁。

## Claude Code 与 Agent Skills

把「编码智能体」单独列一类，因为它的学习曲线和通用 Agent 完全不同——重点从写代码变成写配置和规则：

- **官方文档**：[使用 Skills 扩展 Claude（Claude Code，中文）](https://code.claude.com/docs/zh-CN/skills) 讲清了 Claude Code 的 Skills 遵循 Agent Skills 开放标准，并额外支持调用控制、子代理执行和动态上下文注入；[Agent Skills 概述](https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/overview) 和 [Quickstart](https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/quickstart)（以生成 PPT 为例）是 API 侧的入口。
- **[awesome-agent-skills](https://github.com/libukai/awesome-agent-skills)** ——中文维护的 Agent Skills 终极指南：快速入门、精选技能库，覆盖 GUI、IDE、Claude Code 等环境的安装方法。
- **中文教程**：[知乎：Agent Skills 使用指南（喂饭版）](https://zhuanlan.zhihu.com/p/1990123800545731904)、[CSDN：Agent Skills 从入门到高级自定义](https://blog.csdn.net/may1992heihei/article/details/157061213)。
- **工程实践**：[Anthropic 官方 Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)（CLAUDE.md 配置、「探索 - 规划 - 编码 - 提交」迭代流、subagent 与 headless 模式）是必读起点；进阶看 39 页的 [Scaling Agentic Coding Across Your Organization](https://resources.anthropic.com/hubfs/Scaling%20agentic%20coding%20across%20your%20organization.pdf)（组织级推广、安全与代码审计）；[Armin Ronacher 的 Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/6/12/agentic-coding/)（Flask 作者的第一手工作流）和 [Ernest Chiang：Anthropic 内部如何使用 Claude Code](https://www.ernestchiang.com/zh/posts/2025/how-anthropic-teams-use-claude-code)（繁中）是很好的实践补充；[知乎的中文学习笔记](https://zhuanlan.zhihu.com/p/1997843063482123604)适合快速抓官方指南要点。

本博客的相关深度笔记：[Claude Code 插件系统之 Skill 详解](/posts/learningnotes-claudecodeskill/)、[MCP 详解](/posts/learningnotes-claudecodemcp/)、[写了 22 个 skill 后的心得](/posts/agent-skill-writing-tips/)。

## MCP 专题

MCP 是 Agent 接工具的事实标准协议，教程已经很成熟：

- **[MCP 编程极速入门（中文）](https://github.com/liaokongVFX/MCP-Chinese-Getting-Started-Guide)** ——最早的中文入门指南之一，讲清 MCP 如何让 LLM 标准化连接外部数据和工具。
- **[知乎：MCP，一篇就够了](https://zhuanlan.zhihu.com/p/29001189476)** ——把 Host / Client / Server 三层架构和完整调用链路（如 Claude Desktop → MCP Client → MCP Server）讲得最清楚的中文长文。
- **官方中文教程**：[modelcontextprotocol.info 中文站](https://modelcontextprotocol.info/zh-cn/docs/tutorials) 手把手用 Node.js 构建 MCP Client，[mcpcn.com 教程页](https://mcpcn.com/docs/tutorials) 还有构建 Server 的系列教程和「用 Claude 加速 MCP 开发」的指南。
- 补充：[CSDN：MCP 详解和开发教程](https://blog.csdn.net/ZYC88888/article/details/146414158)、[Logto：什么是 MCP 及其工作原理](https://blog.logto.io/zh-TW/what-is-mcp)（繁中概念科普）。

## 视频教程

偏好视频学习的可以看 B 站（标题营销味较重，建议当目录挑着看）：

- [B 站：AI Agent 开发零基础教程 2026（748 集）](https://www.bilibili.com/video/BV1xwVr6FEh4) ——量最大的一套，从入门到进阶实战都有覆盖，聚合课性质，按需选章节。
- [B 站：AI Agent 智能体搭建教程 2026](https://www.bilibili.com/video/BV11NNAz5EKn) ——入门到实战的完整路线，体量小一些。

## 建议学习路径

把上面的资源串成一条四到六周的路径：

1. **建立概念（第一周前半）**：Anthropic《Building Effective Agents》+ OpenAI《A Practical Guide to Building Agents》两篇长文，配合菜鸟教程快速补名词；中文读者加我的[设计模式笔记](/posts/learningnotes-aiagentdesignpatterns/)。
2. **系统课程（第一到三周）**：英文走 HuggingFace Agents Course（有认证有作业），中文走 Datawhale hello-agents（亲手写框架）；想加强 LangGraph 就配 DeepLearning.AI 短课。
3. **框架上手（第三到四周）**：OpenAI Agents SDK Quickstart 或 LangGraph 二选一深入；怀疑框架必要性就按纯 Python 教程手写一个 ReAct 循环——写完再回头看选型对比会完全不一样。
4. **生态与工程化（第五周起）**：MCP 按「知乎一篇就够了 → 官方教程手写一个 Server」的顺序；重度使用 Claude Code 的加餐 Best Practices + Skills 文档 + awesome-agent-skills；正式选型前读 2026 对比文 + 上面的 20 框架速览 + 我的[十框架选型笔记](/posts/open-source-agent-frameworks-survey/)。
5. **一条贯穿始终的提醒**：两家官方的方法论共识——能用单次调用解决就别上 workflow，能用 workflow 就别上 agent，能单 agent 就别多 agent；复杂度只在问题确实需要时才引入。

链接于 2026-10-14 检索验证（20 框架速览一节为 2026-10-25 增补），若日后失效或有更好的资源，欢迎在评论区补充。
