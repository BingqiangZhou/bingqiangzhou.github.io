---
title: 【学习笔记】拆解 HyperFrames：一个把视频渲染从 HTML 里"长"出来的 skill 体系
published: 2026-07-23
description: 深度拆解 HeyGen 的 HyperFrames——用 HTML 声明时序、可 seek 的动画运行时、框架托管媒体播放，把视频渲染变成确定性的"逐帧采样"。本文从入口路由、核心契约、动画运行时、CLI 开发闭环到工作流派发，拆解这套 skill 体系的架构设计，以及它对写 agent skill 的启示。
lang: zh
tags: [学习笔记, Agent Skill]
abbrlink: hyperframes-skills-deep-dive
---

前面几篇我聊过 [Agent Skill 怎么写](/posts/agent-skill-writing-tips)、怎么把别人的好 skill 当教材。这一篇换个角度：拿一个**工业级**的 skill 体系做一次完整拆解，看看当一套 skill 复杂到要管"从一句话需求到一条渲染好的 mp4"的全流程时，它是怎么组织自己的。

被拆的对象是 HeyGen 开源的 **HyperFrames**——一句话定位：**从 HTML 渲染视频**。一个 HyperFrames 的 composition（合成体）就是一个 HTML 文件，它的 DOM 用 `data-*` 属性声明时序，动画运行时可 seek（随机定位），媒体播放由框架托管。听起来很 Web，但它真正解决的是一个传统视频渲染的根本矛盾，下面展开。

这篇是我把入口 skill、core 契约、animation、cli、creative、keyframes、registry、media-use 这一整圈读下来之后的结构化总结。信息密度优先，关键处加小结。

---

## 一、它到底在解决什么问题：确定性渲染

先把最底层的设计哲学讲清楚，否则后面所有架构都显得啰嗦。

视频渲染有两种思路。一种是**播放并录屏**——让动画跑起来，用 ffmpeg 抓帧。问题是它假设"帧按时间顺序到达"，一旦渲染器乱序采样、并行采样，任何依赖"我刚才经过过第 N 帧"的状态就会错乱：定时器、累积状态、事件驱动的动画全会崩。

HyperFrames 选了第二种：**逐帧采样**。渲染器拿着一个时间值，产出一个像素缓冲区，没有"播放"这个概念，每一帧都是一次全新的 seek。这要求一个铁律——

> **同一个时间值，永远产出同一组像素。**

这条铁律往下推，就有了所有那些看起来很严苛的"确定性规则"。不能用的东西清单：

- `Date.now()`、`performance.now()`——任何渲染期时钟。
- 没种子的 `Math.random()`——要随机感就用带种子的 PRNG。
- 渲染期网络请求拿必要资源——内联或预打包。
- hover / scroll / focus 状态——渲染器没有输入事件。
- `repeat: -1` 无限循环——要算成有限次数：`repeat: Math.max(0, Math.floor(duration / cycleDuration) - 1)`，注意是 `floor` 不是 `ceil`（`ceil` 会超出 `data-duration`）。

**一个细节**：动态文字别用 `<br>` 强制换行。强制换行无视实际渲染的字体宽度，当文字本来就能自然换行时会多断一次，造成重叠。用 `max-width` 让它自然换。

**一个更隐蔽的坑**：`transform` / `scaleX` 对一个内联 `<span>` 是空操作，对一个 `width: auto`（0px）的元素缩放什么都看不见。所以被 transform 的元素必须是 `display: block`/`inline-block` 且有真实尺寸。这类问题自动化检查经常漏掉，属于"沉默 bug"。

小结：HyperFrames 的全部精巧，都服务于"任意时间点可重现"这一条。理解了这点，core 里那些"不可商量"的规则就都有了理由。

---

## 二、入口 skill：一个状态机式的分诊台

入口 skill（`/hyperframes`）不干实事，它是个**分诊台**。它一上来先看项目当前处于什么状态，第一张匹配的行就执行，下面的行不看了：

| 状态 | 动作 |
| --- | --- |
| 明确要把 Remotion 源移植过来 | 直接走移植工作流，跳过意图层 |
| 对现有项目做某个具体操作（检查 / 渲染 / 发布） | 只做这个操作，跳过意图和工作流路由 |
| 对现有项目做具体编辑 | 直接改，不跑意图层 |
| 已有 `BRIEF.md` | 读里面的 `workflow` 和 `flow`，直接执行那个工作流 |
| 没 brief 但有 `hyperframes.json` 或 `STORYBOARD.md` | 从现有产物恢复，推断归属工作流 |
| 全新创建 | 跑意图层（intent interview），然后路由一次 |

这种设计很值得学。**入口只做分流，不做创作。** 它不持有任何业务知识，业务知识全在下游。这让它极薄、极稳——加新工作流不用动入口，只要在路由表里加一行。

### 路由表：匹配"交付物"而非"关键词"

全新创建时，入口用一张优先级表把请求路由到具体工作流。关键纪律是——**匹配的是请求的交付物，不是顺嘴提到的某个词或文件类型**。优先级从高到低：

1. 明确移植 Remotion → `remotion-to-hyperframes`
2. 演示文稿 / pitch deck / 可交互 deck → `slideshow`
3. 给现有人像视频加纯字幕 → `embedded-captions`
4. 给现有人像 / 访谈视频加设计过的图形覆盖层 → `talking-head-recut`
5. 用音乐驱动、节拍同步的视频 → `music-to-video`
6. 短的、无旁白、运动即信息的单元（通常 10 秒内）→ `motion-graphics`
7. 解释一个 GitHub PR / 代码改动 → `pr-to-video`
8. 营销 / 展示某个网站或产品 → `product-launch-video`
9. 解释一个话题 / 文章（无产品无网站可抓）→ `faceless-explainer`
10. 其他任何自定义视频 → `general-video`（兜底）

兜底那条很有意思。`general-video` 还承担另一个角色：所有 `flow: companion`（协作共创模式）的 brief 都在它这里执行，哪怕原本路由到的可能是别的——因为 companion 模式要把整套能力都摆上桌。

路由表里还埋了一堆**消歧规则**，处理那些"看起来像 A 其实该走 B"的情况。比如：一个短的动效标题如果**无旁白且运动本身就是信息**才是 `motion-graphics`；一个静态标题卡、有旁白的序列、更长的蒙太奇则是 `general-video`。再比如：音乐文件只有当它的节拍网格驱动整条片子时才选 `music-to-video`，只是当背景床的音乐不能改变按主题匹配的路由。

小结：路由是"先匹配交付物 → 读那一条 route 文件确认契约 → 不满足就继续往下路由"，不是"看到关键词就贴标签"。

---

## 三、意图层：一次对话，把"做个视频"变成一份 brief

路由定了之后，对全新创建的请求会跑一遍**意图层**（intent interview）。这是整套体系里我觉得设计得最讲究的部分之一——它不是无脑问问题，而是有结构的八步流程。

我挑几步讲。

### 第一步：先读记忆，再问问题

在问任何问题之前，强制做两次读：

- **记住的偏好**。跑一个脚本拉用户的历史偏好，把每个记到的值设成推荐选项，并标注来源。注意：建项目前用一个故意不存在的探测路径（比如 `/tmp/hyperframes-intent-memory-<run-id>`），绝不用当前工作区。
- **配方（recipe）**。如果用户说了"像上次那样"或者有个配方匹配了大概的路由，**先问要不要采用这个配方**，而不是直接开问别的。而且要让这个提议"配得上这个 yes"——说清楚它匹配在哪、采用它能省掉什么（"这跟你那个发布宣传片配方匹配——采用它能填好目标平台、画幅、语言、设计规范，你只要确认核心信息和两个运行形态问题"）。

这一步的精髓：**问问题是有成本的，记忆和配方能替用户省掉一整轮提问。**

### 第二步：分诊输入是"成型"还是"未成型"

这是意图层最微妙的一刀。素材本身不决定成型与否——一个网站、文档、PR 自带论点，但同一个论点的五种讲法是五条不同的片子。一个请求如果只有素材给了形状（"给这个 URL 做个视频"），它**对事实是成型的，对讲法是未成型的**，要进"提案轮"。

### 提案轮：唯一的发散步骤

意图层其他地方都在收敛（推荐选项、附理由、一字段一问），只有提案轮（pitch round）是发散的。

未成型请求才进提案轮。它的核心纪律是一道**采样门槛**（内部跑，不给用户看）：先回答关于这个 brief 的四个具体问题（主体长什么样 / 目标情绪作为一帧长什么样 / 播放载体要求什么 / 这个话题的其他所有视频长什么样＝反模式），然后沿五条不同的路径各采一个概念。重点是这条约束——

> **五个概念里至少有两个要落在概率 0.10 以下。**

如果五个都过了 0.10，那每个提案都是中位数，推倒重来。概率永远不展示给用户，它是个采样约束，不是计分卡。

然后检查"剪影"：把每个概念的主要元素草草画成 bounding box，两个剪影相同的概念其实是同一个概念，替换掉一个。

五个全摆出来，**然后**才推荐一个。推荐先说会锚定后面一切。每个提案三行：概念一句话 / 视觉世界 / 开场钩子。视觉世界那行要带上它依赖的一两个能力，用大白话说（"发布数字在音轨的节拍网格上计数攀升"），绝不抛功能名。

**自治模式下这道门槛照跑**——"just build it"改变的是听众，不是纪律。而且自治模式恰恰是中位数最危险的地方，因为没人在场说"这看起来跟所有别的视频一样"，所以这道门槛必须替人说出来。

### 运行形态：两个正交的问题，绝不合并成菜单

这是 brief 体系里一个反复强调的点。两个问题：

- **(a) 要不要 storyboard？**——在实时画板上分轮审计划 / 草图 / 成片（推荐，两三个场景以上的都建议），还是跳过画板直接从确认的 brief 出一条成片。
- **(b) 自动化还是协作？**——自动化＝匹配的工作流管道端到端执行 brief；协作＝在 `general-video` 里一起搭，全套能力都摆上桌。

这两个是**正交的，绝不能合并成一个三选一菜单**。四个 `flow` × `storyboard` 组合都是合法的用户选择。一个被压平成三选项的列表（"storyboard 审 / 一把出 / 协作"）会**悄悄让"协作 + storyboard"变得不可选**。

### 移交：BRIEF.md 是唯一的路由产物

八步走完，意图层把确认后的意图写成 `BRIEF.md`。这是**工作流读的唯一路由产物**——之后再没有任何步骤会重新打开这个 skill 或这次访谈。"路由到底要求了什么"这个问题，永远去重读这份大概 1KB 的文件。

工作流的 Setup 在 `hyperframes init` 之后、作为**第一个动作**写 `BRIEF.md`（绝不在 init 之前写——init 会拒绝非空目录），之后再不问任何 brief 问题。

小结：意图层的设计密度很高，但有一条清晰主线——**收敛为主，一处发散；问题都带推荐和理由；记忆和配方优先于提问；产出一份可被下游机械消费的 brief。**

---

## 四、核心契约：一个 composition 的技术骨架

`hyperframes-core` 是技术契约——怎么搭一个能渲染的项目。它把细节都推到 `references/` 里，SKILL.md 本身像个目录。几个我认为最值得记的点。

### 两种根形式（不可互换）

- **Standalone**（顶层 `index.html`）：根 `<div data-composition-id="…">` 直接坐在 `<body>` 里，**没有 `<template>` 包裹**（裹了会把所有内容藏起来，渲染崩掉）。
- **Sub-composition**（通过 `data-composition-src` 加载）：根**必须**裹在 `<template>` 里。

**运输规则**：运行时只克隆 `<template>` 的内容，外面的一切（包括 `<head>` 里的样式和脚本）都会被丢弃——所以 `<style>` / `<script>` 要放在 template **里面**。

**宿主 id 规则**：宿主槽的 `data-composition-id` 必须**精确等于**内层 template 的 `data-composition-id`，也**精确等于** `window.__timelines["<id>"]` 那个 key——不能有 `-mount`/`-slot`/`-host` 后缀。

### 根必须显式定尺寸（沉默布局 bug）

standalone 根需要一个**显式尺寸的盒子**（px 单位的 `width`/`height`），而且从根往下到某个 `height: 100%` 元素为止，**每个祖先都得有解析出来的高度**——否则一个 flex / `100%` 子元素会塌成 ~0，内容全堆到左上角。这条不能只靠自动化关卡抓，要肉眼看 snapshot。

### 一条暂停的时间线

每个 composition 在 `window.__timelines["<id>"]`（key＝根 `data-composition-id`）注册**恰好一条** `gsap.timeline({ paused: true })`，在页面加载时**同步**构建。渲染时长＝根 `data-duration`，**不是**时间线长度。不要手动把子时间线嵌进宿主。

### `data-duration` 的编译期锁定（容易踩的坑）

根 composition 的总时长是**编译期固定**的，在脚本跑之前像 `data-width`/`data-height` 一样被静态读一次。所以脚本之后改根的 `data-duration`（`root.setAttribute(...)`）或者用 `--variables` 驱动它，**改了也白改，被忽略**。要按输出变长，就直接在根上写 `data-duration`。（注意：一个 **clip 自己**的 `data-duration` 不一样，它是从活 DOM 重新读的，所以脚本 / 变量能驱动 clip 时长。）

### `class="clip"` 是可见性的命脉

可见的、带时序的子元素（`<div>`、`<img>` 等）**必须**带 `class="clip"`——没它，运行时会把这个元素在整个 composition 期间一直显示，无视 `data-start`/`data-duration`。`<video>` 上别加（框架直接管它的可见性），`<audio>` 也不用（没视觉）。

**clip 必须是根的直接子元素。** 套了 wrapper 的 clip 不会被注册——最典型的表现是包在 wrapper 里的 `<video>` 永远不被 seek / 解码，渲染出来是黑的。要包装 / 变换一个 clip，把 wrapper 放在 clip **里面**，或者直接动 clip 本身；别包住 clip。

### 时序窗口是闭区间的两端都含

一个 clip 在 `start ≤ t ≤ start + duration` 期间显示——它在恰好 `t = start + duration` 那帧仍然渲染，所以最后一帧会保持动画解析后的结束状态（运行时不会提前一帧藏掉它）。一个落在 `data-duration` 上的 reveal / 入场因此会在最后一帧可见；不用为了"保证结束态渲染"非得在 `data-duration` 之前完成它。

小结：core 的契约读起来像一份法律文件，但每条都对应一个具体的、曾经让渲染翻车的场景。"沉默 bug"这个词反复出现，提醒你自动化关卡抓不全，要靠 snapshot 肉眼审。

---

## 五、动画：默认组合原子规则，而不是抄蓝图

`hyperframes-animation` 把所有运动知识收在一个 skill 里：**规则**（原子配方）、**蓝图**（多阶段场景模板）、**转场**、**技术**、**适配器**（按运行时的 API）。

### 默认做法：挑 2-4 条原子规则，用一条暂停时间线粘起来

这是默认，而且明确说比从蓝图起步更快、代码更少。`rules/` 里每条规则都是一个可复用的 HTML / CSS / GSAP 配方，目录索引按触发器 / 标签组织。

**只有当**场景正好匹配一个预设计好的多阶段模板（品牌揭示、社会认同等），复用它的阶段流水线能省下真实的创作时间，或者你需要一段复杂的 4-5 阶段编排的可运行真值代码时，才去读蓝图。

这个默认选择本身是个设计观点：**复杂运动应该是简单运动的组合，而不是一个大的预制件。**

### 运行时选择

- **GSAP** 是 95% 运动工作的默认——时间线编排、变换、缓动、错峰全覆盖。所有原子规则都是 GSAP 的。
- **Lottie** 当资产自带预烘焙时间线（通常是 AE 导出）。
- **Three.js** 做 3D 场景、相机运动、着色器驱动的视觉。
- **Anime.js** 当 GSAP 杀鸡用牛刀时的轻量补间。
- **CSS** 做简单重复母题、装饰、微光——无 JS 动画成本。
- **WAAPI** 不依赖 GSAP 的原生浏览器关键帧。
- **TypeGPU / WebGPU** 做 GPU 渲染的画布（粒子、液态玻璃、自定义着色器）。

多个运行时能在一个 composition 里共存。每个把自己的实例注册到运行时专属的全局变量上，这样 HyperFrames 能一次性 seek 完所有。

### 动画层在 core 契约之上的两条增量

- **预算好的布局常量**——绝不在补间时从 `getBoundingClientRect()` 推导位置。补间时的 DOM 测量会失同步（因为渲染器并行采样），在 composition 设置时算一次坐标，复用。
- **空间运动只用 GSAP 变换别名**（`x`、`y`、`scale`、`rotation`）。core 的白名单也允许非空间属性补间用 `opacity` / `color` / `backgroundColor` / `borderRadius`——但布局变化绝不用 `width`/`height`/`top`/`left`。

### 关键帧 skill：pose 契约

`hyperframes-keyframes` 把关键帧当作一个 **pose 契约**：可见的状态、连续的主体身份、可 seek 的运行时、验证过的像素。它的核心程序很干净：

1. 识别动画主体、可见状态、最终状态、运行时。
2. 选**最小的、能证明 prompt 的机制**。机制不清时才去读机制选择表。
3. 在声明的运行时里写可 seek 的关键帧，同步构建并注册实例。
4. 用 `hyperframes lint`、`check`、`keyframes`、一个聚焦的 `--shot`、以及证明时间点的 snapshot 来验证。

它有一张很实用的"机制选择表"，按需求映射到最小机制：同一主体换框 / 层级→共享元素或 FLIP；主体走可见路线→路径行进；笔画生长→描边绘制；形状变形→形状插值；揭示边界可见→clip / mask / 着色器 uniform；多个元素有序运动→错峰 / 索引延迟；文本自身运动→行 / 词 / 字 / 带状细分；表面弯折拉伸裁切→父子反向变换；UI 有状态→显式状态机；场景有深度→DOM 3D / Three.js / WebGL。

**机制能组合，但每一个都要让那个想法更清楚。装饰不等于证明。**

小结：动画 skill 的分层是"原子规则 → 蓝图 → 转场 → 技术 → 适配器"，默认走最轻的"组合原子规则"，重的东西按需加载。这跟入口 skill 的"薄入口 + 按需加载下游"是同一个设计哲学。

---

## 六、CLI 开发闭环：lint 是快门，check 是闸门

`hyperframes-cli` 定义了开发循环。顺序很重要：

1. **脚手架**：`npx hyperframes init <project>` 或抓一个网站。
2. **创作**：用 `/hyperframes-core` 写 composition。
3. **编辑时快速反馈**：第一遍 HTML 之后、以及每次结构性改动之后，跑 `npx hyperframes lint`。
4. **跑最终关卡**：`npx hyperframes check`——它会先重跑 lint，再开浏览器。**不要在它前面再画蛇添足地单独跑一次 lint。**
5. **检查 sub-composition**：`index.html` 用了 `data-composition-src` 时，抓中间点 snapshot 审每个挂载的场景。
6. **开最终的 Studio 预览**：`npx hyperframes preview`，把时间线项目 URL 交给用户，问改还是渲染。
7. **批准后才渲染**：草稿质量用于迭代，高质量用于交付。
8. **验证输出**：确认文件存在、非空、时长合理。

几个我注意到的纪律：

- **`check` 跑 lint 在前**，然后用一次浏览器会话、一次 seek 遍历来审计运行时错误、失败请求、布局、`*.motion.json` 断言、WCAG 对比度。持久型 finding 卡 exit code；入场 / 出场的瞬时型 finding 只是信息性的。
- **两个不同的预览面别混淆**：storyboard 画板（在 composition check 之前，只在 `storyboard: yes` 时开）≠ 最终 composition 预览（check 通过之后）。早期画板不是对成片的批准。渲染永远要最终预览那道批准。
- **studio 定向编辑**：用户说"这个元素"时，别猜，查 Studio——`npx hyperframes preview --context --json --context-fields selection`，用 `selection.target.hfId`（有就用），否则用它的选择器和源文件。结果报 `no-selection` 就请用户点一下元素再重跑。
- **绝不要因为检查通过就渲染**。要在最终预览处停住等批准。这条被强调了不止一次。

### 渲染选择

| 需求 | 命令 |
| --- | --- |
| 本地快速迭代 | `render --quality draft` |
| 本地最终交付 | `render --quality high --output out.mp4` |
| 可复现的容器渲染 | `render --docker --strict --output out.mp4` |
| 本地变量驱动批量 | `render --batch rows.json --output "renders/{name}.mp4"` |
| HeyGen 托管零基建 | `cloud render` |
| 自管分布式 AWS | `lambda render <project> --width 1920 --height 1080 --wait` |
| 自管分布式 GCP | `cloudrun render <project> --width 1920 --height 1080 --wait` |

用户要托管渲染但不想本地装 Chrome / FFmpeg / AWS 时用 cloud；Lambda 只在 AWS 归属是硬要求时用；Cloud Run 只在 GCP 归属是硬要求时用。

小结：CLI 闭环的核心是把"检查"和"渲染"严格分开——`check` 是关，`render` 是闸，中间永远卡一道人的批准。`lint` 是编辑时的快门，不是闸门。

---

## 七、技能生命周期：核心急装，工作流懒装

这套体系把技能分两类安装：

- **核心集**：`/hyperframes`、各 `hyperframes-*` 领域技能、`/media-use`。急切安装。
- **工作流技能**：路由选到时才通过 `npx hyperframes skills update <workflow-name>` 装。

`init` 会检查 GitHub 并刷新核心集 + 已经装了的别的技能，但不会去装从没用过的工作流。当前安装是最新的就是个 no-op。离线或限流时优雅降级，不会让脚手架失败。

诊断：

- `skills check` 在已装技能过期或核心集不完整时非零退出。可用但没装的工作流不算失败。
- 裸 `skills update` 刷新核心集 + 已装的一切，修剪未发布的技能，不扩工作流集。
- 带 name 的 `skills update <name...>` 会装这些命名的工作流或领域技能。
- 裸 `skills` 显式装全量已发布集。

**关键纪律**：如果 CLI 不可用，别从记忆里重建工作流契约——当工具失败就报错。路由到某个工作流后，第一步是 `npx hyperframes skills update <workflow-name>` 把它装 / 刷新到位，再读它。

小结：急装核心 + 懒装工作流，是为了让入口轻、让上下文窗口不被一堆用不上的工作流塞满。这跟"渐进式披露"（progressive disclosure）是同一套思路。

---

## 八、registry 与 media-use：复用与媒体中台

最后两块拼图。

### registry：可装可贴的积木

registry 提供两类可复用件，通过 `hyperframes add <name>` 装：

- **Blocks**——独立的 sub-composition（自带尺寸、时长、时间线）。通过宿主 composition 里的 `data-composition-src` 引入。
- **Components**——效果片段（无自带尺寸）。直接粘进宿主 composition 的 HTML。

装完，CLI 打印写了哪些文件、以及一段要粘进宿主的起始片段。这段片段是起点——接线时你得自己加 `data-composition-id`（必须匹配 block 的内部 id）、`data-start`、`data-track-index`。

发现用 CLI 当主界面：`catalog`（列）、`catalog --type block/component`、`catalog --tag social`、`catalog --json`（agent / CI 用）、`catalog --human-friendly`（交互式选择器，选完立刻装）。CI / agent 场景优先 `--json` 再显式 `add`。

### media-use：一个动词解决所有媒体需求

media-use 自称"Agent Media OS"，一个 skill 管所有媒体类型。它的核心是**一个动词** `resolve`：

```bash
node <SKILL_DIR>/scripts/resolve.mjs --type <type> --intent "<描述>" --project <dir>
```

返回一行：`resolved <id> → <path> (<type>, <metadata>)`。所有搜索噪音留在磁盘上。支持的 type：`bgm`、`sfx`、`image`、`icon`、`logo`、`voice`、`grade`（可粘贴的 HyperFrames `data-color-grading` 片段）、`lut`（可复用的校验过的 `.cube`）。

它还有一条很主动的设计——**主动跑一次媒体机会扫描**。理由是：人通常看不出哪种媒体能把片子抬起来，但 agent 能。建 / 审 composition 时做**一次**有依据的扫描，然后**问一次**——别默默加，也别每个资产都唠叨。只在有具体信号时才提议：屏上有文字 / 脚本但没配音→TTS；emoji 或装成图标的 div→真图标；占位 / 像素低 / 放大感的图→更好的图；硬切无声音→转场音效；10 秒以上无音乐床→bgm；曝光不对的素材→校正级。

四条让它"是帮助不是唠叨"的规矩：**有依据不泛泛**（没信号就不提）；**有主见且具体**（带着默认提出具体修复，人批全 / 部分 / 无）；**每项目一次**（一次汇总问，尊重"别动它"）；**只露面绝不默默改**（尤其颜色校正：先提、先预览，一个灰世界的"校正"能毁掉一个故意的日落或霓虹观感）。

小结：registry 解决"场景级复用"，media-use 解决"媒体资源一站式"。media-use 的"主动一次、有依据、不唠叨"是 agent 主动性的一个好范本——主动但不越界。

---

## 九、对写 agent skill 的几点启示

拆完整套，回头看它对写 skill 有什么用。我挑几条最实在的。

### 1. 入口要薄，只做分流

入口 skill 不持业务知识，只看状态、路由。加新工作流不动入口，只动路由表。这让入口极稳。我自己之前几个 skill 入口都太"胖"了，塞了一堆该推到下游的逻辑，下次改。

### 2. 渐进式披露是贯穿全程的设计哲学

入口薄、core 把细节推 references、animation 默认组合原子规则而非读蓝图、技能急装核心懒装工作流、CLI"读对应 reference 再跑命令"——全是同一个思路：**只在你需要的时候加载你需要的那一块。** 这既省上下文，也降低出错面。

### 3. 把"agent 容易翻车的确定性逻辑"抽成契约 / 脚本兜底

core 里那些"不可商量的规则"、determinism-rules、keyframes 的 pose 契约，本质都是把 agent 最容易翻车的地方（用 Math.random、用 Date.now、无限循环、补间时测 DOM、包住 clip……）写成铁律。这跟我自己那个"渲染兜底脚本幂等补结构规则"的思路完全一致，只是它做得更系统。

### 4. 人的批准是闸门，不是建议

CLI 闭环反复强调"检查通过不等于该渲染，要在最终预览等批准"。意图层强调"修订不是确认，改完要重新摆一遍"。这套体系把"对人负责"刻进了流程，而不是留给 agent 的自觉。

### 5. 提案轮的采样门槛是个可迁移的好设计

"至少两个落 0.10 以下"+"剪影查重"，是个能套到任何"需要给用户出多个方案"的 agent 场景的设计——强制发散到尾部，防止全挤在中位数。写任何"给我几个方案"的 skill 都能用上。

---

HyperFrames 这套体系，技术内核是"从 HTML 逐帧采样出确定性视频"，但更值得学的是它的**组织方式**：一个薄入口做分诊、一个意图层把模糊需求收敛成机械可消费的 brief、一套 core 契约管住渲染确定性、一组按需加载的领域技能各管一摊、一个 CLI 把"检查"和"渲染"用人审闸门隔开。视频只是它的载体，它真正示范的是"怎么把一个复杂的多步骤创作流，组织成 agent 能稳定执行、人能可靠把关的形态"。

如果你也在攒自己的 agent skill 工具链，强烈建议把它翻一遍——尤其入口的状态表、意图层的八步、core 的确定性规则、CLI 的关卡设计。一手 skill 代码，比任何二手教程都讲得清。
