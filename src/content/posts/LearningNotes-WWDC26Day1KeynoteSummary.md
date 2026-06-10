---
title: 【学习笔记】WWDC 2026 Day 1：Keynote 与平台技术综述
published: 2026-06-10
description: WWDC26 第一天 Keynote + Platforms State of the Union 完整笔记，涵盖 Siri AI 全面重构、六大操作系统更新、Liquid Glass 设计语言优化、Apple Intelligence 系统级升级，以及面向开发者的全新 AI 框架和工具链。
lang: zh
tags: [学习笔记, Apple, WWDC]
---

> 本文整理自 WWDC26 第一天（2026 年 6 月 8 日）的主题演讲（Keynote）和平台技术综述（Platforms State of the Union），按照**普通用户关注**和**开发者关注**两个维度分类整理。

## 概览

| 维度 | 数据 |
|---|---|
| Keynote 时长 | 76 分钟 |
| Platforms State of the Union 时长 | 61 分钟 |
| 操作系统更新数量 | 6 个（iOS、macOS、iPadOS、watchOS、visionOS、tvOS） |
| AI 相关内容占比 | 约 70% |
| 人事变动 | Tim Cook 作为 CEO 的最后一次 WWDC |

---

# 🧑‍💻 普通用户关注

## Siri AI — 自 2011 年以来最彻底的重构

Siri AI 是本次 WWDC 的头号发布。Apple 与 Google 合作，基于定制的 Gemini 模型打造了全新的 Siri，正式从语音助手进化为 **AI Agent**。

### 独立 Siri 应用

- Siri 首次拥有**独立 App**，采用类似 ChatGPT 的聊天界面
- 支持多轮对话，可处理行程规划、派对策划等复杂任务
- 聊天记录支持自动删除，可设置过期时间
- 通过 iCloud 私密同步对话记录，跨设备无缝衔接
- 覆盖 iPhone、iPad、Mac、Apple Watch、Apple Vision Pro

### 三大核心能力

- **上下文记忆**：支持多轮对话，理解对话历史，可处理复杂任务链
- **屏幕感知**：识别当前屏幕图文内容，联动相册、短信等本地信息操作。例如：看到 Instagram 帖子中的地点，直接获取导航
- **视觉智能（Visual Intelligence）**：iPhone 相机实时识别食物热量、翻译文字、读取营养标签、从名片抓取联系信息

### 灵活唤起与模型自由

- 语音唤醒、长按电源键、从屏幕顶部下滑均可唤起 Siri AI
- 灵动岛自动扩展显示 "Search or Ask" 提示，伴有发光光标
- **模型自由**：支持将 ChatGPT、Claude 等第三方 AI 服务设为默认应答引擎
- 系统级 Extensions 机制，允许 App Store 中的聊天机器人直接接入 Siri

### 隐私架构

- 设备端计算 + 私有云计算（Private Cloud Compute）双架构
- 数据仅用于当前指令，**不存储、不外传**
- 外部专家可随时验证隐私承诺
- 与 Google 合作的 Gemini 模型运行在 Apple PCC 服务器上

### 可用性

- 开发者测试版：即日起推出
- 用户 Beta 版：2026 年秋季
- 首发仅限美国（英语）
- **暂不支持中国大陆和欧盟**（因监管要求）

---

## Apple Intelligence 系统级升级

### 照片 App AI 编辑

- **Extend（智能扩图）**：自动将照片边界向外推，用 AI 生成内容填充新区域
- **Reframe（空间重构）**：按住拖动主体即可改变照片的透视和构图，如同时光倒流重拍
- **Clean Up（清理）**：大幅重建，解决此前物体去除不干净的问题
- **自然语言编辑**：通过语音或文字指令修改图片局部，如"给蛋糕加蜡烛"
- AI 编辑照片自动携带**隐藏 SynthID 水印**（谷歌技术）

### Safari 智能升级

- **Tab Topics**：自动按内容类型、使用频率等维度整理标签页
- **Notify Me**：监控网页更新，如产品补货、降价时主动通知
- **Describe an Extension**：用自然语言描述需求，Safari 自动生成自定义扩展
- 阅读模式 AI 提炼核心内容

### 密码 App 自动修复

- 一键自动修复所有弱密码和泄露密码
- 借助 Apple Intelligence 和 Safari，可代表用户安全登录网站
- 自动将账户密码升级为强密码

### 快捷指令（Shortcuts）

- 支持**自然语言创建**自动化流程，告别复杂编程
- AI 理解用户意图并自动生成所需步骤
- 如需调整，只需描述更改内容即可自动完成
- 示例：根据日历事件设置闹钟、连接妙控键盘时自动打开特定应用布局

### 信息 / 邮件智能回复

- 信息 App 根据对话上下文提供一键建议（创建提醒、笔记、找照片）
- 智能回复（Smart Reply）**学习用户个性化写作风格**
- 邮件建议功能更强大，可与第三方应用协同工作

### Image Playground 升级

- 支持**照片级写实风格**生成，运行在 Private Cloud Compute 上
- 网格展示改为更大圆角卡片样式
- 新增 "describe a change" 选项，支持用文字描述修改已生成图片
- 可为锁屏和联系人海报生成图像，支持任意比例

### 写作工具升级

- 系统级语法检查能力趋近 Grammarly 水平
- 可精准识别句式错误和语法漏洞
- 在邮件、备忘录等应用中提供更智能的文字建议

---

## iOS 27

### 设计理念：Snow Leopard 式务实进化

- 不堆砌炫技新功能，重心放在**全链路系统性能优化**、漏洞修复与底层稳定性
- 为 Apple Intelligence 深度落地打造稳固可靠的系统底座
- 精简冗余代码，**内存占用减少 20%**，日常续航延长 1-2 小时
- 兼容目前所有运行 iOS 26 的机型，**iPhone 11 也能升级**

### 性能提升

- 应用启动速度提升最高 **30%**
- 新拍照片在图库中的显示速度提升最高 **70%**
- AirDrop 传输速度提升最高 **80%**
- 云端硬盘传输速度提升最高 **5 倍**
- Wi-Fi 与蜂窝网络切换更智能流畅
- 低带宽环境下发送大照片/视频不拖慢对话，新增发送进度指示条

### 搜索重构

- 从底层重构了 Spotlight、照片和邮件等 App 中的搜索功能
- 新的索引架构为设备中所有内容建立详细目录
- 新增内容即刻索引并收录
- 邮件采用新排序系统，最佳搜索结果中显示相关性最高的结果

### 相机与视觉智能

- 相机 App 新增 **"Siri 模式"**，与拍照、视频等模式并列
- 用于快速调用 Apple Visual Intelligence 视觉智能功能
- 识别植物、翻译文字、读取营养标签、从名片抓取联系信息

### 钱包 App

- 新增**账单分摊（Bill Split）**功能
- 支持自定义通行证创建

### 儿童安全与 Child Account

- 新增 **Child Account**，过滤不良内容，管控使用时长
- 家长可设定孩子能拨打的联系人范围、可访问的应用和网站
- 13 岁以下儿童设备，"请求浏览"和"请求购买"默认开启
- 苹果会根据孩子成长情况主动建议调整限制

---

## macOS 27 Golden Gate

### Intel Mac 正式落幕

- **停止支持 Intel Mac**，仅兼容 M1 及后续 Apple Silicon 设备
- macOS Tahoe 是最后一个支持 Intel Mac 的版本
- Intel Mac 正式走入历史

### Liquid Glass 与视觉设计

- 新增**系统级透明度调节滑块**，窗口、菜单栏、Dock 栏自由调节
- 在完全不透明与半透明磨砂效果之间自由选择
- 优化透明度计算算法，多窗口叠加时保持清晰视觉层次
- 应用带回统一的顶部工具栏，侧边栏扩展至窗口边缘
- 边栏图标恢复为带颜色设计，通过上色区分前台/后台应用
- 窗口统一采用半径更小的圆角，自动适配无需开发者更新

### Safari 与 Spotlight

- Safari 起始页新增顶部四个标签页切换（收藏夹、书签、阅读列表、历史）
- Spotlight 深度整合 Siri AI，能感知屏幕全局内容、一键调用
- 可跨多个文件对比信息、撰写邮件

### 性能

- 应用启动提速 30%
- 隔空投送提速 80%
- iPad 外接硬盘传文件速度提升 5 倍

---

## iPadOS 27

### 与 iOS 27 共享 AI 能力

- Safari 支持自动整理标签页
- Spotlight 搜索升级为统一入口，可在同一页面提问、找文件、看应用建议、启动应用、发送短信、查询天气、添加日历事项
- 快捷指令支持自然语言创建
- 系统级语法检查覆盖 iPad 端

### 台前调度（Stage Manager）

- AI 自动整理窗口
- 支持跨应用拖拽时智能推荐操作

### Apple Pencil

- 手写转文本准确率提升
- 支持 AI 总结笔记、提取重点

---

## watchOS 27

### AI 与健康深度融合

- AI 分析心率、睡眠数据，**提前预警异常**
- 新增压力缓解训练，动态调整呼吸节奏
- 新增围绝经期与绝经期健康追踪
- Workout Buddy 运动伴侣升级

### Siri AI 登陆 Apple Watch

- 抬腕即可对话
- 支持查日程、发消息、控制智能家居

---

## visionOS 27

### 空间 Siri

- Siri AI 以**可移动 3D 悬浮球**呈现
- 无需唤醒词，直视即可对话
- 可在虚拟屏幕上拖拽、调整窗口
- 支持手势 + 语音双控制

### 全景照片转空间场景

- 自己拍摄的全景照片可转换为沉浸式空间场景
- Image Playground 支持 AI 生成 3D 虚拟物品，融入现实场景

### 地图俯瞰升级

- 将航拍图像和视觉智能模型相结合
- 俯瞰中的城市变得更加栩栩如生

### 控制中心重新设计

- visionOS 27 控制中心重新设计，操作更便捷

---

## tvOS 27

### AI 画质增强

- AI 将普通视频**超分至 4K**
- 自动优化对比度、色彩
- 支持 HDR10+ 动态元数据

### Siri 遥控

- 语音搜索影片、控制播放
- 支持跨设备同步观影记录

---

## Liquid Glass 设计语言优化

### 透明度控制

- 新增更精细的**透明度调节滑块**
- 可在"超清晰"和"有色玻璃"之间自由切换
- 让界面层次更加分明，兼顾美观与可读性
- 已适配 Liquid Glass 的应用无需额外适配即可使用

### 全新图标设计

- 系统图标全面刷新，更加灵动、更统一
- 细节更精致，辨识度更高

### 控件层叠优化

- 控制组件采用 Liquid Glass 打造
- 成为位于 App 上方的独立功能叠层
- 自动让位于内容，不影响下层内容折射效果

---

## 家长控制与儿童安全

### Child Account

- 13 岁以下儿童**必须**设置 Child Account，13-18 岁可选
- 设置后立即启用年龄适宜的跨系统保护
- Setup Assistant 帮助家长选择可用应用

### 内容可见性与通信安全

- 家长可手动设置儿童账户的内容可访问范围，后续逐步开放
- 儿童在 App Store 找到 App 后需请求家长许可
- 网页浏览同样需家长审核后决定
- 信息和 FaceTime 引入类似审核机制
- 通信安全功能：检测到裸露/暴力内容时发出警告并模糊处理
- 家长可要求批准每个新联系人

### 屏幕时间管理

- Time Allowances：为娱乐、游戏、社交媒体 App 设置每日总时间限额
- 基于临床和儿童发展专家指导的每日时间建议
- Schedules：管理不同时间段可访问的应用
- Screen Time 重新设计，更直观，一目了然查看平均使用时长和热门应用

---

## 性能优化（全平台）

### 底层优化

- 优化最底层的**内存使用、CPU 利用率、联网操作、显示渲染**
- 系统动画效果更流畅
- CPU 调度器优化：在恰当时间精准执行正确操作
- 优化适用于新款和老款 iPhone

### 具体提升数据

- 应用启动速度提升最高 **30%**
- 新拍照片显示速度提升最高 **70%**
- AirDrop 传输速度提升最高 **80%**
- iPad 浏览文件或传文件到外置硬盘速度最快 **5 倍**
- 内存占用减少 **20%**
- 日常续航延长 **1-2 小时**

---

## 其他用户相关更新

### iCloud 共享相簿跨平台

iCloud 共享相簿支持 Android 和 Windows 好友加入，且以全分辨率共享内容。

### 健康 App

经期跟踪提供围绝经期和绝经期相关提示，出现围绝经期迹象时也会收到提示。

### AirPods

新增自定义 EQ 功能，语音隔离更新承诺"录音室级"音质。

### App Store 更新

- 新增群组订阅（Group Subscriptions）
- 跨开发者 Bundles
- 个性化 Collections

### watchOS 27 设备支持

watchOS 27 停止支持部分旧款 Apple Watch，影响数百万用户。

---

## 发布时间表

| 阶段 | 时间 |
|---|---|
| 开发者 Beta | 即日起 |
| 公开 Beta | 2026 年 7 月 |
| 正式版 | 2026 年秋季（9 月） |
| Siri AI Beta | 2026 年秋季（美国首发） |
| 中国大陆/欧盟 | 待定 |

---

## 人事变动

- 这是 **Tim Cook 作为 CEO 的最后一次 WWDC**
- John Ternus（硬件工程高级副总裁）将于 2026 年 9 月 1 日接任 CEO
- Tim Cook 转任董事会执行董事长
- 库克在结语中说："回顾我担任 CEO 的岁月，这样的活动是最精彩的时刻之一。看到你们用我们提供的工具创造出的东西，一次次提醒我——想象力没有边界。"

---

# 👨‍💻 开发者关注

## Platforms State of the Union 概览

PSOTU 围绕三大支柱展开 — Apple Intelligence（AI 框架）、平台设计改进（Liquid Glass + 灵活布局）、开发者生产力（Xcode 27 代理编码），时长 61 分 38 秒。

---

## Apple Intelligence 开发者框架

### Foundation Models 框架重建

- 与 Google 合作基于 Gemini 技术重建，支持图像输入、云端模型集成（Claude/Gemini 等）
- **Dynamic Profiles**：新系统简化 AI 智能体和技能构建，可动态交换工具和更新指令
- **Core AI 框架**：全新设备端模型运行框架，内置于操作系统，充分发挥 Apple Silicon 性能

### 开发者权益

- **免费 PCC 访问**：下载量 < 200 万的开发者可免费使用 Private Cloud Compute 上的 Apple Foundation Models
- **开源**：Foundation Models 框架将于夏季末开源

### App Intents 更新

- 新实体和意图模式让应用内容进入 Spotlight 语义索引
- View Annotations API 让 Siri 对屏幕内容进行 conversational 操作

---

## Liquid Glass 开发者迁移

### 强制迁移

- 退出 Liquid Glass 的选项被移除，使用 Xcode 27 重新编译的应用自动采用新设计
- Liquid Glass 优化：更好的内容扩散、新的深色边缘增加深度感、用户可调的透明度滑块

### macOS 窗口

- 统一更紧凑的圆角半径，应用图标自动获得更清晰渲染

### iOS 应用可调整大小

- iPhone 应用在 iPad 和 Mac iPhone Mirroring 上支持调整大小

---

## SwiftUI 与 Swift 更新

### SwiftUI

- 可重排容器、任何容器的滑动操作
- 嵌套布局调整大小速度提升 **2 倍**
- 懒状态初始化
- 自动异步图像缓存

### Swift 6.4

- `anyAppleOS` 可用性简写
- 可抑制编译器警告
- defer 块中的 async 支持
- 改进的类型检查器诊断

### Notion 迁移案例

- Apple 引用 Notion 作为从跨平台 Web 技术迁移到原生 SwiftUI 的主要案例

---

## Xcode 27 与开发者工具

### Xcode 27 本体

- **体积缩小 30%**，完全为 Apple Silicon 打造，项目加载更快
- **设置 iCloud 同步**，工具栏完全可自定义
- **主题**：Emerald、Neon Noir、Coral Reef 等色彩主题贯穿整个应用
- **Device Hub**：取代 Simulator，将虚拟和物理设备整合于一处，支持实时调整大小和完整硬件控制
- **Xcode Cloud**：设置更简单，构建速度提升最高 **2 倍**

### 代理编码扩展

- 代理可运行测试、使用 Playground、自定义预览（明暗模式）、端到端驱动应用

### 插件生态

- 通过 Agent Client Protocol 添加技能、MCP 工具和代理
- Figma 和 GitHub 首发插件
- **与 Anthropic、OpenAI、Google 合作**将他们的代理引入 Xcode
- 开发者可在 Claude、Gemini 和苹果自有模型之间自由选择

---

## 其他开发者技术更新

### Intel Mac 正式落幕

- macOS Tahoe 是最后一个 Intel 版本
- Mac App Store 可发布仅 Apple Silicon 二进制文件

### Game Porting Toolkit

- 重大更新，添加 AI 技能用于编码代理
- 新的 Metal 命令行工具加速游戏移植

### MLX

- 开源 ML 研究框架现支持 Metal 4
- 可通过 Thunderbolt RDMA 跨多台 Mac 扩展模型训练

### Spatial Preview 框架

- Mac 应用可实时将 3D 模型扩展到 Apple Vision Pro 周围的空间中

### OS 内核

- OS 内核部分代码现已用 Swift 编写

---

## 首日发布的视频讲座

| 视频编号 | 标题 | 时长 |
|---|---|---|
| 101 | Keynote — WWDC26 主题演讲 | 76:14 |
| 111 | Keynote ASL — 手语版 | 76:14 |
| 102 | Platforms State of the Union — 平台技术综述 | 61:38 |
| 112 | PSOTU ASL — 手语版 | 61:38 |
| 122 | WWDC26 PSOTU Recap — 快速回顾 | 4:32 |
| 394 | Get ready for WWDC26 — 准备指南 | 1:24 |
| 121 | Announcing Apple's next big step for Siri — Siri 下一代预告 | 1:31 |

---

## Apple Design Awards 入围名单

- 36 款应用入围，涵盖 6 个类别：Delight and Fun、Inclusivity、Innovation、Interaction、Social Impact、Visuals and Graphics
- 获奖名单将在未来几周公布

## Swift Student Challenge

- 350 名获奖者，其中 50 名 Distinguished Winners 受邀前往 Cupertino 参加 WWDC 周特别活动
- 全球 20 所 Apple Developer Academies 已帮助数万名学生开启开发之旅

## 柏林开发者中心

Apple 第五个开发者中心将于 2026 年秋季在柏林开业，加入 Cupertino、上海、新加坡和 Bengaluru 的行列。

---

## 参考来源

1. [MacDailyNews - WWDC26: Apple unveils next generation of Apple Intelligence](https://macdailynews.com/2026/06/08/wwdc26-apple-unveils-next-generation-of-apple-intelligence-siri-ai-powerful-parental-controls-and-an-expansive-set-of-software-improvements/)
2. [TechCabal - From Siri AI to iOS27: Everything Apple announced at WWDC 2026](https://techcabal.com/2026/06/08/wwdc-2026-announcements/)
3. [少数派 - Liquid Glass 精调、Apple 智能大升级：WWDC26 发布会回顾](https://m.sohu.com/a/1034062092_115785/)
4. [TechRepublic - 10 Biggest Apple WWDC 2026 Announcements](https://www.techrepublic.com/article/news-11-biggest-announcements-apple-wwdc-2026/)
5. [掘金 - WWDC26 全面汇总](https://juejin.cn/post/7648894966207725620)
6. [Apple Developer - Platforms State of the Union 五大要点](https://developer.apple.com/cn/news/?id=lvart8mq)
7. [MacRumors - Apple Outlines Major AI and Developer Tool Updates at 2026 PSOTU](https://www.macrumors.com/2026/06/09/apple-outlines-major-ai-and-developer-tool-updates/)
8. [The Neuron - I Think Apple Just Won AI: Here's Why](https://www.theneuron.ai/explainer-articles/i-think-apple-just-won-ai-heres-why-/)
