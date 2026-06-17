---
title: 【学习笔记】Vibe Coding 实战经验整理：从"屎山代码"到工程化工作流
published: 2026-06-17
description: 整理自 LINUX DO 讨论：vibecoding 的成败在于用软件工程方式管理 Agent——上下文切小、模块边界划清、用文档/Skill 沉淀项目记忆、先对齐再动手、每步可验收。
lang: zh
tags: [学习笔记]
abbrlink: vibe-coding-experience-summary
toc: true
---

> 📌 **内容来源**：本文整理自 LINUX DO 讨论帖《哪位佬有成熟的 vibecoding 经验分享》（楼主 zlin），原帖链接：<https://linux.do/t/topic/2413287>。以下为我对讨论内容的归纳与个人理解（学习笔记），非逐字转载，观点归原帖各位佬友。

## 背景：楼主遇到的四个痛点

楼主自述是"开发小白"（有计算机基础但非专业开发者），用 codex、Claude Code 这类 agent 工具做小功能还行，但要落地一个功能复杂的项目仍然非常困难。他总结了四个典型痛点：

1. **上下文膨胀 → 方向跑偏**：写完初步需求和架构文档后，文档随开发不断修改补充；但随着上下文增多，开发方向逐渐偏离主线，最后一堆"屎山代码"。
2. **前后端开发顺序**：前后端分离的系统，是先写好前端、再分模块接后端，还是先把后端数据调通、再接前端页面？
3. **可视化验收难**：有些功能开发完必须可视化地看效果才能评估，这种场景容易越搞越乱。
4. **前端效果差 + 对接即崩**：前端页面达不到想要的效果，一和后端对接、一修改就成"一坨"。

楼主试过类似 superpowers 的方案但感觉没什么变化，因此发帖求成熟经验。

## 核心经验归纳

把楼友们的回复按主题归类，大致可以提炼出下面几条主线。

### 1. 本质是"上下文管理 + 提示词工程"

这是出现频率最高的共识。

- **Agent 和人一样，不适合在巨大上下文里做推导判断**。应该在边界清晰的模块里工作，**任务和模块拆得越细，成功率越高**。
- **沉淀项目记忆**：让 AI 先分析整个项目，生成一份「开发声明.md」，让后续新会话能快速了解项目；任务中途想中断、或上下文堆积过多时，让 AI 写一份「修改笔记.md」，避免上下文过长导致 token 消耗爆炸。
- 用 `CLAUDE.md` 管理项目约定；把重复的提示词和功能封装成 **SKILL**。

### 2. 要有软件工程思维，vibecoding 只是形式

- 一位佬友说得很直白：**"先是 Coding 本身，其次才是 vibecoding"**——后者只是一种形式。
- 管理 Agent 就像管理程序员：要懂得怎么划分分支、怎么管理 worktree、多人如何协作、怎么用 Playwright 之类的工具做自动化测试。
- 真正要管理的是"**如何划分限界上下文边界，让一个模块更清晰、更独立、更容易替换**"。

### 3. 用 Skills / 流程规范来约束 Agent

一位佬友分享了自己基于一套类 **SDD（Spec-Driven Development）的 skills** 的实践，重点解决：agent 之间如何沟通交接、如何验收、如何用 **design gate 让问题提前暴露**。

他描述的实际工作流是：

> 先和人对齐 → 对齐清楚后各自完成 coding + review → alpha test 去"点点点"验收 → 最终回顾产品愿景 → 如果还有没对齐的就继续 loop。

配套的 `feat-lifecycle` 这类 skill 负责功能"立项 → 讨论 → 完成"的全生命周期管理。

### 4. 先对齐需求，再动手

- 当不知道具体怎么做的时候，先用 `/brainstorming` 之类的手段**先把需求对齐**，而不是直接开干。
- 思路对齐的优先级高于编码本身——方向错了，写再多也是屎山。

### 5. 前端 UI 效果怎么处理

针对楼主"前端达不到想要效果"的痛点，有佬友给了具体办法：

- **UI 不加控制，AI 画出来的都一个样**。要么直接找那种已经带效果图（mockup）的方案；
- 要么走迭代：**让 AI 先画一版 → 让另一个 AI 去看、去评估 → 让 AI 据此给你生成 prompt → 最后让 AI 按这个 prompt 修改**，多轮逼近想要的效果。

> 补充：楼主 Q2（前后端谁先）和 Q3（可视化验收）没有被逐一正面回答，但楼友们给出的通用解法其实就是——**模块化 + 小步迭代 + 每一步都可验收**。只要拆得够细、每步能独立验证，前后端顺序和可视化问题都会自然缓解。

## 可参考的资源与工具

帖子里多位佬友自荐或推荐了开源项目，可作为上手参考：

| 资源 | 作者 | 用途 |
|---|---|---|
| **clowder-ai** ([zts212653/clowder-ai](https://github.com/zts212653/clowder-ai)) | L.S | 开源 AI agent team 协同平台（"Build AI teams, not just agents"），自带 `feat-lifecycle` skill |
| **Vibe_coding_guide** ([Lling0000/Vibe_coding_guide](https://github.com/Lling0000/Vibe_coding_guide)) | taidamier | 中文优先的 vibecoding 工作流指南：specs、agents、worktrees、skills、CI、review |
| **code-note-helper / vibe-coding-template** ([Philip-Cao-9527/code-note-helper](https://github.com/Philip-Cao-9527/code-note-helper)) | harrypotter9527 | codex 工作流模板 |
| **agent-project-continuity** ([jiangtwelve/agent-project-continuity](https://github.com/jiangtwelve/agent-project-continuity)) | jiangcan | 结构化项目记忆 + 阶段化开发 + 单文件状态快照，跨会话/跨 agent 接续项目 |
| **superpowers** | — | 社区推荐的 skills 集合 |

## 一句话总结

> 这帖给我的最大启发是：**vibecoding 的成败，不在于 AI 工具有多强，而在于你是否用软件工程的方式去管理它**——把上下文切小、把模块边界划清、用文档和 Skill 沉淀项目记忆、先对齐再动手、每一步都保证可验收。**要把 Agent 当程序员来管，而不是当许愿池。**
