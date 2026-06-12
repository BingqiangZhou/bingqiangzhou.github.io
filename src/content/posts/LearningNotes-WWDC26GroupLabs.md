---
title: 【学习笔记】WWDC 2026 开幕直播与全部 19 场 Group Lab 要点
published: 2026-06-12
description: WWDC26 开幕直播（Keynote、PSOTU）与全部 19 场 Group Lab（小组讨论）的要点合集，按天分组整理；补全官方目录中遗漏的场次，附编号与日期的存疑说明。
lang: zh
tags: [学习笔记, Apple, WWDC]
toc: true
---

> 想快速了解 WWDC26 全貌与导航，见[《WWDC 2026 总览》导读](/posts/learningnotes-wwdc26overview/)。Group Lab（小组讨论）是 WWDC26 中由 Apple 工程师与设计师主持的在线实时问答与讨论环节，每场约 1 小时，开发者可以倾听、提问、获取建议并参与讨论。本篇合并自原先按天记录的 Day 2 / Day 3 / Day 4 三篇笔记中的 Lab 段落，并据 [Apple 开发者官网目录](https://developer.apple.com/videos/wwdc2026/) 补全了原笔记遗漏的 9 场，覆盖官方目录中全部 **19 场 Group Lab**，并在第 1 天简要记录大会开幕直播（Keynote、PSOTU）。这两场及相关技术讲座的逐场深度要点另见《WWDC 2026 全部视频讲座总结》一篇，本篇仅作提要、不重复展开。

## 概览

WWDC26 为期 5 天（太平洋时间 6 月 8 日–12 日）。Group Lab 在第 2–5 天举行，每天通常 9:00 a.m. 起、每 2 小时一场。下表按天汇总（**⚠️ 标记为推断，详见末节说明**）：

| 天 | 日期 | Lab 数 | 覆盖主题 | 置信度 |
|---|---|---|---|---|
| 第 1 天 | 6 月 8 日（Keynote） | — | 开幕直播：Keynote(#101) + PSOTU(#102)；无 Group Lab | 确定 |
| 第 2 天 ⚠️ | 6 月 9 日 | 6 | Swift、SwiftUI 入门、性能、visionOS、无障碍、AI/ML | 推断 |
| 第 3 天 | 6 月 10 日 | 5 | SwiftUI、隐私安全、Icon Composer、Safari/Web、相机/照片 | 原笔记 |
| 第 4 天 | 6 月 11 日 | 6 | Apple Intelligence、编码智能入门、Xcode、watchOS、App Store、SwiftUI | 原笔记 |
| 第 5 天 | 6 月 12 日（今天） | 2 | 机器学习 & AI、SwiftData | 官方“Live on June 12”确定 |

---

## 一、第 1 天（6 月 8 日）—— 大会开幕直播

第 1 天没有 Group Lab，但有两场面向全球直播的重磅开场（均为 WWDC26 全周期视频目录的组成部分）：

- **Keynote（主题演讲，[#101](https://developer.apple.com/videos/play/wwdc2026/101/)，约 76 分钟）**：Apple 发布 iOS 27、iPadOS 27、macOS 27、watchOS 27、visionOS 27、tvOS 27，以及新一代 Apple Intelligence、由 Gemini 技术驱动的 Siri、Liquid Glass 设计语言等，约 70% 内容与 AI 相关。
- **Platforms State of the Union（[#102](https://developer.apple.com/videos/play/wwdc2026/102/)，约 61 分钟）**：面向开发者的技术综述，介绍各平台新 API 与开发者工具——Foundation Models 框架重建、全新 Core AI 设备端推理框架、Xcode 27 编码代理、Liquid Glass 迁移指南等。

> 这两场的逐场深度要点见《WWDC 2026 全部视频讲座总结》第二、三节，本篇仅作提要。

---

## 二、第 2 天（6 月 9 日）⚠️ 日期为推断

原四篇按天笔记从未记录这一天的任何 Lab，但官方目录中以下 6 场**已有回放时长**（即属本周最早直播的一批）。Apple 官方不发布逐日 Lab 日程，因此将它们归入最早的 Lab 日（第 2 天），**具体归属为推断，请勿当作确定结论**：

- **#8001 Swift Group Lab**：与 Apple 工程师讨论 Swift 语言相关发布，对应技术讲座《What's new in Swift》（#262）等内容的问答延伸。
- **#8002 SwiftUI for Beginners Group Lab**：面向初学者的 SwiftUI 入门问答（**英文进行**），适合刚接触声明式 UI 的开发者提问、获取上手建议。
- **#8003 Power and Performance Group Lab**：应用性能与功耗优化主题，涵盖性能调优、Instruments 分析与能耗最佳实践。
- **#8004 visionOS Group Lab**：visionOS 27 与空间计算主题，对应《Build next generation experiences with visionOS 27》（#287）等技术讲座的 Lab 问答。
- **#8005 Accessibility Technologies Group Lab**：无障碍技术主题，涵盖 VoiceOver、辅助功能 API、Dynamic Type 等最佳实践。
- **#8121 Coding Intelligence, Machine Learning & AI Group Lab**：编码智能 / 机器学习 / AI 综合主题，涵盖 Foundation Models、Core AI、MLX 等本周重要发布的讨论。

---

## 三、第 3 天（6 月 10 日）

来自原 Day 2 笔记，5 场：

- **#8006 SwiftUI Group Lab**（9:00 a.m. PDT）：与 Apple 工程师、设计师在线互动，深入讨论 WWDC26 中 SwiftUI 相关的主要发布内容；可提问、获取建议并参与 SwiftUI 新功能的讨论。
- **#8009 Privacy and Security Group Lab**：隐私与安全主题互动讨论，与 Apple 工程师探讨应用安全最佳实践、隐私保护框架更新等内容。
- **#8012 Icon Composer for Beginners Group Lab**：Icon Composer 入门小组讨论，适合初学者了解如何使用 Icon Composer 工具创建应用图标。
- **#8015 Safari and Web Technologies Group Lab**：Safari 与 Web 技术主题讨论，涵盖 Safari 27 新特性、WebKit 更新、Web 扩展开发等话题。
- **#8018 Camera and Photo Technologies Group Lab**：相机与照片技术主题讨论，涵盖 AVFoundation 相机 API 更新、高分辨率照片捕获、Center Stage 等话题。

---

## 四、第 4 天（6 月 11 日）

合并自原 Day 3 与 Day 4 两篇笔记（两篇均标 6 月 11 日、内容高度重复，此处合并去重），6 场，每 2 小时一场：

- **#8011 Apple Intelligence Group Lab**（9:00 a.m.）：与 Apple 工程师、设计师在线深入讨论本周最重要的 Apple Intelligence 发布——Foundation Models 框架、Private Cloud Compute 上的 Apple Foundation Model、App Intents、Core AI、Siri 与 App Schemas、Evaluations 框架、Visual Intelligence、Image Playground 等。
- **#8007 Coding Intelligence for Beginners Group Lab**（11:00 a.m.）：面向初学者的编码智能讨论，涵盖 Xcode 27 中的 AI 代理（Agentic Coding）、代码补全，以及如何借助 AI 学习 Swift / SwiftUI；可了解如何利用 AI 工具提升开发效率。
- **#8013 Xcode Tips and Tricks Group Lab**（1:00 p.m.）：Xcode 效率技巧主题，包括快捷键、调试技巧、编码代理的深度使用、Device Hub 多设备管理等 Xcode 27 新功能的最佳实践。
- **#8014 watchOS Group Lab**（3:00 p.m.）：watchOS 27 新 API、健康与健身数据集成、Complications 开发、Apple Watch 应用性能优化，以及从 watchOS 调用 Private Cloud Compute 等新能力。
- **#8010 App Store Connect Group Lab**（5:00 p.m.）：应用提交、测试、分发、留存消息（Retention Messaging）、订阅管理、应用分析、App Review 流程及新的商务功能（如组织订阅）。
- **SwiftUI Group Lab**（7:00 p.m.）：SwiftUI 在 iOS 27 / macOS 27 等平台上的最新功能讨论，涵盖 Liquid Glass 设计语言适配、拖放 API、懒加载栈与滚动、高级图形效果等。**本场编号存疑，见末节说明。**

---

## 五、第 5 天（6 月 12 日，今天）

官方目录明确标注“Live on June 12”，2 场：

- **#8016 Machine Learning & AI Group Lab**（9:00 a.m.）：机器学习与 AI 主题综合讨论，与 Apple 工程师探讨本周 ML / AI 相关发布。
- **#8017 SwiftData Group Lab**（11:00 a.m.）：SwiftData 持久化框架主题，对应《What's new in SwiftData》（#274）等内容的问答延伸。

---

## 六、关于编号与日期的说明（准确性提示）

整理过程中发现原按天笔记存在若干不一致，本篇已做如下处理，**凡不确定处一律标注而非臆断**：

1. **第 2 天（6 月 9 日）为推断**：原四篇笔记完全未记录 `#8001`–`#8005`、`#8121` 这 6 场。它们在官方目录里已附回放时长（属本周最早直播的一批），故归入最早的 Lab 日，但 Apple 官方不发布逐日 Lab 日程，**具体是第几天无法确定**。

2. **6 月 11 日 7:00 p.m. 的 SwiftUI Lab 编号有歧义**：原 Day 3 笔记将其标为 `#8006`、原 Day 4 笔记标为 `#8012`。但官方目录中 `#8012` 实为 **Icon Composer for Beginners**、`#8006` 是 6 月 10 日 9:00 a.m. 那场 SwiftUI——两者都不应是 6/11 晚场。官方目录另有第三个 SwiftUI 实例 `#8120`（SwiftUI Group Lab，无状态标记），6/11 晚场更可能是 `#8120`，但**无法确证**，故正文仅写“SwiftUI Group Lab（7:00 p.m.）”而不强行附编号。

3. **同一编号只播一次**：`#8006` 只在第 3 天（6/10 9:00 a.m.）列出一次，不再重复出现在 6/11。SwiftUI 主题本周确实多次开讲，但每次是不同编号的独立场次（#8006、#8120、以及入门向的 #8002）。

4. **Lab 的内容性质**：每场 Group Lab 是实时问答，官方页面的描述为通用模板（“Join us online for a deep dive…”），除 #8002 标明“面向 SwiftUI 入门、英文进行”外，其余各场的**具体问答内容官方未公开文字记录**。因此本篇要点按主题范围概括，不杜撰具体的问答细节。

---

## 数据来源

1. [Apple Developer — WWDC26 Videos 目录（含全部 Lab 卡片与状态标记）](https://developer.apple.com/videos/wwdc2026/)
2. [Apple Developer — WWDC26 Group Labs 日程](https://developer.apple.com/wwdc26/schedule/group-labs)
3. 各场 Lab 官方页面（按编号）：[#8001](https://developer.apple.com/videos/play/wwdc2026/8001/) · [#8002](https://developer.apple.com/videos/play/wwdc2026/8002/) · [#8003](https://developer.apple.com/videos/play/wwdc2026/8003/) · [#8004](https://developer.apple.com/videos/play/wwdc2026/8004/) · [#8005](https://developer.apple.com/videos/play/wwdc2026/8005/) · [#8006](https://developer.apple.com/videos/play/wwdc2026/8006/) · [#8007](https://developer.apple.com/videos/play/wwdc2026/8007/) · [#8009](https://developer.apple.com/videos/play/wwdc2026/8009/) · [#8010](https://developer.apple.com/videos/play/wwdc2026/8010/) · [#8011](https://developer.apple.com/videos/play/wwdc2026/8011/) · [#8012](https://developer.apple.com/videos/play/wwdc2026/8012/) · [#8013](https://developer.apple.com/videos/play/wwdc2026/8013/) · [#8014](https://developer.apple.com/videos/play/wwdc2026/8014/) · [#8015](https://developer.apple.com/videos/play/wwdc2026/8015/) · [#8016](https://developer.apple.com/videos/play/wwdc2026/8016/) · [#8017](https://developer.apple.com/videos/play/wwdc2026/8017/) · [#8018](https://developer.apple.com/videos/play/wwdc2026/8018/) · [#8120](https://developer.apple.com/videos/play/wwdc2026/8120/) · [#8121](https://developer.apple.com/videos/play/wwdc2026/8121/)
