---
title: 【学习笔记】WWDC 2026 Day 2：108+ 场视频讲座要点全收录
published: 2026-06-10
description: WWDC26 第二天全部 108+ 场视频讲座与 5 场 Group Lab 的详细要点，涵盖 AI/Foundation Models、Siri、SwiftUI、Xcode 27、visionOS、Metal 等 13 大主题分类。
lang: zh
tags: [学习笔记]
toc: true
---

## 概览

WWDC26 第二天（2026 年 6 月 10 日）共发布 **108+ 场视频讲座**、**5 场 Group Lab**，涉及 **13 个主题分类**，其中约 **70%** 的内容与 AI 相关。

---

## 一、Group Labs（小组讨论，5 场）

| 编号 | 主题 | 时间 |
|------|------|------|
| #8006 | SwiftUI Group Lab | 6 月 10 日 9:00 a.m. PDT |
| #8009 | Privacy and Security Group Lab | 6 月 10 日 |
| #8012 | Icon Composer for Beginners Group Lab | 6 月 10 日 |
| #8015 | Safari and Web Technologies Group Lab | 6 月 10 日 |
| #8018 | Camera and Photo Technologies Group Lab | 6 月 10 日 |

- **SwiftUI Group Lab**：与 Apple 工程师和设计师在线互动，深入讨论 WWDC26 中 SwiftUI 相关的主要发布内容。可提问、获取建议，并参与关于 SwiftUI 新功能的讨论。
- **Privacy and Security Group Lab**：隐私与安全主题互动讨论，与 Apple 工程师探讨应用安全最佳实践、隐私保护框架更新等内容。
- **Icon Composer for Beginners Group Lab**：Icon Composer 入门小组讨论，适合初学者了解如何使用 Icon Composer 工具创建应用图标。
- **Safari and Web Technologies Group Lab**：Safari 与 Web 技术主题讨论，涵盖 Safari 27 新特性、WebKit 更新、Web 扩展开发等话题。
- **Camera and Photo Technologies Group Lab**：相机与照片技术主题讨论，涵盖 AVFoundation 相机 API 更新、高分辨率照片捕获、Center Stage 等话题。

---

## 二、AI / Foundation Models / Core AI（16 场）

### 2.1 What's new in the Foundation Models framework（#241，21:13）

- **全新设备端模型**：重建的设备端模型具备更强推理和工具调用能力；新增 API 检查上下文大小和 token 计数；改进护栏减少误报。
- **视觉理解**：设备端模型新增视觉功能，通过 `Attachment(UIImage(...))` 附加图像，支持 UIImage/NSImage/CGImage/Core Image/CoreVideo 像素缓冲区。
- **Private Cloud Compute**：通过 `PrivateCloudComputeLanguageModel` 访问 Apple 服务器模型，32K 上下文窗口，支持推理级别，无需账户/API 密钥，已支持 watchOS 27。
- **模型抽象层**：新 `LanguageModel` 协议统一本地和服务器模型，支持 `CoreAILanguageModel` 和 `MLXLanguageModel`。
- **合作伙伴模型**：Anthropic 和 Google 发布 Swift 包，通过 SPM 切换模型，使用 OAuth + Keychain 安全处理认证。
- **系统工具**：新增 Vision 支持的 `BarcodeReaderTool` 和 `OCRTool`，Spotlight 驱动搜索工具实现完全本地 RAG。
- **Dynamic Profiles**：声明式 agentic 原语，单个会话可在不同模式间切换指令和工具。
- **Evaluations 框架**：新 Swift 框架衡量智能功能质量。
- **fm CLI + Python SDK**：macOS 27 终端内置 `fm` 命令行工具，`apple_fm_sdk` 将设备端模型暴露给 Python 生态。
- **开源**：核心框架开源，可在 Linux 服务器运行。

### 2.2 Build agentic app experiences with the Foundation Models framework（#242，21:43）

- **Dynamic Profile 声明**：通过 `LanguageModelSession.DynamicProfile` 声明多个 Profile，每个代表不同 agent 配置（模型、指令、工具）。
- **DynamicInstructions**：将相关指令和工具组合为可复用、可嵌套的组件。
- **按阶段配置模型**：brainstorming 用 PCC + temperature，planning 用 PCC + deep reasoning，reviewing 用 SystemLanguageModel。
- **Transcript 管理**：`historyTransform` 对历史窗口应用无状态变换，工具包提供 `rollingWindow` 和 `droppingCompletedToolCalls`。
- **生命周期修饰符**：`onResponse` 在会话边界运行命令式代码，`@SessionProperty` 在工具和 Profile 间共享状态。
- **编排模式——Baton-pass**：多个 Profile 共享完整 transcript，通过工具切换活跃 Profile。
- **编排模式——Phone-a-friend**：工具生成隔离 transcript 的短生命子会话。
- **Tool Calling Mode**：通过 `.allowed`、`.disallowed`、`.required` 控制工具调用时机。
- **Transcript 错误处理**：`transcriptErrorHandlingPolicy` 支持 `.revertTranscript` 和 `.preserveTranscript`。

### 2.3 Debug and profile agentic app experiences with Instruments（#243，14:20）

- **三大挑战**：概率性输出（非确定性响应）、模型间通信（多模型数据流协调）、可观测性（多模型管道定位问题）。
- **Foundation Models Instrument**：Xcode 中增强的 FoundationModels 模板，检查 agentic 流程行为和优化性能。
- **三大性能指标**：time-to-first-token（缩短提示降低）、tokens-per-second（跨配置基准测试）、total latency（streaming 降低感知等待）。
- 时间线显示 instructions lane 和 model inference lane，树形视图检查 sessions/requests/inferences/tool calls。

### 2.4 Meet the Evaluations framework（#298，25:46）

- **框架概述**：新 Swift 框架衡量智能功能质量，解决概率性输出无法用传统单元测试验证的问题，也可评估分类器、线性回归等随机系统。
- **五步构建评估**：定义被测代码 → 定义输入数据（ModelSample）→ 定义度量（Metric + Evaluator）→ 汇总度量 → 创建测试运行。
- **Swift Testing 集成**：使用 `@Test` 宏和 `.evaluates` trait，通过 `#expect` 断言聚合值。
- **Xcode 评估报告**：新的 Evaluations Report 可视化结果，查看每个样本的详细度量、提示和完整响应。
- **Hill-climbing**：基于评估反馈迭代改进指令，形成评估驱动开发（EDD）循环。
- **模型评判（Model Judge）**：`ModelJudgeEvaluator` 进行定性度量，Cohen's kappa 衡量评判者与人类一致性。

### 2.5 Create robust evaluations for agentic apps（#299，21:28）

- **合成数据生成**：`makeSamples` API 需要 prompt、dataset、target count；`SampleGenerator` 提供完全控制。
- **数据验证**：`validator` 闭包定义接受/拒绝逻辑，有效/无效样本实时更新。
- **工具调用评估**：验证模型是否调用了正确工具、正确参数、正确顺序（"验证 how，不仅验证 what"）。
- **轨迹期望（Trajectory Expectation）**：定义工具调用的预期路径，配合 `ToolExpectation`。
- Xcode 27 的 Evaluations Report 支持 Compare 按钮对比不同数据集的评估结果。

### 2.6 Build with the new Apple Foundation Model on Private Cloud Compute（#319，10:58）

- **PCC 概述**：端到端隐私设计，用户数据永不存储，无需认证/API 密钥，开发者无 token 费用。
- **一行代码切换**：将 `LanguageModelSession()` 改为 `LanguageModelSession(model: PrivateCloudComputeLanguageModel())`。
- **推理级别**：三级推理（light/moderate/deep），通过 `ContextOptions(reasoningLevel:)` 设置。
- **使用限额处理**：检查 `model.quotaUsage.isLimitReached`，显示持久性可操作 UI。
- 设备端：离线、无限制、4K 上下文；PCC：需联网、每日限额、32K 上下文、支持推理。

### 2.7 Meet Core AI（#324，20:43）

- **Core AI 概述**：Apple 新的设备端 AI 模型部署框架，驱动 Apple Intelligence，利用全部 Apple Silicon（CPU/GPU/ANE），提供现代 Swift API 和 Python 工具。
- **模型转换**：使用 `coreai-torch` Python 包将 PyTorch 模型转换为 `.aimodel` 格式。
- **应用集成**：`AIModel(contentsOf:)` 加载、`loadFunction(named:)` 加载推理函数、`NDArray` 构造输入、`run(inputs:)` 运行推理。
- **KV 缓存优化**：添加 key-value cache 作为有状态输入，显著提升自回归模型性能。
- **模型特化（Specialization）**：为目标设备特化模型，支持 AOT 编译将工作转移到用户设备之外。
- **Instruments 分析**：新的 Core AI instrument 分析模型延迟，识别性能瓶颈。

### 2.8 Dive into Core AI model authoring and optimization（#325，29:21）

- **coreai-models 仓库**：开源仓库提供即用型模型架构、可复用组件和 agent skills。
- **Python 工作流**：`torch.export` 导出 → `TorchConverter` 转换 → `optimize()` 优化 → `save_asset()` 保存。
- **模型优化**：SAM3（850M 参数）使用 int4 per-channel 对称量化，从 3GB 压缩至 430MB。
- **Core AI Debugger**：独立应用，提供导航器、结构查看器、源码查看器、检查器，可在设备上检查中间张量。
- **自定义 Metal Kernel**：使用 `TorchMetalKernel` 将 MSL kernel 嵌入 `.aimodel` 文件。
- **模型重新创作**：SAM3 拆分为三个独立函数，使用卷积投影和 channels-first 布局，4-bit 调色板化。

### 2.9 Integrate on-device AI models into your app using Core AI（#326，23:44）

- **模型加载与推理**：`AIModel(contentsOf:)` 加载 `.aimodel`，`loadFunction(named:)` 加载推理函数，`NDArray` 构造输入。
- **SAM3 图像分割**：通过 `CoreAIImageSegmenter` 加载 SAM3 模型执行分割。
- **Core AI 语言模型**：通过 `CoreAILanguageModel(resourcesAt:)` 加载，结合 Foundation Models 的 `@Generable` 宏生成结构化输出。
- **AOT 编译**：`xcrun coreai-build compile` 预编译模型，避免运行时特化开销。

### 2.10 Bring an LLM provider to the Foundation Models framework（#339，20:41）

- **LanguageModel 协议**：定义统一接口，`LanguageModelExecutor` 执行请求。
- **Transcript 映射**：将提供商响应格式映射到 Foundation Models 的 transcript 条目。
- **预热**：`prewarm()` 方法提前设置，减少首次请求延迟。
- **流式响应**：通过 textDelta/toolCallDelta 事件实现流式输出。
- **错误处理**：`LanguageModelError` 提供标准化错误类型。

### 2.11 Build AI-powered scripts with the fm CLI and Python SDK（#334，16:36）

- **fm CLI**：`fm respond`（单次响应）、`fm chat`（交互式对话）、`fm schema object`（生成 JSON schema），预装于 macOS 27。
- **Python SDK**：`fm.generable` 装饰器用于结构化输出，支持工具调用和评估管道。
- **管道集成**：可将 fm 输出管道到 shell 脚本实现摘要、提取或生成。

### 2.12 Improve your prompts by hill-climbing with Evaluations（#335，26:41）

- **Hill-climbing 方法论**：基于评估反馈迭代改进提示词，形成"构建-测试-改进"循环。
- **Cohen's Kappa**：衡量模型评判者与人类评判者之间的一致性。
- **Xcode 27 比较**：支持在 Xcode 中比较不同评估运行的结果。
- **Few-shot 示例**：通过提供少量示例改进模型评判者的表现。

### 2.13 Secure your app: mitigate risks to agentic features（#347，25:12）

- **间接提示注入**：不可信内容可能操纵 agent 行为。
- **"致命三要素"**：私有数据 + 不可信内容 + 外部通信同时存在时风险最大。
- **.onToolCall 安全检查点**：在工具调用前插入用户确认步骤，对敏感操作要求用户批准。
- **PII 脱敏**：在发送给模型前移除个人身份信息。
- **Spotlighting**：突出显示不可信内容来源，帮助用户识别潜在风险。

### 2.14 Run local agentic AI on the Mac using MLX（#232，13:37）

- **MLX-LM 服务器**：`pip install mlx-lm` 后运行 `mlx_lm.server`，在 Mac 上本地运行 LLM。
- **分布式启动**：`mlx.launch` 跨多台 Mac 分布式推理。
- **Foundation Models 集成**：通过 `MLXLanguageModel` 将本地 MLX 模型接入 Foundation Models 框架。

### 2.15 Explore distributed inference and training with MLX（#233，22:06）

- **JACCL over Thunderbolt 5 RDMA**：利用 TB5 的 RDMA 能力实现低延迟分布式通信。
- **拓扑结构**：mesh vs ring 拓扑，默认使用张量并行。
- **并行策略**：张量并行（默认）和管道并行（`--pipeline` 标志）。
- **分布式微调**：数据并行分布式 fine-tuning，支持多台 Mac 联合训练。

### 2.16 Explore numerical computing in Swift with MLX（#328，14:31）

- **MLX Swift 数组计算**：惰性求值，`eval()` 刷新计算图。
- **自动微分**：`grad` 函数支持自动梯度计算。
- **卷积操作**：`conv2d` 用于模板操作。
- **GPU 加速**：计算自动在 GPU 上执行，提供 NumPy 风格的 Swift API。

---

## 三、Siri / App Intents / Shortcuts（6 场）

### 3.1 Build intelligent Siri experiences with App Schemas（#240，27:23）

- **App Schema Domains**：预定义模式（消息、日历等），让 Siri 理解应用内容而无需自定义 NLP。
- **IndexedEntity**：通过 `indexingKey` 实现语义搜索，`CSSearchableIndex.indexAppEntities()` 捐赠实体。
- **EntityStringQuery**：用于服务端/大数据集的回退查询方案。
- **屏幕感知**：通过 `UserActivity` 和 View 注解实现 on-screen awareness。

### 3.2 Code-along: Make your app available to Siri（#344，24:20）

- **日历领域采用**：`CalendarEntity`、`AttendeeEntity`（TransientAppEntity）、`EventEntity`（IndexedEntity）。
- **OpenEventIntent**：使用 `system.open` schema 打开事件。
- **实体捐赠**：`CSSearchableIndex.indexAppEntities()` 索引实体。
- **EnumerableEntityQuery**：枚举所有实体供 Siri 查询。

### 3.3 Discover new capabilities in the App Intents framework（#345，18:02）

- **ValueRepresentation**：使用 `PlaceDescriptor` 实现跨应用结构化数据共享。
- **RelevantEntities**：`RelevantEntities.updateEntities()` 提供上下文感知建议。
- **SyncableEntity**：通过 `SyncableEntityIdentifier` 实现跨设备实体身份同步。
- **@UnionValue**：宏支持多类型参数。
- **LongRunningIntent**：通过 `performBackgroundTask` 支持后台长时间运行，配合 Live Activity 显示进度。

### 3.4 Explore advanced App Intents features for Siri and Apple Intelligence（#343，24:08）

- **ProvidesDialog**：`IntentDialog(full:supporting:)` 提供自定义对话文本。
- **ShowsSnippetView**：在 Siri 中显示自定义视图片段。
- **IntentDonationManager**：`donate()` 主动捐赠 intent。
- **IntentValueQuery**：通过结构化搜索输入实现高级查询，配合 `system.searchInApp` schema。
- **View 注解**：`.appEntityIdentifier` 标注视图中的实体，支持在通知、Now Playing、AlarmKit 中添加实体注解。

### 3.5 Validate your App Intents adoption with AppIntentsTesting（#295，25:57）

- **AppIntentsTesting 框架**：基于 XCUITest 的 App Intents 集成测试框架。
- **IntentDefinitions**：`IntentDefinitions(bundleIdentifier:)` 发现 bundle 中的 intent 定义。
- **测试执行**：`makeIntent()` 构造实例，`.run()` 执行并检查 `result.value`。
- **Spotlight 验证**：`spotlightQuery()` 验证索引内容。
- 无需 UI 自动化即可测试 Intent 执行、实体查询、Spotlight 索引。

### 3.6 What's new in Shortcuts（#310，11:02）

- **新自动化类型**：截图触发、键盘连接触发、通知触发（支持关键词过滤）。
- **"Use Model" 操作**：内置 AI 模型访问，支持 web 检索和 transcript inspector。
- **Storage**：Get/Set/global 值，通过 iCloud 同步，在快捷指令间共享持久化数据。

---

## 四、视觉智能 / 图像 / Image Playground（4 场）

### 4.1 What's new in image understanding（#237，15:46）

- **GenerateIterativeSegmentationRequest**：支持种子点、套索、涂鸦、边界框等多种分割输入方式。
- **Foundation Models 图像输入**：通过 Prompt 中的 `Attachment(image)` 将图像传入语言模型。
- **Vision 工具**：`BarcodeReaderTool`（条形码读取）和 OCR 工具可直接在 Foundation Models 会话中使用。
- Vision 框架现已登陆 watchOS。

### 4.2 Best practices for integrating visual intelligence in your app（#297，17:45）

- **IntentValueQuery**：配合 `SemanticContentDescriptor.pixelBuffer` 实现基于视觉内容的语义查询。
- **GenerateImageFeaturePrintRequest**：设备端图像相似度比较，生成图像特征指纹。
- **系统集成**：EventKit、ContactStore、HealthKit 系统存储集成。
- **semanticContentSearch schema**：支持在应用内继续视觉搜索体验。

### 4.3 LLM search using Core Spotlight（#246，16:25）

- **SpotlightSearchTool**：一行代码创建工具，将 Core Spotlight 索引暴露给语言模型。
- **Index Delegate**：实现 `CSSearchableIndexDelegate` 恢复完整 `CSSearchableItem`。
- **GuidanceProfile**：限定搜索工具的引导范围，对设备端模型的小上下文尤为重要。
- **ContactResolver**：当查询引用人物时提供联系人信息以消除歧义。
- **自定义 PipelineStages**：注册 `@Generable` 自定义阶段。

### 4.4 Create high quality images using Image Playground（#375，14:11）

- **新图像生成模型**：运行在 PCC 上，支持几乎任何风格（包括照片写实），质量大幅提升。
- **人物生成**：支持单场景中多人物，个性化功能允许从照片库引入人物。
- **风格预设**：Animation、Illustration、Sketch、Genmoji、externalProvider（第三方如 ChatGPT）。
- **SwiftUI 集成**：`.imagePlaygroundSheet` 视图修饰符，绑定 `@State` 控制显示。
- **上下文种子**：`ImagePlaygroundConcept.text()`、`.extracted()`、`.drawing()`（PencilKit）、`sourceImage`。
- **Genmoji**：emoji 风格触发 `onAdaptiveImageGlyphCreation` 回调，返回 `NSAdaptiveImageGlyph`。
- **可用性检查**：`supportsImageGeneration` 环境值，无需 entitlement。

---

## 五、Xcode 27 / 开发工具（6 场）

### 5.1 What's new in Xcode 27（#258，28:00）

- **编码代理（Coding Agents）**：AI 代理内置于 Xcode 编辑器，支持探索、构建、精炼、编排四种协作模式。
- **Device Hub**：全新独立应用，紧凑模式和完整窗口模式，画布区域实时显示设备画面。
- **个性化选项**：自定义 Xcode 外观和行为。
- 本地化、性能和测试工具更新。

### 5.2 Xcode, agents, and you（#259，24:03）

- **Explore（探索）**：使用 walkthrough 了解数据模型和视图层级，利用 Apple Document Search 获取框架知识。
- **Build（构建）**：使用 plan mode 在编写代码前设计架构，通过 queued messages 实时沟通需求。
- **Refine（精炼）**：使用 Swift Charts 和真实预览迭代视觉设计，通过 inline annotations 定向修改。
- **Orchestrate（编排）**：描述高级目标（如本地化和无障碍），让 Xcode 自动发现工具并协调子代理。

### 5.3 Create UI prototypes using agents in Xcode（#227，18:11）

- **Exploring UI possibilities**：编写提示词一次性生成多种 UI 变体，混合最有前景的元素。
- **Making your app feel lived in**：使用代理填充真实示例数据，覆盖边缘情况（空状态、长文本、无限列表）。
- **Tuning key moments**：构建自定义调优面板实时调整动画参数。
- 核心理念：将代理视为协作者而非设计师，开发者的判断力是关键。

### 5.4 Translate your app using agents in Xcode（#213，14:52）

- **上下文感知翻译**：Xcode 自 String Catalogs 引入以来积累字符串上下文（使用位置、方式、描述注释）。
- **代理翻译流程**：字符串分批处理，委派给子代理，每个子代理获得完整上下文。
- **Review 和 Iterate**：使用代理渲染 UI 检查文本截断，支持 TestFlight 获取母语反馈。
- **Best Practices**：使用 `String(localized:)`；通过 `TRANSLATION.md` 提供翻译指导（术语表、不翻译词汇、语气描述）。

### 5.5 Build, deliver, and automate with Xcode Cloud（#261，13:49）

- **核心概念**：连接源代码仓库即可开始云端构建和测试。
- **分发**：配置应用分发。
- **Webhooks**：通过 webhook 和管理工具扩展 Xcode Cloud 能力。
- **额外仓库**：支持额外仓库。

### 5.6 Profile, fix, and verify: Improve app responsiveness with Instruments（#268，约 26 分钟）

- 使用 Swift Concurrency instrument、Time Profiler 和 System Trace 定位瓶颈。
- 使用 top functions 和运行比较来衡量改进并确认修复。
- Instruments 的增强功能使每次迭代循环比以往更快。

---

## 六、SwiftUI（6 场）

### 6.1 What's new in SwiftUI（#269，28:15）

- **全新视觉风格**：Refreshed look and feel。
- **基于文档的应用**：新 Document 协议，支持直接磁盘访问和基于快照的 diffing。
- **展示与交互**：扩展的展示 API，包括在任何视图上添加滑动操作（swipe actions）。
- **数据流与性能**：工具栏增强（可见性优先级和自动最小化）、AsyncImage 缓存改进、Observable 类型的懒状态初始化。
- iPhone 应用可在 iPad/Mac 上通过 mirroring 调整大小，iOS 模拟器也支持可调整大小。

### 6.2 Dive into lazy stacks and scrolling with SwiftUI（#321，21:10）

- **布局原理**：LazyVStack 从上到下布局，仅加载可见区域视图；离屏视图高度基于已放置视图平均大小估算。
- **子视图加载**：避免在 ForEach 叶子视图中创建动态数量子视图，应在数据层面使用 Predicate 过滤。
- **预加载**：Lazy stack 在滚动方向上预加载视图，将渲染工作分散到多帧中防止丢帧。
- **编程式滚动**：使用 `.onScrollTargetVisibilityChange` 代替 `.onScrollGeometryChange`。

### 6.3 Compose advanced graphics effects with SwiftUI（#322，17:55）

- **三种着色器效果**：`colorEffect`（逐像素颜色变换）、`distortionEffect`（几何变形）、`layerEffect`（最灵活，可采样相邻像素）。
- **Domain Warping**：使用 NoiseTexture 和域扭曲技术实现流动的有机效果。
- **时间驱动动画**：着色器无状态，使用 `TimelineView` 传入时间戳驱动动画。
- **创意管线**：将每个 modifier/API 视为管线中的一个阶段。

### 6.4 Code-along: Build powerful drag and drop in SwiftUI（#271，15:21）

- **重排**：使用 `.reorderable()` 和 `.reorderContainer(for:)` 修饰符，支持跨多个容器重排。
- **多项目拖动**：使用 `DragContainer` API 同时拖动多个项目。
- **拖放预览**：通过 `dragPreviewsFormation` 和 `dropPreviewsFormation` 自定义外观（pile、list、stack）。
- **拖放配置**：`dragConfiguration` 和 `dropConfiguration` 控制数据传输方式（move vs copy）。

### 6.5 Use SwiftUI with AppKit and UIKit（#272，约 14 分钟）

- **Observation in AppKit**：使用 Observation 框架自动更新视图。
- **Hosting SwiftUI**：将 SwiftUI 组件集成到现有视图层级。
- **AppKit 手势**：将手势识别器引入 SwiftUI。
- **SwiftUI 场景**：在不改变整体架构的情况下添加完整的 SwiftUI 场景。

### 6.6 WidgetKit foundations（#277，20:20）

- **三大品质**：可瞥见（glanceable）、相关（relevant）、可个性化（personalizable）。
- **Timeline**：通过 Timeline Entry 提供内容，Timeline Provider 提供三种状态。
- **重载策略**：`atEnd`、`afterDate`、`never`。
- **Widget families**：新增 system extra large portrait 家族（macOS、iOS、iPadOS 27）。
- **着色环境**：使用 `containerBackground` 修饰符支持玻璃材质替换。

---

## 七、Swift / SwiftData（5 场）

### 7.1 What's new in Swift（#262，32:45）

- 日常人体工程学更新。
- 改进的并发（Concurrency）支持。
- 更安全的高性能代码。
- Swift-C 互操作性（`@C` 属性）。
- 嵌入式 Swift（Embedded Swift）更新。
- 工作流和语言互操作性改进。

### 7.2 What's new in SwiftData（#274，12:53）

- **Sectioning fetches**：将获取的数据在 SwiftUI 应用中分组为 sections。
- **自定义类型**：使用 Codable 持久化自定义和第三方类型。
- **ModelResultsObserver**：在任何地方观察数据存储变化。
- **HistoryObserver**：精确响应模型更新，与基于委托的架构集成。

### 7.3 Code-along: Add persistence with SwiftData（#275，22:35）

- **识别状态**：识别需要持久化的数据类型和变量。
- **定义 Schema**：将 Observable 宏替换为 Model 宏，处理属性可变性。
- **模型关系**：使用 `@Relationship` 宏标记关系以支持级联删除，使用模型继承。
- **更新视图层**：使用 `@Query` 宏配合 Predicate 进行高效数据库查询。

### 7.4 Build real-time apps and services with gRPC and Swift（#265，24:25）

- **gRPC 概述**：开源 RPC 框架，专为高性能双向流式 API 设计。
- **Protocol Buffers**：使用 .proto 文件定义服务 API，消息格式比 JSON 约小一半。
- **双向流式 RPC**：使用 TaskGroup 同时处理请求流和响应流。
- **客户端生命周期**：创建客户端管理器，通过环境传播，应用进入后台时断开。

### 7.5 Migrate to Swift Testing（#267，21:25）

- 利用测试框架互操作性进行迁移。
- 增量引入高级测试功能的最佳实践和模式。
- 加速开发并增加测试覆盖率。

---

## 八、UIKit / AppKit / TextKit（3 场）

### 8.1 Modernize your UIKit app（#278，16:03）

- 遗留 API 更新：应用生命周期、主屏幕、界面惯用语、界面方向。
- **全屏游戏模式**：游戏的全屏模式。
- **UIView Body 协议**：用于运动和位置。
- **可调整大小的 iPhone 应用**：iPhone Mirroring 和 iPad 支持。
- Tab bar、sidebar、导航栏、菜单功能增强。
- 为 Apple Intelligence 新功能做准备。

### 8.2 Modernize your AppKit app（#289，18:01）

- **现代输入**：使用手势识别器替代传统跟踪循环。
- 选择、上下文菜单和拖放功能增强。
- 键盘导航和状态项增强。
- 跨启动的连续性和状态恢复。
- **Liquid Glass 设计**：macOS 27 设计更新，新的角落同心性（concentricity）API。

### 8.3 Elevate your app's text experience with TextKit（#370，23:46）

- **四层架构**：文本存储层（Text Content Storage）→ 布局层（Text Layout Manager）→ 视口层（Viewport）→ 视图层（View）。
- **新 API**：`NSTextViewportRenderingSurface` 协议和 `NSTextViewportRenderingSurfaceKey` 协议。
- **扩展框架文本视图**：UITextView 和 NSTextView 可子类化并重写委托方法添加自定义行为。
- **示例**：代码编辑器行号显示、可折叠食谱章节。
- 文本附件的新缓存和复用策略。

---

## 九、Web / Safari（5 场）

### 9.1 What's new in WebKit for Safari 27（#204，16:32）

- 超过 1000 项浏览器引擎改进。
- **CSS Grid Lanes**：新的瀑布流/砖墙布局模式。
- **Customizable Select**：HTML select 元素可自定义样式。
- **HTML Model element**：在网页中嵌入交互式 3D 内容。
- **Immersive Website Environments**：沉浸式网站环境。
- Web Extensions 和 MapKit JS 更新。

### 9.2 Create web extensions for Safari（#216，26:42）

- **入门**：使用 manifest.json 定义扩展，在 Safari 开发者设置中加载。
- **阻止内容**：使用 Declarative Net Request API 阻止/修改/重定向网络请求。
- **修改网页**：使用 Content Scripts 读取和修改网页内容。
- **打包分发**：通过 App Store Connect 打包分发，TestFlight 分享测试。
- **Native Messaging**：扩展与宿主应用通信。
- 扩展在 iOS、iPadOS、macOS 和 visionOS 上同时工作。

### 9.3 Get started with the HTML Model Element（#215，15:52）

- **加载模型**：`<model src="...">` 加载 USDZ 模型，`<img>` 作为回退。
- **交互**：`stagemode="orbit"` 实现自由旋转，`entityTransform` 自定义视角。
- **动画播放**：通过 `playbackRate` 和 `play()` 控制模型内建动画。
- **AR Quick Look**：`<a rel="ar">` 在 iOS/iPadOS 上启用 AR。
- **优化**：`usdcrush` 命令行工具压缩模型（7.9MB 降至 1.9MB）。

### 9.4 Learn CSS Grid Lanes（#314，10:25）

- **Grid Lanes**：介于 Grid 和 Flexbox 之间，结构化一个轴而释放另一个轴。
- **三行 CSS**：`display: grid-lanes` + `grid-template-columns` + `gap`。
- **砖墙变体**：替换为 `grid-template-rows` 实现横向砖墙。
- **Flow Tolerance**：`flow-tolerance` 属性控制项目放置灵活性。
- 已在 Safari 26.4 中可用。

### 9.5 Rediscover the HTML select element（#315，9:30）

- **样式化按钮**：`appearance: base-select` 启用新样式模型，`::picker-icon` 自定义箭头。
- **自定义下拉**：`::picker(select)` 样式化下拉菜单，`:checked` 强调选中项。
- **富内容选项**：在 `<option>` 中放置 SVG 图标、图片、标签。
- **selectedcontent 元素**：显示选中选项的富内容。
- Safari 27 和 Chrome 135 中可用。

---

## 十、visionOS / RealityKit / 空间计算（14 场）

### 10.1 Build next-generation experiences with visionOS 27（#287，32:35）

介绍 visionOS 27 的新特性和 API，帮助开发者构建下一代空间计算体验。涵盖新框架能力、性能优化、以及空间应用设计模式的更新。

### 10.2 Explore advances in RealityKit（#279，23:51）

探讨 RealityKit 框架的最新进展，包括新的渲染能力、物理模拟改进和空间音频增强，为构建沉浸式空间体验提供更强工具。

### 10.3 Collaborate on structured 3D models in visionOS（#284，25:16）

介绍在 visionOS 中协作处理结构化 3D 模型的新功能，支持团队在空间环境中共同编辑和查看 USD 格式的 3D 内容。

### 10.4 Discover the Spatial Preview framework（#282，14:45）

介绍全新的 Spatial Preview 框架，允许开发者在空间计算环境中预览和测试 3D 内容，提供实时渲染和交互预览能力。

### 10.5 Explore enhancements to visionOS object tracking（#283，14:05）

探讨 visionOS 物体追踪功能的增强，包括更精确的实时物体识别和追踪能力，支持更多类型的物体和更复杂的场景。

### 10.6 Discover USDKit and what's new in OpenUSD（#285，14:33）

介绍 USDKit 框架和 OpenUSD 的最新更新，帮助开发者在 Apple 平台上使用通用场景描述（USD）格式处理 3D 资产。

### 10.7 Use foveated streaming to bring immersive content to visionOS（#286，约 14 分钟）

使用注视点流式传输（FoveatedStreaming）技术将沉浸式内容引入 visionOS，通过根据用户视线方向动态调整渲染分辨率来优化性能和带宽，支持 NVIDIA CloudXR。

### 10.8 Supercharge your spatial workflows with Reality Composer Pro 3（#393，21:52）

- Reality Composer Pro 3 新增多种 Graph 编辑器：Animation Graph、Behavior Trees、Script Graph、Navigation Mesh、Compute Graph、Shader Graph。
- 大幅提升空间内容创作效率。

### 10.9 Extend Reality Composer Pro 3 functionality with Xcode（#281，22:02）

介绍如何通过 Xcode 扩展 Reality Composer Pro 3 的功能，实现更高效的空间内容开发工作流。

### 10.10 Iterate your spatial scenes faster with Reality Composer Pro 3（#280，16:44）

使用 RCP 3 更快地迭代空间场景，包括快速预览、实时编辑和调试工具。

### 10.11 Design no-code games with Reality Composer Pro 3（#252，18:53）

使用 RCP 3 的无代码功能设计空间游戏，通过可视化编辑器创建交互式游戏体验。

### 10.12 Design immersive environments for visionOS apps and the spatial web（#234，15:58）

探讨沉浸式环境的设计原则和最佳实践，帮助开发者创建引人入胜的空间计算环境。

### 10.13 Explore immersive website environments in visionOS（#320，19:09）

介绍如何在网站中创建沉浸式环境体验，将空间计算概念扩展到 Web 平台。

### 10.14 Build live production tools for Apple Immersive Video（#338，16:23）

构建 Apple Immersive Video 的实时制作工具，涵盖空间视频捕获、处理和播放的技术细节。

---

## 十一、Metal / 游戏 / 图形（7 场）

### 11.1 Build real-time neural rendering pipelines with Metal（#359，22:16）

- **MetalFX Denoising**：结合神经放大器和去噪器的统一方案。
- **去噪器最佳实践**：漫反射反照率、透明度叠加、去噪强度遮罩。
- **主表面替换**：用于反射和玻璃效果。
- **ML 命令编码器**：部署已训练模型（MTLPackage 格式）。
- **神经色调映射**：基于 HDRNet 架构。
- **TensorOps API**：用于内联着色器网络。

### 11.2 Optimize custom machine learning operations with Metal tensors（#330，16:13）

- **神经加速器**：M5/A19 Pro GPU 中每个着色器核心内嵌。
- **量化数据类型**：4/8 位整数，新增 4/8 位浮点和 2 位整数。
- **协作张量**：线程私有内存分布。
- **reduce_rows**：用于 FlashAttention SoftMax。
- Core AI 集成（TorchMetalKernel、PyTorch 导出）。

### 11.3 Find and fix performance issues in your Metal games（#388，21:01）

- **Metal Performance HUD**：实时 GPU 性能监控。
- **Instruments**：Game Performance Overview 模板用于深度分析。
- **metalperftrace CLI**：macOS 27 新增命令行工具。
- **StateReporting API**：将渲染状态建模为有限状态机。
- **MetricKit**：字段数据收集。

### 11.4 Bringing Cyberpunk 2077 to Mac（#356，27:54）

- CD Projekt Red 将《赛博朋克 2077》移植到 Mac 的经验分享。
- 使用 Game Porting Toolkit 评估，建立原生 Metal 渲染基础。
- Metal Shader Converter 转换着色器。
- MetalFX Upscaling + Dynamic Resolution Scaling。
- 创建 "For this Mac" 预设（基于设备自动配置）。

### 11.5 Speedrun your game port with agentic coding（#357，28:00）

- **Game Porting Toolkit 4**：AI 辅助移植，专家技能包括 translating-to-metal、shader-converter、GPU-debugging 等。
- **移植助手代理**：discover、plan、validate 工作流。
- macOS 27 新增 gpucapture/gpudebug CLI 工具。
- Metal 4 显式内存管理、Metal Shader Converter 运行时参数缓冲区布局。

### 11.6 Make your game great with touch（#358，24:23）

介绍 Touch Controller 框架，为 Mac 和 iPad 上的游戏提供灵活的触控布局、流畅的交互和丰富的触觉反馈。

### 11.7 Unlock in-game content with StoreKit and Background Assets（#378，9:59）

- 面向 Unity 开发者的 StoreKit 和 Background Assets 集成指南。
- 本地化资源包、Steam Asset Converter。
- 新的 Apple Unity 插件（C# API）。
- iOS 27 重新设计的支付页面（支持横屏）。

---

## 十二、相机 / 照片 / 媒体（6 场）

### 12.1 Build a responsive camera app that launches quickly（#303，25:20）

- **延迟启动 API**：`AVCaptureSession.automaticallyRunsDeferredStart`，延迟初始化相机硬件。
- **响应式捕获**：`isResponsiveCaptureEnabled` 允许照片输出立即捕获。
- **稳定预览**：AVCaptureVideoPreviewLayer vs AVCaptureVideoDataOutput 的权衡。
- **确定性文件写入**：AVProVideoStorage API，用于高数据率视频捕获如 ProRes。

### 12.2 Implement high resolution photo capture（#304，17:58）

- 支持 12MP、24MP、48MP 分辨率（Main、Tele、Ultra Wide 相机）。
- 四种捕获类型：完全处理照片、曝光包围、Bayer RAW、Apple ProRAW。
- `maxPhotoQualityPrioritization` 设为 .quality 或 .balanced。
- 响应式最佳实践：重叠捕获、延迟照片处理、快速捕获优先级。

### 12.3 Support the Center Stage front camera in your iOS app（#341，17:44）

- **硬件特性**：iPhone 17/17 Pro/Air 方形图像传感器，95 度视场角，居中摄像头。
- **dynamicAspectRatio**：iOS 26+，5 种比例（3x4/4x3/9x16/16x9/1x1），无需重建捕获会话。
- **smartFramingMonitor**：自动人脸/注视检测，提供宽高比和缩放因子建议。
- **视频通话**：VoIP 后台模式自动支持；cinematicExtended 电影稳定模式。

### 12.4 Discover generated subtitles and subtitle styles（#256，11:00）

- **两种生成方式**：语音转文字（从音频生成字幕）和语言翻译（从现有字幕翻译）。
- 支持 HLS 内容（含直播）、点播视频、文件内容。
- iOS/macOS/tvOS/visionOS 27 支持英语音频生成英语字幕、英语字幕翻译为多种语言。
- **字幕样式预览**：`AVPlayerLayer.setCaptionPreviewProfileID` 按样式预览。

### 12.5 Enhance RAW image processing with Core Image（#305，16:28）

- **RAW 9 API**：基于分块 CoreML 模型（结合去马赛克和去噪），在 Apple Neural Engine 上运行。
- 大幅提升图像质量：更清晰、色彩更准确、噪点更少。
- `CIRAWFilter` 20 个可调参数：exposure、sharpness、contrast 等。
- 性能最佳实践：交互编辑使用 scaleFactor 缩小显示，导出时关闭缓存。

### 12.6 Meet the Music Understanding framework（#253，16:40）

- **六大分析维度**：Key（调性）、Rhythm（节奏）、Structure（结构）、Pace（速度感）、Instrument Activity（乐器活动）、Loudness（响度，LUFS 标准）。
- **API**：`MusicUnderstandingSession` 从 AVAsset 初始化，`analyze()` 全部分析或指定类型。
- **Loudness 流式 API**：AsyncSequence，每 100ms 交付。
- 完全设备端运行、保护隐私、支持离线。

---

## 十三、其他框架 / 设计 / 隐私安全（30+ 场）

### 媒体与音频

- **Meet the Now Playing framework（#312，12:36）**：全新 Now Playing Swift 框架，将应用媒体播放连接到系统界面（锁屏、控制中心、灵动岛、CarPlay、StandBy）。MediaSessionRepresentable 协议、RemoteMediaSessionRepresentable 协议、Media Sharing Extensions。
- **Integrate MusicKit into your app（#254，21:06）**：MusicKit 集成全面指南：开发者令牌注册、MusicAuthorization 授权、Music Item 值类型、Music Picker（.musicPicker 修饰符）、MusicPlayer（SystemMusicPlayer vs ApplicationMusicPlayer）、目录请求分页。

### 性能与监控

- **Meet the new MetricKit（#222，17:43）**：介绍全新 MetricKit 框架，提供更强大的应用性能和指标监控能力，帮助开发者诊断和解决性能问题。

### 实时体验

- **Live Activities essentials（#223，15:16）**：全面介绍 Live Activities 的核心概念和实现方法，包括锁屏和灵动岛上的实时活动展示、更新机制和最佳实践。
- **Create live communication experiences（#226，17:18）**：讲解如何创建实时通信体验，利用新的 API 构建高质量的音视频通话和消息传递功能。

### 健康

- **Deliver workout insights with HealthKit workout zones（#207，12:15）**：介绍 HealthKit 运动区域的全新功能，帮助健身应用通过运动区间提供更深入的锻炼洞察和反馈。

### 钱包与支付

- **What's new in Wallet（#209，15:49）**：Wallet 框架的最新更新，包括新的卡片类型、支付功能和开发者 API。
- **What's new in Apple In-App Purchase（#210，13:26）**：IAP 更新：12 个月承诺的月度订阅、Bundles 和 Suites、优惠码兑换 API 增强、App Review 提交体验改进。

### CarPlay 与 tvOS

- **Rev up your CarPlay app（#212，16:20）**：CarPlay 更新：视频应用、MiniPlayer、语音控制模板、导航面板、路线共享。
- **Prepare your tvOS apps for Dynamic Type（#221，10:08）**：为 tvOS 应用准备 Dynamic Type 支持，确保文字在不同设置下正确显示。

### 蓝牙与手写

- **Find your accessory with Bluetooth Channel Sounding（#369，8:12）**：蓝牙信道探测技术，通过精确测距帮助用户查找配件设备。
- **Read between the strokes with PencilKit（#203，15:10）**：PencilKit 更新：`PKStrokeRecognizer` 手写识别、贝塞尔路径转换、笔画切片。
- **Unwrap PaperKit（#372，7:39）**：PaperKit：PaperMarkup 子元素、MarkupInteractions、MarkupAdornment 覆盖层。

### App Store 与商业化

- **Enhance your presence on the App Store（#205，8:14）**：提升 App Store 上的应用展示，包括产品页面定制、搜索优化和发现性提升策略。
- **Explore Retention Messaging in App Store Connect（#309，15:10）**：App Store Connect 中的留存消息功能，帮助开发者通过定向消息提高用户留存率。
- **Offer subscriptions to groups and organizations（#391，7:56）**：向群组和组织提供订阅服务，包括批量订阅管理、组织级许可和 IT 管理员分配功能。

### 评估与安全

- **What's new in assessment on macOS（#230，14:01）**：macOS 评估模式更新：前提条件检查（SIP、托管设备）、无障碍限制（逐功能控制 VoiceOver/SwitchControl/Zoom）、系统体验定制（菜单栏、Dock、目录）、进程限制。
- **Secure your apps with App Attest（#201，20:02）**：
  - 确保应用运行在真实 Apple 硬件上（安全隔区绑定密钥对）。
  - iOS 27 新增：启动验证类别和 Bundle 版本扩展。
  - macOS 27 新增支持：ACL Blob OID（验证完整安全模式和 SIP 状态）。
  - 工作流：密钥生成 → 认证 → 断言，最佳实践包括服务器控制、指数退避、后台执行。
- **Meet Trust Insights（#379，13:57）**：
  - **Trust Insights**：iOS 27 全新框架，检测社交工程和胁迫攻击。
  - `IsLikelyBeingCoachedInsight` 三个结果值：unknown/medium/high。
  - 五个操作类别：payment、account、resourceUse、communication、other。
  - 设备端数据处理、输入立即丢弃、仅输出值离开设备。

### 开发工具

- **Get the most out of Device Hub（#260，17:09）**：Xcode 27 全新独立 Device Hub 应用：紧凑模式和完整窗口模式、画布区域实时显示设备画面、侧边栏设备清单、检查器面板设置/诊断/信息、devicectl CLI。
- **Discover container machines（#389，11:07）**：Container 应用中新增容器机功能，提供在 Mac 上的轻量级持久化 Linux 环境。
- **Expand the capabilities of your Virtualization app（#224，20:29）**：
  - **macOS 客户机预配置**：指定全名、用户名、密码，可选自动登录和 SSH。
  - **Accessory Access 框架**：USB 设备直通，支持热插拔。
  - **高级网络拓扑**：vmnet 框架自定义网络配置。
  - **DiskImageKit**：Apple Sparse Image Format、分层镜像、写时复制。

### 设备管理

- **What's new in managing Apple devices（#206，23:02）**：
  - **Apple Business**：全新一体化平台，扩展至 200+ 国家和地区。
  - **声明式管理（已成为标准）**：托管迁移、Apple Intelligence/Siri/键盘细粒度控制。
  - **应用管理**：ManagedApp 框架、硬件绑定密钥、Managed Device Attestation。
  - **身份集成**：Platform SSO 增强、现代认证标准（一次性码、推送通知条件访问、QR 码）。

### 设计

- **Principles of great design（#250，17:16）**：探讨优秀设计的核心原则，涵盖视觉设计、交互设计和用户体验的最佳实践。
- **Communicate your brand identity on iOS（#251，17:26）**：
  - **UI 层与内容层区分**：Liquid Glass 范式下，内容层作为品牌画布。
  - 标准组件用于导航，自定义组件用于独特内容。
  - 颜色在内容区域使用，tint color 用于操作和状态。
  - 自定义排版配合 Dynamic Type 缩放，SF Symbols 与自定义图标权衡。
- **Design intuitive search experiences（#292，16:17）**：探讨如何设计直观的搜索体验，包括搜索交互模式、结果展示和过滤功能的设计原则。
- **Craft clear names for features and labels in your app（#290，15:04）**：为功能特性起清晰明了的名称，提升用户理解和产品可用性。

### 无障碍

- **Refine accessibility for custom controls（#220，16:25）**：
  - 核心原则：目的、价值、操作、反馈。
  - `.adjustable` trait 配合 `accessibilityAdjustableAction`。
  - 直通手势（双击并按住）、`accessibilityActivationPoint`。
  - `allowsDirectInteraction` trait 实现直接触摸。
- **Enhance the accessibility of your reading app（#219，20:00）**：
  - 三大目标：细粒度文本导航、连续阅读体验、全面的文本选择。
  - `accessibilityNextTextNavigationElement` API。
  - iOS 27 新增 SwiftUI `accessibilityLinkedGroup` 修饰符。
  - `UITextInput` 协议实现行级触摸探索和粒度导航。

---

## 数据来源

1. [Apple Developer - WWDC26 Videos](https://developer.apple.com/videos/wwdc2026/)
2. [Apple 新闻room - WWDC26 日程公告](https://www.apple.com.cn/newsroom/2026/05/apple-kicks-off-worldwide-developers-conference-on-june-8/)
3. [Kodeco - WWDC26: Sessions Worth Your Time](https://www.kodeco.com/53131394-wwdc26-sessions-worth-your-time)
4. [MacObserver - Everything Apple Announced at WWDC 2026](https://www.macobserver.com/news/everything-apple-announced-at-wwdc-2025/)
