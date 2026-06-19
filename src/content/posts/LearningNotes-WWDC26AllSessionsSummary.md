---
title: 【学习笔记】WWDC 2026 全部视频讲座总结：Keynote + PSOTU + 100+ 技术会话（不含 Labs）
published: 2026-06-12
description: WWDC26 所有视频讲座的统一总结——涵盖 Keynote(#101)、Platforms State of the Union(#102)及 100+ 场技术会话，按 13 大主题分类，附全部会话编号速查表；不含 Group Lab 互动环节。
lang: zh
tags: [学习笔记, Apple, WWDC]
toc: true
---

> 想快速了解 WWDC26 全貌与导航，见[《WWDC 2026 总览》导读](/posts/learningnotes-wwdc26overview/)。本篇是 WWDC26 **所有视频讲座**（Keynote、Platforms State of the Union、100+ 技术会话、Dub Dub Daily）的统一总结，按主题分类。**不含 Group Lab**——全部 19 场 Group Lab（小组讨论属实时互动环节）已独立整理在《WWDC 2026 全部 19 场 Group Lab 要点合集》一篇中。Apple 官方对单场技术讲座并不按"第几天"打标签，讲座是大会级目录、全周持续上线，因此本篇不再按天组织，而是汇总成一份完整的技术参考。
>
> 说明：本篇 **纳入了最重要的两个视频（Keynote / PSOTU）要点**，并附 **全部会话编号速查表**；各技术会话的逐场要点见下文按主题分类的章节。

## 概览

| 视频类型 | 代表编号 | 说明 |
|---|---|---|
| Keynote（主题演讲） | [#101](https://developer.apple.com/videos/play/wwdc2026/101/) / [#111](https://developer.apple.com/videos/play/wwdc2026/111/)(ASL) | 面向所有人的产品与平台发布，76 分钟 |
| Platforms State of the Union | [#102](https://developer.apple.com/videos/play/wwdc2026/102/) / [#112](https://developer.apple.com/videos/play/wwdc2026/112/)(ASL) | 面向开发者的技术综述，61 分钟 |
| 技术会话（Sessions） | [#201](https://developer.apple.com/videos/play/wwdc2026/201/) – [#393](https://developer.apple.com/videos/play/wwdc2026/393/) 等 | 100+ 场，横跨 13 大主题 |
| Dub Dub Daily | [#397](https://developer.apple.com/videos/play/wwdc2026/397/) 等 | 每日速览视频 |
| **本文不含** | Group Labs #8006–#8018 | 实时小组讨论（见 Day 2 / Day 3） |

官方明确：「Throughout the week, developers and students can watch **more than 100 new video sessions**」（[Apple 新闻室](https://www.apple.com/newsroom/2026/05/apple-kicks-off-worldwide-developers-conference-on-june-8/)）。经直接抓取[官方目录](https://developer.apple.com/videos/wwdc2026/)逐项核实：视频共 **119 场**（含 Keynote、Platforms State of the Union、特别演讲与 Dub Dub Daily 等；另有 19 场 Group Lab，本文不含）。本文已覆盖全部 119 场。

---

## 一、全部会话编号速查表

> 按编号排序，便于查找。完整 100+ 目录以 [developer.apple.com/videos/wwdc2026/](https://developer.apple.com/videos/wwdc2026/) 为准。

| 编号 | 标题 | 分类 |
|---|---|---|
| [101](https://developer.apple.com/videos/play/wwdc2026/101/) | Keynote | 特别 |
| [102](https://developer.apple.com/videos/play/wwdc2026/102/) | Platforms State of the Union | 特别 |
| [111](https://developer.apple.com/videos/play/wwdc2026/111/) | Keynote (ASL) | 特别 |
| [112](https://developer.apple.com/videos/play/wwdc2026/112/) | Platforms State of the Union (ASL) | 特别 |
| [121](https://developer.apple.com/videos/play/wwdc2026/121/) | Announcing Apple's next big step for Siri and iPhone | 特别 |
| [122](https://developer.apple.com/videos/play/wwdc2026/122/) | WWDC26 Platforms State of the Union Recap | 特别 |
| [201](https://developer.apple.com/videos/play/wwdc2026/201/) | Secure your apps with App Attest | 安全 |
| [203](https://developer.apple.com/videos/play/wwdc2026/203/) | Read between the strokes with PencilKit | 手写/媒体 |
| [204](https://developer.apple.com/videos/play/wwdc2026/204/) | What’s new in WebKit for Safari 27 | Web |
| [205](https://developer.apple.com/videos/play/wwdc2026/205/) | Enhance your presence on the App Store | App Store |
| [206](https://developer.apple.com/videos/play/wwdc2026/206/) | What’s new in managing Apple devices | 设备管理 |
| [207](https://developer.apple.com/videos/play/wwdc2026/207/) | Deliver workout insights with HealthKit workout zones | 健康 |
| [209](https://developer.apple.com/videos/play/wwdc2026/209/) | What’s new in Wallet | 钱包 |
| [210](https://developer.apple.com/videos/play/wwdc2026/210/) | What’s new in Apple In-App Purchase | 钱包/支付 |
| [212](https://developer.apple.com/videos/play/wwdc2026/212/) | Rev up your CarPlay app | CarPlay |
| [213](https://developer.apple.com/videos/play/wwdc2026/213/) | Translate your app using agents in Xcode | Xcode |
| [215](https://developer.apple.com/videos/play/wwdc2026/215/) | Get started with the HTML Model Element | Web |
| [216](https://developer.apple.com/videos/play/wwdc2026/216/) | Create web extensions for Safari | Web |
| [219](https://developer.apple.com/videos/play/wwdc2026/219/) | Enhance the accessibility of your reading app | 无障碍 |
| [220](https://developer.apple.com/videos/play/wwdc2026/220/) | Refine accessibility for custom controls | 无障碍 |
| [221](https://developer.apple.com/videos/play/wwdc2026/221/) | Prepare your tvOS apps for Dynamic Type | tvOS |
| [222](https://developer.apple.com/videos/play/wwdc2026/222/) | Meet the new MetricKit | 性能 |
| [223](https://developer.apple.com/videos/play/wwdc2026/223/) | Live Activities essentials | 实时体验 |
| [224](https://developer.apple.com/videos/play/wwdc2026/224/) | Expand the capabilities of your Virtualization app | 开发工具 |
| [226](https://developer.apple.com/videos/play/wwdc2026/226/) | Create live communication experiences | 实时体验 |
| [227](https://developer.apple.com/videos/play/wwdc2026/227/) | Create UI prototypes using agents in Xcode | Xcode |
| [230](https://developer.apple.com/videos/play/wwdc2026/230/) | What’s new in assessment on macOS | 评估/安全 |
| [232](https://developer.apple.com/videos/play/wwdc2026/232/) | Run local agentic AI on the Mac using MLX | AI |
| [233](https://developer.apple.com/videos/play/wwdc2026/233/) | Explore distributed inference and training with MLX | AI |
| [234](https://developer.apple.com/videos/play/wwdc2026/234/) | Design immersive environments for visionOS apps and the spatial web | 设计/visionOS |
| [237](https://developer.apple.com/videos/play/wwdc2026/237/) | What’s new in image understanding | 视觉智能 |
| [240](https://developer.apple.com/videos/play/wwdc2026/240/) | Build intelligent Siri experiences with App Schemas | Siri |
| [241](https://developer.apple.com/videos/play/wwdc2026/241/) | What’s new in the Foundation Models framework | AI |
| [242](https://developer.apple.com/videos/play/wwdc2026/242/) | Build agentic app experiences with the Foundation Models framework | AI |
| [243](https://developer.apple.com/videos/play/wwdc2026/243/) | Debug and profile agentic app experiences with Instruments | AI |
| [246](https://developer.apple.com/videos/play/wwdc2026/246/) | LLM search using Core Spotlight | 视觉智能 |
| [250](https://developer.apple.com/videos/play/wwdc2026/250/) | Principles of great design | 设计 |
| [251](https://developer.apple.com/videos/play/wwdc2026/251/) | Communicate your brand identity on iOS | 设计 |
| [252](https://developer.apple.com/videos/play/wwdc2026/252/) | Design no-code games with Reality Composer Pro 3 | visionOS |
| [253](https://developer.apple.com/videos/play/wwdc2026/253/) | Meet the Music Understanding framework | 媒体 |
| [254](https://developer.apple.com/videos/play/wwdc2026/254/) | Integrate MusicKit into your app | 媒体 |
| [256](https://developer.apple.com/videos/play/wwdc2026/256/) | Discover generated subtitles and subtitle styles | 媒体 |
| [258](https://developer.apple.com/videos/play/wwdc2026/258/) | What’s new in Xcode 27 | Xcode |
| [259](https://developer.apple.com/videos/play/wwdc2026/259/) | Xcode, agents, and you | Xcode |
| [260](https://developer.apple.com/videos/play/wwdc2026/260/) | Get the most out of Device Hub | Xcode |
| [261](https://developer.apple.com/videos/play/wwdc2026/261/) | Build, deliver, and automate with Xcode Cloud | Xcode |
| [262](https://developer.apple.com/videos/play/wwdc2026/262/) | What’s new in Swift | Swift |
| [265](https://developer.apple.com/videos/play/wwdc2026/265/) | Build real-time apps and services with gRPC and Swift | Swift |
| [267](https://developer.apple.com/videos/play/wwdc2026/267/) | Migrate to Swift Testing | Swift |
| [268](https://developer.apple.com/videos/play/wwdc2026/268/) | Profile, fix, and verify: Improve app responsiveness with Instruments | 性能 |
| [269](https://developer.apple.com/videos/play/wwdc2026/269/) | What's new in SwiftUI | SwiftUI |
| [271](https://developer.apple.com/videos/play/wwdc2026/271/) | Code-along: Build powerful drag and drop in SwiftUI | SwiftUI |
| [272](https://developer.apple.com/videos/play/wwdc2026/272/) | Use SwiftUI with AppKit and UIKit | SwiftUI |
| [274](https://developer.apple.com/videos/play/wwdc2026/274/) | What’s new in SwiftData | Swift |
| [275](https://developer.apple.com/videos/play/wwdc2026/275/) | Code-along: Add persistence with SwiftData | Swift |
| [277](https://developer.apple.com/videos/play/wwdc2026/277/) | WidgetKit foundations | SwiftUI |
| [278](https://developer.apple.com/videos/play/wwdc2026/278/) | Modernize your UIKit app | UIKit |
| [279](https://developer.apple.com/videos/play/wwdc2026/279/) | Explore advances in RealityKit | visionOS |
| [280](https://developer.apple.com/videos/play/wwdc2026/280/) | Iterate your spatial scenes faster with Reality Composer Pro 3 | visionOS |
| [281](https://developer.apple.com/videos/play/wwdc2026/281/) | Extend Reality Composer Pro 3 functionality with Xcode | visionOS |
| [282](https://developer.apple.com/videos/play/wwdc2026/282/) | Discover the Spatial Preview framework | visionOS |
| [283](https://developer.apple.com/videos/play/wwdc2026/283/) | Explore enhancements to visionOS object tracking | visionOS |
| [284](https://developer.apple.com/videos/play/wwdc2026/284/) | Collaborate on structured 3D models in visionOS | visionOS |
| [285](https://developer.apple.com/videos/play/wwdc2026/285/) | Discover USDKit and what's new in OpenUSD | visionOS |
| [286](https://developer.apple.com/videos/play/wwdc2026/286/) | Use foveated streaming to bring immersive content to visionOS | visionOS |
| [287](https://developer.apple.com/videos/play/wwdc2026/287/) | Build next-generation experiences with visionOS 27 | visionOS |
| [289](https://developer.apple.com/videos/play/wwdc2026/289/) | Modernize your AppKit app | AppKit |
| [290](https://developer.apple.com/videos/play/wwdc2026/290/) | Craft clear names for features and labels in your app | 设计 |
| [292](https://developer.apple.com/videos/play/wwdc2026/292/) | Design intuitive search experiences | 设计 |
| [295](https://developer.apple.com/videos/play/wwdc2026/295/) | Validate your App Intents adoption with AppIntentsTesting | Siri |
| [297](https://developer.apple.com/videos/play/wwdc2026/297/) | Best practices for integrating visual intelligence in your app | 视觉智能 |
| [298](https://developer.apple.com/videos/play/wwdc2026/298/) | Meet the Evaluations framework | AI |
| [299](https://developer.apple.com/videos/play/wwdc2026/299/) | Create robust evaluations for agentic apps | AI |
| [303](https://developer.apple.com/videos/play/wwdc2026/303/) | Build a responsive camera app that launches quickly | 相机 |
| [304](https://developer.apple.com/videos/play/wwdc2026/304/) | Implement high resolution photo capture | 相机 |
| [305](https://developer.apple.com/videos/play/wwdc2026/305/) | Enhance RAW image processing with Core Image | 媒体 |
| [309](https://developer.apple.com/videos/play/wwdc2026/309/) | Explore Retention Messaging in App Store Connect | 其他 |
| [310](https://developer.apple.com/videos/play/wwdc2026/310/) | What's new in Shortcuts | Siri |
| [312](https://developer.apple.com/videos/play/wwdc2026/312/) | Meet the Now Playing framework | 媒体 |
| [314](https://developer.apple.com/videos/play/wwdc2026/314/) | Learn CSS Grid Lanes | Web |
| [315](https://developer.apple.com/videos/play/wwdc2026/315/) | Rediscover the HTML select element | Web |
| [319](https://developer.apple.com/videos/play/wwdc2026/319/) | Build with the new Apple Foundation Model on Private Cloud Compute | AI |
| [320](https://developer.apple.com/videos/play/wwdc2026/320/) | Explore immersive website environments in visionOS | visionOS/Web |
| [321](https://developer.apple.com/videos/play/wwdc2026/321/) | Dive into lazy stacks and scrolling with SwiftUI | SwiftUI |
| [322](https://developer.apple.com/videos/play/wwdc2026/322/) | Compose advanced graphics effects with SwiftUI | SwiftUI |
| [324](https://developer.apple.com/videos/play/wwdc2026/324/) | Meet Core AI | AI |
| [325](https://developer.apple.com/videos/play/wwdc2026/325/) | Dive into Core AI model authoring and optimization | AI |
| [326](https://developer.apple.com/videos/play/wwdc2026/326/) | Integrate on-device AI models into your app using Core AI | AI |
| [328](https://developer.apple.com/videos/play/wwdc2026/328/) | Explore numerical computing in Swift with MLX | AI |
| [330](https://developer.apple.com/videos/play/wwdc2026/330/) | Optimize custom machine learning operations with Metal tensors | Metal |
| [334](https://developer.apple.com/videos/play/wwdc2026/334/) | Build AI-powered scripts with the fm CLI and Python SDK | AI |
| [335](https://developer.apple.com/videos/play/wwdc2026/335/) | Improve your prompts by hill-climbing with Evaluations | AI |
| [338](https://developer.apple.com/videos/play/wwdc2026/338/) | Build live production tools for Apple Immersive Video | visionOS |
| [339](https://developer.apple.com/videos/play/wwdc2026/339/) | Bring an LLM provider to the Foundation Models framework | AI |
| [341](https://developer.apple.com/videos/play/wwdc2026/341/) | Support the Center Stage front camera in your iOS app | 相机 |
| [343](https://developer.apple.com/videos/play/wwdc2026/343/) | Explore advanced App Intents features for Siri and Apple Intelligence | Siri |
| [344](https://developer.apple.com/videos/play/wwdc2026/344/) | Code-along: Make your app available to Siri | Siri |
| [345](https://developer.apple.com/videos/play/wwdc2026/345/) | Discover new capabilities in the App Intents framework | Siri |
| [347](https://developer.apple.com/videos/play/wwdc2026/347/) | Secure your app: mitigate risks to agentic features | AI/安全 |
| [356](https://developer.apple.com/videos/play/wwdc2026/356/) | Bringing Cyberpunk 2077 to Mac | 游戏 |
| [357](https://developer.apple.com/videos/play/wwdc2026/357/) | Speedrun your game port with agentic coding | 游戏 |
| [358](https://developer.apple.com/videos/play/wwdc2026/358/) | Make your game great with touch | 游戏 |
| [359](https://developer.apple.com/videos/play/wwdc2026/359/) | Build real-time neural rendering pipelines with Metal | Metal |
| [369](https://developer.apple.com/videos/play/wwdc2026/369/) | Find your accessory with Bluetooth Channel Sounding | 蓝牙 |
| [370](https://developer.apple.com/videos/play/wwdc2026/370/) | Elevate your app's text experience with TextKit | UIKit/文本 |
| [372](https://developer.apple.com/videos/play/wwdc2026/372/) | Unwrap PaperKit | 手写/媒体 |
| [375](https://developer.apple.com/videos/play/wwdc2026/375/) | Create high-quality images using Image Playground | 视觉智能 |
| [378](https://developer.apple.com/videos/play/wwdc2026/378/) | Unlock in-game content with StoreKit and Background Assets | 游戏 |
| [379](https://developer.apple.com/videos/play/wwdc2026/379/) | Meet Trust Insights | 安全 |
| [382](https://developer.apple.com/videos/play/wwdc2026/382/) | Inside Apple Intelligence and Xcode: Special Presentation | AI |
| [388](https://developer.apple.com/videos/play/wwdc2026/388/) | Find and fix performance issues in your Metal games | 游戏 |
| [389](https://developer.apple.com/videos/play/wwdc2026/389/) | Discover container machines | 开发工具 |
| [391](https://developer.apple.com/videos/play/wwdc2026/391/) | Offer subscriptions to groups and organizations | App Store |
| [393](https://developer.apple.com/videos/play/wwdc2026/393/) | Supercharge your spatial workflows with Reality Composer Pro 3 | visionOS |
| [394](https://developer.apple.com/videos/play/wwdc2026/394/) | Get ready for WWDC26 | 特别 |
| [397](https://developer.apple.com/videos/play/wwdc2026/397/) | Dub Dub Daily: Day 2 | 特别 |
| [398](https://developer.apple.com/videos/play/wwdc2026/398/) | Dub Dub Daily: Day 3 | 特别 |
| [399](https://developer.apple.com/videos/play/wwdc2026/399/) | Dub Dub Daily: Day 4 | 特别 |
| [400](https://developer.apple.com/videos/play/wwdc2026/400/) | Dub Dub Daily: Day 5 | 特别 |

---

## 二、Keynote（[#101](https://developer.apple.com/videos/play/wwdc2026/101/)）要点

WWDC26 主题演讲，时长 76 分钟，约 70% 内容与 AI 相关。

### Siri AI：自 2011 年以来最彻底的重构

- 与 Google 合作，基于定制 Gemini 打造，正式从语音助手进化为 **AI Agent**。
- 首次拥有**独立 App**（类 ChatGPT 聊天界面），支持多轮对话、行程规划、自动删除聊天记录、iCloud 跨设备同步。
- **三大核心能力**：上下文记忆、屏幕感知（联动相册/短信等本地信息）、视觉智能（相机实时识别食物热量/翻译/营养标签/名片）。
- **模型自由**：可将 ChatGPT、Claude 等设为默认引擎；系统级 Extensions 让 App Store 聊天机器人直接接入 Siri。
- **隐私**：设备端 + Private Cloud Compute 双架构，数据不存储不外传；与 Google 合作的 Gemini 运行在 Apple PCC 服务器。
- 首发仅限美国（英语），暂不支持中国大陆和欧盟。

### Apple Intelligence 系统级升级

- 照片 AI 编辑：Extend（智能扩图）、Reframe（空间重构）、Clean Up（清理重建）、自然语言编辑；自动携带隐藏 SynthID 水印。
- Safari：Tab Topics 整理标签、Notify Me 网页更新通知、Describe an Extension 自然语言生成扩展。
- 密码 App：一键修复弱密码/泄露密码，可代用户安全登录。
- 快捷指令支持自然语言创建；Image Playground 支持照片级写实风格（运行在 PCC）。

### 六大操作系统

- **iOS 27**：Snow Leopard 式务实进化，内存占用减少 20%、续航延长 1-2 小时、应用启动提速 30%；iPhone 11 起可升级；相机新增"Siri 模式"。
- **macOS 27 Golden Gate**：**正式停止支持 Intel Mac**（仅 M1 及后续）；系统级透明度调节滑块。
- **iPadOS 27**：共享 iOS AI 能力，台前调度 AI 自动整理窗口。
- **watchOS 27**：AI 分析心率睡眠提前预警；Siri AI 登陆 Apple Watch。
- **visionOS 27**：Siri 以可移动 3D 悬浮球呈现，无需唤醒词直视对话。
- **tvOS 27**：AI 将普通视频超分至 4K，支持 HDR10+。

### Liquid Glass 设计语言优化

系统级透明度滑块、全新图标设计、控件层叠优化。

### 人事变动

Tim Cook 作为 CEO 的最后一次 WWDC；John Ternus 于 2026 年 9 月 1 日接任 CEO，Cook 转任董事会执行董事长（[Apple 新闻室](https://www.apple.com/newsroom/2026/04/tim-cook-to-become-apple-executive-chairman-john-ternus-to-become-apple-ceo/)）。

---

## 三、Platforms State of the Union（[#102](https://developer.apple.com/videos/play/wwdc2026/102/)）要点

面向开发者的技术综述，时长 61 分 38 秒，围绕三大支柱：**Apple Intelligence（AI 框架）、平台设计（Liquid Glass）、开发者生产力（Xcode 27 代理编码）**。

### Apple Intelligence 开发者框架

- **Foundation Models 框架重建**：与 Google 合作基于 Gemini 技术重建，支持图像输入与云端模型集成。
- **Dynamic Profiles**：声明式 agentic 原语，单个会话动态切换指令和工具。
- **Core AI 框架**：全新设备端模型运行框架，内置于操作系统，充分发挥 Apple Silicon。
- **免费 PCC 访问**：首启下载量 < 200 万的开发者可免费使用 Apple Foundation Models。
- **开源**：Foundation Models 框架夏季末开源。

### Liquid Glass 开发者迁移

退出 Liquid Glass 的选项被移除，Xcode 27 重新编译自动采用新设计；macOS 统一更紧凑圆角；iPhone 应用可在 iPad / Mac iPhone Mirroring 上调整大小。

### SwiftUI 与 Swift

- SwiftUI：可重排容器、嵌套布局调整大小提速 2 倍、懒状态初始化、自动异步图像缓存。
- Swift 6.4：`anyAppleOS` 可用性简写、defer 块中的 async 支持。
- Notion 作为从跨平台 Web 迁移到原生 SwiftUI 的主要案例。

### Xcode 27 与开发者工具

- 体积缩小 30%，为 Apple Silicon 打造；设置 iCloud 同步、可自定义工具栏、色彩主题。
- **Device Hub**：取代 Simulator，整合虚拟与物理设备。
- 代理编码扩展：可运行测试、使用 Playground、端到端驱动应用。
- 插件生态：Agent Client Protocol，Figma / GitHub 首发插件；与 Anthropic、OpenAI、Google 合作引入代理。

---

## 四、AI / Foundation Models / Core AI

### Inside Apple Intelligence and Xcode：特别演讲（[#382](https://developer.apple.com/videos/play/wwdc2026/382/)，约 88 分钟）

WWDC26 期间在 Steve Jobs Theater 录制的旗舰特别演讲，统揽本周 Apple Intelligence 与 Xcode 的核心进展：以 Xcode 27 的**编码代理（agentic coding）新工作流**加速开发、通过 **App Intents** 让 Siri 理解上下文并在 App 内执行操作、用 **Foundation Models 框架**交付智能功能、以及用 **Core AI** 部署自定义设备端模型。本场是上述各主题的总览入口，相关逐场深度要点见下文 #241、#242、#324、#326 等条目，涉及 Xcode 的部分另见 §七。

### What's new in the Foundation Models framework（[#241](https://developer.apple.com/videos/play/wwdc2026/241/)）

重建的设备端模型具备更强推理与工具调用能力；新增视觉（`Attachment(UIImage(...))`）；`PrivateCloudComputeLanguageModel` 提供 32K 上下文、推理级别、无需账户/密钥；`LanguageModel` 协议统一本地与服务器模型（开源 `CoreAILanguageModel`、`MLXLanguageModel`）；Anthropic/Google 发布 Swift 包；Dynamic Profiles、Evaluations 框架、`fm` CLI + Python SDK；核心框架开源可跑 Linux。

### Build agentic app experiences（[#242](https://developer.apple.com/videos/play/wwdc2026/242/)）

`DynamicProfile` 声明多 agent 配置；`DynamicInstructions` 组合可复用指令；按阶段配置模型（brainstorming/planning/reviewing）；`historyTransform` 管理历史；`onResponse`/`@SessionProperty` 生命周期；Baton-pass、Phone-a-friend 两种编排模式。

### Debug agentic apps with Instruments（[#243](https://developer.apple.com/videos/play/wwdc2026/243/)）

FoundationModels Instrument 模板检查 agentic 流程；三大指标 time-to-first-token / tokens-per-second / total latency。

### Meet the Evaluations framework（[#298](https://developer.apple.com/videos/play/wwdc2026/298/)）

衡量智能功能质量的新 Swift 框架；五步构建评估；与 Swift Testing 集成（`@Test` + `.evaluates`）；Xcode Evaluations Report；Hill-climbing 评估驱动开发；`ModelJudgeEvaluator` 模型评判。

### Create robust evaluations for agentic apps（[#299](https://developer.apple.com/videos/play/wwdc2026/299/)）

`makeSamples` 合成数据；`validator` 闭包；工具调用评估验证 how 不仅 what；轨迹期望（Trajectory Expectation）。

### Build with Apple Foundation Model on PCC（[#319](https://developer.apple.com/videos/play/wwdc2026/319/)）

一行切换 `PrivateCloudComputeLanguageModel`；三级推理（light/moderate/deep）；`quotaUsage` 限额处理；设备端 4K 上下文 vs PCC 32K。

### Meet Core AI（[#324](https://developer.apple.com/videos/play/wwdc2026/324/)）

设备端 AI 部署框架，驱动 Apple Intelligence，利用 CPU/GPU/ANE；`coreai-torch` 将 PyTorch 转 `.aimodel`；`AIModel` 加载、`NDArray` 输入、`run(inputs:)` 推理；KV 缓存优化、模型特化与 AOT 编译、Core AI instrument。

### Dive into Core AI model authoring（[#325](https://developer.apple.com/videos/play/wwdc2026/325/)）

`coreai-models` 开源仓库；`torch.export` → `TorchConverter` → `optimize()` → `save_asset()`；SAM3（850M 参数）int4 量化从 3GB 压至 430MB；独立 Core AI Debugger；`TorchMetalKernel` 自定义 Metal kernel。

### Integrate on-device AI models with Core AI（[#326](https://developer.apple.com/videos/play/wwdc2026/326/)）

SAM3 图像分割（`CoreAIImageSegmenter`）；`CoreAILanguageModel` 结合 `@Generable` 宏；`xcrun coreai-build compile` AOT 预编译。

### Bring an LLM provider to Foundation Models（[#339](https://developer.apple.com/videos/play/wwdc2026/339/)）

`LanguageModel` 协议 + `LanguageModelExecutor`；Transcript 映射；`prewarm()` 预热；流式响应；`LanguageModelError`。

### Build AI scripts with fm CLI and Python SDK（[#334](https://developer.apple.com/videos/play/wwdc2026/334/)）

`fm respond`/`fm chat`/`fm schema object`（预装 macOS 27）；`fm.generable` 装饰器；管道到 shell 脚本。

### Improve prompts by hill-climbing（[#335](https://developer.apple.com/videos/play/wwdc2026/335/)）

基于评估反馈迭代改进提示词；Cohen's Kappa 衡量一致性；Few-shot 示例改进模型评判。

### Secure your app: mitigate risks to agentic features（[#347](https://developer.apple.com/videos/play/wwdc2026/347/)）

间接提示注入；"致命三要素"（私有数据 + 不可信内容 + 外部通信）；`.onToolCall` 安全检查点；PII 脱敏、Spotlighting。

### Run local agentic AI on the Mac using MLX（[#232](https://developer.apple.com/videos/play/wwdc2026/232/)）

`mlx_lm.server` 本地运行 LLM；`mlx.launch` 分布式；`MLXLanguageModel` 接入 Foundation Models。

### Explore distributed inference and training with MLX（[#233](https://developer.apple.com/videos/play/wwdc2026/233/)）

JAXCL over Thunderbolt 5 RDMA；mesh/ring 拓扑；张量并行（默认）与管道并行；分布式微调。

### Explore numerical computing in Swift with MLX（[#328](https://developer.apple.com/videos/play/wwdc2026/328/)）

惰性求值、`eval()`；`grad` 自动微分；`conv2d`；NumPy 风格 Swift API、GPU 加速。

---

## 五、Siri / App Intents / Shortcuts

- **Build intelligent Siri experiences with App Schemas（[#240](https://developer.apple.com/videos/play/wwdc2026/240/)）**：预定义 Schema Domains 让 Siri 理解应用内容；`IndexedEntity` 语义搜索；屏幕感知。
- **Code-along: Make your app available to Siri（[#344](https://developer.apple.com/videos/play/wwdc2026/344/)）**：日历领域实体（`CalendarEntity`/`EventEntity`）；`system.open` schema 打开事件。
- **Discover new capabilities in App Intents（[#345](https://developer.apple.com/videos/play/wwdc2026/345/)）**：`ValueRepresentation`/`PlaceDescriptor`；`RelevantEntities`；`SyncableEntity` 跨设备同步；`LongRunningIntent` 后台运行。
- **Explore advanced App Intents features（[#343](https://developer.apple.com/videos/play/wwdc2026/343/)）**：`ProvidesDialog`；`ShowsSnippetView`；`IntentDonationManager`；View 注解。
- **Validate with AppIntentsTesting（[#295](https://developer.apple.com/videos/play/wwdc2026/295/)）**：基于 XCUITest 的集成测试；无需 UI 自动化即可测 Intent/实体/Spotlight。
- **What's new in Shortcuts（[#310](https://developer.apple.com/videos/play/wwdc2026/310/)）**：截图/键盘连击/通知触发；"Use Model" 操作内置 AI；Storage 跨快捷指令共享数据。

---

## 六、视觉智能 / 图像 / Image Playground

- **What's new in image understanding（[#237](https://developer.apple.com/videos/play/wwdc2026/237/)）**：`GenerateIterativeSegmentationRequest` 多种分割输入；Foundation Models 图像输入；`BarcodeReaderTool`/OCR 工具；Vision 登陆 watchOS。
- **Best practices for visual intelligence（[#297](https://developer.apple.com/videos/play/wwdc2026/297/)）**：`IntentValueQuery` + `SemanticContentDescriptor.pixelBuffer`；`GenerateImageFeaturePrintRequest` 图像相似度。
- **LLM search using Core Spotlight（[#246](https://developer.apple.com/videos/play/wwdc2026/246/)）**：`SpotlightSearchTool` 一行代码；`GuidanceProfile` 限定范围；`ContactResolver` 消歧。
- **Create high quality images using Image Playground（[#375](https://developer.apple.com/videos/play/wwdc2026/375/)）**：新模型运行在 PCC，支持照片写实；多人物生成；风格预设；`.imagePlaygroundSheet` SwiftUI 集成。

---

## 七、Xcode 27 / 开发工具

- **What's new in Xcode 27（[#258](https://developer.apple.com/videos/play/wwdc2026/258/)）**：内置编码代理（Explore/Build/Refine/Orchestrate）；Device Hub 独立应用；个性化选项。
- **Xcode, agents, and you（[#259](https://developer.apple.com/videos/play/wwdc2026/259/)）**：Explore 用 walkthrough；Build 用 plan mode；Refine 用 Swift Charts 迭代；Orchestrate 描述高级目标自动协调。
- **Create UI prototypes using agents（[#227](https://developer.apple.com/videos/play/wwdc2026/227/)）**：一次生成多种 UI 变体；填充真实示例数据；自定义调优面板。
- **Translate your app using agents（[#213](https://developer.apple.com/videos/play/wwdc2026/213/)）**：上下文感知翻译；分批委派子代理；`TRANSLATION.md` 提供术语/语气指导。
- **Build with Xcode Cloud（[#261](https://developer.apple.com/videos/play/wwdc2026/261/)）**：连接仓库即云端构建测试；Webhooks 扩展。
- **Improve app responsiveness with Instruments（[#268](https://developer.apple.com/videos/play/wwdc2026/268/)）**：Swift Concurrency instrument + Time Profiler + System Trace 定位瓶颈。
- **Get the most out of Device Hub（[#260](https://developer.apple.com/videos/play/wwdc2026/260/)）**：紧凑/完整窗口模式；画布实时显示设备画面；`devicectl` CLI。
- **Discover container machines（[#389](https://developer.apple.com/videos/play/wwdc2026/389/)）**：Container 应用中轻量级持久化 Linux 环境。
- **Expand your Virtualization app（[#224](https://developer.apple.com/videos/play/wwdc2026/224/)）**：macOS 客户机预配置；Accessory Access 框架 USB 直通；vmnet 自定义网络；DiskImageKit。

---

## 八、SwiftUI

- **What's new in SwiftUI（[#269](https://developer.apple.com/videos/play/wwdc2026/269/)）**：全新视觉风格；新 Document 协议；任意视图滑动操作；工具栏增强、AsyncImage 缓存、懒状态初始化。
- **Dive into lazy stacks and scrolling（[#321](https://developer.apple.com/videos/play/wwdc2026/321/)）**：LazyVStack 仅加载可见视图；数据层用 Predicate 过滤；`.onScrollTargetVisibilityChange` 编程式滚动。
- **Compose advanced graphics effects（[#322](https://developer.apple.com/videos/play/wwdc2026/322/)）**：`colorEffect`/`distortionEffect`/`layerEffect` 三种着色器；Domain Warping；`TimelineView` 驱动动画。
- **Code-along: drag and drop（[#271](https://developer.apple.com/videos/play/wwdc2026/271/)）**：`.reorderable()`/`.reorderContainer(for:)`；`DragContainer` 多项目拖动；pile/list/stack 预览。
- **Use SwiftUI with AppKit and UIKit（[#272](https://developer.apple.com/videos/play/wwdc2026/272/)）**：AppKit Observation；集成 SwiftUI 组件；引入手势识别器。
- **WidgetKit foundations（[#277](https://developer.apple.com/videos/play/wwdc2026/277/)）**：可瞥见/相关/可个性化三品质；新增 system extra large portrait 家族；`containerBackground` 玻璃材质。

---

## 九、Swift / SwiftData

- **What's new in Swift（[#262](https://developer.apple.com/videos/play/wwdc2026/262/)）**：人体工程学更新、并发改进、Swift-C 互操作（`@C`）、嵌入式 Swift。
- **What's new in SwiftData（[#274](https://developer.apple.com/videos/play/wwdc2026/274/)）**：Sectioning fetches；Codable 持久化自定义类型；`ModelResultsObserver`/`HistoryObserver`。
- **Code-along: Add persistence with SwiftData（[#275](https://developer.apple.com/videos/play/wwdc2026/275/)）**：Model 宏 + `@Relationship`；`@Query` + Predicate 查询。
- **Build real-time apps with gRPC and Swift（[#265](https://developer.apple.com/videos/play/wwdc2026/265/)）**：Protocol Buffers；双向流式 RPC（TaskGroup）；客户端生命周期管理。
- **Migrate to Swift Testing（[#267](https://developer.apple.com/videos/play/wwdc2026/267/)）**：利用测试框架互操作性增量迁移。

---

## 十、UIKit / AppKit / TextKit

- **Modernize your UIKit app（[#278](https://developer.apple.com/videos/play/wwdc2026/278/)）**：全屏游戏模式；UIView Body 协议；可调整大小 iPhone 应用；Tab bar/sidebar 增强。
- **Modernize your AppKit app（[#289](https://developer.apple.com/videos/play/wwdc2026/289/)）**：手势识别器替代跟踪循环；Liquid Glass 新角落同心性 API。
- **Elevate text experience with TextKit（[#370](https://developer.apple.com/videos/play/wwdc2026/370/)）**：四层文本架构；`NSTextViewportRenderingSurface` 协议；代码编辑器行号、可折叠章节示例。

---

## 十一、Web / Safari

- **What's new in WebKit for Safari 27（[#204](https://developer.apple.com/videos/play/wwdc2026/204/)）**：超 1000 项引擎改进；CSS Grid Lanes；Customizable Select；HTML Model element；Immersive Website Environments。
- **Create web extensions for Safari（[#216](https://developer.apple.com/videos/play/wwdc2026/216/)）**：manifest.json；Declarative Net Request；Content Scripts；App Store Connect 分发；跨 iOS/iPadOS/macOS/visionOS。
- **Get started with HTML Model Element（[#215](https://developer.apple.com/videos/play/wwdc2026/215/)）**：`<model src>` 加载 USDZ；`stagemode="orbit"`；`playbackRate` 动画；`usdcrush` 压缩。
- **Learn CSS Grid Lanes（[#314](https://developer.apple.com/videos/play/wwdc2026/314/)）**：`display: grid-lanes`；结构化一轴释放另一轴；`flow-tolerance`。
- **Rediscover the HTML select element（[#315](https://developer.apple.com/videos/play/wwdc2026/315/)）**：`appearance: base-select`；`::picker(select)`；富内容 `<option>`；`selectedcontent`。

---

## 十二、visionOS / RealityKit / 空间计算

本节汇总空间计算方向的会话，从平台级 visionOS 27 到 RealityKit、Reality Composer Pro 3、USD 工具链与 Apple Immersive Video：

- **Build next-generation experiences with visionOS 27（[#287](https://developer.apple.com/videos/play/wwdc2026/287/)）**：本场介绍 visionOS 27 的新能力，指导开发者构建下一代 App、游戏以及空间体验；内容覆盖从应用到游戏再到空间体验的多种开发路径，帮助开发者选择适合自身场景的实现方式；面向已有 Apple visionOS 平台开发基础的受众，重点讲解如何利用新版系统的能力打造更具沉浸感的空间计算体验。
- **Explore advances in RealityKit（[#279](https://developer.apple.com/videos/play/wwdc2026/279/)）**：本场 session 介绍 RealityKit 在 WWDC26 上的最新进展，目标是帮助开发者为应用和游戏打造更具沉浸感和真实感的体验；新增的能力包括交互式布料模拟（cloth simulations）、基于 NavMesh 的寻路（pathfinding）、混合现实光照（mixed reality lighting），以及可自定义的混响网格（reverb meshes）用于增强空间音频效果；视觉保真度方面带来改进的阴影、角色渲染增强，以及对 Gaussian splatting（高斯泼溅）技术的支持，可呈现更逼真的 3D 场景；RealityKit 是 Apple 的空间/3D 渲染框架，常用于 visionOS 与 AR 场景下的应用与游戏开发，本场适合希望提升空间应用表现力的开发者观看。
- **Discover the Spatial Preview framework（[#282](https://developer.apple.com/videos/play/wwdc2026/282/)）**：介绍全新的 Spatial Preview 框架，它能将 Mac 上的内容直接带入 visionOS，让 Mac 应用以空间化的方式呈现；讲解如何构建支持实时同步与跨 Mac 和 visionOS 双向编辑的动态工作流，两平台间内容保持联动；深入介绍 SpatialPreview API，涵盖设备发现、2D 与 3D 会话集成等核心能力；还介绍了新的 Quick Look 功能，帮助开发者进一步提升 Mac 应用的空间化体验。
- **Explore enhancements to visionOS object tracking（[#283](https://developer.apple.com/videos/play/wwdc2026/283/)）**：本场 session 介绍 visionOS 在物体追踪（object tracking）方面的最新增强，帮助开发者更好地将现实物体融入空间体验；讲解了空间配件输入（spatial accessory input）的相关进展，探讨如何通过配件与 visionOS 应用进行交互；展示了追踪移动中和手持物体（moving and handheld objects）的新方式，扩展了 visionOS 对动态物体的识别能力；面向 visionOS 开发者，帮助理解并应用更新后的物体追踪与配件输入能力，提升混合现实应用的交互表现。
- **Collaborate on structured 3D models in visionOS（[#284](https://developer.apple.com/videos/play/wwdc2026/284/)）**：本场讲解如何在 visionOS 中让结构化 3D 模型真正可用，重点覆盖 USDZ 文件的准备工作，使导出后的各个部件在运行时仍可独立选择和操控；介绍如何在层级化装配（hierarchical assemblies）中操控单个实体（entity），从而对模型内部结构进行精细化交互；演示用剖切面（cross-sectional plane）查看模型内部组件，以及创建爆炸视图动画，用于设计评审与协作场景；整体面向 Apple Vision Pro 上的设计评审与协作体验，帮助开发者呈现更精细、可拆解的结构化 3D 内容。
- **Discover USDKit and what's new in OpenUSD（[#285](https://developer.apple.com/videos/play/wwdc2026/285/)）**：本场介绍 Apple 平台对通用场景描述 (USD/OpenUSD) 支持的最新进展，重点推出基于 Swift 的 USDKit 框架，让开发者能以原生 Swift 方式打开、遍历与编辑 USD 内容；介绍新的 USD 原语类型 Particle Fields（由 Apple 与 NVIDIA、Adobe、Pixar 通过 Alliance for OpenUSD 共同开发），使高斯泼溅 (Gaussian Splats) 可在 USD 中原生表示并与传统网格、材质合成进同一场景；讲解 USD 在 Web 端的落地——通过 Safari 的 Model 标签在 macOS 与 iOS 上直接将 USD 内容嵌入网页，并在 visionOS 上提供完整空间呈现，使 USD 像图片和视频一样成为 Web 的原生格式；梳理 USD 基础概念（Layers、Composition、Stages、Prims、Schemas、Attributes、Metadata）并结合 Swift 代码示例，同时介绍 MaterialX、OpenVDB 跨平台更新以及 Mac 版 Preview 中扩展的 USD 编辑与渲染工具。
- **Use foveated streaming to bring immersive content to visionOS（[#286](https://developer.apple.com/videos/play/wwdc2026/286/)）**：介绍 FoveatedStreaming 框架，讲解其如何将远程渲染的沉浸式场景以完整保真度无线传输到 Apple Vision Pro；该框架将 visionOS 原生能力与第三方流式渲染技术相结合，演示案例基于 OpenXR 场景与 NVIDIA CloudXR 完成；讲解与 NVIDIA CloudXR SDK 的集成方式，说明动态注视点（foveated）流式传输如何在带来性能收益的同时仍保护用户隐私。
- **Supercharge your spatial workflows with Reality Composer Pro 3（[#393](https://developer.apple.com/videos/play/wwdc2026/393/)）**：本场 session 聚焦 Reality Composer Pro 3，介绍如何完全在该工具内构建丰富的交互体验与精美的视觉特效，用于打造 visionOS 空间计算内容；Reality Composer Pro 是 Apple 为 visionOS 应用构建 3D 场景、动画与素材的核心创作工具，本场重点演示其内置的完整工作流，减少对外部工具的依赖；内容面向提升空间内容创作的效率与表现力，帮助开发者与设计师利用其强大的功能集实现更复杂的空间交互与视觉表现。
- **Iterate your spatial scenes faster with Reality Composer Pro 3（[#280](https://developer.apple.com/videos/play/wwdc2026/280/)）**：本场 Session 介绍 Reality Composer Pro 3 的新功能，帮助开发者更高效地构建与迭代空间（spatial）场景内容；Reality Composer Pro 是 Apple 官方用于 visionOS 等空间体验的 3D 内容编辑工具，本版带来更多创作能力，包括添加内容和视觉效果等方面的新特性；讲解如何利用这些新功能加速空间体验的开发流程，提升场景制作的迭代速度；面向构建空间体验的开发者，聚焦于在实际工作流中用该工具更快地完成场景内容的搭建与调整。
- **Extend Reality Composer Pro 3 functionality with Xcode（[#281](https://developer.apple.com/videos/play/wwdc2026/281/)）**：本场介绍 Reality Composer Pro 3 如何借助 Xcode 支持更大规模、更具挑战性的空间计算项目开发；讲解如何创建项目专属插件，用于在编辑器中编辑自定义组件并运行自定义系统；演示如何构建自定义 ScriptGraph 节点，从而完全掌控空间内容创作工作流；内容覆盖扩展编辑器、自定义组件与系统、自定义动画动作以及 Script Graph 节点等空间创作相关主题。
- **Design no-code games with Reality Composer Pro 3（[#252](https://developer.apple.com/videos/play/wwdc2026/252/)）**：本场介绍如何使用 Reality Composer Pro 3 中的 ScriptGraph 功能，为 app 和游戏创作无需编写代码的 3D 内容；ScriptGraph 是 Reality Composer Pro 3 提供的可视化逻辑编辑工具，开发者可通过节点式编排而非手写代码来构建交互行为；Reality Composer Pro 是 Apple 用于创作 3D 与空间内容的工具，本 session 聚焦其第 3 代版本中面向无代码开发的新工作流程；讲解如何将上述无代码创作的 3D 内容集成到自己的 app 与游戏之中。
- **Design immersive environments for visionOS apps and the spatial web（[#234](https://developer.apple.com/videos/play/wwdc2026/234/)）**：本场介绍如何为 visionOS 应用、网站以及 SharePlay 体验创建照片级真实感的沉浸式环境；讲解让环境真正具有沉浸感的设计原则，并覆盖应用与空间 Web（spatial web）等场景；内容涵盖如何创建或采集参考素材、准备高保真 CG 资产，并打造运动与光照等实时效果；还涉及如何将运动与空间音频（Spatial Audio）融入场景，呈现真实感的自然景观等环境内容。
- **Explore immersive website environments in visionOS（[#320](https://developer.apple.com/videos/play/wwdc2026/320/)）**：本场介绍面向 visionOS 与 Apple Vision Pro 的新 JavaScript Immersive API，让网页能够将访客带入沉浸式虚拟环境；讲解如何用该 Web API 在网站内容中呈现空间化的虚拟环境，拓展 Safari/WebKit 在 visionOS 上的沉浸式 Web 体验能力；围绕 Web 开发场景展开，演示把普通网站升级为可在 Vision Pro 中沉浸式浏览的实现思路与用法。
- **Build live production tools for Apple Immersive Video（[#338](https://developer.apple.com/videos/play/wwdc2026/338/)）**：本场聚焦 Apple Immersive Video（苹果沉浸式视频）的实时直播制作流程，带开发者走进现场制作背后的技术细节；讲解如何将沉浸式视频、空间音频与场景元数据打包，并依据 SMPTE 2110 标准通过 IP 网络进行实时传输；演示如何借助 Apple 的 Immersive Media Support、Video Toolbox 与 AVFoundation 三大框架来驱动实时的 Apple Immersive Video 工作流；内容涵盖实况制作概览、沉浸式直播的差异、沉浸式实况格式、实时媒体传输以及录制与回放等环节。

## 十三、Metal / 游戏 / 图形

- **Build real-time neural rendering pipelines（[#359](https://developer.apple.com/videos/play/wwdc2026/359/)）**：MetalFX Denoising 统一放大 + 去噪；ML 命令编码器（MTLPackage）；神经色调映射；TensorOps API。
- **Optimize custom ML with Metal tensors（[#330](https://developer.apple.com/videos/play/wwdc2026/330/)）**：M5/A19 Pro GPU 每核心内嵌神经加速器；4/8 位量化（新增浮点与 2 位整数）；协作张量；Core AI 集成。
- **Find and fix performance issues in Metal games（[#388](https://developer.apple.com/videos/play/wwdc2026/388/)）**：Metal Performance HUD；Game Performance Overview 模板；`metalperftrace` CLI；StateReporting API；MetricKit。
- **Bringing Cyberpunk 2077 to Mac（[#356](https://developer.apple.com/videos/play/wwdc2026/356/)）**：CD Projekt Red 移植经验；Game Porting Toolkit 评估；Shader Converter；MetalFX + Dynamic Resolution。
- **Speedrun your game port（[#357](https://developer.apple.com/videos/play/wwdc2026/357/)）**：Game Porting Toolkit 4 AI 辅助；移植助手代理 discover/plan/validate；`gpucapture`/`gpudebug` CLI；Metal 4 显式内存管理。
- **Make your game great with touch（[#358](https://developer.apple.com/videos/play/wwdc2026/358/)）**：Touch Controller 框架，触控布局 + 触觉反馈。
- **Unlock in-game content with StoreKit and Background Assets（[#378](https://developer.apple.com/videos/play/wwdc2026/378/)）**：Unity 集成；Steam Asset Converter；新 Apple Unity 插件（C#）；iOS 27 横屏支付页。

---

## 十四、相机 / 照片 / 媒体

- **Build a responsive camera app（[#303](https://developer.apple.com/videos/play/wwdc2026/303/)）**：延迟启动 API；`isResponsiveCaptureEnabled`；确定性文件写入（ProRes）。
- **Implement high resolution photo capture（[#304](https://developer.apple.com/videos/play/wwdc2026/304/)）**：12/24/48MP；四种捕获类型（全处理/曝光包围/Bayer RAW/ProRAW）。
- **Support Center Stage front camera（[#341](https://developer.apple.com/videos/play/wwdc2026/341/)）**：iPhone 17 系方形传感器 95° 视场角；`dynamicAspectRatio`；`smartFramingMonitor`。
- **Discover generated subtitles（[#256](https://developer.apple.com/videos/play/wwdc2026/256/)）**：语音转文字 + 语言翻译；支持 HLS/直播；字幕样式预览。
- **Enhance RAW processing with Core Image（[#305](https://developer.apple.com/videos/play/wwdc2026/305/)）**：RAW 9 基于分块 CoreML 模型在 ANE 运行；`CIRAWFilter` 20 参数。
- **Meet Music Understanding framework（[#253](https://developer.apple.com/videos/play/wwdc2026/253/)）**：Key/Rhythm/Structure/Pace/Instrument/Loudness 六维分析；完全设备端。
- **Meet Now Playing framework（[#312](https://developer.apple.com/videos/play/wwdc2026/312/)）**：连接媒体播放到锁屏/控制中心/灵动岛/CarPlay/StandBy。
- **Integrate MusicKit（[#254](https://developer.apple.com/videos/play/wwdc2026/254/)）**：开发者令牌、授权、Music Picker、SystemMusicPlayer。

---

## 十五、其他框架 / 设计 / 隐私安全

- **健康**：HealthKit workout zones（[#207](https://developer.apple.com/videos/play/wwdc2026/207/)）运动区间洞察。
- **钱包/支付**：Wallet（[#209](https://developer.apple.com/videos/play/wwdc2026/209/)）新卡片类型；IAP（[#210](https://developer.apple.com/videos/play/wwdc2026/210/)）12 个月月度订阅、Bundles/Suites、优惠码 API。
- **CarPlay/tvOS**：CarPlay（[#212](https://developer.apple.com/videos/play/wwdc2026/212/)）视频应用/MiniPlayer/语音模板；tvOS（[#221](https://developer.apple.com/videos/play/wwdc2026/221/)）Dynamic Type。
- **蓝牙/手写**：Bluetooth Channel Sounding（[#369](https://developer.apple.com/videos/play/wwdc2026/369/)）精确测距；PencilKit（[#203](https://developer.apple.com/videos/play/wwdc2026/203/)）`PKStrokeRecognizer`；PaperKit（[#372](https://developer.apple.com/videos/play/wwdc2026/372/)）PaperMarkup 子元素。
- **App Store**：Enhance presence（[#205](https://developer.apple.com/videos/play/wwdc2026/205/)）；Retention Messaging（[#309](https://developer.apple.com/videos/play/wwdc2026/309/)）；Group subscriptions（[#391](https://developer.apple.com/videos/play/wwdc2026/391/)）。
- **评估/安全**：assessment on macOS（[#230](https://developer.apple.com/videos/play/wwdc2026/230/)）逐功能无障碍控制；App Attest（[#201](https://developer.apple.com/videos/play/wwdc2026/201/)）安全隔区绑定、启动验证类别、macOS ACL Blob OID；Trust Insights（[#379](https://developer.apple.com/videos/play/wwdc2026/379/)）检测社交工程/胁迫，`IsLikelyBeingCoachedInsight` 三结果值。
- **性能/实时**：MetricKit（[#222](https://developer.apple.com/videos/play/wwdc2026/222/)）；Live Activities（[#223](https://developer.apple.com/videos/play/wwdc2026/223/)）；live communication（[#226](https://developer.apple.com/videos/play/wwdc2026/226/)）。
- **设备管理**：managing Apple devices（[#206](https://developer.apple.com/videos/play/wwdc2026/206/)）Apple Business 平台、声明式管理标准、ManagedApp 框架。
- **设计**：Principles of great design（[#250](https://developer.apple.com/videos/play/wwdc2026/250/)）；brand identity on iOS（[#251](https://developer.apple.com/videos/play/wwdc2026/251/)）Liquid Glass 下 UI 层/内容层区分；intuitive search（[#292](https://developer.apple.com/videos/play/wwdc2026/292/)）；clear names（[#290](https://developer.apple.com/videos/play/wwdc2026/290/)）。
- **无障碍**：custom controls（[#220](https://developer.apple.com/videos/play/wwdc2026/220/)）`.adjustable` trait；reading app（[#219](https://developer.apple.com/videos/play/wwdc2026/219/)）`accessibilityNextTextNavigationElement`、SwiftUI `accessibilityLinkedGroup`。

---

## 十六、Dub Dub Daily 系列

官方每日推出的速览视频，汇总当天的大会要点与社区动态：

- **Dub Dub Daily: Day 2（[#397](https://developer.apple.com/videos/play/wwdc2026/397/)）**：这是 WWDC26 第二天（Day 2）的官方每日回顾视频，集中汇总当日最重要的发布内容，方便开发者一站式了解大会进展；视频定位为「将最大的公告汇聚于一处」，帮助观众快速补齐当天 WWDC26 揭晓的全部信息；内容不止于罗列新闻，还会深入探讨塑造今年大会主题的关键方向，帮助开发者把握 WWDC26 的整体脉络；Dub Dub Daily 是贯穿 WWDC26 期间的每日系列节目，本集对应大会第 2 天的内容。
- **Dub Dub Daily: Day 3（[#398](https://developer.apple.com/videos/play/wwdc2026/398/)）**：本场是 WWDC26 第三天的「Dub Dub Daily」每日总结栏目，聚焦当天 Apple Intelligence 相关的最新 AI 公告；内容围绕 Apple Intelligence 平台的演进展开，讲解最新动态对开发者 App 的实际影响与意义；节目帮助开发者了解当日 AI 公告要点，并探讨这些能力在应用中落地的可能性；「Dub Dub Daily」以每日回顾形式串联大会信息，便于开发者快速跟进 WWDC26 各天的重要发布。
- **Dub Dub Daily: Day 4（[#399](https://developer.apple.com/videos/play/wwdc2026/399/)）**：本场为 WWDC26 第 4 天的「Dub Dub Daily」每日回顾节目，聚焦 Xcode 与开发者工具链的最新动态；围绕「让开发者构建得更快、更智能」这一主题，介绍本年度开发工具的升级方向；内容定位为当日要闻汇总，帮助开发者快速了解 Day 4 公布的开发工具相关更新；所涉背景常识：Xcode 是 Apple 官方集成开发环境，承担代码编写、调试、构建与上架等完整开发流程。
- **Dub Dub Daily: Day 5（[#400](https://developer.apple.com/videos/play/wwdc2026/400/)）**：本场为 WWDC26 最后一天（Day 5，6 月 12 日）的「Dub Dub Daily」每日回顾节目，聚焦当天 Swift 语言相关的最新发布；节目围绕「Swift 持续进化」展开，介绍最新的语言更新、这些更新为开发者代码解锁的新能力，以及为何当下是成为 Swift 开发者的激动时刻，并邀请特别嘉宾共同深入探讨；内容定位为当日要闻汇总，帮助开发者一站式补齐大会最后一天的 Swift 相关动态；所涉背景常识：Swift 是 Apple 推出的现代编程语言，贯穿 iOS、iPadOS、macOS 等全平台应用与系统开发。

> 说明：Dub Dub Daily 为每日概览短片，官方未对其逐项内容单独详述，以上要点基于官方页面描述概括。

## 数据来源

1. [Apple Developer — WWDC26 Videos 目录](https://developer.apple.com/videos/wwdc2026/)
2. [Apple Developer — Platforms State of the Union（#102）](https://developer.apple.com/videos/play/wwdc2026/102/)
3. [Apple 新闻室 — WWDC26 开幕（100+ sessions）](https://www.apple.com/newsroom/2026/05/apple-kicks-off-worldwide-developers-conference-on-june-8/)
4. [Apple 新闻室 — Tim Cook / John Ternus 人事任命](https://www.apple.com/newsroom/2026/04/tim-cook-to-become-apple-executive-chairman-john-ternus-to-become-apple-ceo/)
5. [Apple Developer — Core AI 主题页](https://developer.apple.com/core-ai/)
