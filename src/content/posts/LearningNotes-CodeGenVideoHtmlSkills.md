---
title: 【学习笔记】用代码生成视频与炫酷 HTML 的 Agent Skills 全景调研
published: 2026-09-19
description: 调研 2026-09 时点「用代码生成视频或炫酷 HTML」的 Agent Skill 生态：视频侧覆盖 Remotion 官方 12 子 skill（React 组件逐帧渲染）、manim-skill 四角色流水线（storyboard.yaml 契约 → 逐场景 Manim 渲染）、iart-ai 15 包 51 skill（TikTok 竖屏/聊天记录故事片/Vox 风格地图等形态）、HyperFrames（HTML 时间轴即视频 + 370+ 动效原语目录）、skill-canvas-video（纯 Canvas 2D + Puppeteer 截帧）、Motion Canvas 与生态配件；3D 侧覆盖 blender-mcp（Blender 内嵌 socket server + 资产超市）与两大 Three.js skill 集合；网页侧覆盖 Slidev 官方 skill + 内置 MCP、VHS 终端转 GIF、awwwards-designer 五件套、D3 系与 Anthropic 官方四件（web-artifacts-builder/algorithmic-art/canvas-design/slack-gif-creator）。每条均按「实现方式 + 能做出的效果」双维度记录，并总结十条共性规律与按效果选型地图：底层公式都是「时序写成代码 → 确定性逐帧渲染（CPU 绘帧/浏览器截帧/3D 引擎）→ FFmpeg 合成」，差别只在画布。
lang: zh
tags: [学习笔记, Agent Skill, Claude Code, Agent]
abbrlink: code-gen-video-html-skills
---

> 整理日期：2026-09-19
> 调研方式：各官方仓库 README / SKILL.md 原文一手抓取核对（GitHub 直连超时的地方换 web_reader 通道），HyperFrames 为本机已装 skill 的一手验证；stars / 版本 / 包数量等数字均为当日快照。
> 写作动机：之前拆过一批「操作视频」的 skill（[video-agent-kit](/posts/zcode-video-agent-kit/)、[video-shotcraft](/posts/video-shotcraft-skill-deep-dive/)、[video-talkcraft](/posts/video-talkcraft-skill-deep-dive/)），它们的主战场是剪辑与素材处理；这次想补另一族——**代码直接渲染成视频或炫酷网页**的 skill。和[《视频制作的一般流程》](/posts/video-production-pipeline/)互为姊妹篇：那篇讲流程地图，这篇盘点「生成」这条新路线上的工具面。

## 一、太长不看：一条公式、一张表、一张选型地图

先给结论。这一族 skill 的底层公式完全相同：

```text
时序写成代码
   → 确定性逐帧渲染（CPU 绘帧 / 无头浏览器截帧 / 3D 引擎）
   → FFmpeg 合成（或 GIF 编码）
```

差别只在「画布」是什么：cairo、React DOM、Canvas 2D、终端，还是 Blender 场景。

| Skill / 集合 | 实现方式（一句话） | 能做出的效果（一句话） |
| --- | --- | --- |
| Remotion 官方 skills | React 组件逐帧渲染：无头 Chromium 截帧 + FFmpeg | 数据驱动 motion graphics、地图动画、批量个性化视频 |
| manim-skill | 四角色 agent 流水线 → 逐场景 Manim Python → cairo 绘帧 + FFmpeg | 3Blue1Brown 风格数学讲解片，可配音配字幕 |
| iart-ai/motion-skills | 15 包 51 skill，Remotion/Manim/GSAP/Lottie/Three.js 矩阵 | 竖屏短视频、聊天记录故事片、Vox 风格地图等 |
| HyperFrames | HTML/CSS/JS 时间轴即视频，浏览器确定性渲染 | 网页级排版动效全部搬进视频，370+ 现成动效原语 |
| skill-canvas-video | 纯 Canvas 2D 逐帧 + Puppeteer 截帧 + FFmpeg | 60fps 暗色科技风解释动画，五平台尺寸 |
| blender-mcp | Blender 内嵌 socket server + MCP 桥接，执行 Python | 真 3D 渲染动画 + AI 生成模型 + 网页 3D 资产导出 |
| Slidev 官方 | Markdown → Vue 幻灯片 + 内置 MCP 实时编辑 | 开发者演示片：代码高亮、magic-move、图表动画 |
| VHS | .tape 脚本 → ttyd 无头终端 → Chrome 截帧 → FFmpeg | 可复现的终端操作演示 GIF |
| awwwards-designer | 5-skill 流水线 + 动画预算分级 + 8 道质量门 | Awwwards 获奖级网站动效 |
| Anthropic 官方四件 | PIL 逐帧 / p5.js 单文件 / Parcel 打包内联 | Slack GIF、生成艺术互动页、单文件 React 应用 |

按你想要的**效果**倒推选型：要**数学/论文讲解片**选 Manim 系；要**批量数据个性化视频**选 Remotion 系；要**短视频流量形态**（聊天记录、卡拉OK字幕、Vox 地图）选 iart 对应包；要**网页质感的排版动效**选 HyperFrames / skill-canvas-video；要**照片级 3D** 只有 Blender 管线；要**获奖级网站**选 awwwards-designer；要**演示片**选 Slidev；要**终端演示**选 VHS。

下面逐个展开，每条都记录两个维度：**怎么实现的**，以及**能做出什么样的东西**。

## 二、代码 → 视频类

### 1. Remotion 官方 skills：React 组件即视频

[官方仓库](https://github.com/remotion-dev/skills)（约 4.6k stars），是视频 skill 里最完整的官方实现，共 12 个子 skill：`/remotion-markup`（React 标记模式：组合、动画、排版、媒体、时序）、`/remotion-render`（调渲染）、`/remotion-studio`（预览）、`/remotion-create`（脚手架）、`/remotion-maps`（Mapbox/MapLibre/CesiumJS 相机动画）、`/remotion-captions`（字幕），另有 saas、interactivity、docs、upgrade、multimedia 等。

**实现方式**：Remotion 框架本身是「React 组件即视频」——组件用 `useCurrentFrame()` 驱动每帧画面，渲染器在无头 Chromium 里逐帧截图、FFmpeg 编码成 MP4（另有 AWS Lambda / Cloud Run 云渲染）。官方 skill 的核心价值是**教 API 而非教框架**：把 `interpolate()` / `spring()` / `<Sequence>` / `<Composition>` 这些正确用法灌给模型，杜绝把 CSS transition、rAF 等「实时网页」习惯带进逐帧确定性渲染——那类写法在渲染时完全失效。安装走 `npx skills add remotion-dev/skills`，`bun create video` 建项目时也会主动提示。

**能做出的效果**：官方 showcase 的品类是产品发布视频、营销 campaign、教程和创意工具。因为时序就是代码，最突出的是**数据驱动视频**：一行 CSV 渲染一条 MP4 的千人千面个性化视频（回顾视频/报表视频）；Mapbox 相机飞行 + 路线画线的地图动画；逐字精确卡点的字幕视频。效果上限等于浏览器能画的一切（CSS/字体/SVG/Lottie 全部可用），但做不了照片级 3D。

### 2. manim-skill：四角色流水线拍数学讲解片

[仓库](https://github.com/vumichien/manim-skill)（Apache-2.0，v0.2.0）。把一个主题、arXiv 论文或数学概念变成成片。

**实现方式**：四角色子 agent 流水线——researcher 摄取素材（arxiv / pymupdf4llm / trafilatura）产出 outline；planner 跑两遍，生成经 JSON Schema 校验的 `storyboard.yaml`（整条流水线的规范契约）；implementer 逐场景写 Manim Python 并调 `python -m manim` 渲染（cairo 逐帧绘制 + FFmpeg 合成），失败在固定重试预算内自修复。独立 uv venv（Python 3.11），gTTS/OpenAI/ElevenLabs 配音、chrome 标题卡、交叉转场、字幕开箱即用。工程细节很典型：venv 必须在启动 Claude Code 的 shell 里激活否则 `ModuleNotFoundError`；MathTex 需要 MiKTeX 否则「静默渲染空白」。

**能做出的效果**：正宗 3Blue1Brown 质感的数学/科普讲解片——公式推导逐步浮现、几何变换、函数曲线随参数实时重绘。仓库六个官方样例划出能力边界：勾股定理、3D 旋转立方体、傅里叶级数 LaTeX 动画、二次函数绘图、文字 morph、正弦波 ValueTracker 动态曲线。输入可以直接是 arXiv 论文编号，产出 1080p60 带配音字幕的成片，「论文转科普视频」一条龙。

### 3. iart-ai/motion-skills：15 包 51 个 skill 的动效矩阵

瑞士 iart.ai 出品的[技能集合](https://github.com/iart-ai/motion-skills)（477 stars，MIT），按场景分包，框架覆盖 Remotion、Manim、GSAP、SVG、Lottie、Three.js/WebGL/shaders（不含 Motion Canvas）。每个 skill 自包含（SKILL.md + references/），安装走 `npx skills add iart-ai/<pack>`。

**实现方式**：视觉类 skill 都带一套 **deliver-and-verify 自验证工具链**：冻结某一帧截图、多帧拼成 contact sheet、用 ffprobe 探测生成的 MP4——让 agent 自己「看」产出对不对。其中 web-animation 包的 gsap-web 是验证范式的代表：交付契约是「单个可直接打开的 HTML + `?t=N` seek harness（暂停并跳到指定时刻冻结）」，agent 在开头/中间/结尾三处截图自检文字裁切、元素出画、FOUC，还要求无 console 错误 + 支持 `prefers-reduced-motion`。

**能做出的效果**（按包）：

- **TikTok 包**（4 个）：竖屏 9:16 短视频——hook→留存→循环的短视频语法、前 3 秒钩子、pattern interrupts、片尾无缝循环；Hormozi 风格逐词卡拉OK字幕（当前词高亮放大）；零漂移的数字翻滚倒计时；模板化批量品牌名字条（lower-thirds）
- **聊天记录包**：聊天剧本/CSV → 以假乱真的 iMessage/WhatsApp/SMS 对话视频——气泡逐条弹出、「打字中」三点脉动、发送音效、线程自动滚动、已读回执；一个模板配 CSV 无限量产
- **地图包**：Vox 编辑部风格地图动画——从地球 zoom 到目标城市、路线逐段画线、图钉落下、区域高亮标注，连 Vox 标志性的「12fps 降帧抖动」做旧质感都能还原；要电影感走 Google Earth Studio→After Effects，要全自动走坐标数组驱动的 GeoJSON/SVG 矢量地图代码渲染成 MP4
- **动效设计包**（9 个）：remotion-video（数据驱动批渲染，一行 CSV 一条 MP4）、logo 动画、动态背景（mesh 渐变、shader 极光、粒子星座）、节拍剪辑（cut to the beat）
- **网页动效包**（9 个）：GSAP ScrollTrigger、SVG 路径描画、Lottie、ASCII 生成艺术、glassmorphism 等
- 另有电商/广告/解说/文字动效（kinetic typography）/生成插画等包

### 4. HyperFrames：网页时间轴即视频（本机一手验证）

**实现方式**：HTML/CSS/JS 时间轴直接就是视频，浏览器确定性逐帧渲染。skill 规定完整闭环：写动效前先自然语言搜 370+ 现成原语目录（`catalog --query "reveal a headline one line at a time"`，本地词法索引，可选 33MB 本地 ONNX 语义检索）→ lint → check（单浏览器 seek 审计运行时错误/失败请求/布局/WCAG 对比度，问题直接门禁退出码）→ preview 人审门（SKILL.md 明文「Never render merely because checks passes」）→ 渲染出口分层：本地 draft/high、Docker 可复现、变量批渲染（`--batch rows.json`）、HeyGen/Lambda/CloudRun 云渲染。

**能做的效果**：**网页能做什么效果，视频就能有什么效果**——大字排版逐行 reveal、zoom/punch-in 镜头感、CSS/SVG 数据可视化动效、子组合嵌套场景；变量批渲染天然适合个性化系列片。

### 5. skill-canvas-video：最「裸」的 Canvas 2D 路线

[仓库](https://github.com/siegerts/skill-canvas-video)（MIT）。

**实现方式**：只用 Canvas 2D API（明文禁止 DOM/CSS 动画和 WebGL），产出「单个自包含 JS 类，在一个 `<canvas>` 上逐帧渲染」，外面套一个带字体加载和空格播放/R 重启的最小 HTML 宿主页。技术约束很硬：时间按毫秒而非帧号驱动、所有运动走 lerp/easing、类必须自带 `progress()` / `easeOut()` / `easeInOut()` / `lerp()`。导出不用 MediaRecorder，而是 Puppeteer 无头 Chromium 逐帧截 PNG → FFmpeg（libx264，CRF 18，slow preset）合成 MP4，2 倍超采样；agent 被明确要求不要自动跑导出（太慢），只把命令交给用户。

**能做的效果**：默认 1920×1080、60fps 的**暗色科技风解释动画**（深蓝渐变底 + 紫青强调色），自带文本/面板/chrome/终端窗口绘制模板，覆盖 YouTube/Instagram/TikTok/X/LinkedIn 五种平台尺寸安全区——产品演示和概念解释片的典型形态。

### 6. Motion Canvas 与生态配件

- **[Motion Canvas](https://github.com/motion-canvas/motion-canvas)**（约 19k stars）：TypeScript 用 generator 函数编程动画 + 实时预览编辑器；mcpmarket 上有包装成 SKILL.md 的 Claude Code skill。能做出 Manim 同类的讲解型 motion graphics，但 Web 技术栈、逐帧可控
- **digitalsamba/claude-code-video-toolkit**：Remotion 项目模板——`/video` `/record-demo` `/brand` 斜杠命令、9 个可复用组件、ThemeProvider、跨会话 CLAUDE.md。适合品牌一致性的系列产品视频
- **Manim MCP server**：agent 发场景代码、收回渲染好的 MP4，渲染即工具调用
- **Playwright MCP `--save-video=1920x1080`**：agent 驱动浏览器操作，整个会话被录成视频——「操作即视频」的第三条路线
- **op7418 的 YouTube 剪辑 skill**（633 stars）：yt-dlp 下载 + AI 语义章节 + FFmpeg 帧精确剪辑 + 双语字幕烧录（这条路线我们拆过的 [video-agent-kit](/posts/zcode-video-agent-kit/) 也属于近亲）

以上被 [wilwaldon/Claude-Code-Video-Toolkit](https://github.com/wilwaldon/Claude-Code-Video-Toolkit) 这个 awesome-list 收录。

## 三、3D 创作管线：唯一能到照片级效果的路线

### 7. ahujasid/blender-mcp：agent 直接开 3D 软件

[仓库](https://github.com/ahujasid/blender-mcp)（约 27k stars）。

**实现方式**：双组件架构——Blender 插件（addon.py）在 Blender **内部**起一个 socket server（localhost:9876，JSON-over-TCP），MCP server（`uvx blender-mcp`）把 LLM 客户端的请求桥接进去。核心工具 `execute_blender_code` 可以在 Blender 里执行任意 Python（safe mode 下先校验脚本），还能获取场景信息、截取视口画面。内置「资产超市」：Poly Haven 的 HDRI/模型、Sketchfab、Poly Pizza 的 10,600+ 低模（下载时把 CC-BY 署名自动写进 .blend 自定义属性）、Hyper3D Rodin 和腾讯混元 3D 的文生 3D 模型；`export_scene` 可导出 GLB/FBX。

**能做的效果**：真 3D 渲染动画——搭场景、打光、关键帧动画、Blender 引擎出片，可以现场生成 3D 模型塞进场景；导出的 GLB 接着喂 Three.js 网页，形成「3D 资产→视频+网页」双出口管线。

### 8. freshtechbro/claudedesignskills：最大的 3D/动效 skill 集合

自称 [Claude Design Skillstack](https://github.com/freshtechbro/claudedesignskills)：27 插件 / 22 skill / 50+ 斜杠命令 / 27+ 专用子 agent，覆盖 Three.js、GSAP、React Three Fiber、Framer Motion、Babylon.js、A-Frame、Vanta、PlayCanvas、PixiJS、Locomotive、Barba、React Spring、Magic UI、AOS、Anime.js、Lottie，以及 Blender/Spline/Rive/Substance 3D。还有 meta-skill（如 `web3d-integration-patterns` 专讲 Three.js×GSAP×R3F 组合的坑）。

**实现方式**：特色是**生成器脚本**——skill 不只给知识，还带代码生成器：`component_generator.py`（12 种 R3F 组件类型）、`animation_generator.py`（11 种动画类型）、`scene_generator.py`（8 种场景类型）、`mesh_builder.py`、`timeline_builder.py` 等 50+ 生成器当脚手架，agent 调脚本生成骨架再改。其中 blender-web-pipeline（Blender→glTF/Web 导出优化，约 2k 安装）就出自这里。

**能做的效果**：Three.js/R3F 网页 3D 场景、滚动驱动动效、页面转场（Barba）、Blender→glTF 的网页 3D 资产管线——「炫酷官网」的完整武器库。

### 9. Impertio-Studio/Three.js-Claude-Skill-Package：「确定性 skill」流派

[仓库](https://github.com/OpenAEC-Foundation/Three.js-Claude-Skill-Package)（原 OpenAEC-Foundation，现更名 Impertio-Studio）。

**实现方式**：24 个 skill 分五类（core/syntax/impl/errors/agents），方法论极端：全部用 ALWAYS/NEVER 的零含糊措辞、每个 SKILL.md 平均 338 行且硬上限 500 行、绑定 Three.js r160+ 显式版本号、每个都带 methods/examples/anti-patterns.md，自称由「7 阶段研究方法」生成（背后有 27,627 词的调研文档）。agents 类里 `scene-builder` 是决策树式建场景指导，`model-optimizer` 是 Draco/KTX2/LOD 优化管线。

**能做的效果**：版本正确、可维护的 Three.js 交互场景 + 大模型加载优化（LOD/压缩），偏工程可靠性而非视觉花活。

## 四、演示、终端与炫酷网页

### 10. Slidev 官方：框架作者亲自下场 + 内置 MCP

**实现方式**：Slidev（Anthony Fu 的 Markdown→Vue 幻灯片框架）[官方出了 agent skill](https://sli.dev/guide/work-with-ai)，源码就在主仓 `skills/slidev/`，`npx skills add slidevjs/slidev` 安装。杀手锏是 **Slidev 内置了 MCP Server**：dev server 跑着时一条命令接进 Claude（`claude mcp add --transport http slidev http://localhost:3030/__mcp`），也可以 `slidev mcp slides.md` 用 stdio 独立跑——给 agent 提供 inspect/edit/reorder/navigate 幻灯片的结构化工具，不用盲改文件。

**能做的效果**：开发者演示片——Monaco 代码高亮、click 逐步揭示、magic-move 代码变形动画、Mermaid/PlantUML 图表动画，导出 PDF/SPA。社区还有 [yoanbernabeu/slidev-skills](https://github.com/yoanbernabeu/slidev-skills)（20 个 skill 的套件）、pamelafox/presentation-skills（含 RevealJS 模板）；Marp 路线走「skill 生成 .md 后自动执行 marp 导出」的闭环。

### 11. charmbracelet/vhs：终端操作也能「代码成片」

[仓库](https://github.com/charmbracelet/vhs)。

**实现方式**：`.tape` 脚本里写 `Type "npm install"`、`Enter`、`Sleep 2s` 这类指令，内部起一个 ttyd 无头终端，Chrome 逐帧截图，FFmpeg 编成 GIF/MP4/WebM。反过来 `vhs record > cassette.tape` 能把手工会话录成脚本（可复现、可编辑）。

**能做的效果**：可复现、永不「录歪」的终端操作演示 GIF——README demo、CLI 教程的标准形态。社区已有包装成 Claude Code skill 的 VHS 录制 skill；更有趣的是 aiskill.market 这个目录用 VHS 给收录的每个 skill 自动生成演示 GIF——skill 生态吃自己的狗粮。

### 12. Masalale/awwwards-designer：获奖级网页动效流水线

[仓库](https://github.com/Masalale/awwwards-designer)：5-skill 套件（brand-essentials / stitch-mcp-integration / motion-tiering / animation-toolbox / quality-gates），技术栈 TanStack Start + Bun，设计由 Google Stitch MCP 生成。

**实现方式**：几个机制很「反 AI slop」——Invention Gate（硬性清单禁止用模板和常见库，逼发明而非拼装）；动画预算三档（L1 微交互→L2 页面级→L3 hero 场景，逐档升级防堆料）；tool-agnostic 动画层（先写成工具无关描述再绑定具体库）；Video Generation Protocol（把创意文字转成提示词→逐帧截图检查→迭代变异的循环）；8 道质量门（Lighthouse ≥90、可访问性、Core Web Vitals、跨浏览器等）。

**能做的效果**：Awwwards/FWA 获奖级网站动效——hero 大场景、微交互、页面转场，克制的「高级感」而非特效堆料。另有独立的 awwwards-animations skill（React-first、60fps 不容妥协、GSAP/Motion/Anime.js/Lenis 选型决策矩阵）在各 skill 市场流传。

### 13. D3 系：交互式数据可视化

**实现方式**：[chrisvoncsefalvay/claude-d3js-skill](https://github.com/chrisvoncsefalvay/claude-d3js-skill) 教 D3 v7 的数据绑定、响应式设计、平滑过渡和图表 boilerplate；awesome-claude-code-toolkit 里有 D3+Chart.js 变体；加上 iart 的 data-animation-skills（3 个，数据→动画视频）。

**能做的效果**：交互式动态图表——柱/线/饼/散点/网络/树图，状态切换带平滑过渡；属「炫酷 HTML」而非成片视频，要与视频形态结合时走 Remotion 数据驱动路线。

### 14. Anthropic 官方四件：单文件炫酷产物的各种做法

官方 [anthropics/skills](https://github.com/anthropics/skills) 仓库 19 个 skill 里与「炫酷产出」直接相关的四个：

- **web-artifacts-builder**。**实现方式** = 真前端工程再压扁：`init-artifact.sh` 脚手架 React 18 + TS + Tailwind 3.4.1 + 40 个预装 shadcn/ui 组件（含 `@/` 路径别名），`bundle-artifact.sh` 用 Parcel（+ tspaths resolver + html-inline）构建后把所有 JS/CSS/资源内联成一个自包含的 bundle.html；附反「AI slop」设计指引（避免过度居中/紫色渐变/统一圆角/Inter 字体）。**能做的效果** = 带路由和状态管理的复杂单文件 React 应用，直接贴进 claude.ai artifact 或任意浏览器
- **algorithmic-art**。**实现方式** = p5.js 1.7.0（CDN）单文件 HTML + 固定 viewer 模板（header/侧栏参数滑块/seed 导航/Regenerate/Reset/下载 PNG 按钮），`randomSeed()` / `noiseSeed()` 保证同 seed 严格复现；两阶段工作流：先写 4-6 段「生成艺术宣言」再写算法。**能做的效果** = 流场、粒子/噪声系统、递归结构、圆堆积/Voronoi 的「活体」生成艺术互动页，每刷新一个新花色、参数实时可调
- **canvas-design**。**实现方式** = 先给视觉作品「发明」一个命名的美学运动、写宣言（.md），再代码绘制单页 PDF/PNG（canvas-fonts 目录选字体），强制第二轮减法式打磨（不加元素只提纯）。**能做的效果** = 海报/艺术单页；多页模式做成咖啡桌画册式叙事
- **slack-gif-creator**。**实现方式** = 纯 Python：PIL/Pillow 画每一帧 + imageio + numpy 存 GIF，零浏览器依赖。核心模块是 GIFBuilder（num_colors=48、去重、emoji 优化）+ Slack 约束校验器 + 缓动库（bounce_out/elastic_out/back_out）+ 帧合成助手。**能做的效果** = Slack 规格的 shake/pulse/bounce/spin/粒子爆发小 GIF（emoji 128×128、消息 480×480，10-30fps）

## 五、十条共性规律

两轮调研下来，这批 skill 背后有十条反复出现的工程模式：

1. **宣言先行**：先写设计哲学再产出（canvas-design / algorithmic-art），用文字约束视觉品味
2. **交付契约 + 自验证闭环**：standalone HTML、`?t=N` 冻结时刻、三点截图、contact sheet、ffprobe——让 agent 能「看见」自己的产出
3. **教 API 不教框架**：Remotion 官方 skill 灌正确 hook，防网页习惯污染逐帧渲染
4. **渲染器分层**：PIL/cairo CPU 绘帧 → 无头浏览器截帧（Remotion/HyperFrames/VHS/skill-canvas-video）→ WebGL/GPU → 真 3D 引擎（Blender）
5. **脚手架 + 打包内联**：init/bundle 脚本把真工程压成单文件产物（web-artifacts-builder 的 Parcel + html-inline）
6. **人审门禁**：HyperFrames「check 过了也不许 render」、skill-canvas-video「不自动跑导出」——昂贵动作停在人工批准之后
7. **确定性语言规范**：ALWAYS/NEVER 零含糊措辞 + 显式版本号绑定（Impertio 流派）
8. **skill 与 MCP 双形态**：skill 灌知识、MCP 给实时反馈通道（blender-mcp、Slidev 内置 MCP、Manim MCP）；Remotion、Slidev 框架作者亲自官方下场出 skill 已成趋势
9. **生成器脚本**：skill 不只是说明书，还带代码生成器工厂（claudedesignskills 的 50+ 生成器）
10. **资产超市集成**：Poly Haven/Sketchfab/Poly Pizza/混元 3D/Rodin，把「下载合法素材」做进创作管线，连 CC-BY 署名都自动写进文件属性

## 六、结语

这族 skill 最有意思的一点：它们没有发明新的渲染技术，全部押注在既有渲染器（FFmpeg、Chromium、cairo、Blender）上，创新集中在**把「时序确定性」变成 agent 可操作、可验证的契约**——seek harness、冻结帧、JSON Schema storyboard、Lighthouse 质量门。换句话说，难点从来不是渲染，而是让模型「知道每一帧长什么样」。这与我们之前在 [GPT-6 Astra 提示词建议](/posts/gpt6-astra-skills-prompts/)里看到的「做减法」是同一件事：把可验证性做进产物，比堆生成能力更有效。

## 来源清单

- [remotion-dev/skills](https://github.com/remotion-dev/skills) · [Remotion 官方 showcase](https://www.remotion.dev/showcase) · [Remotion docs for AI agents](https://www.remotion.dev/docs/ai)
- [vumichien/manim-skill](https://github.com/vumichien/manim-skill)
- [iart-ai/motion-skills](https://github.com/iart-ai/motion-skills) · [tiktok-video-skills](https://github.com/iart-ai/tiktok-video-skills) · [text-message-video-skills](https://github.com/iart-ai/text-message-video-skills) · [map-animation-skills](https://github.com/iart-ai/map-animation-skills) · [web-animation-skills](https://github.com/iart-ai/web-animation-skills) · [motion-design-skills](https://github.com/iart-ai/motion-design-skills)
- [siegerts/skill-canvas-video](https://github.com/siegerts/skill-canvas-video)
- [motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas)
- [wilwaldon/Claude-Code-Video-Toolkit](https://github.com/wilwaldon/Claude-Code-Video-Toolkit)
- [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp)
- [freshtechbro/claudedesignskills](https://github.com/freshtechbro/claudedesignskills)
- [OpenAEC-Foundation/Three.js-Claude-Skill-Package](https://github.com/OpenAEC-Foundation/Three.js-Claude-Skill-Package)
- [sli.dev/guide/work-with-ai](https://sli.dev/guide/work-with-ai) · [slidevjs/slidev](https://github.com/slidevjs/slidev) · [yoanbernabeu/slidev-skills](https://github.com/yoanbernabeu/slidev-skills)
- [charmbracelet/vhs](https://github.com/charmbracelet/vhs)
- [Masalale/awwwards-designer](https://github.com/Masalale/awwwards-designer)
- [chrisvoncsefalvay/claude-d3js-skill](https://github.com/chrisvoncsefalvay/claude-d3js-skill)
- [anthropics/skills](https://github.com/anthropics/skills)
