---
title: 【学习笔记】HyperFrames 30 天拆解（五）Choose a creation workflow：按手头素材选工作流，附四种创作场所
published: 2026-08-25
description: HyperFrames「30 天」系列第五篇（专题一），对应官方课程页 Related topics 的「Choose a creation workflow」。浏览器核对后发现该入口实际链向 /workflows 的「Choose a workflow」页——「Start from the material you already have」：九条工作流按输入素材归类（产品网站、想法讲解、既有素材、PR、动效图形、音乐、演示文稿、自定义、Remotion 移植），外加「多源并重走 general-video、裸 /hyperframes 请求由代理自选」的消歧规则；本篇同时拆解容易混淆的姊妹页 /guides/choose-creation-path「Choose how to create」——四种创作场所（本地代理 + CLI、AI 聊天 MCP、设计工具、HeyGen Video Agent）各自适合谁、能力边界、产物归属（They all give you a video. The difference is what you keep afterwards），以及「先选工作流再选场所」的完整决策顺序。
lang: zh
tags: [学习笔记]
abbrlink: hyperframes-thirty-days-creation-paths
---

> **系列导航**：[（一）总览](/posts/hyperframes-thirty-days-notes/) → [（二）Start and create](/posts/hyperframes-thirty-days-phase-1/) → [（三）Direct and refine](/posts/hyperframes-thirty-days-phase-2/) → [（四）Extend and ship](/posts/hyperframes-thirty-days-phase-3/) → **（五）创作路径专题** → [（六）Prompt Guide 深读](/posts/hyperframes-thirty-days-prompt-guide/) → [（七）Catalog 全景](/posts/hyperframes-thirty-days-catalog/)
> **调研日期**：2026-08-25（浏览器逐页核对）
> **本篇对象**：官方课程页 Related topics 之 [Choose a creation workflow](https://hyperframes.heygen.com/workflows)（文档标题 Choose a workflow），辅以姊妹页 [Choose how to create](https://hyperframes.heygen.com/guides/choose-creation-path)、[MCP](https://hyperframes.heygen.com/guides/mcp) 与 [Studio](https://hyperframes.heygen.com/studio/index)
> **说明**：核对时发现一个易混点——Related topics 的这个入口链向 `/workflows`（按素材选工作流），而不是 `/guides/choose-creation-path`（四种创作场所）。两页回答的是两个不同问题：**做哪种视频**与**在哪做视频**。本篇把两页都拆开，正好凑成完整的「创作路径」决策

## 一、先分清两个入口：选工作流 vs 选场所

| 页面 | 标题 | 回答的问题 |
| --- | --- | --- |
| `/workflows` | Choose a workflow | 做哪种视频？（按手头素材对号入座） |
| `/guides/choose-creation-path` | Choose how to create | 在哪做？（本地 / 聊天 / 设计工具 / HeyGen） |

30 天课程的 Day 18 演示的是「场所」里的 HeyGen Video Agent 一格；Related topics 链的则是「工作流」页。先选工作流、再选场所，才是完整的决策顺序。

## 二、/workflows：Start from the material you already have

（源：[Choose a workflow](https://hyperframes.heygen.com/workflows)）

这页的开场白就是系列第一阶段的浓缩——**入口不是空时间轴，而是你已经有的东西**。九条工作流全部按「带来什么」归类：

| 你手头有 | 工作流 | 指向 |
| --- | --- | --- |
| 一个 URL、发布简报或产品故事 | Show a product or website | product-launch-video |
| 笔记、文章、脚本、一个粗想法 | Explain an idea | faceless-explainer |
| 一段口播 / 访谈 / 播客剪辑 | Work with existing footage | captions-and-recuts |
| 一个 GitHub PR 链接 | Explain a pull request | pr-to-video |
| 一句话、一个数字、引言、图表或 logo | Make a short motion graphic | motion-graphics |
| 一首曲子 + 想用的照片或视频 | Cut to music | music-to-video |
| 大纲、提案、报告或现成 deck | Build a presentation | slideshow |
| 只有想要的结果和零散素材 | Direct a custom video | general-video |
| 一个现成 Remotion 工程 | Port a Remotion composition | hyperframes-vs-remotion（单向迁移） |

页面末尾的消歧规则值得原文记录：**当几种素材同等重要时，用 Direct a custom video；也可以直接发一条普通的 `/hyperframes` 请求，代理理解你的意图后会自己选匹配的工作流。**

这张表与课程 Days 3-7 的对应关系一目了然（PR-to-Video、Music-to-Video、Faceless explainer、Talking-head recut、Motion graphics 正是表中五条）；篇二拆过的入口路由优先级表，就是这条「代理自选」背后的实现。

## 三、/guides/choose-creation-path：四种创作场所

（源：[Choose how to create](https://hyperframes.heygen.com/guides/choose-creation-path)）

姊妹页的开场白同样精准：**四个场所都能给你一条视频，区别是你 afterwards 留下什么**（They all give you a video. The difference is what you keep afterwards）——**拿不准就选第一个**。官方总表：

| 从哪开始 | 你最终得到 |
| --- | --- |
| 电脑上的编码代理 | 一个你拥有、可继续编辑的项目文件夹 |
| AI 聊天 | 一条做出来、保存在你 HeyGen 账号里的视频 |
| 设计工具 | 一个观感，回到电脑上收尾 |
| HeyGen Video Agent | 一条替你组装完成的成片 |

四个小节的标题本身就是判断条件，正文各一句话：

**① Start on your computer if the video will change**——编码代理（在文件夹里工作的 AI 助手，如 Claude Code、Cursor）写一个普通 HTML 项目；用代理改、开进 Studio、读源码、本地出 MP4。请求模板：`Using /hyperframes, make a 10-second product intro for https://example.com.`

**② Start in an AI chat if you want nothing installed**——hosted MCP connector（聊天可用的插件）经你的 HeyGen 账号构建与渲染。**你放弃的是项目文件夹、Studio 与本地渲染。**

**③ Start in a design tool if the look is the open question**——Figma、Claude Design、Open Design 先定品牌、版式与场景方向；把草稿交给编码代理做运动、媒体与渲染——**没有设计工具能告诉你动起来对不对**。

**④ Start in HeyGen if you want it done for you**——Video Agent 接一条提示词，组装脚本、视觉、旁白、头像与运动；**留在 HeyGen 里面——没有文件夹、没有源码、没有 CLI**，可能消耗账号额度或积分；而你电脑上的渲染永远不耗。

本地场所独占的进阶面（篇二已详拆）：`cloud render / lambda / cloudrun` 渲染基础设施编程、`render --batch` 批量生产、`hyperframes figma` REST 直拉、`transcribe / tts / remove-background` 媒体深度加工。代价是养环境（Node 22、FFmpeg、浏览器）——对工程师这是主场。「留在本地」的迁移方向是单向偏好的：任何场所起稿，要吃满能力面都得回到本地文件项目——这也是整个系列反复强调「项目是文件」的原因。

## 四、和 Studio 的关系（防混淆）

（源：[Studio](https://hyperframes.heygen.com/studio/index)；本地进阶面细节见[篇二](/posts/hyperframes-thirty-days-phase-1/)）

Studio 不是第五个「创作场所」，而是**本地项目的可视化工作面**：`npx hyperframes preview --background` 打开的 storyboard 板 / 画布 / 时间线，编辑的还是那个 HTML 项目（Day 13-14 拆过）。场所四选一决定「项目和代理在哪」，Studio 决定「你用眼睛还是用终端看项目」。

## 五、合起来的完整决策链

（源：[Choose a workflow](https://hyperframes.heygen.com/workflows) × [Choose how to create](https://hyperframes.heygen.com/guides/choose-creation-path)）

1. **手头有什么？** → 查 `/workflows` 的九行表，对号入座（多源并重 → general-video；不想选 → 裸 `/hyperframes` 让代理选）；
2. **在哪做？** → 查 `/guides/choose-creation-path` 的四个判断条件（会反复改 → 本地；不想装 → 聊天；观感未定 → 设计工具；全托管 → HeyGen）；
3. **怎么开口？** → 进入 [Prompt Guide](/posts/hyperframes-thirty-days-prompt-guide/) 的两段式提示词与访谈。

下一篇正是这条链的第三环：Prompt Guide 深读。
