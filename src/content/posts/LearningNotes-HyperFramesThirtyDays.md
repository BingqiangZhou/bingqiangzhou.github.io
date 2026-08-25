---
title: 【学习笔记】HyperFrames「30 天」系列课程全梳理：当视频变成可版本化的 HTML
published: 2026-08-25
description: 系统梳理 HeyGen HyperFrames 官方「30 Days of HyperFrames」课程：三阶段路线图（Days 1-9 输入与九大工作流、Days 10-19 提示词结构与精修手段、Days 20-30 组件/变量/云渲染的工程化交付），逐日拆解 30 课要点并各附一条可直接上手的事实与官方文档直链（一段话全自动安装、FRAME.md 品牌事实源、PR 三种受众、音轨七要素结构、解说四种落点、字幕三路分工、动效六种对象、TTS 引擎顺序、Figma 六种导入、六段式提示词骨架与节拍五槽、参考复刻 75/90 百分比、Studio 安全编辑与关键帧快捷键、媒体角色论、storyboard 双色纪律、MCP 连接、人物专用抠像、云渲染 asset_id 复用、变量七类型与批渲、调色十三预设与四示波器、媒体特效四族、四条渲染路线等），最后总结「视频即文本资产」的产品哲学、skills/Catalog/CLI 的生态飞轮，以及对照自己公众号封面 HTML 模板实践的后续动手清单。深拆见系列（二）至（七）篇。
lang: zh
tags: [学习笔记]
abbrlink: hyperframes-thirty-days-notes
---

> **系列导航**：**（一）总览（本篇）** → [（二）Start and create](/posts/hyperframes-thirty-days-phase-1/) → [（三）Direct and refine](/posts/hyperframes-thirty-days-phase-2/) → [（四）Extend and ship](/posts/hyperframes-thirty-days-phase-3/) → [（五）创作场所](/posts/hyperframes-thirty-days-creation-paths/) → [（六）Prompt Guide](/posts/hyperframes-thirty-days-prompt-guide/) → [（七）Catalog](/posts/hyperframes-thirty-days-catalog/)
> **调研日期**：2026-08-25
> **调研对象**：[30 Days of HyperFrames](https://hyperframes.heygen.com/thirty-days)（官方课程汇总页）+ [HyperFrames 文档站](https://hyperframes.heygen.com/)（Prompt Guide / Guides / Studio / Catalog / Developers 全目录）
> **调研动机**：HyperFrames 是 HeyGen 开源的「用 HTML 渲染视频」框架，主打让 AI 编码代理直接做视频。「30 天」是官方为它做的日更课程，一天一课、每课先做出成品再发布，相当于官方亲自把整套框架的能力面演了一遍——比零散啃文档更适合当学习主线
> **说明**：课程原帖发布在 X 上（前半段 @HeyGen、后半段 @HyperFrames_），汇总页每张卡片链回原帖（含当课 prompt 与讨论）。本篇是总览：30 课地图 + 每课一个可上手的具体事实（各课末尾附官方文档直链）；机制细节的全文收录在（二）至（七）篇——合起来读完无需再翻官网

## 一、先搞清楚：HyperFrames 是什么

HyperFrames 的核心主张是**用普通 Web 技术渲染视频**：一个视频 composition 就是一个 HTML 文件，不需要专门的时间轴编辑器，也不需要 React 组件树。它面向的「用户」主要是 AI 编码代理（Claude Code、ZCode 这类工具），人类负责提需求、审查结果。

几个关键机制：

- **DOM 即时间轴**：元素标上 `class="clip"`，用 `data-start` / `data-duration` / `data-track-index` 等 `data-*` 属性声明出现时机、时长与轨道；同轨道 clip 时间不得重叠；框架拥有 clip 的可见性（不许动画它的 opacity/display 来藏它）。
- **动画可寻址（seekable）**：每个组合在 `window.__timelines["<id>"]` 注册恰好一个**同步构建**的暂停 GSAP 时间线，渲染器逐帧 seek 它——所以任何东西都不得依赖墙钟时间、未播种随机或网络。GSAP 之外有 Lottie、Three.js、Anime.js、CSS、WAAPI 等适配器。
- **确定性渲染**：视频元素一律 `muted`、声音走兄弟 `<audio>`（混音器才能独立 duck）；同 worker 同 seek 必同帧。
- **知识以 skills 分发**：`npx skills add heygen-com/hyperframes` 装核心集，`/hyperframes` 入口路由读请求选工作流；配套 CLI 覆盖 init / lint / check / snapshot / compare / preview / render / cloud / lambda / cloudrun / publish 全流程。
- **免费开源，本地渲染不耗 HeyGen 额度**；代理与可选托管服务各计各费。

「30 天」系列是围绕这套体系的三阶段课程：**Days 1-9 学会开始与创建（输入），Days 10-19 学会指挥与精修（steering），Days 20-30 学会扩展与交付（流水线）**。

## 二、课程总览：一张三阶段能力地图

| 阶段 | 天数 | 主题关键词 | 学完能做什么 |
| --- | --- | --- | --- |
| Start and create | Day 1-9 | 输入：仓库、音轨、主题、说话人、设计稿 | 把五种典型输入各自跑成一条成片，摸清全部工作流 |
| Direct and refine | Day 10-19 | 指挥：怎么问、怎么查、怎么改 | 用提示词结构、Studio 预览、storyboard 精确控制代理 |
| Extend and ship | Day 20-30 | 流水线：复用积木、变量、调色、云渲染 | 从「一次做一条」走向模板化、批量、可部署的视频工程 |

## 三、第一阶段（Day 1-9）：Start and create——先让「素材到成片」跑通

九天对应九条输入路径，每天附一个可上手的事实（全文见[篇二](/posts/hyperframes-thirty-days-phase-1/)）：

- **Day 1 — Install HyperFrames**：给编码代理装 skills，一个 router 读请求选工作流。最短路径只需粘贴三行话（装 skills → `/hyperframes` 做 10 秒产品介绍 → 开预览）；分步装用 `npx skills add heygen-com/hyperframes` 选 Core Skills；装完第一版查四件事：故事、事实、可读文字、声音。（源：[Quickstart](https://hyperframes.heygen.com/quickstart)、[Skills](https://hyperframes.heygen.com/guides/skills)）
- **Day 2 — Give your brand a motion language**：把视觉识别转成可复用运动规范，一次写进 `FRAME.md`、此后每次构建都读。关键纪律：**品牌对色与字体是真理、对版式不是**——1px 边框活不过 H.264，web 正文字号在 1080p 帧上消失；与其要求「on-brand」，不如指向品牌事实源。（源：[Design systems](https://hyperframes.heygen.com/prompting/design-systems)）
- **Day 3 — PR-to-Video**：把 open PR 讲成短视频，内容从 diff、commits、files 构建。同一 PR 对三种受众是三个故事：Users 看可见变化与 before/after，Contributors 看架构与取舍，Social 只留一个 feature reveal；视频讲的是变更，不是朗读 PR 描述。（源：[PR-to-Video](https://hyperframes.heygen.com/guides/pr-to-video)）
- **Day 4 — Music-to-Video**：音轨定结构——先映射 **phrases、energy、onsets、silences、rolls、drops、hard stops** 再规划视觉；节奏强的按真实 beat grid 切，舒缓的按乐句流动，**拍多不等于场景多**。（源：[Music-to-Video](https://hyperframes.heygen.com/guides/music-to-video)）
- **Day 5 — Faceless explainer**：无实拍讲题视频，视觉逐场景发明。四种落点（懂一个想法 / 跟一个流程 / 记三个要点 / 听一个故事）；**不是逐段变场景**——找教学主线、删枝节、围绕一个要记住的观点构建。（源：[Faceless explainer](https://hyperframes.heygen.com/guides/faceless-explainer)）
- **Day 6 — Talking-head recut**：源片不动叠同步图形。三路分工：`/embedded-captions` 屏上文字、`/talking-head-recut` 设计化卡片、要改素材本身（去停顿、换语序）走 general-video。（源：[Captions and recuts](https://hyperframes.heygen.com/guides/captions-and-recuts)）
- **Day 7 — Motion graphics**：十秒内、运动即信息。六种对象（文字/一个数字/数据/logo/overlay/网页帖子地图）；overlay 用 **WebM 或 MOV 带透明**导出，首末帧必须干净。（源：[Motion graphics](https://hyperframes.heygen.com/guides/motion-graphics)）
- **Day 8 — Music and SFX with the HeyGen CLI**：命令行配声。TTS 引擎顺序 HeyGen Starfish → ElevenLabs → 本地 Kokoro（免 key）；BGM 给心情**加响度目标**（如 under −18 dB）；记住 **`no narration` 不等于静音**——要真无声说 `no audio`。（源：[Media and audio](https://hyperframes.heygen.com/prompting/media-and-audio)、[Authentication](https://hyperframes.heygen.com/guides/authentication)）
- **Day 9 — Figma to HyperFrames**：设计稿变活 HTML 而非扁平导出。六种导入能力（资产/token/组件/运动/shader/storyboard）；**先 tokens 后 components**（组件颜色才能连到品牌变量）；总规则「图片留图片，会动的重建为 HTML」。（源：[Figma integration](https://hyperframes.heygen.com/guides/figma)、[Design tools](https://hyperframes.heygen.com/guides/design-tools)）

## 四、第二阶段（Day 10-19）：Direct and refine——学会「指挥」

官方定义 steering：怎么问、怎么查、怎么改（全文见[篇三](/posts/hyperframes-thirty-days-phase-2/)）：

- **Day 10 — Anatomy of a prompt**：六段式骨架 route / spec / beats / copy / technique / negatives；beat 内部用**五槽公式**（element / motion / layout / style / timing）；「带时间戳的节拍是 HyperFrames 的母语」。（源：[Anatomy](https://hyperframes.heygen.com/prompting/anatomy)、[Specification dial](https://hyperframes.heygen.com/prompting/specification-dial)、[Vocabulary](https://hyperframes.heygen.com/prompting/vocabulary)）
- **Day 11 — Repurpose an existing video**：参考复刻三步——转写动作（一次到位约 75%）、绝对目标迭代、提炼常量回提示词（约 80-90%）；**纯文本天花板约 90%**，像素级精确保留组合文件。（源：[Recreating references](https://hyperframes.heygen.com/prompting/recreating-references)）
- **Day 12 — Dynamic captions**：字幕按语气点名组件（Hype/Corporate/Elegant/Neon/Tech/Karaoke/Textured/Depth 八类）；注意**组合字幕 ≠ 口播字幕**——后者走 `/embedded-captions`（能坐在人物身后）。（源：[Captions catalog](https://hyperframes.heygen.com/prompting/captions-catalog)）
- **Day 13 — Studio preview, part 1**：渲染前检查。做一次**安全编辑**（停在问题处、只改一个属性）；警告：**自动关键帧默认开启**，普通布局修正前先关。（源：[Work on a project in Studio](https://hyperframes.heygen.com/studio/index)）
- **Day 14 — Studio preview, part 2: keyframes**：关键帧编辑。快捷键 **K** 加帧、**H** hold/bezier 切换、**U** 展开属性、**R** 手势录制；先重定时再重设计。（源：[Edit animation and keyframes](https://hyperframes.heygen.com/studio/animation)）
- **Day 15 — Sample the web**：捕获真实网页把 web 动效带进 composition——HTML 渲染路线独有：别家扒视频参考，这里拿源码级保真采样。（源：[30 Days](https://hyperframes.heygen.com/thirty-days)，官方未设独立文档页）
- **Day 16 — Media use**：**从角色出发不从效果出发**——每类媒体一个主职（产品捕获证明行为、语音承载讲解、音乐塑造节奏）；两个资产干同一件事时留更清楚的那个。（源：[Work with media](https://hyperframes.heygen.com/guides/media)）
- **Day 17 — Storyboard**：先审计划再审画面。方向块四件事：**双色纪律**（一主色一强调色）、reveal 对齐旁白、全片一处喘息帧、点名负例清单。（源：[Storyboards](https://hyperframes.heygen.com/prompting/storyboards)）
- **Day 18 — HyperFrames in Video Agent**：四种创作场所之一。MCP 连接地址 `https://mcp.heygen.com/mcp/hyperframes/`，在任意支持的 AI 聊天里免装本地环境创作与渲染。（源：[Choose how to create](https://hyperframes.heygen.com/guides/choose-creation-path)、[MCP](https://hyperframes.heygen.com/guides/mcp)）
- **Day 19 — Background removal**：本地人物抠像（`u2net_human_seg`，**只适合人**——产品/动物返回空 mask）；双层板技法 `--background-output` 一次产出前景挖剪加带人形洞的反 alpha 背景板，文字即可从人物身后穿过。（源：[Remove background](https://hyperframes.heygen.com/guides/remove-background)）

## 五、第三阶段（Day 20-30）：Extend and ship——从一次成片到可复用流水线

十一天的主题全是复用与交付（全文见[篇四](/posts/hyperframes-thirty-days-phase-3/)）：

- **Day 20 — Claude Design**：设计方向直接进项目不手工重画。交接四步里最要紧的一句：**要 working project，不要 loose mockups**；没有设计工具能告诉你动起来对不对。（源：[Design tools](https://hyperframes.heygen.com/guides/design-tools)、[Prompt Guide](https://hyperframes.heygen.com/prompting/overview)）
- **Day 21 — Cloud rendering**：两条命令交给托管云。**上传一次多次重渲**（`asset_id` 复用）；`--no-wait` + `--callback-url` 让渲染进 CI；上限 200MB。（源：[Cloud rendering](https://hyperframes.heygen.com/deploy/cloud)）
- **Day 22 — Components Catalog**：装积木不造轮子。370 余条目；检索**必须英文、按效果描述**；缺口用 `feedback --search-miss` 上报——那是目录唯一的需求信号。（源：[Catalog](https://hyperframes.heygen.com/catalog)）
- **Day 23 — Templates and variables**：会变的抽成命名槽位。**七种类型**（含新增的 font、image）；`data-var-text` / `data-var-src` 无脚本绑定；批渲用 **JSON 数组文件 `rows.json`** + `{name}` 占位符。（源：[Variables](https://hyperframes.heygen.com/concepts/variables)）
- **Day 24 — Color grading**：代码里校正与风格化。**先校正后风格化**；13 个预设缩略图渲染的是你自己的帧；**读示波器别信屏幕**（波形图看见哪部分曝掉、矢量图查肤色线）。（源：[Color grading](https://hyperframes.heygen.com/guides/color-grading)）
- **Day 25 — Prompt Guide**：官方提示词体系大成，七层课程 + 反例附录——见[篇六](/posts/hyperframes-thirty-days-prompt-guide/)全文深读。（源：[Prompt Guide](https://hyperframes.heygen.com/prompting/overview)）
- **Day 26 — Media effects and overlays**：真实媒体加设计化处理。四族 **18 种效果**（Essentials / Retro 与 glitch / Print / Art，ASCII 单独八风格）；两条边界——效果不进 HDR 层、远程媒体要 CORS。（源：[Media effects](https://hyperframes.heygen.com/guides/media-effects)、[Overlays](https://hyperframes.heygen.com/prompting/overlays-and-lower-thirds)）
- **Day 27 — Deploy**：四条渲染路线（本地、应用后端、HeyGen 托管云、自运维 Lambda/Cloud Run）；应用后端有三个官方模板：Vercel（Sandbox+Blob）、Cloudflare（Container+R2，需 Workers Paid）、Modal（FastAPI+Volume）。（源：[Deploy overview](https://hyperframes.heygen.com/deploy/overview)、[Deploy guide](https://hyperframes.heygen.com/guides/deploy)）
- **Day 28 — Contribute to the Catalog**：把积木发回注册表。manifest 的 **params 暴露四种控件**（color/text/number/select）；过 check 证明组合有效，**不证明运动可读**。（源：[Contribute to the Catalog](https://hyperframes.heygen.com/contributing/catalog)）
- **Day 29 — Components update**：把扩充后的整套组件组合进单个项目——组件库是活的，消费端吃下迭代。（源：[30 Days](https://hyperframes.heygen.com/thirty-days)、[Product updates](https://hyperframes.heygen.com/developers/product-updates)）
- **Day 30 — Thirty for thirty**：收官混剪，每课一秒——官方原话：*"Thirty days in one cut — a second from every lesson, back to back."*（源：[30 Days](https://hyperframes.heygen.com/thirty-days)）

## 六、我的分析：这套课程在教什么

**1. 教学法是软件工程三段论。** 先跑通输入到产出（能不能做出来），再学会 code review 式的精确指挥（提示词结构、预览、storyboard），最后 CI/CD 化（组件、模板、云渲染、部署）。把「视频制作」完整重构成「软件交付」，对工程师几乎零迁移成本——这可能也是它选 AI 编码代理做一线用户的原因：会用 git 的人天然懂这套节奏。

**2. 产品的核心赌注：视频是可版本化的文本资产。** composition 是 HTML + `data-*` 属性，天然可 diff、可 lint、可变量化、可模板化、可批量渲染。对比时间轴编辑器（工程文件是二进制黑盒，无法 review）和 Remotion（是代码，但 React 组件树的心智门槛仍在），HyperFrames 把「能进 git 的东西」扩展到了视频。课程里 snapshot / compare / check 那一套，就是给视频做的 code review。

**3. 提示词工程被当成产品在做。** 六段式骨架、specification dial、vocabulary、negatives、专门的七层 Prompt Guide（Day 25）——不是博客技巧文，是有结构、有层级、有反例的体系。「怎么指挥代理」本身就是框架的一部分。

**4. 分发即生态。** skills 分发方法论（知识）、Catalog 分发组件（资产，Day 22 消费、Day 28 贡献，双向）、CLI + 云渲染 + Deploy 组成完整开发者面，SDK 与 feedback 闭环收尾。30 天课程本身也是内容营销与文档合一的示范：每课先做后发、链原帖 prompt，学习者可以直接抄作业。

**5. 对照自身：我已在实践同一哲学的静态版。** 之前写的[《公众号系列封面生成：HTML 模板 + 无头 Chrome 截图》](/posts/wechat-series-cover-workflow/)正是「HTML 是渲染源」——模板改数据、批量截图出封面。HyperFrames 把同一思想推进到时间轴维度，且全程由代理驱动。接下来可以动手的方向：

- 复现 Days 3-7 的任意工作流（本机已装 HyperFrames skills，与课程一一对应），首选 faceless-explainer：把博客里某篇学习笔记做成解说视频；
- 用 Day 2 的 FRAME.md 思路，把博客封面与视频的视觉语言沉淀成一份可复用的设计规格；
- 试着把封面模板改造成带变量的 HyperFrames 模板（Day 23），体验「一次模板、批量成片」。

至此三十天看完。一句话总结：**HyperFrames 卖的不是「AI 生成视频」，而是「视频拥有了软件工程的全套基础设施」——而 30 天课程就是这份基础设施的官方导览。**

本篇是系列总览。三个阶段与三个专题各有续篇全内容拆解：[（二）Start and create——skills 体系、九大工作流操作指南与 Figma 导入全细节](/posts/hyperframes-thirty-days-phase-1/)、[（三）Direct and refine——六段骨架、十节词汇表、Studio 操作与抠像全细节](/posts/hyperframes-thirty-days-phase-2/)、[（四）Extend and ship——云渲染、变量、调色、部署与贡献全细节](/posts/hyperframes-thirty-days-phase-3/)；课程页 Related topics 的三个入口另成专题：[（五）创作路径——按素材选工作流与四种创作场所](/posts/hyperframes-thirty-days-creation-paths/)、[（六）Prompt Guide 深读——七层课程、运动八规则与反例附录](/posts/hyperframes-thirty-days-prompt-guide/)、[（七）Catalog 全景——三百多个可复用积木的地图](/posts/hyperframes-thirty-days-catalog/)。
