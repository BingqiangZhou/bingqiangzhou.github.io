---
title: "【工具分享】HyperFrames——用 HTML 写视频的开源渲染框架"
published: 2026-05-07
description: "深度分析 HeyGen 开源项目 HyperFrames：从 HTML 到视频的完整渲染管线、帧适配器架构、AI Agent 技能系统、Studio 编辑器与 Player 组件的技术解析。"
lang: zh
tags: ["工具分享", "学习笔记"]
---

项目地址：[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)，由 HeyGen 团队开源，Apache 2.0 协议。

## 一句话概括

HyperFrames 是一个**用 HTML 作为视频源文件、通过无头 Chrome 逐帧截图 + FFmpeg 编码**来生成视频的 TypeScript 框架。核心思路：AI Agent 天然会写 HTML，所以让 HTML 成为视频的"源码"。

## 整体架构

TypeScript monorepo，包含 7 个核心包：

| 包 | 职责 |
|---|------|
| `@hyperframes/core` | 类型定义、HTML 解析器、编译器、浏览器运行时、动画适配器、Linter、Studio API |
| `@hyperframes/engine` | 基于无头 Chrome 的逐帧截图引擎（Puppeteer + CDP） |
| `@hyperframes/producer` | 完整渲染管线编排器（编译 → 截帧 → 编码 → 音频混流） |
| `hyperframes` (CLI) | 24 个子命令的命令行工具 |
| `@hyperframes/player` | `<hyperframes-player>` Web Component |
| `@hyperframes/studio` | 浏览器端 NLE 风格视频编辑器（React + Vite + Tailwind） |
| `@hyperframes/shader-transitions` | 14 种 WebGL 着色器转场效果 |

## HTML 即视频源码

HyperFrames 的核心设计是让 HTML 成为视频的声明式源文件。一个视频项目就是一个 `index.html` + 素材目录，通过 `data-*` 属性声明时间线：

```html
<div data-composition-id="root" data-width="1920" data-height="1080">
  <video id="clip1" src="intro.mp4"
    data-start="0" data-duration="10" data-track-index="0"
    muted playsinline />
  <audio id="bgm" src="music.mp3"
    data-start="0" data-volume="0.3" data-track-index="5" />
  <div data-composition-src="captions.html"
    data-composition-id="captions"
    data-start="0" data-track-index="10" />
</div>
```

关键 `data-*` 属性一览：

| 属性 | 作用 |
|------|------|
| `data-composition-id` | 组合（场景）的唯一标识 |
| `data-width` / `data-height` | 画布像素尺寸 |
| `data-start` | 起始时间（秒），支持引用表达式如 `"scene1 +0.5"` |
| `data-duration` / `data-end` | 时长或结束时间 |
| `data-track-index` | 时间线轨道编号 |
| `data-media-start` | 媒体源内的偏移起点 |
| `data-volume` | 音量（0-1） |
| `data-composition-src` | 子组合 HTML 文件路径 |
| `data-has-audio` | 标记视频元素需要提取音频 |

### 子组合与作用域隔离

子组合通过 `data-composition-src` 引入，编译时被内联到主 HTML。编译器对子组合做了严格的作用域隔离：

- **CSS 作用域**：用 PostCSS 给每个选择器加 `[data-composition-id="X"]` 前缀
- **JS 作用域**：用 IIFE 包装子组合的脚本，创建 `document` 代理对象拦截 `querySelector`，让查询只命中组合内部元素；同时代理 `gsap` 对象，让动画目标限定在组合范围内
- **路径重写**：子组合中的相对路径会被重写为主项目根目录的相对路径

### 时间引用系统

`data-start` 不仅支持绝对时间（`data-start="3.5"`），还支持**引用表达式**：`data-start="scene1 +0.5"` 表示在 `scene1` 结束后 0.5 秒开始。解析器通过 WeakMap 缓存和循环检测来处理复杂引用链。

## 视频生成的六阶段管线

执行 `hyperframes render`，经历以下六个阶段：

### 阶段一：HTML 编译

三阶段纯正则解析管线（无 DOM 依赖，可在 Node.js 和浏览器中运行）：

1. **静态编译**：扫描所有 `<video>`/`<audio>` 标签，自动生成缺失的 `id`，计算缺失的 `data-end`
2. **时长注入**：通过 `ffprobe` 探测媒体真实时长，注入到未声明 `data-duration` 的元素上
3. **时长钳位**：将声明的时长与实际媒体时长对比，超出部分会被裁剪

之后由 HTML Bundler 完成完整打包：CSS/JS 内联、子组合内联与作用域化、资产路径重写、小型资产（SVG/JSON）base64 内联。

### 阶段二：视频帧预提取

无头 Chrome 无法可靠播放 `<video>` 元素，所以视频帧必须预先提取：

1. **HDR 预检**：ffprobe 检测色彩空间。混合 SDR/HDR 源时，SDR 视频通过 FFmpeg `colorspace` 滤镜转换为 HDR（PQ 或 HLG），且仅转码使用的片段
2. **VFR 标准化**：可变帧率输入（录屏、手机视频）通过 `fps_mode=cfr` 转为恒定帧率
3. **帧提取**：FFmpeg 按目标 FPS 抽帧为 JPEG/PNG，建立时间索引查找表（`FrameLookupTable`）
4. **内容寻址缓存**：基于（路径、mtime、大小、mediaStart、时长、FPS、格式）的缓存键，避免重复提取

### 阶段三：音频处理

从 `<audio>` 元素和带 `data-has-audio="true"` 的视频元素中提取音轨：FFmpeg 提取为 PCM 16bit 48kHz 立体声 → `atrim` 裁剪 → `adelay` 延迟 → `apad` 补齐 → `amix` 混合。

### 阶段四：逐帧捕获（核心）

这是整个框架的心脏。通过无头 Chrome + Puppeteer + CDP（Chrome DevTools Protocol）实现精确的逐帧截图。

**运行时契约**：编译后的 HTML 注入了 `window.__hf = { duration, seek }` 接口——这是引擎与页面之间的唯一协议。引擎对每一帧时间点 `t` 调用 `window.__hf.seek(t)`，运行时内部的适配器将动画定位到精确时刻。

**五种动画适配器**：

| 适配器 | seek 机制 |
|--------|----------|
| GSAP | `timeline.pause(); timeline.totalTime(t, false)` — 帧级精确寻址 |
| CSS @keyframes | 优先 `getAnimations().currentTime`，回退到负 `animation-delay` 技巧 |
| WAAPI | `document.getAnimations()` 后设置 `currentTime` |
| Lottie | `lottie-web` 用 `goToAndStop()`，`dotlottie-web` 用 `setCurrentRawFrameValue()` |
| Three.js | 设置 `window.__hfThreeTime` 并派发自定义事件，由组合脚本读取 |

**视频帧注入**：预提取的视频帧以 data-URI `<img>` 元素替换 `<video>` 标签，精确复制原始 CSS 属性（objectFit、zIndex、borderRadius、GSAP 控制的 opacity）。用 `img.decode()` 确保像素已就绪。

**截图模式**：
- Linux + chrome-headless-shell：`HeadlessExperimental.beginFrame` — 单次原子 layout-paint-composite 周期，确定性最高
- macOS/Windows：`Page.captureScreenshot` 标准截图

**HDR 合成**（两遍流程）：先捕获 DOM 内容（透明背景），再在 48 位线性 RGB 空间中将 HDR 视频帧与 DOM 层进行软件 Alpha 混合，最后转换到 PQ 信号后编码为 H.265 + BT.2020 元数据。

**并行捕获**：大渲染任务可启动多个浏览器 Worker 并行截图，通过 `FrameReorderBuffer`（异步屏障）保证乱序 Worker 顺序输出到 FFmpeg。

### 阶段五：视频编码

- **流式编码**：帧缓冲区通过 `-f image2pipe` 直接管道到 FFmpeg stdin，零磁盘 I/O
- 编码器：H.264（libx264）、H.265（libx265）、VP9（libvpx-vp9）、ProRes（prores_ks）
- GPU 加速：NVIDIA NVENC、Apple VideoToolbox、Intel VAAPI/QSV
- HDR 输出包含正确的 BT.2020/PQ/HLG 色彩元数据和 SMPTE ST 2086 mastering display SEI

### 阶段六：最终组装

音视频混流 → MP4 faststart（moov atom 前移） → 输出 MP4 / WebM / MOV / PNG 序列。

### 完整流程图

```
index.html + 素材（视频/音频/图片）
         │
         ▼
  [HTML 编译] → 正则解析时间属性、ffprobe 探测媒体时长、
  │              子组合内联与作用域化、CSS/JS/资产内联
  ▼
  [视频帧预提取] → HDR 预检与转换、VFR 标准化、
  │                FFmpeg 抽帧、内容寻址缓存
  ▼
  [音频处理] → FFmpeg 提取、裁剪、延迟、混合
  │
  ▼
  [逐帧捕获] → 无头 Chrome 加载编译后的 HTML
  │              每帧：seek(t) → 适配器定位动画 → 注入视频帧 → CDP 截图
  │              可并行多 Worker，帧重排序缓冲区保证顺序
  │              HDR：两遍合成（DOM 透明层 + HDR 视频帧，48 位线性 RGB）
  ▼
  [视频编码] → image2pipe 流式编码（支持 GPU 加速）
  │
  ▼
  [最终组装] → 音视频混流 + faststart → MP4/WebM/MOV/PNG
```

## 确定性设计

整个管线的核心目标：**同样输入永远产生相同输出**。

- GSAP 的 `totalTime()` 实现可寻址时间线（不是实时播放）
- Chrome 的 `--deterministic-mode` 和 `HeadlessExperimental.beginFrame` 保证合成一致
- 时间量化（`quantizeTimeToFrame`）避免浮点误差
- **30 条 Lint 规则**禁止不确定性代码：`Math.random()`、`Date.now()`、`new Date()`、`performance.now()`、`crypto.getRandomValues()`、`repeat: -1` 等

## Lint 系统

框架内置了完整的静态分析 Linter，包含 30+ 条规则，按类别组织：

- **核心规则**：缺少 `data-composition-id`、缺少尺寸声明、缺少时间线注册、内联脚本语法错误、非确定性代码检测
- **媒体规则**：重复 id、video 缺少 `muted`、视频嵌套在定时元素中、占位符 URL 检测、base64 媒体禁止、命令式媒体控制检测（`.play()`/`.pause()`/`.currentTime =`）
- **GSAP 规则**：重叠动画检测、未限定作用域的选择器、无限循环检测、CSS/GSAP transform 冲突
- **字幕规则**：文本溢出风险、容器定位检查、transcript 格式校验
- **组合规则**：重叠片段检测、`requestAnimationFrame` 禁用、外部脚本依赖警告

此外还有运行时验证命令 `hyperframes validate`（在无头 Chrome 中捕获 JS 错误和缺失资产）和 `hyperframes inspect`（视觉布局检查，检测文字溢出、元素越界等）。

## AI Agent 技能系统

HyperFrames 提供了 6 个 AI Agent 技能，通过 `npx skills add heygen-com/hyperframes` 安装，支持 Claude Code、Cursor、Codex 三个平台。

### 六个技能

| 技能 | 作用 |
|------|------|
| `hyperframes` | 核心创作技能。强制"先布局后动画"流程、11 条硬性规则、12 个按需加载的参考文档 |
| `hyperframes-cli` | CLI 命令参考手册 |
| `hyperframes-registry` | 50+ 预置 Block/Component 的安装与使用 |
| `website-to-hyperframes` | 7 步网站转视频流水线：捕获 → 设计稿 → 脚本 → 分镜 → 配音 → 合成 → 验证 |
| `remotion-to-hyperframes` | 从 Remotion（React）项目迁移到 HyperFrames 的转换指南 |
| `gsap` | GSAP 动画完整参考 |

### 核心创作技能的设计哲学

主技能 `hyperframes` 体现了几个重要设计决策：

- **视觉身份门控（HARD-GATE）**：在写任何 HTML 之前，Agent 必须先定义视觉风格——通过 DESIGN.md、visual-style.md，或向用户提问 3 个设计问题。这是为了防止 Agent 生成千篇一律的"AI 风格"设计
- **先布局后动画**：强制先构建最终状态（hero frame）的静态 HTML+CSS，然后加 `gsap.from()` 入场和 `gsap.to()` 退场。避免动画叠加 bug
- **8 种预设视觉风格**：Swiss Pulse、Velvet Standard、Deconstructed 等，每种附带完整调色板
- **9 种命名调色板**：bold-energetic、warm-editorial、dark-premium、clean-corporate 等
- **强制场景转场**：场景间必须有转场效果，必须有入场动画，除最后一个场景外不要退场动画
- **House Style**：默认创作方向中要求每个场景背景 2-5 个装饰元素，禁用渐变文字、cyan-on-dark 等常见 AI 设计套路

### 网站转视频流水线（website-to-hyperframes）

一个完整的 7 步工作流，把任意网站变成推广视频：

1. **Capture** — 捕获并理解目标网站
2. **DESIGN.md** — 提取品牌视觉参考
3. **SCRIPT.md** — 编写旁白脚本
4. **STORYBOARD.md** — 逐镜头创意方向
5. **Voiceover** — TTS 生成语音 + Whisper 对齐时间戳
6. **Compositions** — 按分镜构建 HTML 组合
7. **Validate** — lint + inspect + 视觉验证

## CLI 工具

24 个子命令，分五大类：

### 创作流程

```bash
hyperframes init my-video                  # 新建项目（支持 8 种模板）
hyperframes init my-video --video demo.mp4 # 从视频素材开始
hyperframes add data-chart                 # 安装预置 Block
hyperframes preview                        # 启动 Studio 编辑器（热重载）
hyperframes render                         # 渲染为视频
```

`render` 命令支持：`--fps`（24/30/60）、`--quality`（draft/standard/high）、`--format`（mp4/webm）、`--workers`（1-8 或 auto）、`--gpu`、`--docker`。

### 质量保障

```bash
hyperframes lint       # 静态 HTML 结构验证（30+ 规则）
hyperframes inspect    # 视觉布局检查（文字溢出、元素越界）
hyperframes validate   # 运行时验证（JS 错误、缺失资产、WCAG 对比度）
hyperframes snapshot   # 关键帧截图存档
```

### TTS 与转录

```bash
hyperframes tts "Hello world" --voice af_heart --lang en-us  # 文本转语音
hyperframes transcribe video.mp4                              # 音频转文字（词级时间戳）
hyperframes transcribe --import captions.srt                  # 导入现有字幕
```

- **TTS 引擎**：基于 Kokoro-82M（开源神经网络 TTS），通过 Python 调用，支持 9 种语言、54 种声音
- **转录引擎**：基于 whisper.cpp（C/C++ 实现），自动检测语言，输出词级时间戳，可导入 SRT/VTT/OpenAI JSON

### 其他

```bash
hyperframes catalog    # 浏览 Block 目录
hyperframes skills     # 安装 AI 编码技能
hyperframes doctor     # 检查系统依赖
hyperframes benchmark  # 渲染性能基准测试
```

## 预置 Block 目录

项目附带 50+ 预置 Block，按类型组织：

**社交叠加层**：Instagram Follow、TikTok Follow、X Post、Reddit Post、Spotify Card、YouTube Lower Third、macOS Notification 等——都是带有品牌样式的动画卡片，使用 GSAP 弹性动画。

**着色器转场**（最精细的类别）：14 种 WebGL 着色器转场效果——Domain Warp、Ridged Burn、Whip Pan、SDF Iris、Ripple Waves、Gravitational Lens、Cinematic Zoom、Glitch、Swirl Vortex 等。转场分 13 个类别集合（3D、模糊、遮盖、溶解、扭曲、网格、光线、机械等）。

**数据可视化**：`data-chart` — NYT 风格的动画柱状图 + 折线图，带交错揭示、数值递增动画、来源信息。

**组件**（无独立尺寸，嵌入宿主组合）：`grain-overlay`（胶片颗粒纹理，SVG feTurbulence）、`shimmer-sweep`（高光扫过效果）、`grid-pixelate-wipe`（网格像素化擦除）。

每个 Block 都是一个独立的 HTML 文件 + `registry-item.json` 清单，安装时复制到项目中。

## Studio 编辑器

浏览器端的完整视频编辑器，NLE（非线性编辑器）布局：

- **左侧栏**：组合列表（带缩略图）+ 资产浏览器
- **中央**：视频预览（嵌入 `<hyperframes-player>`）+ 多轨时间线 + 词级字幕时间线
- **右侧**：属性面板 + 字幕样式面板
- **底部**：渲染队列
- **源码编辑器**：直接编辑 HTML 源码，支持 `applyPatchByTarget` 精确编辑
- **拖放**：资产可直接拖放到时间线上
- **热重载**：文件变更 300ms 去抖后自动刷新预览
- **音频波形**：可视化音频表示
- **元素选择器**：在预览中直接点选元素

状态管理使用 Zustand，通过 SSE（Server-Sent Events）与后端 Hono 服务端通信。

## Player Web Component

`<hyperframes-player>` 是一个标准 Web Component，可在任何网页中嵌入播放：

```html
<hyperframes-player
  src="composition.html"
  width="1920" height="1080"
  controls muted
></hyperframes-player>
```

**技术亮点**：

- **Shadow DOM + iframe**：在 iframe 中渲染组合 HTML，通过 `transform: scale()` 自适应容器尺寸
- **运行时自动注入**：若组合缺少运行时，自动从 CDN 注入
- **双通道音频**：桌面端 iframe 直接驱动音频；移动端（自动播放被阻止时）切换到父帧代理模式——在父文档中创建镜像 `<audio>`/`<video>` 元素，通过 50ms 漂移阈值 + 2 样本连续漂移吸收算法保持同步
- **同源/跨源 Seek**：同源直接调用 `window.__player.seek()`（亚帧精度）；跨源回退到 `postMessage`
- **完全可主题化**：通过 CSS 自定义属性（`--hfp-accent`、`--hfp-controls-bg`、`--hfp-font` 等）

## TTS 系统

基于 **Kokoro-82M** 开源 TTS 模型的本地语音合成：

- 模型为 ONNX 格式（~311MB），通过 Python `kokoro-onnx` 包调用
- 默认声音 `af_heart`，支持 54 种声音、9 种语言（中英日法西等）
- 语言从声音 ID 前缀自动推断（`a`=美式英语，`z`=中文，`j`=日语...）
- 输出 WAV 格式，300 秒超时

## 转录系统

基于 **whisper.cpp** 的本地音频转录：

- 自动查找 whisper 二进制文件（环境变量 → 系统路径 → Homebrew → 源码编译）
- 默认模型 `small.en`，从 HuggingFace 下载
- 输出词级时间戳（`--output-json-full --dtw`）
- **语音起始检测**：直接分析 WAV PCM 数据，用 RMS 能量检测有效语音起点
- **字幕补丁**：转录完成后自动将词数组写入 HTML 中的 `const script = [...]` 或 `const TRANSCRIPT = [...]`
- 支持 5 种导入格式：whisper.cpp JSON、OpenAI API JSON、SRT、VTT、词 JSON

## 项目初始化

`hyperframes init` 的完整流程：

1. 指定项目名（交互式或参数）
2. 可选视频/音频输入：`ffprobe` 探测元数据，非 Web 兼容编解码器建议转码
3. 自动转录音频（Whisper），生成字幕时间线
4. 选择模板（8 种内置：warm-grain、swiss-grid、vignelli、kinetic-type 等）
5. 脚手架生成：复制模板、替换占位符、生成 `meta.json` 和 `hyperframes.json`
6. 复制 AI Agent 上下文文件（`CLAUDE.md`、`AGENTS.md`）
7. 可选安装 AI 编码技能
8. 自动打开 Studio 编辑器预览

## 着色器转场系统

独立的 WebGL 转场包，14 种 GLSL 片段着色器。两种运行模式：

- **Player 模式（浏览器预览）**：用 `html2canvas` 捕获两个场景为 Canvas → 上传为 WebGL 纹理 → 着色器驱动转场动画。Safari 下回退到 CSS 交叉淡入淡出
- **Engine 模式（渲染管线）**：不执行 GL/Canvas 操作，而是用 GSAP `set()` 调度确定性的 opacity 翻转，将转场元数据写入 `window.__hf.transitions`，由 Producer 原生合成

## 与 Remotion 的关系

项目在 CREDITS.md 中明确致谢 Remotion 是主要灵感来源——特别是无头浏览器 + FFmpeg `image2pipe` 管线、并行帧捕获的异步屏障、端口探测等概念。所有代码均为独立实现。

主要差异：

| | HyperFrames | Remotion |
|---|---|---|
| 源文件格式 | HTML + CSS + GSAP | React + JSX |
| 构建步骤 | 无（HTML 直出） | 需要 Webpack/Vite 构建 |
| 渲染模型 | GSAP seekable timeline | React 组件渲染 |
| 许可证 | Apache 2.0（完全开源） | Source-available（有渲染费用） |
| AI 集成 | 原生技能系统 | 无 |

## 总结

HyperFrames 的思路很独特：它把"视频"从传统的像素流变成了"带动画声明的结构化文档"。通过以下几层设计让整个系统运转起来：

1. **声明层**：HTML + `data-*` 属性描述时间线，子组合支持嵌套与作用域隔离
2. **动画层**：GSAP/CSS/Lottie/Three.js 通过统一的适配器接口实现确定性 seek
3. **捕获层**：无头 Chrome 逐帧 seek + CDP 截图，视频帧预提取为图片注入
4. **编码层**：FFmpeg 流式管道编码，支持 GPU 加速和 HDR 输出
5. **创作层**：AI Agent 技能系统 + Studio 编辑器 + TTS/转录，降低视频制作门槛

整个项目在确定性渲染、HDR 管线、并行化、Lint 规则等方面的工程细节值得深入学习。如果你对"用代码生成视频"这个方向感兴趣，这是一个值得仔细研究的项目。
