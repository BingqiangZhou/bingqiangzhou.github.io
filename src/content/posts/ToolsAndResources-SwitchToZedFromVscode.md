---
title: 【工具分享】VSCode 太重了，今天我把主力编辑器换成了 Zed
published: 2026-10-29
description: '用了多年 VSCode 之后，今天把主力编辑器换成了 Zed：起因是 VSCode 实在太重——十几个进程、GB 级内存、冷启动等不起，换过来之后"快得不像话"。文中深度对比两者的架构（Electron vs Rust + GPUI）、扩展模型（Node 扩展宿主 vs WASM 沙箱）、AI 策略（Copilot 深度绑定 vs ACP 开放协议）与生态成熟度，并完整讲一遍 Atom → Electron → VSCode → Zed 这段跨十五年的编辑器恩怨——Atom 团队为了 Atom 造了 Electron，Electron 成就了 VSCode，微软收购 GitHub 后 Atom 被退役，原作者们用 Rust 从头再造了 Zed。'
tags: [工具分享, 折腾记录]
abbrlink: switch-to-zed-from-vscode
---

今天早上我干了件念叨了很久的事：**把主力编辑器从 VSCode 换成了 Zed。** 到晚上写这篇文章的时候，我可以负责任地说一句：不后悔，而且有种"早干嘛去了"的感觉。

起因特别朴素——**现在的 VSCode，实在是太重了。** 打开我这个博客仓库（就是个 Astro + pnpm 的静态站，没几万行代码），改两行 Markdown，任务管理器里 `Code.exe` 排出一串十几个进程，内存常驻 GB 级，冷启动要盯着启动画面数秒。而我的真实使用场景，早就退化成了"看代码、改几行、起个终端"——重活都交给终端里的 coding agent 了。一个主要用来"看和改"的工具，凭什么吃掉这么多资源？

于是我换到了 Zed。这篇文章记录这次切换，顺便把 Zed 和 VSCode 掰开揉碎比一遍——以及它们背后那段横跨十五年、比产品本身精彩得多的恩怨史。

## 一、导火索：VSCode 怎么就"太重了"

先说清楚"重"从哪来，不然就像是无脑跟风。

**第一，Electron 的先天体质。** VSCode 跑在 Electron 上——本质是给你每个窗口配一颗定制的 Chromium 浏览器，再加上 Node.js 运行时。浏览器内核 + JS 引擎 + 渲染管线，这套东西天生就不是为"低延迟文本编辑"设计的，它是为"渲染网页"设计的。今天你觉得 VSCode 慢，很大一部分是这套地基的税。

**第二，扩展是自由了，但也失控了。** VSCode 的扩展跑在一个完整的 Node.js 扩展宿主（extension host）进程里，拥有几乎全部 Node 能力——这造就了它无敌的生态，但也意味着：任何一个写得糟糕的扩展都能拖慢你的启动、吃掉你的内存、甚至卡住整个 UI。装得越多，越重。我这几年的 VSCode 装了三十多个扩展，其中一半我甚至想不起来是干嘛的。

**第三，功能还在往里堆。** 这两年 VSCode 把 Copilot Chat、Agent Mode、各种面板一路往里塞，功能表越拉越长。对重度 AI 用户这是福利，对我这种 agent 工作流早就在终端里（我用 ZCode，写过[迁移记录](/posts/coding-agent-migration/)）的人来说，编辑器内嵌的这些我几乎不碰——**但它们的重量我天天背着。**

有意思的是，翻我自己博客，2019 年我还写过一篇[《XMind 与 Sublime Text 等等其他工具》](/posts/toolsandresources-xmindandsublimetext/)——那时候我还在折腾 Sublime Text 3 的破解激活。Sublime 给我的核心记忆就是俩字：**轻快**。后来投奔 VSCode 是为了它的全功能生态，七年后绕了一圈，我又开始追"轻快"了。区别是，这次有个既轻快又不缺现代化功能的选择。

## 二、Zed 是什么：先给个三十秒版本

给还没接触过的朋友一句话介绍：**Zed 是一款用 Rust 从零写的、GPU 直接渲染的、原生多人协作的开源代码编辑器**，由 Atom 编辑器的原班人马打造，2024 年 1 月开源（GPLv3），2026 年 4 月 29 日发布了 1.0，现在保持每周发版的节奏。

对我这样的 Windows 用户来说还有个时间点值得记一下：**Zed 的 Windows 版是 2025 年 10 月底才发布的**——到我今天装它，刚好整整一年。也就是说 Windows 版已经过了一年打磨加 1.0 这个成色节点，不再是"尝鲜玩具"了。

官网下载安装包，装完点开的第一秒我就被说服了一半：**近乎瞬开。** 不是"很快"，是"感觉不到启动过程"。这篇文章接下来的部分，讲它为什么能做到，以及它到底牺牲了什么换来的。

## 三、要读懂 Zed，得先讲完 Atom 这段十五年的恩怨

Zed 和 VSCode 的对比如果只停留在"谁快谁慢"，就太浪费这个故事了。**这两个编辑器的背后，站着同一群人的两次人生。**

### Electron：Atom 造的孩子，成了 VSCode 的地基

2011 年，Nathan Sobo 加入 GitHub，开始做 Atom——口号是"a hackable text editor for the 21st Century"（21 世纪可魔改的编辑器），2014 年公测，2015 年 6 月发布 1.0。当年 Atom 是 GitHub 的门面明星，"用 Web 技术写桌面编辑器"这套玩法就是它带火的。

问题在于，2011 年你想用 Web 技术写桌面应用，连个趁手的壳都没有。于是 Atom 团队自己造了一个，叫 Atom Shell，2016 年更名——**Electron**。对，就是后来那个养活了 VSCode、Slack、Discord、Figma 桌面版的 Electron。它的第一份工作是给 Atom 当地基。

然后命运开始转折。**2015 年 4 月，微软发布了 VSCode——同样跑在 Electron 上。** 也就是说，VSCode 站着的地基，是 Atom 团队亲手打的。同一个 2015 年，VSCode（4 月）和 Atom 1.0（6 月）前后脚面世，但走势从此分岔：VSCode 背靠微软，背靠后来为它发明的 LSP 协议和海量生态，一路狂奔；Atom 慢慢掉队。**2018 年微软以 75 亿美元收购 GitHub，Atom 进了微软家门——家里已经有继子 VSCode 得宠。2022 年 6 月，GitHub 官宣 Atom 退役，12 月 15 日仓库正式归档。** 社区不甘心，fork 出了 Pulsar 项目续命，但大势已去。

"Atom 被 VSCode 杀死"这个说法在传播上很爽，但严格说不准确——杀死 Atom 的是注意力停止投入。不过有一个讽刺是实打实的：**Atom 团队造的 Electron，成了压垮 Atom 的那根杠杆的支点。**

### 2017 年的日记："我们必须从头再来"

Nathan Sobo 们在 Atom 时代的最后几年，最想做的其实是编辑器实时协作（2017 年他们发布了协作插件 Teletype）。但 Web 平台的天花板一次次撞上来：布局要"弯腰"、渲染要走 DOM、JS 的垃圾回收暂停没法控制、想上多线程就得把子系统整块下沉成 C++ 再包回 JS。按 Nathan 自己在官方博文《We Have to Start Over: From Atom to Zed》里的回忆，2017 年他在日记里写下：

> "We have to start over. We have to start over, this isn't working."
> （我们必须从头再来。必须从头再来，这样下去不行。）

关于 Electron 他还有段更扎心的原话：

> "It was a nightmare. I mean, the ironic thing is that we created Electron to create Atom, but I can't imagine a worse application for Electron than a code editor."
> （那是一场噩梦。讽刺的是，我们当年为了做 Atom 才造了 Electron，但我想象不出比"代码编辑器"更不适合 Electron 的应用了。）

于是这支队伍离开 GitHub，从头开始：2019 年动手写自研 UI 框架 GPUI，2021 年起小范围内测（仅 macOS），**2024 年 1 月正式开源**——编辑器主体 GPLv3，协作服务端 AGPLv3，GPUI 框架单独以 Apache-2.0 开源。再往后就是前面说的：2025 年 10 月底 Windows 版发布，2026 年 4 月 29 日 1.0 上线（同步推出 Zed for Business），如今预览版已到 1.2x，每周发版。

顺带一提，Zed 这个名字是英式英语里字母 Z 的读音——编辑器的"最后一个词"，官方这个梗也是够直白的。

### 遗产是互通的：LSP 与 Tree-sitter

这段恩怨里我最喜欢的一个细节：**编辑器战争没有白打，输家的遗产在赢家的肚子里活着，反之亦然。**

- **LSP（Language Server Protocol）是微软 2016 年为 VSCode 发明并开源的。** 它把"语言智能"从编辑器里拆出来变成标准协议，从此任何编辑器接上语言服务器就能获得补全、跳转、诊断。Zed 的语言支持走的正是 LSP——**VSCode 留给行业最好的遗产，Zed 是直接受益人。**
- **Tree-sitter 的作者是 Max Brunsfeld——Atom 团队成员、Zed 联合创始人。** 这个增量语法解析器如今是 GitHub 代码导航、Neovim、Zed 共同的地基。Atom 死了，Atom 人的代码活在所有主流编辑器里。

所以 Zed vs VSCode 根本不是什么"新贵挑战霸主"，而是**同一群人对自己两次作品的对赌**：第一次他们赌 Web 技术（Atom + Electron），赌输了性能；第二次他们赌 Rust + GPU（Zed），赌的就是当年输掉的东西。

### 一张时间线收束

| 时间 | 事件 |
|---|---|
| 2011 | Nathan Sobo 加入 GitHub 开始做 Atom |
| 2014 | Atom 公测（为其打造的地基后来开源为 Electron） |
| 2015-04 | VSCode 发布，同样跑在 Electron 上 |
| 2015-06 | Atom 1.0 发布，此后被 VSCode 全面反超 |
| 2016 | Atom Shell 更名 Electron；微软开源 LSP |
| 2017 | Atom 团队发布协作插件 Teletype；Nathan 日记"必须从头再来" |
| 2018 | 微软 75 亿美元收购 GitHub |
| 2022 | Atom 官宣退役并于 12 月 15 日归档；Nathan 发帖宣布 Zed 是"精神续作" |
| 2024-01 | Zed 开源（GPLv3 / AGPLv3 / Apache-2.0） |
| 2025-10 | Zed 发布 Windows 版 |
| 2026-04-29 | Zed 1.0 发布，推出 Zed for Business |

## 四、深度对比：同一个"编辑器"，两种世界观

故事讲完，回到产品本身。Zed 和 VSCode 的差异，表面是功能清单，底层是**两套完全不同的世界观**。

### 架构：Electron 三明治 vs Rust 一体化

VSCode 的架构是"三明治"：Chromium 负责渲染 UI，Node.js 主进程管窗口和生命周期，扩展宿主进程跑插件，语言服务器再单独起子进程。好处是 Web 技术栈门槛低、跨平台便宜、生态扩张快；代价是每个窗口背后都拖着一颗定制浏览器，进程间通信、JS 垃圾回收、DOM 协商，桩桩件件都是延迟和内存。

Zed 是 Rust 单体 + 自研 GPUI 框架 + GPU 直接渲染（macOS 走 Metal，跨平台后补了 Vulkan/DX12 后端）。按官方的说法，他们追求的是**每帧 3 毫秒以内**的渲染预算——120fps 刷新率下每帧也就 8 毫秒，这等于给"极致跟手"留足了余量。更有意思的是多线程哲学：Zed 跟 Rust 借用检查器较劲的产物之一，是一棵支持 O(1) 快照的写时复制 B 树，语法解析、全文搜索这类重活全部丢到后台线程，主线程只管画。**"快"不是优化出来的，是架构第一天就长在里面的。**

### 扩展模型：Node 扩展宿主 vs WASM 沙箱

这是两个编辑器分歧最深的地方。

VSCode 扩展拥有完整 Node.js 能力——什么都能干，所以生态什么都有。但反面是：扩展能拖垮 UI、能读你磁盘上的任何东西，供应链攻击的风险是真实存在的。

Zed 的扩展跑在 **WASM 沙箱**里（基于 WASI），碰不了任意文件、起不了子进程，天然安全，也天然不可能卡住 UI 线程。代价是某些"深度魔改类"扩展永远做不到。Zed 的补偿策略是**把最常用的大件直接内置**：Tree-sitter 语法高亮、LSP 语言支持、Vim 模式、Git 集成（含行内 blame）都是开箱即用的，扩展市场只补长尾。

生态数量的差距必须有心理预期：VSCode 官方口径 2025 年 5 月是 2.5 万 + 扩展（第三方统计口径最高能数到十万级），Zed 是几百上千的量级。**主流语言、主流主题、常见工具链 Zed 都有，但冷门插件大概率要搜一下、没有就真的没有。**

### 性能：数据之外，说体感

跑分文章网上一搜一大把，我说换过来一天的真实体感：

- **冷启动**：VSCode 要看启动画面转圈，Zed 是"点了就已经开了"。差距大到改变行为——我现在敢随手关掉再开，以前 VSCode 是舍不得关的。
- **输入延迟**：这是 Zed 官方最引以为傲的指标，体感上就是"字符贴着手指出现"，长时间打字疲劳感明显更轻。
- **大文件与全局搜索**：几千行日志、minified 文件，Zed 打开不卡顿；全仓库搜索基本是"回车即出结果"。
- **内存**：大方向是省，但我不想吹成玄学级差距——官方仓库里"Zed 内存对比"的讨论帖（#8736）一直很热闹，早期版本也爆过内存泄漏，现在成熟了但仍有改进空间。

**必须诚实记录的一个反面**：2026 年初 Windows 版 Zed 被用户报过冷启动倒退的 issue（#49442），团队在几轮"质量周"里集中修过。Windows 版终究才一岁，糙的地方比 macOS 版多，这是事实。

### AI：Copilot 的深度绑定 vs Zed 的开放协议

AI 时代编辑器的路线分歧，两家几乎是对着走的。

**VSCode 把 Copilot 塞进了每个毛孔**：补全、Chat、Agent Mode、编辑器内嵌终端联动，深度无可匹敌。代价是绑定微软生态——你当然可以配别的模型，但一等公民永远是 Copilot，而且这一切都在给前面说的"重"继续加码。

**Zed 的策略是"开放协议 + 自由模型"**：

- **Zeta**：自家的编辑预测模型（next-edit prediction），2024 年开源，开放权重、开放训练数据，专门学"你的下一个编辑动作"，补全粒度是击键级的。免费档送一定用量，重度使用上订阅。
- **BYOK（自带钥匙）**：Assistant 面板可以直接填各家 API key，Anthropic、OpenAI、本地 Ollama 都行，编辑器不锁模型。
- **ACP（Agent Client Protocol）**：2025 年 9 月推出的开放标准，让任意 AI agent 以标准方式接入任意编辑环境。Claude Code、Gemini CLI 这类外部 agent 都能挂进 Zed 的 Agent Panel 里跑。

我个人的偏好很明确：我的 agent 工作流本来就在终端（ZCode）里，编辑器内嵌 AI 我用得少。**"编辑器归编辑器，agent 归 agent，中间用开放协议互通"**——Zed 这个哲学对我来说刚刚好；而你如果是 Copilot 重度用户，VSCode 的体验目前仍是独一档。

### 协作、远程与生态

- **协作**：Zed 的多人实时协作是原生的、CRDT 架构的，体验丝滑，这是他们从 Teletype 时代就背着的执念；VSCode 的 Live Share 也能用，但更像外挂件。
- **远程开发**：这是 VSCode 的护城河——Remote SSH / WSL / DevContainer 全家桶，成熟度无可撼动。Zed 的 `zed-remote-server` 2024 年底才开始 beta，方向正确（UI 本地渲染、代码远端执行），但成熟度还有距离。**WSL2 重度用户（比如写过 WSL 折腾记录的我）短期内别急着全切。**
- **IDE 级设施**：调试器（顺带一提，DAP 也是微软搞的标准）、测试面板、Jupyter Notebook——VSCode 全都成熟，Zed 有基础支持但普遍年轻。
- **开源与商业模式**：VSCode 的核心 Code-OSS 是 MIT 的，但微软官方构建带遥测、扩展市场专有，所以才有 VSCodium 和 Open VSX 的存在；Zed 是 GPLv3 全开源，官方构建即开源构建，靠协作服务、AI 订阅和 Zed for Business 挣钱，编辑器本体承诺免费。

### 一张表收束

| 维度 | VSCode | Zed |
|---|---|---|
| 技术栈 | Electron（Chromium + Node.js） | Rust + 自研 GPUI，GPU 直接渲染 |
| 启动与输入延迟 | 冷启动秒级，输入偶有可感知延迟 | 近乎瞬开，击键级跟手 |
| 内存 | 进程多、常驻大，随扩展膨胀 | 明显更省，但仍有优化空间 |
| 扩展模型 | Node 宿主，全能力，也可拖垮 UI | WASM 沙箱，安全轻量，能力受限 |
| 生态 | 数万扩展，绝对霸主 | 数百上千，主流够用、长尾缺失 |
| AI | Copilot 深度绑定，体验独一档 | Zeta 开源补全 + BYOK + ACP 开放协议 |
| 协作 | Live Share（外挂感） | 原生 CRDT 实时协作 |
| 远程开发 | Remote SSH/WSL/容器，成熟 | zed-remote-server，较新 |
| 平台 | 全平台深耕多年 | macOS/Linux 久经打磨，Windows 满一岁 |
| 界面观感 | 精致耐看，但默认元素多、显拥挤 | 朴素，但默认极简利落（见仁见智） |
| 开源 | 核心 MIT，官方构建带遥测 | GPLv3 全开源，官方构建即开源构建 |

## 五、换过来第一天的真实体感

照例不吹不黑，好的不好的都摆出来。

**好的：**

1. **快，全方位的快。** 启动、打字、搜索、切换项目，每个环节都能感到"没有中间商"。这种体感很难向别人转述，但一旦习惯就回不去——就像用回高刷屏之后再摸 60Hz。
2. **多项目切换特别顺。** 博客、脚本、素材库几个项目来回切，开窗口、切项目都是"点了就开"。这是"快"带来的隐藏福利：切换没有启动税，也就没有心理成本——以前 VSCode 是"开着就不想关"，现在随手开、随手关。
3. **迁移比想象中无痛。** 设置就是两个 JSON（`settings.json` + `keymap.json`），从 VSCode 来的人天然亲切；社区有 VS Code 键位映射扩展，Ctrl 系快捷键基本无缝；One Dark 之类的主流主题都有。
4. **大件全内置。** Vim 模式、Git 行内 blame、多缓冲区（multibuffer，跨文件的"缝合编辑视图"）这些别人要装插件的东西，它开箱就有，而且因为内置，快且稳。
5. **"编辑器不碍事"的哲学很对味。** 我的重活都在终端 agent 里，编辑器越安静越好，Zed 的产品气质完全踩在这个点上。

**不好的：**

1. **Windows 版仍有一岁产品该有的毛边。** 个别设置项位置不顺手、边缘场景的渲染小瑕疵，我在第一天里都碰到了，不致命，但需要一点容忍度。
2. **UI 没有 VSCode 好看——这条见仁见智。** 默认界面偏"工具味"，图标、间距、动效这些细节的打磨，跟被 VSCode 精修了十年的视觉体系比，确实朴素一截。但这枚硬币有另一面：**简洁。** Zed 默认界面非常克制，没有活动栏图标排队、没有状态栏徽章、没有各路 AI 入口抢注意力，VSCode 那种"每个扩展都想让你看它一眼"的热闹，在它这里完全没有——嫌 VSCode 拥挤的人，这份朴素反而越看越顺眼。主题和图标主题能缓解观感问题，但可定制的颗粒度（产品图标、文件图标、边角细节）远不如 VSCode 生态丰富。我属于"能用就行"党，这条对我无感；但如果你的编辑器还兼作"门面"，先掂量掂量再换。
3. **长尾扩展缺失是真的。** 我有两个 VSCode 插件在 Zed 里没有等价物，好在都是低频使用，忍了；高频依赖插件的朋友换之前先去扩展市场搜一遍。
4. **远程和 WSL 场景还得回 VSCode。** 涉及 WSL2 的活儿，我目前还是开 VSCode——这块等 Zed 追上来再说。

所以我的现状是：**Zed 当日常主力，VSCode 留着干远程和个别插件活。主力换防，不是删号。**

## 六、谁适合现在就换，谁先别急

**适合现在就换的：** 前端/脚本/写作型开发者；coding agent 工作流在终端、只需要编辑器"快且安静"的人；Vim 党（内置 vim mode 做得相当正）；被"编辑器占用比 IDE 还高"烦了很久的人。

**先别急的：** Remote SSH/WSL/DevContainer 重度用户；调试器和 Jupyter 重度用户；有特定插件硬依赖的；对界面精致度敏感、把编辑器当"门面"的颜值党；以及 Windows 上追求"零毛边"体验的完美主义者——再给 Zed 的 Windows 版半年时间。

## 七、写在最后：工具的轮回

从 2011 年的 Atom，到 2015 年的 VSCode，再到 2026 年的 Zed 1.0，这条线上最动人的其实不是哪个产品赢了，而是那群人认赌服输的干脆：他们亲手造了 Electron，亲眼看着它托举起了杀死自己产品的对手，然后没有抱怨平台，而是承认"当年那注押错了"，用 Rust 从第一行代码重写了一遍。

我自己的轨迹也在这条轮回里：2019 年用 Sublime 图个轻快，中间这些年用 VSCode 图个全能，2026 年的今天换到 Zed——**图一个"轻快，但这次不缺现代化功能"**。工具的尽头是顺手，而顺手这件事，每隔几年就值得重新评估一次。

对了，还有一个时间上的巧合值得记一笔：**我装 Zed 的今天，距离它的 Windows 版发布刚好一周年。** 生日快乐，晚一年上车，也挺好。

## 参考与延伸阅读

- [We Have to Start Over: From Atom to Zed（Zed 官方博文，Nathan Sobo 第一人称回忆）](https://zed.dev/blog/we-have-to-start-over)
- [Zed is 1.0（Zed 官方 1.0 发布公告）](https://zed.dev/blog/zed-1-0)
- [Fast, Rust-Based Zed Code Editor Finally Arrives on Windows（The New Stack，2025-10）](https://thenewstack.io/fast-rust-based-zed-code-editor-finally-arrives-on-windows)
- [Zed team releases version 1.0 of Rust-built editor（The Register，2026-04）](https://www.theregister.com/software/2026/04/30/zed-team-releases-version-10-of-rust-built-editor/5225716)
- [Agent Client Protocol（ACP）官网](https://zed.dev/acp)
- [Celebrating 50 Million Developers（微软官方博客，VSCode 数据口径）](https://developer.microsoft.com/blog/celebrating-50-million-developers-the-journey-of-visual-studio-and-visual-studio-code)
- [Zed 内存使用社区讨论（GitHub Discussion #8736）](https://github.com/zed-industries/zed/discussions/8736)
- [Zed Windows 冷启动 issue #49442](https://github.com/zed-industries/zed/issues/49442)
