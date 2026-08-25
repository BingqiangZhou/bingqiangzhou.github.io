---
title: 【学习笔记】HyperFrames 30 天拆解（二）Start and create：九种输入路径跑通成片
published: 2026-08-25
description: HyperFrames「30 天」系列第二篇，全内容拆解 Days 1-9「Start and create」阶段：skills 安装全命令（交互式/CI/Antigravity/Copilot、路由九行表、排障四步）与快速上手三步（含一段话全自动捷径、第一版之后的三条路径）；FRAME.md 设计系统七条原则（品牌只对色与字体是真理、站点当事实源、tokens 先于 components、别对抗工作流预设等）；Days 3-7 五条工作流的请求模板原文、关键选择、结构原则与评审清单全录（PR 三种受众与两份检查单、音乐六要素结构、解说四种落点与教学评审、字幕三路分工、动效六种对象与透明导出）；Day 8 媒体音频管线（TTS 引擎顺序、BGM 响度目标、VO 节奏规则、HEVC 自动代理、供给资产规则、鉴权提供方表与离线回退）；Day 9 设计工具（图片留图片/动的重建 HTML 总规则、Figma 六种导入能力与命令细节、Claude Design 交接四步）；另附 faceless-explainer 七步执行链解剖。读完本篇无需再翻官方文档。
lang: zh
tags: [学习笔记]
abbrlink: hyperframes-thirty-days-phase-1
---

> **系列导航**：[（一）总览](/posts/hyperframes-thirty-days-notes/) → **（二）Start and create（本篇）** → [（三）Direct and refine](/posts/hyperframes-thirty-days-phase-2/) → [（四）Extend and ship](/posts/hyperframes-thirty-days-phase-3/) → [（五）创作路径](/posts/hyperframes-thirty-days-creation-paths/) → [（六）Prompt Guide](/posts/hyperframes-thirty-days-prompt-guide/) → [（七）Catalog](/posts/hyperframes-thirty-days-catalog/)
> **调研日期**：2026-08-25
> **本篇对象**：[30 Days of HyperFrames](https://hyperframes.heygen.com/thirty-days) Days 1-9 + 官方 [Quickstart](https://hyperframes.heygen.com/quickstart) / [Skills](https://hyperframes.heygen.com/guides/skills) / [Design systems](https://hyperframes.heygen.com/prompting/design-systems) / 五条工作流 Guide / [Media and audio](https://hyperframes.heygen.com/prompting/media-and-audio) / [Authentication](https://hyperframes.heygen.com/guides/authentication) / [Figma](https://hyperframes.heygen.com/guides/figma) / [Design tools](https://hyperframes.heygen.com/guides/design-tools) 全文
> **说明**：本篇是全内容笔记——官方页面的事实、命令、检查单、示例尽量原文收录，目标是读完本篇不再需要翻网站。篇一只有每天的一句话简介，机制细节都在这里

## 一、第一阶段的本质：入口不是空时间轴，而是「你已有的东西」

| 输入 | 天 | 走哪条工作流 |
| --- | --- | --- |
| 一台装好代理的机器 | Day 1 | 装 skills，先跑通最小闭环 |
| 一套品牌视觉 | Day 2 | FRAME.md 设计系统 |
| 一个 GitHub PR | Day 3 | PR-to-Video |
| 一首歌 | Day 4 | Music-to-Video |
| 一段文字（文章/笔记/主题） | Day 5 | Faceless explainer |
| 一段口播视频 | Day 6 | Talking-head recut |
| 一个想法（十秒内的小动效） | Day 7 | Motion graphics |
| 一个「要有声音」的需求 | Day 8 | 媒体与音频管线 |
| 一份 Figma 设计稿 | Day 9 | Figma 导入 |

先看地基：怎么装、怎么开口、装完怎么继续。

## 二、Day 1：装 skills，做出第一条视频

（源：[Make your first video](https://hyperframes.heygen.com/quickstart)、[Install and update agent skills](https://hyperframes.heygen.com/guides/skills)）

### 2.1 官方「最短路径」：一段话全自动

如果编码代理已经开在某个文件夹里，直接粘贴这三行（只改 URL）——装 skills、做视频、开预览一次完成：

```text
Set this folder up for HyperFrames and make me a video.
1. Run: npx hyperframes skills update
2. Then, using /hyperframes, make a 10-second product intro for https://example.com
3. Open the local preview when it is done and tell me the project folder.
```

官方同时说明成本边界：HyperFrames 免费开源，**本地渲染不消耗 HeyGen 额度**；你的编码代理和可选的托管/语音/头像/生成媒体服务各有自己的计费。

### 2.2 分步安装：skills 的完整命令面

```bash
npx skills add heygen-com/hyperframes        # 交互式安装，选 Core Skills
npx hyperframes skills update                # 代理/CI 环境非交互安装或刷新（核心集 + 已有技能）
npx hyperframes skills check                 # 只检查新旧，不改动
npx hyperframes skills update pr-to-video    # 显式装/刷新某一个工作流
npx skills add heygen-com/hyperframes --all  # 全量安装（离线环境/不想后续联网再拉）
npx skills add heygen-com/hyperframes --skill hyperframes-animation  # 装单个命名技能
```

要点（官方原文语义）：

- **选 Core Skills 即可起步**：`/hyperframes` 路由会在请求需要时再安装专门工作流，不必预先全装；核心集更小、更容易保持最新；
- **装完开新会话**再让代理用 `/hyperframes`；
- **Google Antigravity**：选 Core Skills + Antigravity，装进项目级 `.agents/skills`（也支持全局 `~/.gemini/config/skills`）；
- **GitHub Copilot CLI**：`skills update` 后启动 `copilot`；已运行的会话用 `/skills reload`，用 `/skills list`、`/skills info hyperframes` 确认发现；
- **代理看不到技能的排障四步**：开新会话 → 确认项目/全局技能目录属于当前代理 → `skills check` → check 报缺失或过时就 `skills update`；
- 技能定义的权威版本在 [GitHub 仓库 skills 目录](https://github.com/heygen-com/hyperframes/tree/main/skills)。

### 2.3 路由表：`/hyperframes` 怎么选工作流

官方 Skills 页的路由表（按输入对号入座）：

| 你提供 | 工作流 |
| --- | --- |
| 产品网站或产品 brief | Product launch video |
| 主题或脚本（无网站捕获） | Faceless explainer |
| 一个 GitHub pull request | PR-to-video |
| 既有口播素材 | Captions 或设计化 recut |
| 一首音乐 | Music-driven video |
| 一段短的设计主导动画 | Motion graphic |
| 一份演示文稿 | Slideshow |
| Figma 文件或 frame | Figma 导入（资产 + 品牌 token + 组件 + 重构运动） |
| 上述之外的任何东西 | General video |

已知正确工作流时可以直接点名调用，但**不需要背名字起步**。（本机入口技能的实现版路由优先级表见篇一附录——比这页更细，含 remotion 移植、embedded-captions 等十级优先级。）

### 2.4 第一版之后：三条继续路径

代理留下一个**可编辑的项目文件夹**并打开本地预览；重开预览用 `npx hyperframes preview`。看第一版时检查四件事：**故事、事实、可读的文字、声音**——它不保证是终剪。之后三条路径操作同一个项目：

| 路径 | 做法 | 示例 |
| --- | --- | --- |
| Ask the agent | 同一聊天里改或渲 | 「Make the title larger, then render another version.」 |
| Open Studio | 指向同一项目做可视化编辑 | `npx hyperframes preview` |
| Use the CLI | 直接从项目目录预览/渲染 | `npx hyperframes render --output video.mp4` |

## 三、Day 2：FRAME.md——把品牌写成事实源

（源：[Design systems and brand](https://hyperframes.heygen.com/prompting/design-systems)）

官方 [Design systems](https://hyperframes.heygen.com/prompting/design-systems) 页的全部要点：

**核心动作永远不变：给代理一个 source of brand truth（设计规格、站点或 Figma 文件），并在提示词里点名它。**「Make it on-brand」是最含糊的请求——代理无从知道你的品牌是什么，只能自己发明一个。

### 3.1 指向规格，不要描述氛围

项目可以携带 `frame.md`：**frontmatter 存机器可读的品牌**（精确 hex、字体族、字重关系），**frontmatter 之下的正文存意图**（品牌的 Do 与 Don't）。规格存在时点名它：

> Use the palette and type from `frame.md`. Build a 15-second feature announcement.

- ❌ `make it feel on-brand and premium`
- ✅ `pull colors and fonts from frame.md; premium means generous spacing and one restrained accent`

原理：`on-brand` 是代理必须去猜的心情；规格的 frontmatter 是规范（normative），代理会**逐字引用你的 hex 和字体族**而不是近似，再读正文拿意图。品牌若在别处（PDF 品牌手册、截图、粘贴的色值），附上——都比口头描述可靠。

### 3.2 品牌对「颜色与字体」是真理，对「版式」不是

设计规格说品牌长什么样，**不说视频帧怎么构图**。要点名什么是神圣的，其余交给代理：

> Colors and fonts are locked to the brand — keep the exact hexes and the display/body pairing. Layout, spacing, and motion are yours to compose for video.

官方给出了原因：**web 尺度的品牌值活不过视频**——1px 边框加 0.06 透明度的阴影在 H.264 压缩后不可见；web 正文字号在 1080p 帧上直接消失。所以规格分两半对待：

- **Strict（严格执行）**：品牌色、字体、字重关系、背景选择（品牌是浅色画布就保持浅色）；
- **Scaled up for the medium（为媒介放大）**：字号、装饰性透明度、边框粗细。

从 web 设计系统里过度指定版式就是在对抗媒介。**钉死色板与字体，委托构图。**

### 3.3 没有规格时：用站点本身

> Match this site's look — pull its palette and fonts — and make a 20-second launch clip: https://…

知名品牌常常点名即可（代理自己调研色板与字体）。一个官方警告：**SPA 首页经常返回近乎空壳**，如果拉回来的色板很薄，让代理改指向博客、新闻或文档页。

### 3.4 从 Figma 带入品牌

> Bring in the brand tokens from this Figma file, then build the intro: https://figma.com/…

Figma 导入把每次导入**冻结为带来源记录的本地文件**，渲染绝不调用 Figma，保持确定性；品牌变量进来成为 composition 的 brand tokens。两个措辞要点：**先说「brand tokens first, then the components」**（先导 token 再导组件，组件颜色才能连到品牌变量而不是烧死重复 hex）；**storyboard frames 是状态不是幻灯片**——指着一条场景帧条让代理「重构帧之间的运动」，一个元素在四帧里的四个位置是「一个元素在动」，不是四张静帧翻页。

### 3.5 多视频系列的一致性

系列（一组 launch 片、每周剪辑、分地区版本）的一致性来自**共享事实源**，不是每次重新描述品牌：

> All four videos share `frame.md` for palette and type. Only the headline and the stat change per video.

常量来自一份 `frame.md` 或一组导入的 Figma token；变量部分变成[变量](https://hyperframes.heygen.com/prompting/variables-and-templating)。`frame.md` 变了就重跑受影响的工作流生成/组装步骤。已经存在的组合要在渲染时换肤，就把共享品牌 token 声明成 composition 变量——**每个标量变量都会作为 `--{id}` CSS 自定义属性应用到组合根**，CSS 里的 `var(--id)` 自动跟随覆盖。这是设计系统与模板化的交汇点：品牌共享，内容参数化。

### 3.6 资产给路径，不给描述

> Logo at `assets/logo.svg`, brand font files in `assets/fonts/`, product shot at `assets/hero.png`. Use them; don't invent placeholders.

显式给路径，代理才接真资产而不是生成替身，渲染也因此确定（所有资产渲染前已在本地）。**logo 优先 SVG 而非位图**——可缩放、可动画。

### 3.7 别对抗工作流预设

每条创作工作流自带一套设计过的观感。**把品牌输入喂给这套观感，不要事后逐场景重样式**：

- ❌ `run /product-launch-video, then restyle every scene to my colors afterward`
- ✅ `run /product-launch-video with my palette, fonts, and logo as inputs up front`

工作流预设是一个协调、经测试的系统（颜色、间距、运动、组件处理互相咬合）；事后逐场景重样式是在把一个整体平衡的设计拆出线头，比一开始给规格费力得多。

## 四、Days 3-7：五条工作流操作指南全录

### 4.1 Day 3 — PR-to-Video：把 PR 讲成视频

（源：[Turn a pull request into a video](https://hyperframes.heygen.com/guides/pr-to-video)）

**请求模板（原文）**：

```text
Using /hyperframes, explain https://github.com/owner/repo/pull/123 to product
and engineering teammates.
```

代理读真实的 PR（diff、commits、files、contributors），**没有网站捕获**；提出讲解角度，并在呈现前确认发布状态（不把提议中的变更当成已上线的行为）。

**同一 PR 对三种受众是三个故事**：

| 受众 | 讲什么 |
| --- | --- |
| Users | 以可见变化开场，展示 before/after，点明他们需要做的动作 |
| Contributors | 讲架构变化、关键取舍、reviewer 需要理解的代码路径 |
| Social audience | 一个清晰的 feature reveal，可见的证据，只留解释它的实现细节 |

**构建前确认五件事**：目标 PR 与受众；角度是 changelog、feature reveal、fix 还是 refactor；变更是 proposed、merged 还是 released；可见的前后对比；有无 breaking change 或迁移步骤。

**成片核验六条（Verify the proof）**：PR 与目标分支正确；proposed/merged/released 没混淆；用户可见的断言与实际行为一致；代码摘录只显示相关行且保持可读；**测试和重构不被当成产品特性来讲**；贡献者名字与发布细节准确。

总原则：**视频应该解释变更，而不是把 PR 描述朗读一遍。**

### 4.2 Day 4 — Music-to-Video：音轨定一切

（源：[Create a music-driven video](https://hyperframes.heygen.com/guides/music-to-video)）

**请求模板（原文）**：

```text
Using /hyperframes, turn assets/song.wav and the photos in assets/tour into a
30-second music-driven video.
```

代理**先分析真实音轨再计划剪辑**。必须的段落、歌词、图片顺序、交付格式等不能自由决定的要显式说明。不加旁白——**音轨就是骨架**。

**三种驱动方式**：

| 你要 | 代理做 |
| --- | --- |
| 用你的照片/视频 | 把既有素材剪到音轨的乐句、能量、节拍与结尾上 |
| 歌词视频 | 先核对歌词，再逐行同步、围绕人声设计 |
| 发明视觉 | 没有素材时用排版、图形元素与运动构建视觉弧 |

**音轨定结构（官方机制描述）**：HyperFrames 先映射音轨的 **phrases（乐句）、energy（能量）、onsets（起音）、silences（静默）、rolls（滚奏）、drops（下落）、hard stops（硬停）**，再规划视觉。节奏强的曲子可以按真实 beat grid 切；**平静或松散的音乐应按乐句与能量流动，不强迫每个测得的拍子都切一刀**。视觉处理在**有音乐意义的时刻**变化——拍子多不自动等于场景多。

**节奏核验五条**：用了音轨的正确段落；必需媒体出现、歌词与人声一致；最强的视觉变化落在有意义的音乐变化上；重要图片与文字停留足够久让人看懂；结尾落在音乐收束上或刻意成环。（直接调时间可用 [Studio timeline](https://hyperframes.heygen.com/studio/timeline) 对着节拍标记精修切口、保持与结尾。）

### 4.3 Day 5 — Faceless explainer：无素材的讲解视频

（源：[Create a faceless explainer](https://hyperframes.heygen.com/guides/faceless-explainer)）

**请求模板（原文）**：

```text
Using /hyperframes, turn these notes into a short visual explainer for a
general audience: [paste notes]
```

只有一个主题就够起步；**脚本只有在其文字已被批准时才有用**。代理提出教学角度，并询问哪些信息必须保持原样。

**想法应该怎么落地（四种落点）**：

| 落点 | 做法 |
| --- | --- |
| Understand one idea | 用一个有用的问题开场，机制一层层揭示 |
| Follow a process | 一个视觉舞台，按观众需要的顺序逐步展示 |
| Remember three points | 三个观点并行、具体、视觉上可区分到事后能回想 |
| Learn through a story | 一个案例从铺垫与张力推进到一般性教训 |

如果提供了已批准的脚本，要说明**允许重排还是逐字保留**。

**从信息到理解（官方的结构哲学）**：HyperFrames **不是把每段变成一幕**——它找 teaching spine（教学主线）、删除枝节、围绕「观众该带走的那个观点」构建序列。视觉共享一套连贯语言并随讲解发展：**图解该揭示机制；图表该证明主张；运动该显示什么在变**。

**教学核验五条**：开场制造了问题、张力或惊喜；主观点在第二幕前就清楚；每个主体场景推进一个机制/步骤/例子/含义；数字与事实断言与来源一致；结尾落到你想让观众记住的那句话。

**路由边界**：真实界面要当证据 → product-launch-video；既有素材要保留在底下 → captions-and-recuts。

### 4.4 Day 6 — Captions 与 Talking-head recut

（源：[Add captions or repackage talking-head footage](https://hyperframes.heygen.com/guides/captions-and-recuts)）

**请求模板（原文）**：

```text
Using /hyperframes, add clear animated captions to assets/interview.mp4.
Keep the footage and its spoken edit unchanged.
```

需要标题、引言、统计、lower third、画中画时，改为要「designed information cards」。

**三路分工（本页核心）**：

| 要什么 | 走哪条 | 说明 |
| --- | --- | --- |
| 屏上文字 | `/embedded-captions` | 可读、按时间出现的字：普通字幕，或置于人物身后的电影感字幕 |
| 屏上设计卡片 | `/talking-head-recut` | 标题、pull-quote、数据 callout、lower third、画中画，按 transcript 同步 |
| 改素材本身 | 都不是 → `/general-video` | 去停顿、换选段、改语序时用 |

前两条都**不触碰素材与其音频**：第一条加字，第二条加图形，素材在底下原样播放。两者都最适合**清晰单主体、语音可听**的片段。

**构建前确认**：captions——目标格式、转写可能拼错的名字与术语（代理看完片段可推荐视觉处理）；overlays——格式、版式、视觉风格、标题/引言/统计/侧栏的出现频率；两路都要确认说话人、已有文字与重要动作给图形**留出安全空间**。

**核验五条**：名字、产品术语、数字正确；字幕跟随口語（逐字）；图形避开面部与重要画面；有声、静音两种情况都可看；最后的字幕/图形在视频结束前清空。直接改位置用 [Studio captions](https://hyperframes.heygen.com/studio/captions)（保存位置/缩放/旋转修正），改词与持久的时间/样式改动找代理或编辑字幕源。

### 4.5 Day 7 — Motion graphics：十秒级动效

（源：[Create a motion graphic](https://hyperframes.heygen.com/guides/motion-graphics)）

**请求模板（原文）**：

```text
Using /hyperframes, make a six-second motion graphic that counts from zero to
10,000 and lands on "Thank you." No narration.
```

代理提出视觉处理；当成品视频与透明 overlay 二者皆可时确认输出。精确的节拍时间可选，除非某个时刻必须精确落地。

**六种动画对象**：

| 对象 | 要点 |
| --- | --- |
| Words | 动态字体：运动与强调本身传达信息 |
| One number | 数字 count 或揭示，落到结果并**停够久让人记住** |
| Data | 图表或对比动画，让序列自己得出结论 |
| Logo | 短 sting：有意的进场、完成、干净的保持 |
| Overlay | lower third 或 callout：进、停、**在素材上完全清空** |
| Page, post, or map | 捕获真实来源，把一个细节动画成视觉回报 |

**输出选择**：MP4 做独立成品；**WebM 或 MOV 带透明通道**做叠在素材上的 logo sting、lower third、callout——overlay 要说明位置与保持时长，首帧末帧必须干净。

**运动核验五条**：文字、数据、来源、logo 精确；播放期间完整信息可读；主要运动帮助传达含义；起止状态都是刻意的；透明导出在**真实素材上**检查过。需要旁白、多场景或更长故事 → general-video。

## 五、Day 8：媒体与音频管线

（源：[Media and audio](https://hyperframes.heygen.com/prompting/media-and-audio)）

官方 [Media and audio](https://hyperframes.heygen.com/prompting/media-and-audio) 页的全部要点。框架拥有媒体**播放**，一个兄弟媒体管线解析其余一切（语音、音乐、音效、图片、图标、logo、字幕、抠像）——你描述 composition 需要什么，代理把每个需求解析成**冻结的本地文件**。官方警告：**精准措辞就是全部手艺**；「add some music」和「no sound」是最常咬人的两个，因为管线按字面执行。

### 5.1 语音（TTS）

引擎按固定顺序选择：**HeyGen Starfish（配置了 HeyGen 账号时优先）→ ElevenLabs（设了 key）→ 本地 Kokoro（无需任何 key）**。可以描述内容让代理选声，也可以点名：

> Generate narration for this script with a professional female voice.
> Add TTS voiceover, British male voice, at 1.1× speed.

Kokoro 声音与内容配对示例：`af_heart`/`af_nova` 适合产品演示，`am_adam`/`bf_emma` 适合教程，`af_sky`/`am_michael` 适合营销。

- ❌ `add a voice`
- ✅ `warm, unhurried female narration of the quoted script`——**语气与节奏才是真正改变 delivery 的东西**

### 5.2 背景音乐（BGM）

按心情从大曲库解析，几乎永远该**坐在旁白之下**而不是竞争。给心情**加上响度目标**——管线可以 duck 和归一化到指定电平：

> Add subtle electronic BGM, kept under −18 dB so it stays beneath the voiceover.
> Upbeat tech-launch music bed at a low level, ducking under narration.

- ❌ `add background music`——得到一条全音量与旁白打架的轨道
- ✅ `subtle background music, ducked ~12 dB under the voice`——一条可执行的混音指令

### 5.3 音效（SFX）

从内置 19 文件库加曲库解析。**对准具体时刻**——转场、stamp-in、冲击——不要撒胡椒面：`Add a whoosh on each of the three scene transitions.` / `Put a soft click on the button press at 0:04.`

### 5.4 VO 节奏规则（Pace reveals to the narration）

视频有了声音之后，**声音就是时钟**：要求屏上元素落在它的 spoken cue 上——数据在旁白说到它的那一刻出现，不是构建者目测的某个独立时间。官方的完整表述值得抄：

> VO-paced reveals: each scene's elements land on their spoken cues; secondary elements keep resolving while the narrator is mid-thought; the scene is complete just as the narration moves on.

两个补充：旁白转写自带**词级时间戳**（与字幕同一套机制），所以「落在 spoken cue 上」是真实可执行的指令；**反向规则同样重要——旁白永远不等画面**，镜头与 reveal 向声音看齐，不是声音向动画看齐。

### 5.5 字幕与转写

字幕来自词级时间戳：生成语音即得时间；既有素材靠转写（装了 Parakeet 用 Parakeet，否则 whisper）。从源视频 scaffold 项目可直接从音频生成字幕。本页管**产生定时文本**；样式（语气、大小、逐词强调）归 captions catalog（篇三）。

### 5.6 抠像（透明挖剪）

`remove-background` 在本地把主体从视频或图片里抠出，返回可当 `<video>` 用的透明 WebM。**一个承重警告**：内置模型 `u2net_human_seg` **专为人物构建**——头肩或全身、构图基本稳定、背景与主体有对比。对**非人主体**（产品、动物、物品）返回基本为空的 mask。所以要抠产品就明说，代理会换工具而不是跑人物模型得到空结果。

### 5.7 视频套视频与画中画

叠素材是合成提示词（口播在场景上、主体在标题前、PiP 小窗）。说清想要的布局即可：`Put the transparent presenter cutout in the bottom-right, over the chart scene.` / `Layer the headline behind the presenter so their silhouette occludes the text.` 两条由工作流技能自动处理的机制（知道即可）：**要揭示进场的抠像放在非计时的 `<div>` 里、动画作用于 wrapper**（框架拥有 clip 可见性，直接动画媒体元素会对抗 clip 生命周期）；**底视频与抠像都 `data-start="0"` 挂载**，解码器在切口处保持同步——这正是「晚挂载的 PiP 可能差一帧」的原因。

### 5.8 任意素材直接用（编解码代理）

不需要预先转码。HEVC（H.265，iPhone/录屏常见）在浏览器里播放不干净——框架探测资产后**自动构建有界的 H.264 代理**，缓存在 `.transcode-cache/`；`preview`、`play`、Studio、发布播放页用代理播放，**渲染永远解码原始文件**（画质色彩零损失）。`lint` 以 info 级 `hevc_preview_codec` 提示代理在起作用；`--no-proxy` 单命令关闭，`hyperframes.json` 里 `media.autoProxy: false` 项目级关闭。同一机制覆盖 alpha 源：ProRes 4444 与 alpha WebM 得到 VP8+Opus 代理而不是被拒绝。

### 5.9 供给资产规则（The supplied-assets rule）

已有资产**一律给显式路径**：❌ `use my logo` ✅ `use assets/logo.svg`。即使搜索本来能找到也该给路径——品牌与实体资产应该指向**你的**文件，不是解析来的像的。第三方 logo 是另一回事：管线从官方 logo 级联拉取官方标记、**永不手绘重画**——「add the LinkedIn logo」可以直接说；「add my company's logo」必须给路径。

### 5.10「没声音」要说清楚

最常见的音频错误是负向表达的意思比你想的少：**`no narration` 只去掉旁白，不禁掉音乐与音效**。要真正的安静说 `no audio at all`。引擎按字面执行，缺口要显式关闭。

## 六、Day 8 延伸：鉴权与提供方

（源：[Authentication & API keys](https://hyperframes.heygen.com/guides/authentication)）

官方 [Authentication](https://hyperframes.heygen.com/guides/authentication) 页全部要点：

**什么时候需要账号**：本地创建与渲染**不需要账号**；要 HeyGen 语音与音乐、托管云渲染、hosted MCP、或发布项目的归属权（可后续更新）时登录。

**登录命令**：

```bash
npx hyperframes auth login            # OAuth：开浏览器授权，回环端口捕获 token
npx hyperframes auth login --api-key  # CI/无头机器：长时 API key（隐藏输入或 stdin）
npx hyperframes auth status           # 查看凭据来源与身份；--json 输出
                                     # { configured, recommended_action, offline_engines }
```

凭据存 `~/.heygen/credentials`（权限 0600），**没有 per-repo `.env` 要管**。独立的 `heygen` CLI（单独安装，没有 `npx heygen`）只支持 API key，两边读写同一凭据文件，一边登录两边生效。

**凭据解析顺序**：`HEYGEN_API_KEY` 环境变量 → `HYPERFRAMES_API_KEY`（别名）→ `~/.heygen/credentials`。`HEYGEN_CONFIG_DIR` 换配置目录，`HEYGEN_API_URL` 换后端。

**提供方选择表（首个可用者胜出）**：

| 能力 | 提供方顺序 | 离线依赖 |
| --- | --- | --- |
| 语音 TTS | HeyGen → ElevenLabs → Kokoro | Kokoro: `pip install kokoro-onnx soundfile` |
| 音乐 BGM | HeyGen 曲库 → Lyria → MusicGen | MusicGen: `pip install transformers torch soundfile numpy` |
| 音效 | HeyGen 曲库 → 内置库 | 内置，零依赖 |
| 捕获描述（可选） | OpenRouter → Gemini | 网站捕获的可选项，无 key 就跳过 |

**完全离线**：Kokoro-82M（54 个声音）+ Whisper 做词级字幕对齐；MusicGen（`facebook/musicgen-small`）生成音乐；内置音效库。首次使用可能下载模型文件。`npx hyperframes doctor` 检查本地依赖装没装；`npx hyperframes tts` 本身就是本地 Kokoro CLI（托管声音由媒体工作流助手选择）。

**登出也能发布**：`npx hyperframes publish` 登出状态可用——上传项目并打印带 claim token 的 URL，到 web 应用认证即认领。想 CLI 立即拥有项目、用 `--update` 更新同一 URL、或 `--space` 发到共享空间，先登录。

## 七、Day 9：设计稿进项目

（源：[Figma integration](https://hyperframes.heygen.com/guides/figma)、[Bring a design into a project](https://hyperframes.heygen.com/guides/design-tools)）

### 7.1 总规则：图片留图片，会动的重建为 HTML

官方 [Design tools](https://hyperframes.heygen.com/guides/design-tools) 页的开门见山：**Pictures stay pictures. Anything that has to move or change gets rebuilt as real HTML — the editable code the video is made of.**

| 保持为图片 | 重建为 HTML |
| --- | --- |
| logo、图标、插画、带纹理的艺术品 | 插画的一部分要分别动 |
| 截图（静帧足以证明时） | 屏幕要展示真实交互、或要改裁剪到别的尺寸 |
| 精确像素比可编辑更重要的 Figma 组件 | 文字、颜色、版式、开关状态要变 |
| storyboard 参考帧（定观感用） | storyboard 帧的意义在于**帧之间的运动**——建那段运动，不要在完成帧之间切换 |

品牌色与字体：导入一次，处处使用。**别因为设计工具产出了一摞截图就去动画截图——截图是证据，HTML 才是变化本身。**

### 7.2 Figma 六种导入能力

| 能力 | 得到什么 | 入口 |
| --- | --- | --- |
| 静态资产 | frame/layer 渲染成 SVG/PNG/JPG/PDF，冻结在 `.media/` | `hyperframes figma asset` |
| 品牌 token | Figma 变量/样式变成 composition 品牌变量 | `hyperframes figma tokens` 或 `/figma` 技能（经 connector） |
| 组件 | frame 变成颜色连到品牌的可编辑 HTML | `hyperframes figma component` |
| 运动 | Figma Motion 时间线翻译成可编辑的暂停 GSAP 时间线 | `/figma` 技能（agent、MCP） |
| Shader | shader 填充/效果冻结成静帧或 clip | `/figma` 技能 |
| Storyboard | 场景帧重构为运动——帧读作状态不读作幻灯片 | `/figma` 技能（REST 资产即可） |

资产、token、组件走 Figma **REST API** 可无头运行；运动与 shader 数据需兼容的 **Figma connector**（没有就用原生导出）；storyboard 重构只需普通帧导出加代理分析。

### 7.3 一次性设置

**Step A — Figma token**：Figma 设置 → 安全 → 个人访问令牌生成。普通账号勾三个只读 scope：**File content、File metadata、Library content**（最后一个最容易漏，没有它 `tokens` 在尝试 published-styles 回退时立刻 403）；**Enterprise 计划**额外勾 Variables 只读以直接拉品牌色（非 Enterprise 不用勾，`tokens` 自动回退 published styles）。然后 `export FIGMA_TOKEN="figd_…"`。集成**只读不写** Figma。

**Step B — Figma connector**：无 token、无 scope 选择，代理请求时一键 OAuth 连一次长期有效。这也是非 Enterprise 计划读品牌变量的捷径（token 路径的那个拉法需要 Enterprise）。connector 的可用性与配额受 Figma 当前计划约束，代理应批量请求并缓存结果。

### 7.4 命令细节

**资产**：`hyperframes figma asset 'https://…?node-id=1-2'`——节点经 REST 渲染，冻结到 `.media/images/`，打印可直接粘贴的 `<img>` 片段（带 `data-figma-id`）。`--format svg|png|jpg|pdf`（默认 **svg**，logo 与矢量首选：可缩放可动画）；`--format png --scale 2` 拿栅格保真。接受完整 URL（右键图层 Copy link）或 `fileKey:nodeId` 简写；**幂等**——manifest 记录 `fileKey:nodeId:format:scale:version`，设计没变重跑就复用文件。

**token**：`hyperframes figma tokens KEY`——读变量（或 published 样式元数据），写 `figma-tokens.json` 边车加绑定索引，并打印 composition `data-composition-variables` 的条目。**先 tokens 后 components**：导入组件的颜色才能链接到你的品牌变量而不是烧进重复字面量。

**组件**：`hyperframes figma component '…?node-id=10-20'`——节点树变成**精确 Figma 几何**的可编辑 HTML，打包在 `compositions/components/<name>/`；无法映射成干净 HTML 的矢量与布尔运算节点自动栅格化。绑定到 Figma 变量的颜色按导入的 token 解析：已导入 → 输出 `var(--brand-slug, #0066FF)`，后续品牌刷新传播进组件；未导入 → 用字面量并标记 `data-figma-unresolved`（命令会告诉你，对源文件跑 `tokens` 再重导即可）。**匹配只按精确 Figma ID、绝不按 hex 值**——碰巧同色不会产生假品牌链接。

**运动与 shader**：Figma Motion 时间线（关键帧、缓动、重复）**结构化翻译**成注册在 `window.__timelines` 的暂停有限 GSAP 时间线——可逐帧 seek、之后可编辑；无法忠实翻译的轨道**回退为烘焙视频 clip**（代理会说明走了哪条路、为什么）。shader 的导出路径不执行 shader，默认走原生导出（PNG 或 Motion MP4）作资产导入。

**storyboard**：一节场景帧被**解码而不是放映**——重复元素成为连续性线索，帧间差异成为运动或交互。

**溯源与刷新**：每次导入把来源（fileKey、nodeId、version）记进 `.media/manifest.jsonl`；渲染产物里**没有任何东西指向 Figma**——资产是文件、token 是变量、运动是时间线。Figma 文件变了，重跑同一批导入命令只重拉变化的部分。

**排障速查**：`NO_TOKEN`（没设变量）；`BAD_TOKEN`（失效/过期/撤销——Figma 对坏 PAT 返回 **403 而非 401**）；`FORBIDDEN 403`（缺某个只读 scope 或无文件权限——报错会点名所需 scope）；`REQUIRES_ENTERPRISE 403`（Variables API 要 Enterprise——不算失败，自动回退 published styles）；`RATE_LIMITED 429`（客户端自动退避重试，仍报错就等一分钟或减少批量）；批量渲染超时（一次 `/v1/images` 塞太多大帧——**约 4 个 id 一批**）；`ref has no node id`（链接指向文件而非节点，右键图层复制带 `?node-id=` 的链接）。

### 7.5 从 Figma / Claude Design / Open Design 起步的提示词

Figma（官方示例）：

```text
Use this Figma section as the source for a 20-second product intro:
https://www.figma.com/design/FILE/Project?node-id=10-20
Keep the brand type and colors. Rebuild the states that must move. Treat the
frames as key moments, not slides.
```

Claude Design / Open Design 的**四步交接**：① 给设计工具 [HyperFrames 指令文件](https://github.com/heygen-com/hyperframes/blob/main/docs/guides/design-tools-hyperframes.md)和你的品牌材料；② **要 working project，不要 loose mockups**；③ 存盘后用编码代理打开那个文件夹；④ 让代理检查 timing、motion、media、captions、rendering。**交接合格标准**：方向清晰；真资产或诚实标注的占位；可能变化的部分有可编辑源；本地媒体与字体；项目能打开。自查跑 `npx hyperframes check` + `npx hyperframes preview`，然后到 Studio 里**看它动**——静帧看不出时序。

## 八、解剖一条工作流：faceless-explainer 的七步执行链

（源：本机安装的 `/faceless-explainer` 技能原文，权威版本见 [hyperframes 仓库 skills 目录](https://github.com/heygen-com/hyperframes/tree/main/skills)；指南页见 [Create a faceless explainer](https://hyperframes.heygen.com/guides/faceless-explainer)）

Day 5 工作流内部的样子（本机安装的技能原文），展示「官方 SOP」如何用门禁组织流水线：

| 步骤 | 做什么 | Gate（门禁） |
| --- | --- | --- |
| Step 0 Setup | `init` 建项目（`--example=blank --skill=faceless-explainer`）；写 `BRIEF.md`；`auth status` 展示登录态 | `hyperframes.json` 与 `BRIEF.md` 存在；登录态已展示 |
| Step 1 Brief | 原文存 `capture/extracted/visible-text.txt`，元数据入 `tokens.json`；**无 capture 步骤** | 能一句话说清主题与受众 |
| Step 2 设计系统 | 选一个 frame-preset，脚本确定性生成 `frame.md` + 字幕皮肤（品牌 token 按角色重混） | 脚本退出码 0 |
| Step 3 分镜与脚本 | 叙事设计产出 `STORYBOARD.md`/`SCRIPT.md`；**序列来自叙事而非原文段落顺序**（重排、合并、删减）；板上把计划作为提案给人审 | 每帧字段齐全 + 用户批准 |
| Step 3.1 音频 | 后台跑 TTS、词级时间戳、BGM 检索（心情来自 storyboard 的 `music:` 字段） | 音频已启动或标记全静音（`music: none` 且无 `SCRIPT.md`） |
| Step 4 视觉设计 | 逐帧写时间码化镜头序列，reveal 对齐旁白——**帧在时长内持续发展，不许先堆完再冻结** | 每帧有 focal/roles 与镜头序列 |
| Step 5 逐帧构建 | 每帧打包成有界数据包（storyboard 块 + 蓝图 + 规则配方内联），**一帧派一个 sub-agent 并行**写 `compositions/frames/NN-*.html`；时长同步、字幕后台建、组装 `index.html` | 全帧 animated + index 存在 |
| Step 6 终审渲染 | 转场注入并校验 → `lint` → `check` → `snapshot` 拼接触点图 → 人审 → 高质量渲染 | MP4 存在且非空 |

三个值得记住的细节：**逐帧 sub-agent 并行**（每个 worker 只读自己的包和 `frame.md`、只写自己的帧——上下文隔离防串扰）；**全片静音是显式协议**（`music: none` + 无 `SCRIPT.md`，把「没有」变成可校验状态）；**已知假阳性写进 SOP**（`check` 对字幕高亮词报告的 1-4px `text_box_overflow` 是设计使然的 snug line-height，文档明说不要去修）。

## 九、本篇小结

第一阶段九天 = 三层架构：**入口层**（BRIEF.md 收敛意图、路由表分派）、**供给层**（FRAME.md 品牌事实源、resolve 冻结素材、HeyGen 账号供音频）、**执行层**（带门禁的步骤链 + 逐帧并行 + lint/check/snapshot 校验）。「能做出来」到此成立；怎么精确指挥，见[篇三](/posts/hyperframes-thirty-days-phase-2/)。
