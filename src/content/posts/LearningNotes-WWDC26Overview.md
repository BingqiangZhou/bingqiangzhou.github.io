---
title: 【学习笔记】WWDC 2026 总览:一文看懂 WWDC26
published: 2026-06-12
description: WWDC26（2026 年 6 月 8–12 日）的读者导读——一句话头条、去哪看导航与 13 大主题速览，深度内容链接到《全部视频讲座总结》与《全部 Group Lab 要点》两篇。
lang: zh
tags: [学习笔记, Apple, WWDC]
toc: true
---

> WWDC26 于 2026 年 6 月 8–12 日举行。Apple 官方视频目录共 136 项，其中 **117 场技术讲座** + **19 场 Group Lab（小组讨论）**。本篇是面向读者的**导读**：用最少的篇幅说清“WWDC26 到底讲了啥”，并告诉你深度内容去哪看。技术讲座逐场要点见[《WWDC 2026 全部视频讲座总结》](/posts/learningnotes-wwdc26allsessionssummary/)，互动讨论见[《WWDC 2026 开幕直播与全部 Group Lab 要点》](/posts/learningnotes-wwdc26grouplabs/)。

## 一、一句话头条

- **Liquid Glass 设计语言**：贯穿 iOS / iPadOS / macOS / watchOS / visionOS / tvOS 27，半透明玻璃质感的全新视觉语言。
- **Apple Intelligence 三件套**：开源的 **Foundation Models 框架**（重建的设备端模型，新增视觉理解）、全新的 **Core AI** 设备端推理框架（覆盖 CPU / GPU / 神经引擎）、**Private Cloud Compute** 上的 Apple Foundation Model（32K 上下文、支持推理，无需账户 / 密钥）。
- **Siri × Gemini**：Siri 由 Gemini 技术驱动，从功能级工具升级为系统级 Agent，可通过 App Schemas 深度理解应用功能与数据。
- **Xcode 27 编码代理**：Coding Agents 内置编辑器、Device Hub 多设备管理、安装包缩小 30%。
- **visionOS 27 / 空间计算**：RealityKit 增强、Reality Composer Pro 3、Spatial Web、Apple Immersive Video 制作工具。
- **全平台 OS 27**：iOS / iPadOS / macOS / watchOS / tvOS 27 同步更新，约 70% 内容与 AI 相关。

## 二、去哪看（导航）

| 你想看 | 去这篇 |
|---|---|
| 大会开幕：Keynote（#101）/ Platforms State of the Union（#102） | [Group Lab 篇 · 第一节](/posts/learningnotes-wwdc26grouplabs/) 或 [技术讲座篇 · 第二 / 三节](/posts/learningnotes-wwdc26allsessionssummary/) |
| 某个主题的技术深度（13 大主题） | [《全部视频讲座总结》](/posts/learningnotes-wwdc26allsessionssummary/) |
| 117 场会话的编号速查表 | [《全部视频讲座总结》· 速查表](/posts/learningnotes-wwdc26allsessionssummary/) |
| 19 场 Group Lab / 互动讨论 | [《开幕直播与全部 Group Lab 要点》](/posts/learningnotes-wwdc26grouplabs/) |
| 每日速览 Dub Dub Daily | [《全部视频讲座总结》· 第十六节](/posts/learningnotes-wwdc26allsessionssummary/) |

## 三、13 大主题速览

下面是 WWDC26 技术讲座覆盖的 13 个主题方向（逐场深度要点见[《全部视频讲座总结》](/posts/learningnotes-wwdc26allsessionssummary/)，点进去用页面目录钻取）：

| 主题 | 一句话 |
|---|---|
| AI / Foundation Models / Core AI | 大会核心：开源 Foundation Models、Core AI 推理框架、Private Cloud Compute、MLX、Evaluations |
| Siri / App Intents / Shortcuts | Gemini 驱动的新 Siri、App Schemas、App Intents 新能力 |
| 视觉智能 / 图像 / Image Playground | 图像理解、本地 RAG 搜索、Image Playground 图像生成 |
| Xcode 27 / 开发工具 | Coding Agents、Device Hub、UI 原型、Instruments |
| SwiftUI | Liquid Glass 适配、拖放、懒加载栈、高级图形 |
| Swift / SwiftData | Swift 语言更新、Swift Testing、SwiftData 持久化 |
| UIKit / AppKit / TextKit | 传统框架现代化、渐进迁移到 SwiftUI |
| Web / Safari | WebKit / Safari 27、CSS Grid Lanes、HTML Model 元素 |
| visionOS / RealityKit / 空间计算 | visionOS 27、Reality Composer Pro 3、Spatial Web、Immersive Video |
| Metal / 游戏 / 图形 | Metal 4、神经渲染、游戏移植（Cyberpunk 2077 上 Mac） |
| 相机 / 照片 / 媒体 | AVFoundation 相机、高分辨率捕获、Music Understanding |
| 其他框架 / 设计 / 隐私安全 | 设计原则、App Attest、agentic 安全、健康 / 钱包 / CarPlay 等 |
| Dub Dub Daily | 每日约 5–7 分钟的大会速览视频 |

## 四、说明

- 本篇为**导读**，只给高层概览与导航；具体技术细节、117 场编号速查、以及日期 / 编号存疑说明，均见上两篇深度笔记各自的开头与“说明”章节。
- 数据来源：[Apple Developer — WWDC26 视频目录](https://developer.apple.com/videos/wwdc2026/)。
