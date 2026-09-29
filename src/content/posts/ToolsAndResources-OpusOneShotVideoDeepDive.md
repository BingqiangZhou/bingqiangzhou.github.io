---
title: 【学习笔记】Opus 5.5「一句话生成视频」深度拆解：它一帧都没「生成」——film as code、七条生产路径与 168 例逐帖核查
published: 2026-09-28
description: 拆解 2026 年 9 月爆火的 Claude Opus 5.5「一句话生成视频」热潮：官方公告核实 Opus 5.5 没有任何视频生成能力，所谓生成实为「写一部电影程序」——单 HTML/Canvas/WebGL 逐帧绘制 + 虚拟时钟确定性渲染 + ffmpeg 编码；基于 athemeroy/awesome-opus-5-5-videos 的 168 例人工复核数据，逐路拆解七条生产路径（代码绘制 2D、素材改造、讲解片、三维实时图形、应用录屏、外部视频模型、混合管线）的真实制作方式、提示词谱系（从 45 字开放委托到 17,664 字符美术规格）、音频两派（代码合成 vs 编排 TTS/音乐服务）、缓存经济学（697M token 98% 命中、$486 变 $38.99）与已披露失败模式；附「一句话」真相（参考图/现成歌曲/磁盘旧项目/预置 skill 都是隐形输入）、逐帖核查方法论与九条批判，以及 8 个可跑的开源管线仓库实测清单。
lang: zh
tags: [学习笔记, Claude Code, AI前沿]
abbrlink: opus-55-one-shot-video-deep-dive
---

> 整理日期：2026-09-28
> 调研方式：以 [Anthropic 官方公告](https://www.anthropic.com/news/claude-opus-5-5)、[Hacker News 讨论帖](https://news.ycombinator.com/item?id=49836374)、r/ClaudeAI 原帖、[知乎一手实测](https://zhuanlan.zhihu.com/p/2086877299169873980)、[diggerhq/shipvideo](https://github.com/diggerhq/shipvideo) 源码级 README 为一手材料；对核查仓库 [athemeroy/awesome-opus-5-5-videos](https://github.com/athemeroy/awesome-opus-5-5-videos) 的 `data/cases.csv`（168 例人工复核）做了全量精读与分组统计；文中提及的 GitHub 仓库 star 数、创建时间以 GitHub API 当日实测为准。X 帖内容一律以核查仓库的转述为准（未直接访问 X），所有「作者自述」类数字均已标注口径。
> 写作动机：上周拆完 [Hypit](/posts/hypit-deep-dive/)（给 Agent 造视频 DSL）和 Table-VideoSOP（人机协议化生产），这次想搞清楚的是同一枚硬币的另一面——当模型自己就是动画师时，「一句话生成视频」到底生成的是什么。结论和我的 [HyperFrames 生产线](/posts/ppt-to-video-vs-hyperframes/)高度同源，多处可以互证。

## 一、太长不看

1. **Opus 5.5 没有任何视频生成能力。** 官方公告（2026-09-22）只字未提图像/视频输出，多模态输出仅限文本。所谓「一句话生成视频」＝模型把那句话当产品需求，**写出一部「电影即代码」（film as code）的网页程序，再由确定性渲染器逐帧截图、ffmpeg 编码成 MP4**。知乎实测者的原话最准：「这条视频没有一帧是『生成』的」。
2. **爆火的是「写程序拍片」这条老路线突然好用了**，不是出了新视频模型。HTML 动画从 Opus 4.6 时代就有（HN 评论原话），5.5 的差异在三点：美术质感跨阈值（官方也只在「单提示词游戏构建测试的 graphics and polish」上给了最高分评价）、长时程执行力（官方测试者：68 万行迁移一天完成、连续 18 小时在任务上）、降价 40%（\$4/\$20，缓存读 \$0.20）。
3. **168 例人工复核的真实路径分布**：代码绘制 2D（52）＞已有素材改造（32）＞教育讲解片（27）＞三维/实时图形（19）＞混合/无法判定（14）＝应用游戏录屏（14）＞外部视频模型（10）。约四分之一（32+10）的案例根本不是「代码渲染」，而是剪辑现成素材或指挥 Seedance 等视频模型。
4. **「一句话」是个谱系，不是事实。** 最短的是「想做动画视频」（日语博主）和 45 秒的「每个可见碰撞产生一个音符」；最长的是 17,664 字符的 p5.js 美术规格书。很多「one shot」指的是「用户只提交了一次」，而非「提示短、零素材、零上下文」——参考图、现成 Suno 歌曲、磁盘上的旧项目、预置 skill 都是隐形输入。
5. **音频两条路线**：纯代码合成（按时间表算出来的音画同步，知乎案例）或编排外部服务（ElevenLabs/Gemini TTS/edge-tts/Suno）。已知硬伤：**代理听不见**——有案例中代理自述「检查了波形和音量，但无法试听」，字幕漂移、音乐抓取失败是公开披露过的翻车点。
6. **缓存是这门生意的经济学基础**：697M token 的 demoscene 案例里 98.1% 是缓存读（实际输出仅 56.6 万 token）；数据中心模拟器案例自报「无缓存 \$486、99% 命中后 \$38.99」。
7. **核查文化本身就是亮点**：athemeroy 的仓库对 X 停止检索日（2026-09-26）前的 1,511 条候选帖做 SHA-256 去重（1,401 个 MP4）→ 视觉分类器初筛 → 168 例人工复核，金句是「Engagement is not evidence of authorship」——有高互动视频被字节级比对发现是把早前只标注 Claude 的作品重标成 Opus 5.5 的搬运。
8. **对我最有用的判断**：这波热潮真正验证的不是「LLM 能做视频」，而是「**确定性渲染 + 程序化生成**」这条路线的成本曲线和质检方式——它和 HyperFrames 的确定性渲染契约（虚拟时钟、禁不确定源、seek-safe）是同一套思想，社区在几天内用一百多个案例把可行性区间摸了出来。

## 二、先破题：模型没有变，是管线赢了

### 2.1 官方事实核对

Anthropic 于 2026-09-22 发布 Claude Opus 5.5（Claude 5.5 家族首个模型，Sonnet/Haiku 5.5 随后）。与本文相关的核实结果：

| 事项 | 官方口径 |
| --- | --- |
| 视频生成 | **无**。公告全文无任何图像/视频输出能力，多模态输出仅文本 |
| 定价 | \$4 / \$20（每百万 token 输入/输出），比 Opus 5 低约 40%；缓存读 \$0.20 |
| 智能定位 | 「在大多数工作上达到 Claude Fable 5.1 水平」（Fable 是 Anthropic 更高一级的模型线） |
| 长时程 | 测试者：68 万行代码迁移一天完成；Clio 测试者报告「连续在任务上超过 18 小时」 |
| 图形能力 | 仅一处相关表述：单提示词游戏构建测试中「graphics and polish 得分高于其他所有模型」 |

所以中文媒体那句「大语言模型正式开始吞噬多模态」是新智元式的标题修辞——被吞噬的不是像素生成，是**前期制作（pre-production）和合成（compositing）这两个环节的劳务**。

### 2.2 事件时间线

| 时间 | 事件 |
| --- | --- |
| 09-15 前后 | 正式发布前的早期访问期，r/ClaudeAI 已有创作者晒出 risograph（孔版印刷）风格火车旅程：约 45 分钟单次生成，纯 JavaScript，附完整 repo（The Neuron 09-16 报道；Ole Lehmann 在 X 扩散：「78 秒动画电影，单个 index.html，零图片、零视频文件、零库」） |
| 09-22 | Opus 5.5 正式发布，\$4/\$20 |
| 09-22 ~ 09-26 | X 爆发式跟拍，核查仓库的检索窗口内抓到 **1,511 条候选帖**；B 站出现「一句话生成鹈鹕骑车 MV」实测；知乎 09-25 出现《我让 Opus 5.5 做了条 30 秒的视频，它一帧都没「生成」》 |
| 09-26 前后 | HN「Opus 5.5 is good at explainer videos」423 分 221 评论；GitHub 出现 awesome 收录与逐帖核查仓库（09-25 起）、shipvideo/clearwater/ClaudeAnimationBase 等管线仓库（09-23 起） |

一个值得注意的节奏：**模型 09-22 发布，管线仓库 09-23 就出现，核查仓库 09-25 出现**——工具化、模板化、然后是打假，全程不到一周。

## 三、公共底座：五步流水线

七条路径共享同一套底座。以开源参考实现 [diggerhq/shipvideo](https://github.com/diggerhq/shipvideo)（即 HN 帖里的 launchvideo.io，实测 197★、2026-09-24 创建）为样本，它的 README 把流程写得很完整：

**① 一句话 → 分镜。** Agent（Claude Code / OpenComputer 等有浏览器和 ffmpeg 可用的环境）先把需求翻译成时间轴与场景表。输入 URL 时它还会顺手抓标题、描述、标题结构和「页面用得最多的十六进制色」来做视觉匹配。

**② 写「电影程序」。** 整部片是一个 1920×1080 的 HTML 文档，CSS keyframes 或 `requestAnimationFrame` 驱动，所有视觉元素由 Canvas/SVG/WebGL 矢量绘制。知乎案例约 700 行代码；Clawd MV 案例约 3,600 行 JS 画 39 个场景。矢量绘制解释了两个传播点：1080p 下中文不糊、风格天然统一。

**③ 确定性逐帧渲染（工程核心）。** 不是录屏。Playwright 无头浏览器注入**虚拟时钟**——一个 `__seek(t)` 函数接管 rAF、定时器、`Date` 和 CSS/WAAPI 动画，把画面精确 seek 到 `t = n / fps` 后截图，逐帧喂给 ffmpeg（libx264、CRF 18、yuv420p、faststart）。为保证可复现，场景**禁止**使用 `<video>`、`<audio>`、iframe、CSS transitions、`Math.random` 和外部图片。30 秒的片子渲染约 30–40 秒，帧级可复现。

**④ ffmpeg 合成。** 帧序列 → MP4。有的管线额外做峰值对齐（把切镜对到音轨峰值上）。

**⑤ 音频 + 自检。** 音频两派见下。自检方面 shipvideo 提供 `check_scene`（在虚拟时钟下查 JS 报错、抽查多个时间点的可见文本），知乎案例中模型自查发现标签重叠、主动修复重渲染——正对应官方说的「更少步骤、更强自验」。

### 音频两派与「聋子导演」问题

- **代码合成派**：知乎的脑机接口科普片里，模型导出每个神经尖峰的时间表、按表合成心跳/点火/伺服音——「音画同步不是对出来的，是算出来的」。Clawd MV 用 Node.js 合成鼓和贝斯；灯塔守夜人案例的全部声音（雨、脚步、钟声）在浏览器里合成。
- **编排外部服务派**：ElevenLabs（配音/音效/Suno 歌曲是最常见三件套）、edge-tts（免费）、CosyVoice、Azure Speech、Gemini TTS、Qwen3-TTS（MLX 本地 + 克隆人声）、Google Lyria 3（音乐）。
- **结构性缺陷**：代理**听不见**。有讲解片案例中代理自述「检查了波形与音量但无法试听，英文术语可能生硬」；MV 案例作者公开承认「结尾字幕有漂移」；C64 demoscene 案例里音乐抓取失败导致 SID 配乐与画面脱节。凡涉及成片听感的质检，目前必须人来做（这一点和 [Table-VideoSOP](https://github.com/duoduoler-ops/Table-VideoSOP) 里「1× 审看审听不可被抽帧波形代替」的铁律完全一致）。

### 缓存经济学

三个自报数字勾勒出这条路线为什么突然便宜得起：demoscene 单文件案例 697M token 总量中 98.1% 是缓存读（实际输出仅 56.6 万）；数据中心模拟器案例「119M 输入 token、99% 缓存命中」，自估无缓存 \$486、命中后 \$38.99；手绘短片诚实案例 6,270 万 token 中 96% 缓存读、API 标价约 \$34。\$0.20/百万的缓存读单价让「反复读同一大文件自我检查」这种工作流第一次不心疼。

## 四、逐路拆解：168 例的七条生产路径

核查仓库按「帧是怎么来的」把 168 例分成七条路径。分布与制作方式如下，逐路展开。

| 路径 | 案例数 | 一句话制作方式 |
| --- | --- | --- |
| 代码绘制 2D | 52 | Canvas/SVG/p5.js 逐帧画出所有画面，浏览器逐帧导出 + ffmpeg |
| 已有素材改造 | 32 | Opus 当剪辑师/包装师，处理真人实拍、播客、产品素材 |
| 教育讲解片 | 27 | Remotion/Manim/GSAP 图解 + TTS 旁白（时长中位数最长，约 102 秒） |
| 三维/实时图形 | 19 | WebGL/Three.js 着色器，或经 MCP/Python 驱动 Blender |
| 混合/无法判定 | 14 | 多工序编排或披露不足 |
| 应用/游戏录屏 | 14 | 先造可玩/可交互的东西，再录屏成片 |
| 外部视频模型 | 10 | Opus 当导演写分镜提示词，Seedance 等负责最终像素 |

### 4.1 代码绘制 2D（52 例）：主赛道，「一句话」的两个极端

这是最接近公众想象「一句话生成视频」的路径，也是案例最多、信息披露最充分的。

**技术栈谱系**：原生 JS + Canvas 2D（最常见）、SVG、p5.js / p5.brush（笔刷质感）、Node Canvas（服务端逐帧）、WebGL2 方形动画。共同点是**确定性约束的写法**：固定调色板、整数像素网格（160×90 整数放大）、最近邻上采样到 1080p、禁外部素材。有案例明确要求「240 秒无缝循环 + 键盘触发导出」。

**提示词谱系的两端**：

- 真·一句话端：「想做动画视频」（日语博主，零图片零音频输入）；「Make a 90-second animated short film about a bug that doesn't want to be fixed」；「make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are... go all out」（15 秒 showreel 模板，同日多人复刻，已成流行梗）。
- 规格书端：3,027 字符的法语提示（240 秒无缝循环、480×270 最近邻放大、60fps、键盘导出）；17,664 字符的 p5.js 提示（把参考视频当权威、规定粗笔刷基元、蓝橙窄色板、60fps 平台上 12–15fps 的颜料状态变化）；4,766 字符的中文提示（逐秒写死场景形变：橙色角色→神经网络→棱镜→向日葵→星系→黑洞→地球）。

**代表案例**：

- **Clawd 年代歌曲 MV**（@Aadidev0）：Claude Code 先研究一个现成 MV 示例仓库，再写原创 39 行歌词和 120 BPM 时间轴，约 3,600 行 JS/Canvas 画 39 场，Node.js 合成鼓贝斯，浏览器渲 3,936 帧、ffmpeg 合成，自报约一小时。核查实测 MP4 为 164.049 秒，与 3,936÷24 相符——**数字对得上，但「一次提示词」背后有示例仓库和多阶段制作**。
- **蚁群动画**（@hanifproduktif）：作者直接开源了 [buildwithhanif/claude-animation-skill](https://github.com/buildwithhanif/claude-animation-skill)（实测 15★），仓库里的 `examples/ant-colony/film.mjs` 与成片吻合：32 秒 24fps 的 `frame(ctx, t)` 动画，Node Canvas + ffmpeg 管线，含蚂蚁 rig、场景、声音脚本和抽帧确定性检查。README 的自我描述是「detail bible（细节圣经）+ 蚂蚁 rig + 笔刷/水彩笔 + 逐帧复刻循环 + 合成音效」。
- **Shaml 纸雕夜景**（@makwired）：对应 [klsoen/opus-js-animations](https://github.com/klsoen/opus-js-animations)（11★）。它的 `FILM.md` 工艺值得整段抄：**先问音源，听完音乐，交一份导演阐述（director's treatment），等人类批准，再写程序**——20.4 秒纸雕夜景，Canvas 2D 逐帧，现成宗教朗读录音做音轨，从 v1 迭代到 v4.2 全是用户美术修订。这就是把 Table-VideoSOP 那套「先审方案再开工」内化成了 skill。
- **697M token 的 demoscene**（@JustinPerea）：一句宽泛 demo 请求 → 280KB 单 HTML 产出全部像素与声音。作者后来澄清：697M 总量中 98.1% 是缓存读，实际输出 56.6 万 token；「一次提示」包含预配置的 ultra-code 工作流和一次「continue」。

**公开披露过的失败模式**：字幕与音乐漂移（作者自认）、音乐素材抓取失败导致声画脱节、人物画成火柴人需要两轮返工、部分镜头夸张到失真。值得表扬的是这批作者普遍愿意在回复里自曝返工次数——@mablesjoseph 的手绘短片直接给出全账：163 次模型调用、6 小时 45 分、1.5 小时人工、6,270 万 token（96% 缓存）、约 \$34 API 标价，「不能包装成短提示 one-shot」是核查笔记的原话。

### 4.2 已有素材改造（32 例）：第二大腿，Opus 是剪辑师

这条路径的公共结构是：**像素不是模型画的，模型做的是选择、编排、包装**。子模式至少六种：

- **真人口播/播客改剪**：13 条同一句话的拍摄 take 交给 Opus + video-use，代理读转写、逐帧比较候选、挑干净版本、剪辑调色改字幕（自报约两分钟、\$0.90）；播客 20 分钟音频 → After Effects 挑高光剪短片；「把原始口播剪得活泼」的 OpenEdit 案例，自报 token \$23 + fal 服务 \$49——**第三方服务比模型还贵**。
- **产品代码库 → 营销片**：Agent 读产品仓库、落地页、品牌视觉，用 Remotion/HyperFrames 写广告。最完整的公开规格（Hooklab 案例）长这样：先索取产品名、卖点、UI、10–20 段自有实拍、授权歌曲，按 120 BPM 的 10 小节逐镜安排，单 HTML + ffmpeg + Playwright + 音轨峰值对齐出 20 秒广告，**要求预检至少 20 帧**。另有「Opus 主笔 + Fable 5.1 协助难段」的多模型协作披露。
- **After Effects 自动化**：MiniMax H3 生成基础片段，Opus 操控 AE 按节拍剪辑、加粒子/万花筒/datamosh，**保留可编辑的 .aep 工程**；也有人用 Opus 处理传统动画的 x-sheet 曝光节奏与分层合成。一位 20 年经验的动效师做了同分镜三流水线对照（MiniMax H3 直出 / GPT-6+AE / Opus+AE），Opus 版约 3–4 小时——「GPT 准备的图层被 Opus 复用」这类依赖关系被核查特别标注。
- **文档/文章 → 视频**：文章 URL → Remotion 竖版 + 横版双语解说（拿站点 logo 星号当吉祥物）；IKEA 说明书 → 3D 旁白教学片；长论文 → 九分钟解说（Gemini 出静图和音频、Opus 做动画）。
- **照片程序合成**：代理上网找真实街景照片，用代码叠雨、倒影、对焦变化、人物光影与音效——「没有视频模型」但**有外部图像**，两个声明要分开。
- **工程手段录屏**：Opus 通过 Android ADB 控制真机录屏、修系统时间/电量显示、自查、选音乐按拍子剪；还有人做了 `/session-story` skill，读本地 Claude Code 会话历史把聊天记录动画化——**个人数据本身是素材**。

### 4.3 教育讲解片（27 例）：形态最成熟，时长最长

核查统计里这条路径的预览时长中位数最长（约 102 秒），最长案例是 12 分钟的 Transformer 教学讲解片（@dotey，Claude Code + 开放工具安装与联网权限，要求用 JS 深入浅出讲自注意力与数学原理）。

**制作方式**的稳定配方：

- **画面**：Remotion（React/SVG/HTML/CSS/web 字体）是自报最多的高质量路线；Manim 衍生品讲数学；GSAP 做品牌动效（拉斯维加斯 Sphere 发展史案例：给三张图和背景资料，指定 GSAP，25 分钟一轮提交）。
- **旁白**：TTS 谱系横跨免费到克隆——edge-tts、CosyVoice、Azure Speech、Gemini TTS、Qwen3-TTS（MLX 本地推理 + 克隆作者人声）。有个细节很能说明工作流成熟度：大气环流教学片的作者**把 TTS 厂商文档和 API 配置直接作为输入给代理**；通胀解说片的代理**自动复用了本地工作区里作者的旧音色、字幕规范和上一季片头**——「短提示作用于富工作区」是这条路径的常态。
- **双交付**：不止出 MP4，还出可交互网页（密码学讲解出 6 分钟 12 章字幕片 + 互动页；捡罐实验出在线交互版，网页里 8,294 字符内联 JS 可直接读）。
- **格式创新**：分屏注意力格式出现了——左半屏 Subway Surfers 式跑酷、右半屏 Black-Scholes 公式讲解，一分钟。

这条路径的软肋也最清楚：**内容正确性无人担保**。核查笔记对每个教学案例都写了「九帧无法验证力学题解法/医学内容正确性/事实准确性」，医疗科普案例被特别标注「必须另由主题专家核查」。

### 4.4 三维/实时图形（19 例）：三条子路线

- **纯浏览器 WebGL**：Clearwater 案例是最好的样本——[Aureliengmz/clearwater](https://github.com/Aureliengmz/clearwater)（实测 473★，单 HTML 文件、WebGL2、无库无构建），README 记载 FFT 波形、涟漪模拟、焦散、自适应画质，鹅卵石纹理以 base64 内嵌（由 Python 辅助生成）。核查确认这是「写实感的实时浏览器图形，不是扩散视频」——但也指出「无外部资产」指的是运行时不拉取，**内嵌的生成纹理仍是视觉资产**。
- **Blender via MCP/Python**：Opus 通过 Higgsfield Blender bridge MCP 驱动 Blender 5.2/EEVEE，**先反问六个问题**，再估相机 30 个角点、建 272 个分离对象、检查爆炸动画碰撞并修路径（建筑爆炸图案例，交付物是可编辑 Blender 场景）；或用 Python 在 Blender 建九个场景、Cycles 渲 720 帧（日本博主的模型发布片：Midjourney 参考图 + 本地 YuE2 生成 BGM + 先分析节拍强拍再对拍子剪）。Anthropic 产品负责人也发了网页 UI 里单提示词用 Blender 做黏土动画的演示。
- **GPU 光线步进（raymarching）**：就是那只鹈鹕。开放委托「技术任意、可跑一整天」→ 作者称 Opus 自写 GPU raymarching 渲染器，鹈鹕/车/栈桥/海/天空/配乐全由代码计算，1,140 帧、每帧 40 次采样。核查实测 MP4 38.059 秒/30fps，与 1,140÷30 相符，画面写实度足以打破「代码只能画矢量卡通」的偏见——**但代码与任务日志未公开，零外部素材声明无法独立证实**。

这条路径还有个单例费用对照很实用：同一「Blender 程序化、无预制资产、10 秒镜头」任务，Opus 5.5 用 35 分钟/19.96 万输出 token/约 \$13.3，GPT-6 Astra 用 28 分钟/5.66 万/约 \$14.5（均为作者口径）——**输出 token 少不等于总费用低**，和 4.7 节的 Rube Goldberg 对照互为印证。

### 4.5 应用/游戏录屏（14 例）：先造玩具，再拍玩具

视频是「可交互作品的录屏」：Splatoon 复刻（部署到 Itch.io 附试玩链接）、波斯王子类（公开提示词：原生 JS/Canvas 2D、可辨识的相似关卡、剑斗、灯光闪烁、数分钟可玩性）、Dark Souls 类。教育方向长出了「互动实验室」变体：相机对焦原理 → 可拖动对焦环的透镜实验室（1 小时 26 分、\$25.66）；数据中心模拟器（1 小时 53 分、\$38.99、202 次调用 99% 缓存命中）；黑洞引力透镜实验室（首轮构建后**自动三轮 QA**：每轮两个评审 Agent 给 9–10 个缺陷按优先级排序、第三个 Agent 修复，共 5 小时 28 分、约 \$90）。

两个对制作方式有揭示价值的细节：数据中心案例的代理**读取了磁盘上作者以前的项目来沿用风格**（「一句话」不等于空白工作区）；捡罐实验的制作用博客公开了完整人机节拍——最初一句任务 → 代理先交静态设计稿 → 人回「不错」 → 网页做出来后按人发现的气泡折行、标牌重叠、手机字号问题修正 → 最后逐帧导出。**设计确认环节仍然在人这里。**

### 4.6 外部视频模型（10 例）：Opus 当导演，扩散模型当摄影机

最清晰的分工声明来自两个同构案例：「Opus 写故事大纲、角色表、起始帧、镜头运动与时值，Seedance 2.5 负责动起来」。进阶玩法：

- **三层参考链**（@OriSilver）：风格参考片 → Opus 经 MaxFusion MCP 在 Blender 里重建机位/走位/分镜、导出 30 秒草模 → 草模 + 自有角色作为 Seedance 2.5 的参考出最终画面。**镜头语言、空间控制、最终像素分别由三层供给。**
- **多服务编排**（@koldo2k，提示词全文公开）：Magnific MCP 编排 Seedream 5 Pro 风景、GPT 2.5 透明剪纸、Kling 2.5 人物/鲸鱼动画、Lyria 3 音乐；**贵步骤先列清单等人确认**，实际消耗 1,500 credits。20 秒可循环的「无限放大拼贴」，穿过怀表/相机/放大镜/镜子门户。
- **Agent + Runway MCP**：给 Claude Agent 挂 Runway 工具权限，令其自主构思并制作 5 分钟 Netflix 风格超级智能纪录片。
- **底片 + 叠层**：fal H3 Max 生成旋转杯子实拍感视频，Opus 在上面画动画叠层——「实拍感底片 + 代码叠层」的混合记账方式。

这条路径的存在本身是重要的祛魅材料：**X 上挂着 Opus 名号的写实视频里，相当一部分的像素来自 Seedance/Kling/H3，Opus 出的是分镜和提示词。**

### 4.7 混合/无法判定（14 例）：长片工厂与配方传播

两个极端案例值得单独立传：

- **8 分 33 秒阿拉伯语动画试播集**：约 14 小时、211 个镜头规划、自建二维动画引擎、生成 300 多张人物/场景图、11 个角色、70 条配音、16 段音乐、字幕与混音。这是「Agent 制片厂」形态的目前上限展示——也是核查最难验收的（台词翻译、配音、连贯性都无法抽帧验证）。
- **「一句话 + 12 小时自治」的真相**（@donaldjewkes）：根帖说一句提示、5 分钟说话、12 小时自治工作；公开的完整提示其实是 **9.5K 字符**，附现成 MP4/歌曲、源码和项目文件夹，明确指示代理去用图像生成和 Seedance。之后有人发帖承认「我照着他的工作流做的」——**生产配方在公开帖子间传播**，5,594 字符的 MV 提示模板也是同一路产物。

这组里还有个对模型选型有用的对照：同一 Rube Goldberg 物理机关任务，Opus 5.5 用 62 分钟/\$14.28，GPT-6 Astra 用 11 分钟/\$2.20——**「每 token 便宜 60%」不保证「每任务更省」**，四个指标（总价、单价、耗时、质量）必须分开记。

## 五、「一句话」的真相：隐形输入清单

把 168 例的披露拼起来，「一句话」能成立，几乎总是因为输入其实不止一句话。按出现频率排：

1. **参考图/参考视频**：手绘参考、Midjourney 图、角色设定图、镜头风格参考片（「给一张图」是最常见的隐形输入，核查专门提醒「一张图是强视觉条件」）。
2. **现成音频**：Suno 歌曲（一周前做好的）、既有 BGM、宗教朗读录音——音画同步的「音」往往早就在了。
3. **磁盘上的旧项目**：早年的动效代码、作者以前的项目风格、本地会话历史。
4. **预置 skill/工作流**：Danny Postma 封装的 `motion-ad` skill（15 秒产品动效广告）、claude-animation-skill、opus-js-animations、code-video、HyperFrames 插件、付费绘画引擎 skill——**短触发词背后是别人写好的整条管线**。
5. **产品资产**：代码库、落地页、品牌色、UI 截图、自有实拍。
6. **结构化知识**：整理好的讲义、Wiki、说明书、博客文全文。

这不是作弊，而是这件事的真实形态：**「一句话」压缩的是交互轮数，不是输入信息量**。168 例里真正「短提示 + 空白工作区 + 零素材」的案例存在，但不多，且成片普遍粗糙——有从业者专门发帖说社区单句跑出来的视频大多不行，提出六步工作流（参考片驱动、HyperFrames/Remotion 代码渲染底座、21st.dev UI 组件库、静态分镜逐帧审核、导演式微调反馈）。

## 六、逐帖核查方法论：这个仓库本身值得单独学

athemeroy/awesome-opus-5-5-videos（242★，CC BY 4.0，与 Anthropic 无关）的流程设计得很专业：

- **检索冻结**：X 检索截止 2026-09-26，1,511 条候选帖。
- **文件级去重**：用 Hypit 工具对 1,419 个 MP4 附件各抽九帧，SHA-256 哈希识别出 1,401 个不同文件。
- **分类器初筛**：Gemini 3.8 Flash 视觉分类，980 个「是」+ 139 个「可能」与 Opus 相关。
- **人工复核 168 例**：每例记录来源链接、生产路径、创作者披露、Hypit 观察和复核笔记，明确区分「作者说的」和「核查看到的」。
- **反例意识**：一个高互动视频经字节级比对发现是搬运（原帖只标注 Claude，搬运帖标成 Opus 5.5），被剔除出索引——「Engagement is not evidence of authorship」。

它反复强调的边界也专业：「一帧不能证明生产路径」「分类器判断不等于作者身份验证」「样本只反映检索窗口」。这套「披露与证据分离」的记账法，和我之前在 Hypit 拆解里推崇的做法同源，值得抄进任何调研 SOP。

## 七、九条批判与我的判断

1. **「生成」是误导性动词。** 全部七条路径里，Opus 的产出物是代码、提示词或剪辑决策；把它叫「视频生成」会让公众错误地拿它对比 Sora/Seedance，而真正的对比对象是 After Effects 和 Manim。
2. **传播样本有系统性偏差。** 病毒式传播的是最好看的 1%（鹈鹕、Clearwater），168 例的中位体验是「能用但像 PPT」——知乎作者的第二句提示词就是「要更生动」，返工是常态不是例外（163 次调用、12 轮修订这类诚实账本都摆在那里）。
3. **时长与质量强负相关。** 45 秒—90 秒是甜点区；164 秒 MV 已经要 39 个场景对 120 BPM 时间轴；13 分钟的「全代码」长片声明至今无源码佐证。别拿短视频案例外推长片能力。
4. **音频是二等公民。** 代理听不见是结构性的（波形检查代替不了审听），字幕漂移、TTS 生硬、音乐授权（Purple Motion 的 demoscene 配乐、Suno 商用许可）都是被披露过或悬着的坑。
5. **成本叙事混乱且普遍乐观。** 「\$0 成本」的帖子忽略订阅额度与第三方服务费（\$49 fal、1,500 credits、\$90 三轮 QA）；「22% 周额度」和「\$3.98」不可比。可信的口径只有带 token 明细和缓存命中率的自报账。
6. **「一句话」营销掩盖了真实工程。** 社区一周内长出的 skill 生态（motion-ad、claude-animation-skill、opus-js-animations、code-video、/session-story、HyperFrames 插件）说明：**可持续的产出靠管线，不靠提示词**。这和 Hypit 拆解的结论（DSL + 编译器 > 裸提示）完全一致。
7. **写实感案例恰恰是最不可核实的。** 最出圈的鹈鹕（raymarching、零素材）没公开代码；公开了源码的案例（Clearwater、蚁群、Shaml）反而都是「中等写实 + 强工艺」。**可信度与传播度呈反向关系**，这不是巧合。
8. **知识正确性裸奔。** 教学片是最大实用场景，但 168 例无一做过内容审校，医疗科普这种高危内容也被原样传播。
9. **对我自己生产线的三句话结论**：虚拟时钟 + 禁不确定源 + seek-safe 是这条路线的全部工程内核，HyperFrames 的确定性渲染契约早就是这个形态；「先交导演方案等人批准再写程序」的 FILM.md 工艺和 Table-VideoSOP 的镜头剧本铁律是同一件事的两种写法；下一步值得做的不是追更玄的提示词，而是把「音频审听」和「内容审校」这两个人工环节协议化。

## 八、附录：可跑的开源管线实测清单

以下仓库均于 2026-09-28 经 GitHub API 核实存在（star 数为当日快照）：

| 仓库 | Star | 定位 |
| --- | --- | --- |
| [Aureliengmz/clearwater](https://github.com/Aureliengmz/clearwater) | 473 | 单 HTML WebGL2 写实浅水渲染（参考实现，非管线） |
| [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | 474 | Canvas 动画基础库（p5.js/Chrome/ffmpeg 管线，核查仓库点名） |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | 355 | Opus 驱动的车辆/动画生成管线（核查仓库点名） |
| [diggerhq/shipvideo](https://github.com/diggerhq/shipvideo) | 197 | launchvideo.io 开源版：URL → 20–40 秒发布片，OpenComputer + 虚拟时钟 |
| [Changroro/code-video](https://github.com/Changroro/code-video) | 43 | Agent skill：调研主题 → 手绘 + 8-bit 宣传片 MP4 |
| [makevoid/motion-graphics-music-video-skill](https://github.com/makevoid/motion-graphics-music-video-skill) | 19 | 音乐 MV skill（核查仓库点名） |
| [buildwithhanif/claude-animation-skill](https://github.com/buildwithhanif/claude-animation-skill) | 15 | 手绘 2D 动画 skill：Node Canvas + ffmpeg，含蚂蚁 rig 与合成音效 |
| [klsoen/opus-js-animations](https://github.com/klsoen/opus-js-animations) | 11 | brief → 音源 → 导演阐述 → 逐帧 MP4 的 Claude Code skill + 插件 |

配套阅读：[Hypit 深度拆解](/posts/hypit-deep-dive/)（同一问题的 DSL 路线）、[HyperFrames 生产线可行性](/posts/ppt-to-video-vs-hyperframes/)（我自己的确定性渲染实践）、[数字人方案调研](/posts/digital-human-research/)（真人感视频的另一条赛道）。

主要信息源：[Anthropic 官方公告](https://www.anthropic.com/news/claude-opus-5-5) · [athemeroy/awesome-opus-5-5-videos（data/cases.csv）](https://github.com/athemeroy/awesome-opus-5-5-videos) · [diggerhq/shipvideo](https://github.com/diggerhq/shipvideo) · [HN 讨论帖](https://news.ycombinator.com/item?id=49836374) · [知乎一手实测](https://zhuanlan.zhihu.com/p/2086877299169873980) · [The Neuron 09-15/16 报道](https://www.theneuron.ai) · [r/ClaudeAI 火车旅程原帖](https://www.reddit.com/r/ClaudeAI/comments/1wnkvys/opus_55_creates_a_train_journey_drawn_entirely_in)
