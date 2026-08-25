---
title: 【学习笔记】HyperFrames 30 天拆解（三）Direct and refine：指挥代理的提示词方法论
published: 2026-08-25
description: HyperFrames「30 天」系列第三篇，全内容拆解 Days 10-19「Direct and refine」阶段：六段式提示词骨架逐段规则与组装示例（route/spec/beats/copy/technique/negatives）、节拍内容五槽公式（element/motion/layout/style/timing）、六组常见改写（冻结保持改环境闲置、时长无尾巴、同时性碰撞、模糊负例、散文冒充文案、格式盲数字）、框架自有词汇表；规格旋钮三档与两个方向钉；词汇表全部十节映射（缓动、镜头、景深、节奏、字幕语气、转场能量、音频响应、手绘标注、TTS 声音、渲染质量）；参考复刻四步法（转写动作 75%、绝对目标迭代、提炼常量 80-90%、纯文本天花板 90%）；字幕目录（语气到组件映射、逐词强调、五种失败模式）； Studio 工作区与安全编辑、关键帧编辑全操作（K/H/U/R 快捷键、自动关键帧、缓动与路径、手势录制、生成动画的 Unroll）；媒体使用角色论与机会扫描；storyboard 评审协议四形状与方向块；MCP 聊天创作全流程；本地抠像命令与双层板技法。读完本篇无需再翻官方文档。
lang: zh
tags: [学习笔记]
abbrlink: hyperframes-thirty-days-phase-2
---

> **系列导航**：[（一）总览](/posts/hyperframes-thirty-days-notes/) → [（二）Start and create](/posts/hyperframes-thirty-days-phase-1/) → **（三）Direct and refine（本篇）** → [（四）Extend and ship](/posts/hyperframes-thirty-days-phase-3/) → [（五）创作路径](/posts/hyperframes-thirty-days-creation-paths/) → [（六）Prompt Guide](/posts/hyperframes-thirty-days-prompt-guide/) → [（七）Catalog](/posts/hyperframes-thirty-days-catalog/)
> **调研日期**：2026-08-25
> **本篇对象**：Days 10-19 + 官方 [Anatomy](https://hyperframes.heygen.com/prompting/anatomy) / [Specification dial](https://hyperframes.heygen.com/prompting/specification-dial) / [Vocabulary](https://hyperframes.heygen.com/prompting/vocabulary) / [Recreating references](https://hyperframes.heygen.com/prompting/recreating-references) / [Captions catalog](https://hyperframes.heygen.com/prompting/captions-catalog) / [Studio](https://hyperframes.heygen.com/studio/index) / [Studio animation](https://hyperframes.heygen.com/studio/animation) / [Media](https://hyperframes.heygen.com/guides/media) / [Storyboards](https://hyperframes.heygen.com/prompting/storyboards) / [MCP](https://hyperframes.heygen.com/guides/mcp) / [Remove background](https://hyperframes.heygen.com/guides/remove-background) 全文
> **说明**：官方页面的事实、表格、示例、反例全部收录于此，目标是读完本篇不再需要翻网站

## 一、第二阶段的本质：steering

官方对这十天的定义：**how you ask（怎么问）、what you inspect（怎么查）、what you fix（怎么改）**。代理第一次交付几乎必然偏离意图，这个阶段把「纠正」从玄学做成体系：提示词骨架与词汇表管「问得对」，Studio 与检查命令管「查得准」，分层的修改面管「改得省」。

## 二、Day 10 之一：六段式提示词骨架（Anatomy）

（源：[Anatomy of a one-shot prompt](https://hyperframes.heygen.com/prompting/anatomy)）

Level 1 的提示词能用，是因为工作流替你填了空缺（色板、节奏、结构）。Level 2 的骨架是**把控制权拿回自己手里**——六段各消灭一类代理首试最常做错的决策：

```text
[route] /motion-graphics
[spec] 8-second 1920x1080 video.
[beats] Beat 1 (0-4s): ... Beat 2 (4-5s): ... Beat 3 (5-8s): ...
[copy] the exact on-screen text, quoted
[technique] Adapt the `code-typing` and `vfx-shatter` registry blocks.
[negatives] No narration, no image or media files.
```

| 段 | 规则（官方原文语义） |
| --- | --- |
| **Route** | 用斜杠命令——加载正确的工作流与框架规则 |
| **Spec** | 时长与分辨率放在最前面。默认 1920x1080、30fps |
| **Beats** | 节拍带时间戳；包含节奏指令（「然后保持在闪烁光标上」）——**不明确说，代理会跳过呼吸空间** |
| **Copy** | 屏上文字**加引号逐字引用**，`/` 表示换行。不加引号的文字会被改写 |
| **Technique** | 按 catalog 里的原样点名 registry blocks——它们是**被改编的起点而非即插即用**（blocks 附带演示内容，代理会按你的 beat 重写；点名钉住的是「技法」）。默认选择可能失败的地方都该钉（见规格旋钮） |
| **Negatives** | 关闭缺口：「no narration」不等于「silent」——要真无声说「no audio」；避免「no external assets」这类歧义（CDN 加载的运行时是正常基础设施；想表达没有图片/媒体文件就直说） |

组装后的完整示例（官方演示，渲染结果贴在页面上）：

> `/motion-graphics` Make an 8-second 1920x1080 video. Beat 1 (0-4s): dark macOS terminal types "npx skills add heygen-com/hyperframes" character by character, then hold on the blinking cursor. Beat 2 (4-5s): the terminal shatters into fragments. Beat 3 (5-8s): bold white kinetic text on black slams in word by word, snappy: "YOU JUST MADE THIS / WITH HYPERFRAMES." Adapt the `code-typing` and `vfx-shatter` registry blocks; hand-author the kinetic text. No narration, no image or media files.

骨架不只是提示风格：框架对自身也执行同一思想——`hyperframes feedback` 报视觉缺陷时要求附 `COMPOSITION_STRUCTURE:` 块（元素普查 + 属性存在性 + 时间线形状，从组合自己的 HTML 自动填充），CLI 缺失时软警告不阻塞。**显式说出形状，人和框架都推理得更快。**

### 2.1 节拍公式：每个 beat 内部的五个槽

骨架结构化「请求」；每个 beat 内部用**同样的五个槽**描述内容：

```text
[element] 屏上是什么   a giant number · the tweet card · "SHOWREEL"
[motion]  它做什么     counts up with an odometer roll · slides up · fades in per letter
[layout]  它在哪       top-center · filling the lower half · bottom-right
[style]   它长什么样   dark navy, green accent · 8-bit pixel · thin geometric sans
[timing]  何时（beat 内）at 1s · over 3s, easing out as it lands · staggered 0.1s apart
```

每个元素一句话、槽序任意：*"a giant number **(element)** counts up to $4.2M with an odometer roll **(motion)**, easing out as it lands **(timing)**, centered **(layout)** in green on dark navy **(style)**."* 没描述的元素由代理设计——信任它的品味时没问题，不信任时就是漂移风险（用规格旋钮控制）。

**官方 Tip**：带时间戳的节拍提示（`Beat 2 (4-5s): ...`）是 HyperFrames 的母语。扩散视频模型是把时间分段外挂在单一 clip 上；这里**每个 beat 直接映射为组合里的定时 clip**，逐 beat 描述无损翻译。**放手用时间戳。**

### 2.2 六组常见改写（每条都源于引擎的真实行为）

1. **冻结的保持（Freezing the hold）**——组合会保持最终状态，字面的「hold」渲染成冻结帧，这是廉价感的第一来源。❌ `then everything holds motionless to the end` ✅ `then everything settles into a gentle ambient idle (breating scale, slow drift)`。
2. **没有尾巴的时长**——要求 12 秒、只描述了 5 秒内容，剩下 7 秒默认死保持（官方自检本页示例时就撞见：构建者只能自己编造剩余 7 秒）。要么把时长缩到内容，要么说明尾巴干什么：✅ `…then hold ~5s on the finished chart with the leader pulsing once and a slow ambient drift`。
3. **同时性碰撞**——两个动作都写「at 4s」就有几帧重叠，渲染器照字面执行。❌ `at 4s the counter fades out and READY stamps in` ✅ `the counter fades out fully by 4.2s; at 4.2s READY stamps in`。
4. **模糊负例**——❌ `no external assets`（CDN 运行时是正常基础设施）✅ `no image or media files`。
5. **散文冒充文案**——没引用的文字会被改写。❌ `show a tagline about shipping faster` ✅ `tagline: "Ship faster."`。
6. **格式盲数字**——里程计需要固定位数列。❌ `counts from $0 to $4.2M`（逼出尴尬的 `$0.0M` 起点）✅ `counts up to $4.2M`。

### 2.3 框架自有词汇（读组合时认得出）

你很少手写这些，但在提示词里点名它们合法且有时必要（「字幕放独立轨道」「保持一组合文件一时间线」），所有报错也用这套词：

| 文件里 | 含义 |
| --- | --- |
| `class="clip"` | 标记一个定时段。**框架拥有其可见性——永远不要动画 clip 自己的 opacity 或 display 来藏它** |
| `data-start` / `data-duration` / `data-track-index` | clip 何时开始、跑多久、在哪条轨道。同轨道 index 的两个 clip 时间上不得重叠 |
| `window.__timelines["<id>"]` | 每个 GSAP 组合在页面加载时**同步地**注册恰好一个暂停时间线在此；渲染器逐帧 seek 它——这就是为什么任何东西都不得依赖墙钟时间或未播种的随机数。其他适配器（Lottie、CSS 动画、WAAPI）通过各自的 seekable 运行时契约注册 |
| `<video muted>` + 独立 `<audio>` | 视频元素静音渲染，声音由兄弟 audio 元素承载，混音器才能独立 duck 与平衡 |

## 三、Day 10 之二：规格旋钮（Specification dial）

（源：[The specification dial](https://hyperframes.heygen.com/prompting/specification-dial)）

官方原话：**规格密度控制结果偏离你想象多远——不控制它能不能用。**心情级提示（"snappy"、"cinematic"）得到设计师式诠释：连贯，但代理选颜色、调度与细节；致密规格（hex、时间戳、缓动、钉死的技法）得到**你的**画面。

**三档设置：**

| 档 | 写什么 | 效果 |
| --- | --- | --- |
| **Mood words** | "a warm, minimal logo sting" | 最快写完；观感归代理 |
| **Style tokens** | 精确 hex、命名纹理（"halftone-dot"、"paper-cut matte"、"8-bit pixel"）、字体方向（"condensed caps"、"thin geometric sans, wide tracking"） | 便宜的精确度，**没有下行风险** |
| **Full visual spec** | 每个元素都有形状 + 颜色 + 位置 + 时间 | 复刻某个具体观感时用 |

**密度永远不亏**——更强的模型只是少用自己的品味；它对「较小的模型不会默认做对」的技法选择影响最大。**两个每次都值得钉的方向**：

- **3D**：任何真实深度、光照或镜头运动 → 说 **"Three.js via the adapter"**。CSS 透视变换在光照关键场景里读起来是平的，Three.js 是受支持的 seek-safe 运行时；
- **时序**：在文本里解决同时性。"The counter fades out and READY stamps in at 4s" 产生重叠；"fades out fully by 4.2s; at 4.2s READY stamps in" 不会。

## 四、Day 10 之三：词汇表（Vocabulary 全十节）

（源：[Vocabulary that changes output](https://hyperframes.heygen.com/prompting/vocabulary)）

自然语言形容词 → 框架设置的完整映射，官方称之为「便宜精确档的词表——说了不花钱、消除真歧义」。

**1. 运动与缓动**（描述运动该有的「感觉」，代理选对应 GSAP ease）：

| 说 | 代理用 | 感觉 |
| --- | --- | --- |
| smooth | `power2.out` | 自然减速 |
| snappy | `power4.out` | 快而果断 |
| bouncy | `back.out` | 过冲后落定 |
| springy | `elastic.out` | 振荡入位 |
| dramatic | `expo.out` | 快起步长滑翔 |
| dreamy | `sine.inOut` | 慢而对称 |

时长速记：fast（0.2s）= 能量，medium（0.4s）= 专业，slow（0.6s）= 奢侈，very slow（1-2s）= 电影感。

**2. 镜头语言**（组合没有物理镜头，但镜头词直接翻译成场景变换或 Three.js 真镜头）：

| 说 | 代理建 |
| --- | --- |
| slow push-in | 全场景 4-8% 缩放增长，柔和缓动 |
| pull back / widen | 缩放缩小，常与元素进场配对 |
| pan across | 场景层水平位移 |
| drone orbit | 连续镜头环绕（Three.js 场景） |
| crane down/up | 垂直镜头漂移加 look-at 偏移 |
| whip to | 快速模糊滑入下一构图 |
| parallax | 多层以不同速率位移制造深度 |

**3. 景深语言**：near-lens / foreground bokeh（大而重模糊的近景元素漂移）；depth planes（2-3 层不同速度）；out-of-focus background（模糊更慢的背层）；shallow depth of field（主体锐、其余全糊）。

**4. 节奏语言**：punchy cuts（每个想法 1.5-4s、硬切、进场重叠）；cinematic holds（更长节拍 + ambient idle）；beat-synced（切分与重音踩音乐节拍栅格）；breathing room（下一拍开始前的保持瞬间）；ambient idle（保持期间 1-2% 呼吸缩放 + 慢漂移）。

**5. 字幕语气**（描述字幕的「能量」，代理选匹配的字体、字号与动画）：

| 语气 | 字体 | 动画 | 字号 |
| --- | --- | --- | --- |
| Hype | 重字重 | Scale-pop | 72-96px |
| Corporate | 干净无衬线 | 淡入 + 滑移 | 56-72px |
| Tutorial | 等宽 | 打字机 | 48-64px |
| Storytelling | 衬线 | 慢淡入 | 44-56px |
| Social | 圆润俏皮 | 弹跳 | 56-80px |

用法示例："Hype-style captions with scale-pop"、"Karaoke-style word highlighting"；逐词样式也可用："Make brand names larger with accent color"、"Add bounce to emotional keywords"、"Highlight numbers differently"。

**6. 转场**（每个多场景组合都受益；按能量描述）：

| 能量 | CSS 选项 | Shader 选项 |
| --- | --- | --- |
| Calm | 模糊交叉溶解 | Cross-warp morph |
| Medium | 推挤滑移 | Whip pan |
| High | Zoom through | Glitch、ridged burn |

按情绪也行："Warm transitions for this wellness brand"、"Cold, clinical transitions for tech"、"Playful bouncy transitions"、"Dramatic zoom for the reveal"。

**7. 音频响应动画**（频段映射视觉属性，代理用这套默认）：低频 → `scale`（踩点脉冲）；高频 → `glow`（微光强度）；振幅 → `opacity`（呼吸）；中频 → `shape`（形变）。**幅度纪律：文字 3-6%，背景 10-30%。**

**8. 手绘标注**（对文字的手绘强调效果）：`highlight`（马克笔扫过，关键短语）；`circle`（手绘椭圆，单词）；`burst`（放射线，hype 时刻）；`scribble`（乱涂划掉）；`sketchout`（矩形描边，callout）。用法："Add a marker highlight sweep on 'revolutionary'"、"Circle this keyword with hand-drawn effect"。

**9. TTS 声音**（本地 Kokoro，无需 key）：产品演示 `af_heart`/`af_nova`，教程 `am_adam`/`bf_emma`，营销 `af_sky`/`am_michael`；或直接描述："Create voiceover with a professional female voice"、"Add TTS with British male voice at 1.1x speed"。

**10. 渲染质量**：draft（快速迭代）、standard（评审与反馈）、high（最终交付）。"Quick draft render"、"Render at high quality"、"Export as transparent WebM"。

## 五、Day 11：参考复刻（Recreating something you saw）

（源：[Recreating something you saw](https://hyperframes.heygen.com/prompting/recreating-references)）

「我没有提示词，只有一条想抄的视频」的标准解法。**纯文本大约能到达参考的 90%**（官方注明：百分比来自他们自己的复刻构建、逐帧评判的观察结果，当曲线形状看，不当保证看）。四步：

1. **转写动作，而不只是构图**。逐帧看参考，写下：精确时长；镜头路径；每个元素带时间戳的动作；进场如何重叠；哪些层是糊的；采样颜色。这样构建的提示词**一次到位约 75%**——结构和运动弧落地，渲染校准不落地。
2. **用绝对目标迭代**。渲染与参考逐帧对比，**一次只纠一个轴，冻结已匹配的部分**。每条修正写成绝对值而非相对推挤：❌ `make dots 2x finer` ✅ `dot radius = 25% of row spacing`。相对修正会钟摆——太大、太小、又太大。预期收敛需要几轮。
3. **把收敛值提炼回提示词**。迭代是搜索，搜到的常量可复用：携带它们的提示词在全新构建上**一次到位约 80-90% 的收敛质量**。离散事实（时间、数量、hex、比例、镜头弧）无损迁移；连续品质（辉度突出程度、构图感）仍差一两句校准说明。
4. **知道纯文本天花板**。词语无损承载离散可数之物，但**欠确定连续知觉品质**：bloom 衰减、材质感、光学混色。最后 10% 从文本关不上，只会振荡。要像素级精确，**保留组合文件**——渲染是确定性的，重渲那个文件必然复现结果。

## 六、Day 12：动态字幕（Captions catalog）

（源：[Caption styles](https://hyperframes.heygen.com/prompting/captions-catalog)）

**先分清两种字幕**：本页的 caption 组件是给**组合视频**（你自己构建的 HyperFrames composition）用的；给既有**口播 MP4** 加字幕走 `/embedded-captions` 工作流——它有自己围绕主体抠像与遮挡构建的字幕身份目录（字幕坐在说话人**身后**），组合片段做不到这一点。

Caption 组件是即插即用的片段，每组件一个视觉身份、逐词或逐行动画。描述字幕的**能量**让代理选字体字号动画；**点名组件锁定观感**：

| 语气 | 组件 |
| --- | --- |
| Hype / 高能社交 | caption-kinetic-slam、caption-highlight、caption-particle-burst、caption-emoji-pop |
| Clean / 商务 | caption-clip-wipe、caption-weight-shift |
| Elegant / 编辑感 | caption-editorial-emphasis、caption-gradient-fill、caption-weight-shift |
| Neon / 夜场 / 音乐 | caption-neon-glow、caption-neon-accent |
| Tech / 赛博 / 故障 | caption-glitch-rgb、caption-matrix-decode |
| Karaoke / 歌词 / 跟读 | caption-pill-karaoke、caption-highlight |
| Textured / 电影感展示字 | caption-texture、texture-mask-text |
| Depth / 3D 层叠 | caption-parallax-layers |

三个**文字效果组件**各干一件事：`caption-blend-difference`（文字压在杂乱/变动素材上自动逐像素反色保可读）；`morph-text`（一个位置循环一组短词表带粘滞变形，"fast / simple / yours"）；`texture-mask-text`（大展示字填充物理纹理：砖、岩、木、金属、熔岩）。

**四个旋钮**：语气（typography/size/animation 全联动）；逐词强调（"brand 名更大加品牌色"、"数字不同高亮"、"情绪词加弹跳"——caption-editorial-emphasis 驱动大小对比、caption-particle-burst 在关键词开火、neon 组件带关键词强调色）；纹理变量（caption-texture 附带 lava/marble/metal/wood/concrete/rock，点名要哪个）；画幅（全屏单词型 caption-kinetic-slam 与 TikTok 高亮型 caption-highlight 为竖屏/社交构图设计——说 "vertical" 或 "9:16" 让安全区匹配）。

**五种失败模式（官方反例）**：

1. **别给每个词堆重效果**——组件本来就逐词动画，再叠强调会互相打架变不可读。❌ `make every word explode with particles` ✅ `caption-particle-burst, firing only on the keywords`；
2. **别在一个段落混两种字幕风格**——一个组合（或一个段落）一个身份；两种竞争的风格读起来像事故；
3. **别对准口播素材用这些**——它们是组合片段不是抠像管线，丢到未处理 MP4 上字幕只会挡在说话人前面（想字幕在人物身后：要么走 `/embedded-captions`，要么像 capstone 那样先抠像、让文字层从主体剪影下穿过）；
4. **别把 hype 风格配冷静内容**——高能字幕配企业解说片打架，让语气表选身份；
5. **别发明字幕名**——只有 Captions 与 Text Effects 组里的组件存在。❌ `add typewriter-bounce captions` ✅ 描述语气（"tutorial, monospace, typewriter"）或点名真组件。

## 七、Day 13：Studio 预览（一）——工作台与安全编辑

（源：[Work on a project in Studio](https://hyperframes.heygen.com/studio/index)；终端三件套部分源自本机 `/hyperframes-cli` 技能）

Studio 是**同一个 HTML 项目**的可视化编辑器（代理和 CLI 操作的那个），任何项目直接打开，无需导入转换：`npx hyperframes preview`。

**工作区面板**：Storyboard（计划的序列、方向、配音、状态、评论——审故事用）；Preview（中间实时帧、下方时间线、左侧项目工具、右侧 Inspector）；Code / Comps / Assets / Catalog（项目源、组合、媒体、可复用视觉）；Design / Layers / Variables / Renders（控制选中对象）。**不需要学会每个面板**——按问题选面：

| 要改 | 从哪开始 |
| --- | --- |
| 当前帧里可见的东西 | Canvas，然后 Design 或 Layers |
| 何时出现、停留多久 | Timeline |
| 某个运动或转场 | 动画控制与关键帧 |
| 故事、多个场景、项目结构 | 你的代理 |

**做一次安全编辑**：停在有问题的画面处；点画布上的元素（多个重叠时去 Layers 选）；**只改你本来要改的那一个属性**。用画布移动/缩放/旋转/裁剪受支持元素，用 Design 改文字、布局、样式、媒体、运动、3D、颜色。**接受改动前播一遍周围的时刻——正确的静帧仍可能在运动中制造碰撞。**警告：**自动关键帧默认开启**——普通布局修正（应保持恒定）前先关掉；只有「当前播放头时刻的改动应该变成动画」时才留着开。

**时间线上改时间**：拖 clip 前后移动；拖边缘改时长；剃刀只在需要把一个受支持 clip 一分为二时用。每次时间改动后把播放头划过周围的剪辑检查。

**更大的改动交回代理**：Studio 适合「能指着的改动」；影响故事、多场景、源调研、不熟项目代码的请求找代理。用 Studio 的 **Ask agent / Copy to Agent**，再补上复制不走的上下文里的人类意图：`Make the opening feel faster, but keep the current narration and final scene.` 代理和 Studio 编辑同一源，**中间没有导出或转换**。

**收尾一个版本**：从头看一遍 → 跑 Lint 修报告的问题 → 交付前跑项目级浏览器门禁 `npx hyperframes check` → 通过 Studio、代理或 CLI 渲染 → **打开导出文件完整看一遍再分享**。

**终端侧的「查」三件套**（`hyperframes-cli`）：`check` 先跑 lint，再用一次浏览器会话 + 一次 seek 遍历审计运行时错误、失败请求、布局、`*.motion.json` 断言、WCAG 对比度（持续问题阻塞退出码，入场/出场瞬态仅提示，`--strict` 连警告一起拦）；`snapshot --at <t1>,<t2>` 按时间点截帧并自动拼接触点图；`compare` / `grade-compare` 改前后对比（调色专用后者）。两个预览面别混淆：storyboard 板（结构检查通过前、`storyboard: yes` 时开）审计划卡片；成片时间线预览（`preview --background`）在 check 通过后审组装结果——**板上批准的计划不等于成片批准**。

## 八、Day 14：Studio 预览（二）——关键帧编辑全操作

（源：[Edit animation and keyframes](https://hyperframes.heygen.com/studio/animation)）

动画是属性随时间变化；**关键帧在特定时刻记录一个重要值**，Studio 把可编辑关键帧画成时间线上的菱形。选中元素、放好播放头、加关键帧。

**先读现有运动**：选中动着的元素（画布、Layers 或时间线）→ 展开它的动画属性 → 播放头划过现有菱形 → 从运动开始前播到结束后。**先定位真问题**：启动太晚、耗时太长、路线不对、加速方式不对——它们需要不同的改法。

**加改关键帧**：播放头移到要定义的时刻 → 时间线工具栏的关键帧控件或按 **K**（上下文敏感：可加时加关键帧，否则仍是「停止播放」快捷键）。改既有运动：拖菱形改时间；改该关键帧的属性值；**Delete** 删选中关键帧；**H** 在 hold（不插值）与 bezier 行为间切换；**U** 展开收起选中元素的属性。

**自动关键帧要有意识地用**：开启时，播放头当前时刻的画布/Inspector 改动被录成动画。摆姿势法：第一个时刻设第一个值 → 第二个时刻设第二个值 → 播放 Studio 生成的过渡。**校正应全程恒定的布局值之前先关掉它。**

**先重定时，再重设计**：关键帧靠近 = 变化更快；拉远 = 观众更多时间跟随。在场景内评判——单独看顺滑的运动可能对旁白来说到得太晚或与下一动作重叠。

**缓动**：hold 用于不插值的突变；预设起步；预设接近但起止/过冲仍不对时用速度曲线。**别只看曲线选缓动**——进场、可读保持、退场连起来播。

**运动路径**：位置关键帧可在画布上露出路径。拖点改路线；该弯时调段；直接运动更清晰时保持直线；元素应朝向行进方向时才开 auto-rotate；按住 **Option/Alt 拖元素**移动整条路径。只为更容易控制预期路线时加点。

**录制手势**：动作比描述容易演时用。选中元素 → **Record gesture** 或按 **R** → 移动指针表演 → 再按 R 停止 → 播放并精修生成的关键帧。录制中拖拽捕获位置、滚轮捕获深度；内置快捷键面板列出旋转、3D 旋转、透明度、缩放的修饰键。**录的是起始表演不是自动抛光**——简化噪声路径、对着场景其余部分重定时。

**编辑代理/助手生成的动画**：Studio 能显示由循环、助手或运行时表达式生成的运动值，但不总能安全改写其源。**Unroll to edit** 把受支持的循环/助手生成运动改写为可编辑的显式 tween；**Computed value — edit it in the Code tab** 表示必须改源。意图比实现好说时，把元素上下文复制给代理描述要保留的结果：`Keep the same curved route, but make the movement finish with the voiceover instead of two beats later.`

**完成运动的评审**：运动应揭示、引导注意、展示变化或连接状态；重要文字要有足够静止时间可读；同一瞬间多个无关运动不应竞争；检查进出场景的过渡；**以目标帧率跑项目预览后再批准**。

## 九、Day 15：网页采样

（源：[30 Days](https://hyperframes.heygen.com/thirty-days) Day 15——官方未设独立文档页）

课程原话：把有用的 web 动效带进 composition，靠**捕获真实页面**（CLI 的 `capture` / `browser` 能力）。HTML 渲染路线的独有便宜：别家从视频里扒参考，这里拿到的是源码级保真的采样。官方文档对这一课没有独立专页，操作入口即 CLI 的捕获命令与 product-launch 工作流的站点捕获。

## 十、Day 16：媒体使用（guides/media + media-use）

（源：[Work with media](https://hyperframes.heygen.com/guides/media)；机会扫描协议源自本机 `/media-use` 技能）

**从角色出发，不从效果出发**——每类媒体只给一个主职：

| 媒体 | 主职 |
| --- | --- |
| 产品捕获 | 证明产品如何表现 |
| 素材 | 承载人、地点、动作或情绪 |
| 图片 | 把一个想法撑到够看懂 |
| 语音 | 承载讲解或故事 |
| 音乐 | 塑造节奏与基调 |
| 音效 | 强化有意义的动作 |

**更多层不自动等于更强的视频。两个资产干同一件事时，留更清楚的那个。**

**带进项目**：Studio 的 Assets → Import media（或拖文件入面板），放置前先预览；也可以让代理捕获网站、准备既有素材、生成衍生品或复制批准的文件进项目。**命名要清楚**（`pricing-page-scroll.mp4`、`customer-logo.svg`）——清晰命名让人和代理的后续修订都容易得多。**最终结果需要的一切都必须在项目里**，预览与渲染才用同一文件。

**只准备结果需要的**：未用素材拖慢评审时才裁剪；主体要坐进设计场景时才抠像；源之间明显打架或故事需要刻意观感时才调色；从真实语音生成字幕、先纠词与时间再谈样式；旁白保持在音乐之上清晰、效果只用于具体事件。**原始文件与准备产物要保持容易区分。**

**终检时间线五条**：每个视频 clip 的首末帧；目标输出尺寸下的裁剪与分辨率；字幕时间对齐口语；普通耳机与笔记本扬声器上的语音清晰度；缺失文件、临时 URL 与迟加载的媒体。

**media-use 技能的供给协议**（Day 8 已详拆 resolve 动词与冻结台账，这里补**机会扫描**）：构建或审查时做一次有依据的扫描，识别具体信号才提具体建议（有文字无配音→TTS；emoji 或 div 假图标→真图标；占位/过小图片→更好的图；硬切无声→转场音效；超 10s 无音乐床→BGM；曝光偏色→校正性调色）。四条防打扰规则：有信号才提、给具体方案带默认值（人只批全部/部分/不要）、每项目只问一次、**只提案不偷偷改**——一个「灰世界校正」能毁掉故意的夕阳。

## 十一、Day 17：Storyboard——先审计划，再审画面

（源：[Storyboards](https://hyperframes.heygen.com/prompting/storyboards)）

核心口诀：**prompt the plan, not the scenes**。让代理先产出 storyboard，人批准的是计划；此后对结构的修改落在文档上而不是渲染结果上。

**四个先想清的形状**：message（一条核心信息——每帧要么推进它要么删掉）；arc（情绪弧：开场如何、中段如何、收尾落在哪）；audience（谁在看、他们已经知道什么、什么让他们继续看）；mood（每场一个词，全局别超三种）。

**方向块（Video direction）四件事**：**双色纪律**——一个主色一个强调色，全局只用这两色（色板放 storyboard 顶部，帧里不再写色值）；**VO 节奏 reveal**——每帧元素落在它的口述提示上，次要元素在旁白思考中持续解析，场景恰在旁白推进时完成；**一处喘息帧**——中段安排一个静息帧（极慢 drift、两三拍），让眼睛休息、节奏有对比；**负例清单**——点名禁用：无弹跳/闪烁文字、无廉价 emoji 图标、无旋转渐变、全片无爆炸粒子、不做逐字打字机全句。负例要具体到效果名——代理见过全部效果，点名即排除。

**每帧的职责**：这帧的类型（钩子/论证/数据/转折/收尾）、说服谁、beat 是什么、focal（观众先看哪）与 roles（还有什么、各干什么）。**一个回收 motif**：一个贯穿全片重复出现的小元素（角落进度点、配色中的一条线、反复回归的形状），廉价地制造「这是一个完整作品」的感觉。

**工作示例（官方）**：静音 3 帧 storyboard——F1 钩子（衬线斜体引言 + 大水印 + 角落 motif 点）；F2 论证（中心结论，focal=结论，roles=边注 + motif 略过）；F3 收尾（语录下划线 + 极慢 drift 出；motif 最后一帧隐去，保持克制）。注意：静音片也要节奏设计（钩子 2-3 拍、论证 4-5 拍、收尾 2 拍）；即使静音也留呼吸；声明负例（不打字机、无粒子、全帧只用双色）。

## 十二、Day 18：Video Agent 与 MCP 聊天创作

（源：[Create through an AI chat](https://hyperframes.heygen.com/guides/mcp)、[Choose how to create](https://hyperframes.heygen.com/guides/choose-creation-path)）

**Hosted MCP connector**（beta）：让支持的 AI 聊天产品经你的 HeyGen 账号调用 HyperFrames 创作与渲染工具，**不装本地 CLI**。

**选托管还是本地**——托管适合：零本地安装、对话式创作流、云渲染；本地适合：完整项目文件、本地渲染、直接 Studio 与源码编辑、自定义自动化或部署、精确调试与校验。

**连接**：生产 MCP 地址 `https://mcp.heygen.com/mcp/hyperframes/`，需要 HeyGen 账号。以 Claude 为例：Customize → Connectors → Add custom connector 填地址 → 完成 HeyGen 登录 → 新聊天里 + 菜单 → Connectors → 启用 HyperFrames（ChatGPT、Grok 类似；各主机的连接器入口与计划/工作区权限由各自控制）。官方警告：**只连本页所示的生产服务器**；像对待任何外部连接器一样审阅权限，不要发送不该到达目的端的秘密或私密材料。

**创作与修订**：像对剪辑师一样描述视频——

```text
Make a 15-second vertical product intro for a meditation app.
Audience: people who have trouble falling asleep.
Style: quiet, spacious, and warm.
Show the breathing timer and end with "Rest starts here."
```

在同一对话里继续修订：`Reveal the product two seconds earlier. Keep the current colors. Make the captions smaller and slow down the final transition.`——点名可见问题与期望结果，**不要每次修订都重启完整 brief**。渲染：`Render this as an MP4 at 30 fps.`（MP4 常规分享格式；WebM 适合 web 交付与透明 overlay；MOV 适合进其他剪辑流程）。保留工具返回的组合/渲染标识符以便后续引用。

**四条当前限制**：渲染跑在 HeyGen 基础设施上（要本地渲染/自托管走本地路径）；确切工具列表与结果呈现取决于部署的服务器与聊天主机；托管产物**不给**本地项目文件夹、Studio 界面或同等调试访问；精确源码与像素级编辑属于本地项目与 Studio。排障：授权循环→确认地址、断开重连、确认主机计划/工作区允许连接器、确认弹窗未被拦截；动作卡住→保留最后的工具结果与标识符、会话过期就从新聊天重试、报告提示词与期望/实际结果/主机/标识符。

## 十三、Day 19：背景移除（本地抠像）

（源：[Remove a background](https://hyperframes.heygen.com/guides/remove-background)）

把人物素材或人像图变成可叠在场景上的透明媒体。**本地运行内置人物分割模型**——不上传源文件、不需要 API key（需 FFmpeg）：

```bash
npx hyperframes remove-background subject.mp4 -o subject.webm   # 首次运行下载模型，之后复用
```

**按用途选输出**：透明 `.webm`（web 或 HyperFrames 组合内叠层）；透明 `.mov`（ProRes 4444 往返 Premiere / Resolve / Final Cut）；透明 `.png`（单张人像）。

**使用挖剪**：导入项目、放在要覆盖的背景/文字/图形之上；**检查完整 clip，尤其头发、手、快速运动与首末帧**。要动画主体时**动画一个包裹层（wrapper）**，保持透明媒体与组合计时行为在一起。挖剪与原背景需要帧对齐时，**两个媒体元素给相同 `data-start` 与播放偏移**，用 wrapper 显隐而不是晚挂载其中一个源；然后**擦查切口并检查渲染帧**，不只看正常播放。

**双层板（text-behind-subject）**：一次产出前景挖剪 + 反 alpha 背景板：

```bash
npx hyperframes remove-background subject.mp4 -o subject.webm --background-output plate.webm
```

背景板保留原环境、留一个**人形的透明洞**（不是 inpaint 过的干净空背景）。洞下面放不透明图形或场景，`subject.webm` 放最上面——文字层即可从人物剪影下穿过。

**何时好用**：内置模型为**人物**设计——清晰的人类主体、稳定构图、与背景有合理对比时最好。四种情况换别的分割/遮罩工具：主体是产品、动物或其他物品；细发丝穿过杂乱背景；帧间边缘稳定性要达到高端 VFX 标准；移除人物后需要重建原背景。**抠像是预处理**：跑一次、透明结果留在项目里、重复使用。

**质量与速度**：`--device auto` 选最佳本地提供方（`--info` 查看检测到什么；CPU 也能跑但慢得多）；WebM 输出 `--quality balanced` 为默认，挖剪直接叠在**原素材**上且边缘颜色必须匹配时用 `best`，叠在无关背景上要小文件用 `fast`。**常见问题**：背景仍不透明→确认输出真是透明格式并在彩色背景上预览；边缘闪烁→更干净的源、减少快速运动、或更强的外部抠像；主体有色彩光晕→`--quality best`；「背景板上有个洞」→预期行为，它是反 alpha 不是干净板。

## 十四、本篇小结

十天指挥课收束为三层：**问得对**（六段骨架 + 节拍五槽 + 规格旋钮 + 十节词汇表，把审美分歧变成查表问题）；**查得准**（Studio 工作台、check/snapshot/compare 三件套、关键帧 lane 编辑）；**改得省**（结构改 storyboard、动作改关键帧、素材走角色论与机会扫描、像素走抠像与调色）。单条视频的闭环到此完整——量产与交付见[篇四](/posts/hyperframes-thirty-days-phase-3/)。
