---
title: 【学习笔记】不靠模型「生成」的视频：代码渲染/程序化视频（Video-as-Code）全景（2026）
published: 2026-06-30
description: 系统梳理 2026 年「非生成式」的视频生产工具——以 HyperFrames 为代表的「代码渲染成视频」(Video-as-Code) 赛道：HTML/React/Canvas/几何 四种渲染范式、HyperFrames/Remotion/Motion Canvas/Manim/Revideo 五大框架横评（许可证/agent 友好度/定价）、HyperFrames 的 19 个 agent skills 与「让 AI 写代码而非生成像素」的新路线、Creatomate/Shotstack/JSON2Video 等模板/数据驱动 API，并与姊妹篇《AI 视频生成全景》形成「确定性渲染 vs 生成式幻觉」的对照
lang: zh
tags: [学习笔记]
abbrlink: code-to-video-survey
---

> 整理日期：2026-06-30
> 涵盖范围：确定性 vs 生成式的核心区分、五种渲染范式、五大代码渲染框架横评、Agent 驱动路线、模板/数据驱动 API、许可与定价、按用途选型决策表
> 说明：本笔记关键信息均标注来源链接，便于追溯核实；标注「（未确认）」或「据报道」者为待二次核验项。这类工具迭代极快（HyperFrames 截至 2026-06-29 已发 258 个版本、 Remotion 5.0 还会再调许可），正式商用前请以各平台最新页面为准。文末「八、按用途选型决策表」可直接跳读结论。本文是[《AI 视频生成全景》](/posts/ai-video-generation-survey/)的姊妹篇——那篇讲「用模型凭空生成画面」，本篇讲「用代码把画面渲染出来」。

<!--
## 目录
- [一、核心结论（太长不看）](#一核心结论太长不看)
- [二、它到底是什么：确定性渲染 vs 生成式幻觉](#二它到底是什么确定性渲染-vs-生成式幻觉)
- [三、五种渲染范式总览](#三五种渲染范式总览)
- [四、主力框架横评（含旗舰深入）](#四主力框架横评含旗舰深入)
- [五、Agent 驱动路线：让 AI 写代码，而非生成像素](#五agent-驱动路线让-ai-写代码而非生成像素)
- [六、模板 / 数据驱动 API（不用写代码）](#六模板--数据驱动-api不用写代码)
- [七、许可与定价：谁真正「免费 + 可商用」](#七许可与定价谁真正免费--可商用)
- [八、按用途选型决策表](#八按用途选型决策表)
- [九、参考资料](#九参考资料)
-->

## 一、核心结论（太长不看）

1. **这是一条和「AI 生成视频」正交的路线**：本篇讲的所有工具都是**确定性渲染**——同一份代码/模板，每次渲染都得到逐像素相同的画面；而上一篇里的 Sora/Kling/Veo 是**生成式**，同一句 prompt 跑两遍结果都不同（即便有 seed，也会因 GPU 不确定性、模型版本漂移而失稳）。**要「品牌一致、可复现、可进 CI」的系列成片，生成式模型天然不擅长，这正是 video-as-code 的位置。**
2. **HyperFrames（HeyGen）是这个赛道最新的 agent 原生玩家**：写 HTML/CSS/JS 就能出 MP4，**无需 build、`index.html` 直接即播**，Apache-2.0、本地渲染不计费；最大卖点是**自带 19 个「skills」**，能装进 Claude Code / Cursor / Codex / Gemini CLI，让 agent 一句话出片。它是 Remotion 的「HTML 版」。
3. **Remotion 仍是成熟度王者**：React 写组件、无头 Chromium 渲染整棵 DOM、Lambda 分布式出片，能渲染的内容类型最多。⚠️ 但它是**源码可见（source-available）而非开源**：个人/非营利/≤3 人的盈利公司**免费（且允许商用）**，4 人以上公司要买 Company License，自动化档约 100 美元/月起。
4. **别被「Motion Agent」这类词带跑**：AutoAE 把自己包装成「video-as-code / Motion Agent」，经核实其实是**手工模板市场 + LLM 选模板填字段**、闭源，更接近 Canva 而非 Remotion——「video-as-code」只是它的营销外衣。
5. **真正「免费 + 可商用」≈ 本地开源**：HyperFrames（Apache）、Motion Canvas / Revideo / Manim（皆 MIT）最干净；Remotion / Editframe 对小团队免费但带「≤3 人」门槛；模板 API（Creatomate/Shotstack/JSON2Video）真用起来都要付费、免费层多带水印——这和姊妹篇[《AI 视频生成全景》](/posts/ai-video-generation-survey/)、[《AI 音乐生成全景》](/posts/ai-music-generation-survey/)是同一个结论。

> 来源：[HyperFrames 仓库（Apache-2.0）](https://github.com/heygen-com/hyperframes) · [HyperFrames：确定性概念](https://hyperframes.heygen.com/concepts/determinism) · [Remotion 官方许可页](https://www.remotion.dev/docs/license) · [Remotion vs Motion Canvas（官方对比）](https://www.remotion.dev/docs/compare/motion-canvas) · [PkgPulse 2026 三方对比](https://www.pkgpulse.com/guides/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026)

---

## 二、它到底是什么：确定性渲染 vs 生成式幻觉

上一篇我们聊的是「让 AI 模型凭空拍视频」——给它文字或图片，它**预测**出一串像素。本篇聊的是另一类工具：**你写代码（或填模板），引擎按代码把每一帧"画"出来**。区别可以用一句话概括：

> **生成式是"概率"——同样的输入，每次输出都不同；程序化是"确定"——同样的输入，逐像素相同。**

| 维度 | 生成式（AI 模型） | 程序化（代码渲染 / video-as-code） |
|---|---|---|
| **原理** | 扩散/自回归模型在潜空间预测像素 | 浏览器/Canvas/几何引擎按代码渲染每一帧 |
| **输入** | 文字、图片、参考视频 | HTML/CSS、React、TypeScript、Python、或模板 + JSON 数据 |
| **输出确定性** | ❌ 概率性，同 prompt 不同结果（seed 也常失稳） | ✅ 逐帧确定，可进 CI、可回归测试 |
| **可控性** | 提示词 + 参考图，间接、不精确 | 代码级精确（像素、品牌色、时间轴全可控） |
| **每帧成本** | 高（GPU 推理） | 低（CPU 渲染或本地） |
| **典型工具** | Sora、Kling、Veo、Seedance（见姊妹篇） | HyperFrames、Remotion、Motion Canvas、Manim |

一个类比：**生成式像"请一个画师凭描述作画"**，每次笔触不同、惊艳但不稳定；**程序化像"用印刷术按图纸印"**，单调但张张一致、可量产。所以——**要做"一个 IP 的 100 条风格统一的社媒短视频"，或者"用户输入数据自动出片、还要能回归测试"，你需要的不是更大的生成模型，而是 video-as-code。** 上一篇的生成式解决"从无到有、要创意"；本篇解决"从代码到成片、要一致与自动化"。

> 来源：[AutoAE：Remotion vs Higgsfield（确定性 vs 生成式）](https://autoae.online/blog/remotion-vs-higgsfield) · [HyperFrames 引擎文档（逐帧 seek-and-capture）](https://hyperframes.heygen.com/packages/engine) · [AutoAE：Video as Code vs AI Video Generation](https://autoae.online/blog/video-as-code-vs-ai-video-generation)

---

## 三、五种渲染范式总览

「代码渲染成视频」内部又分**五种范式**，差别在"你写什么、引擎拿什么渲染"。先看这张索引表，后面每一节都是在展开其中一行。

| 范式 | 你写什么 | 渲染后端 | 代表工具 |
|---|---|---|---|
| **① HTML/CSS 渲染** | HTML + `data-*` 时序属性 + CSS/GSAP 动画 | 无头 Chrome + FFmpeg | **HyperFrames**、Editframe |
| **② React DOM 渲染** | React 组件（TSX），把帧号当 state | 无头 Chromium + FFmpeg（可走 Lambda 分布式） | **Remotion** |
| **③ Canvas 生成器** | TypeScript 生成器函数，用 `yield` 控制时间 | 单个 `<canvas>` + FFmpeg | **Motion Canvas**、Revideo |
| **④ 几何 / 数学引擎** | Python，命令式 `self.play(...)` 驱动数学对象 | OpenGL/GLSL 或 Cairo + FFmpeg | **Manim**（ManimGL / ManimCE） |
| **⑤ 模板 / 数据填充** | 在可视化编辑器里做模板，用 JSON/表格填数据 | 云端 REST API | Creatomate、Shotstack、JSON2Video 等 |

一个直觉判断：**①②③④ 是"写代码/写动画"——你掌控每一帧；⑤ 是"填模板"——你不碰代码，但灵活性被模板锁死。** 而 ①② 最适合 agent 来写——HTML 和 React 正是 LLM 最熟的两种格式，这也是 HyperFrames 敢喊"built for agents"的底层原因。

> 来源：[HyperFrames vs Remotion（官方：React vs HTML）](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion) · [Remotion：把帧号交给 React](https://www.remotion.dev/docs/the-fundamentals) · [Motion Canvas README（generator 函数 + canvas）](https://github.com/motion-canvas/motion-canvas) · [ManimCommunity 文档（self.play）](https://docs.manim.community/en/stable/tutorials/quickstart.html)

---

## 四、主力框架横评（含旗舰深入）

### 4.1 五大框架一览

| 框架 | 语言 / 写法 | 渲染后端 | 需 build | agent 友好 | DOM/CSS | 许可证 | 最适合 |
|---|---|---|---|---|---|---|---|
| **HyperFrames**（HeyGen） | HTML/CSS/JS + `data-*` | 无头 Chrome + FFmpeg | ❌（`index.html` 即播） | ✅ **原生**（19 skills） | ✅ 全 | **Apache-2.0** | agent 一句话出片、营销/产品片 |
| **Remotion** | React / TSX | 无头 Chromium + FFmpeg（Lambda） | ✅ | ⚠️ 靠 skills/LLM | ✅ 全 | source-available（≤3 人免费） | 生产级、参数化批量 |
| **Motion Canvas** | TS 生成器函数 | 单 `<canvas>` + FFmpeg | ✅ | ⚠️ | ❌ 仅 canvas | **MIT** | 矢量讲解动画、配音同步 |
| **Revideo** | TS（Motion Canvas 衍生） | 单 `<canvas>` + FFmpeg | ✅ | ⚠️ | ❌ 仅 canvas | **MIT** | 把渲染做成库、自动化产线 |
| **Manim**（GL/CE） | Python 命令式 | OpenGL/GLSL 或 Cairo + FFmpeg | ❌ | ⚠️ 弱 | ❌ 无 | **MIT** | 数学 / 理工教学动画 |

一个关键取舍：**要不要 DOM/CSS？** Remotion / HyperFrames 渲染整棵 DOM，能叠 CSS、SVG、Three.js、网页截图，内容类型最丰富；Motion Canvas / Revideo 只画一个 `<canvas>`，矢量动画丝滑但混排多媒体弱；Manim 连 DOM 都没有，专攻公式与几何。

> 来源：[HyperFrames 仓库](https://github.com/heygen-com/hyperframes) · [Remotion vs Motion Canvas（官方）](https://www.remotion.dev/docs/compare/motion-canvas) · [Revideo 仓库（MIT，Motion Canvas 衍生）](https://github.com/redotvideo/revideo) · [3b1b/manim（ManimGL）](https://github.com/3b1b/manim) · [ManimCommunity/manim（ManimCE）](https://github.com/ManimCommunity/manim)

### 4.2 旗舰深入 ①：HyperFrames —— 赛道最新的 agent 原生玩家

- **写法**：一个 `.html` 文件就是一条视频——用 `data-*` 属性标时序、`class="clip"` 标片段、轨道/子合成/变量，媒体由框架接管播放。**无需 build，`index.html` 直接在浏览器即播**，这是它和 Remotion 最直观的差别。
- **渲染**：无头 Chrome 逐帧 `seek-and-capture` + FFmpeg 合成，官方明保证"同一份 HTML 永远得到同一份视频"。
- **agent 原生**：通过 `vercel-labs/skills`（`npx skills add heygen-com/hyperframes`）分发 **19 个 skills**，能装进 Claude Code、Cursor、Codex CLI、Gemini CLI、GitHub Copilot CLI、Google Antigravity。结构是 **1 个路由 `/hyperframes` + 约 11 个创作工作流**（如 `/product-launch-video`、`/website-to-video`、`/pr-to-video`、`/music-to-video`）**+ 7 个原子领域技能**（core/animation/creative/media/cli 等）。⚠️ skills 数量随版本微调（另有 `/remotion-to-hyperframes` 迁移技能不计入创作），引用精确数字时以官网为准。
- **把确定性写进契约**：`/hyperframes-core` 强制「禁止 `Date.now()`、禁止无种子 `Math.random()`、禁止渲染期联网」——把"可复现"从口号落成结构约束。
- **短板**：2026 年 3 月才开源、年轻，生态与成熟度不及 Remotion；纯 HTML 写法对复杂交互动画的控制力不如 React 组件树。

> 来源：[HyperFrames 仓库（Apache-2.0）](https://github.com/heygen-com/hyperframes) · [HyperFrames skills 文档](https://hyperframes.heygen.com/guides/skills) · [HyperFrames vs Remotion（官方）](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion) · [vercel-labs/skills](https://github.com/vercel-labs/skills)

### 4.3 旗舰深入 ②：Remotion —— 成熟度王者，但要算清许可账

- **写法**：视频是一个 React 组件，引擎把"当前帧号"当 state 传给你，你像写普通 React 一样返回任意 DOM/SVG/Canvas/Three.js。
- **渲染**：无头 Chromium 渲染整棵 DOM + FFmpeg 出 MP4/WebM；支持 **Lambda 分布式渲染**、可嵌入的 `<Player>` 组件、GitHub Actions 出片——内容类型最丰富、工程化最深。
- **许可（务必看清）**：**源码可见、不是 OSI 开源**。免费档覆盖**个人、非营利、≤3 人的盈利公司、以及未商用评估者——且免费档允许商用出片**；4 人以上公司需购买 Company License。自动化/AI 出片场景的 **"Remotion for Automators" 档按约 0.01 美元/次渲染、100 美元/月起步**（例：1 万次渲染 = 100 美元）。⚠️ 官方已预告 **Remotion 5.0 会"微调"许可**，团队规模触发付费这条主线暂不变，但条款以最新 LICENSE.md 为准。
- **何时选它**：要做生产级、参数化、批量、需要云渲染与回归测试的成片流水线，且团队能接受其许可——Remotion 仍是首选。

> 来源：[Remotion 官方许可页](https://www.remotion.dev/docs/license) · [Remotion Pro 定价（Automators 档）](https://www.remotion.pro/license) · [Remotion LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) · [Remotion Lambda 文档](https://www.remotion.dev/lambda)

---

## 五、Agent 驱动路线：让 AI 写代码，而非生成像素

这一节是 2026 年这条赛道最热的增量，也最容易被营销话术带偏，分两面看。

### 5.1 真路线：HyperFrames 的「skills」—— agent 写代码

HyperFrames 的思路是：**既然 LLM 写 HTML/React 最在行，那就让 agent 直接写渲染代码，而不是去"生成像素"。** 它把"怎么规划视频 → 怎么写合法 HTML → 怎么接时序动画 → 怎么 lint/预览/渲染"这条生产循环，拆成 19 个 skills 喂给 agent。对用户而言就是一句 prompt：

> 用 `/hyperframes`，做一条 10 秒的产品介绍：标题淡入、背景视频、配点轻音乐。

agent 自己选工作流、写 HTML、接动画、渲染出 MP4。**关键是输出仍然确定、可复现、可进版本控制**——这和"让生成模型 roll 一个视频"有本质区别。Remotion 也在跟进：其 Automators FAQ 已专门回答"能不能用 LLM 生成 Remotion 代码"。

### 5.2 ⚠️ 命名陷阱：AutoAE 的「Motion Agent」经核实是模板市场

AutoAE（autoae.online）把自己包装成 "video-as-code / Motion Agent"，但核实其官方材料后结论很明确：

- **它不是代码渲染框架，也不编排 Remotion/HyperFrames**。其模板库自述为**"由动效设计师手工制作（hand-crafted），不是模型生成、不是从代码参数化而来"**，出片流程是「选模板 → 填字段 → 渲染」。
- 所谓 **"AI Motion Agent" 实为模板推荐 + 内容填充助手**：你描述想法，它帮你挑模板、填文字——本质是模板参数化，并非 agent 驱动的 video-as-code。其官方对比文甚至自承 AutoAE "不适合实时数据流"的场景。
- **闭源**：无公开仓库、无 SDK、无源码导出——这条就和 Remotion/Motion Canvas/Manim/Revideo/HyperFrames（全部开源/源码可见）划清了界线。
- **定价**：免费档 5 次下载/月、720p、**带水印、禁商用**；付费 9.90 / 24.90 / 59.90 / 199.90 美元/月，或单条 2.90 美元；企业档含 API、最高 4K。

一句话：**AutoAE 更接近 Canva / mojo 这类模板工具，"video-as-code"是它的营销外衣。** 选型时别被"Motion Agent"这个词带跑——要真 programmatic，还是得回到上面五个开源框架。

> 来源：[AutoAE 定价页](https://autoae.online/pricing) · [AutoAE：Higgsfield Vibe Motion vs AutoAE（自述模板参数化）](https://autoae.online/blog/higgsfield-vibe-motion-vs-autoae-2026) · [HyperFrames skills 文档](https://hyperframes.heygen.com/guides/skills) · [HyperFrames CLAUDE.md（生产循环）](https://github.com/heygen-com/hyperframes/blob/main/CLAUDE.md)

---

## 六、模板 / 数据驱动 API（不用写代码）

如果你**完全不想写代码**，只想「做个模板、用数据批量填」，就走云端模板 API。这类工具的共同形态是：可视化模板编辑器 + REST API（多为 JSON）+ Zapier/Make 等无代码集成，按渲染量计费。

| 工具 | 创作模型 | 定价 / 免费层 | 免费层水印 | 商用 | 最适合 |
|---|---|---|---|---|---|
| **Creatomate** | 可视化模板编辑器 + REST + JSON（"HTML for video"）+ JS Preview SDK | 50 积分免费试用（免信用卡），按积分计 | 未确认 | ✅（付费） | 批量/个性化视频与图片自动化 |
| **Shotstack** | JSON 时间轴 REST + 模板编辑器 + 白标编辑器 SDK | 开发沙箱约 10–20 积分；按量 0.30 美元/分钟，或 39 美元/月订阅（0.20 美元/分钟） | 超额带水印，付费无 | ✅ | 大规模程序化视频（营销/房产/电商）|
| **JSON2Video** | 纯 JSON「Movie JSON」REST + SDK + 内置 TTS | 600 免费积分（免信用卡）；订阅 16.95–99.95 美元/月 | 免费层带水印，去水印为付费功能 | ✅（付费） | 纯代码、无可视化编辑器的程序化出片 |
| **Editframe** | **HTML/CSS web 组件 + React** 渲染成 MP4（无头浏览器捕获）+ CLI/云 API | 个人/≤3 人团队**永久免费**（本地 CLI）；云档 99 美元/月 + 约 0.02–0.07 美元/渲染分钟 | 无 | ✅（全档允许） | 开发者向的 video-as-code、个性化流水线、agent 友好 |
| **Bannerbear** | 类 Sketch 模板编辑器 + REST + Zapier/Make/Airtable | 30 API 积分免费试用；49 / 149 / 299 美元/月 | 未确认 | ✅（付费） | 社媒/电商的图片 + 短视频生成 |
| **Placid** | 模板编辑器 + REST/URL API + 大量无代码集成 | 免费试用积分（免信用卡）；按月积分档 | 预览带水印，付费无 | ✅ | 图/文/PDF/**视频**（≤3 分钟 1080p）多格式自动化 |

⚠️ 三个提醒：① **Editframe 最特殊**——它和 HyperFrames 同属「HTML/CSS 渲染成视频」一脉，但有云端 API + 永久免费个人档，适合想要 video-as-code 又不想自建渲染的开发者。② **Bannerify 同名混淆**：`bannerify.co` 只出图片/PDF（无原生视频）；Figma 插件版 `hypermatic.com/bannerify` 才导出 MP4——引用前务必分清「（未确认）」。③ 这类服务的**精确计费/水印政策变动频繁**，商用前以各平台定价页为准。

> 来源：[Creatomate 定价](https://creatomate.com/pricing) · [Shotstack 定价](https://shotstack.io/pricing) · [JSON2Video 定价](https://json2video.com/pricing) · [Editframe 定价](https://editframe.com/pricing) · [Bannerbear 定价](https://bannerbear.com/pricing) · [Placid 定价](https://placid.app/pricing)

---

## 七、许可与定价：谁真正「免费 + 可商用」

把许可单独拎出来，是因为这条赛道**「免费」两个字藏了三种不同含义**，直接决定你能不能拿去商用。

| 工具 | 许可类型 | 个人/小团队 | 团队/商用 | 你做的视频归谁 |
|---|---|---|---|---|
| **HyperFrames** | **Apache-2.0（纯开源）** | 免费、本地渲染不计费 | 免费、无门槛 | ✅ 完全归你 |
| **Motion Canvas** | **MIT（纯开源）** | 免费 | 免费 | ✅ 官方明示：作品不受工具许可约束，你可任意商用 |
| **Revideo** | **MIT（纯开源）** | 免费 | 免费 | ✅ 归你 |
| **Manim**（GL/CE） | **MIT（纯开源）** | 免费 | 免费 | ✅ 归你 |
| **Remotion** | source-available | ≤3 人免费（**含商用**） | 4 人以上需 Company License；自动化约 100 美元/月起 | ✅ 归你 |
| **Editframe** | 闭源 + 免费档 | ≤3 人永久免费（**含商用**） | 云档 99 美元/月 + 用量 | ✅ 归你 |
| **模板 API 类**（Creatomate 等） | 闭源 SaaS | 多有免费试用/沙箱 | 按量或订阅付费 | ✅ 归你（但免费层常带水印/禁商用） |
| **AutoAE** | 闭源 SaaS | 免费档**禁商用 + 带水印** | 付费档可商用 | ✅ 归你 |

三个值得记的点：

- **最干净 = 本地开源**：HyperFrames（Apache）、Motion Canvas / Revideo / Manim（MIT）是这条赛道里"真·免费 + 可商用"的几席——和姊妹篇[《AI 视频生成全景》](/posts/ai-video-generation-survey/)里 "CogVideoX/Wan/LTX 最干净" 是同一个结论。
- **Remotion 的"免费"含商用**：常见误读是"免费 = 只能非商用"，错——它的免费档**允许商用出片**，付费门槛触发于"公司 >3 人"这个组织规模条件，不是"是否商用"。
- **Motion Canvas 的 MIT 曾差点变 GPL**：维护者 2024 年提议切 GPLv3，因社区反对**无限期搁置**；且无论 MIT 还是 GPL，**都不约束你用它做出来的视频**（你保留全部权利）。⚠️ 网上曾有 AI 摘要误传"已切换 GPL"，直接看 LICENSE 文件即被证伪。

> 来源：[Remotion 官方许可页](https://www.remotion.dev/docs/license) · [Motion Canvas 讨论 #1015（GPL 无限期搁置 + 作品不约束）](https://github.com/orgs/motion-canvas/discussions/1015) · [Motion Canvas LICENSE（MIT）](https://github.com/motion-canvas/motion-canvas/blob/main/LICENSE) · [HyperFrames 仓库（Apache-2.0）](https://github.com/heygen-com/hyperframes)

---

## 八、按用途选型决策表

| 你的用途 | 推荐方案 |
|---|---|
| **让 AI agent 一句话出片（最新玩法）** | **HyperFrames**（Apache-2.0、19 skills、agent 原生）；要 React 生态则 Remotion + LLM |
| **生产级、参数化、批量、要云渲染与回归测试** | **Remotion**（成熟度最高，团队 >3 人记得买 Company License） |
| **矢量讲解动画 / 与配音精准同步** | **Motion Canvas**（MIT、生成器函数 + 实时编辑器） |
| **把渲染做成服务、做成产品（自动化产线）** | **Revideo**（MIT、Motion Canvas 的"库化"版本，带渲染 API + SSR） |
| **数学 / 物理 / 工程教学动画** | **Manim**（新手用 ManimCE 社区版，追新用 3b1b 的 ManimGL） |
| **不想写代码，用模板 + 数据批量出片** | JSON 优先 → **JSON2Video**；可视化优先 → **Creatomate**；大规模 → **Shotstack** |
| **想要 video-as-code 又不想自建渲染** | **Editframe**（HTML/CSS 渲染、有云 API + 永久免费个人档） |
| **本地免费 + 可商用、零许可顾虑** | **HyperFrames / Motion Canvas / Manim**（Apache 或 MIT，最干净） |
| **从 Remotion 迁移到更轻的 HTML 写法** | HyperFrames 自带 `/remotion-to-hyperframes` 迁移 skill |

一句话总原则：**先问"谁写代码"（人 / agent / 填模板），再问"渲染什么"（DOM / Canvas / 几何），最后看"团队规模与商用许可"——这三步筛完，几乎总能收敛到一两个答案。而如果你的需求是"凭空生成创意画面"，那不在本篇，请去姊妹篇[《AI 视频生成全景》](/posts/ai-video-generation-survey/)。**

---

## 九、参考资料

**框架官网与仓库**

- [HyperFrames (GitHub, Apache-2.0)](https://github.com/heygen-com/hyperframes) · [HyperFrames 官网](https://hyperframes.heygen.com/) · [skills 文档](https://hyperframes.heygen.com/guides/skills)
- [Remotion 官网](https://www.remotion.dev/) · [Remotion GitHub](https://github.com/remotion-dev/remotion) · [Lambda 分布式渲染](https://www.remotion.dev/lambda)
- [Motion Canvas 官网](https://motioncanvas.io/) · [Motion Canvas (GitHub, MIT)](https://github.com/motion-canvas/motion-canvas)
- [3b1b/manim（ManimGL，原版）](https://github.com/3b1b/manim) · [ManimCommunity/manim（ManimCE，社区版）](https://github.com/ManimCommunity/manim) · [Manim 文档](https://docs.manim.community/)
- [Revideo (GitHub, MIT)](https://github.com/redotvideo/revideo)

**许可与定价（主源）**

- [Remotion 官方许可页](https://www.remotion.dev/docs/license) · [Remotion Pro 定价（Automators）](https://www.remotion.pro/license) · [Remotion LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)
- [Motion Canvas 讨论 #1015（GPL 搁置 + 作品归属）](https://github.com/orgs/motion-canvas/discussions/1015)
- [Editframe 定价](https://editframe.com/pricing) · [Creatomate 定价](https://creatomate.com/pricing) · [Shotstack 定价](https://shotstack.io/pricing) · [JSON2Video 定价](https://json2video.com/pricing) · [Bannerbear 定价](https://bannerbear.com/pricing) · [Placid 定价](https://placid.app/pricing) · [AutoAE 定价](https://autoae.online/pricing)

**对比文章与格局**

- [PkgPulse：Remotion vs Motion Canvas vs Revideo（2026）](https://www.pkgpulse.com/guides/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026) · [Remotion 官方对比 Motion Canvas](https://www.remotion.dev/docs/compare/motion-canvas) · [HyperFrames vs Remotion（官方）](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion)
- [AutoAE：Video as Code vs AI Video Generation](https://autoae.online/blog/video-as-code-vs-ai-video-generation) · [AutoAE：Remotion vs Higgsfield](https://autoae.online/blog/remotion-vs-higgsfield) · [pexo.ai：Remotion 替代品](https://pexo.ai/blog/remotion-alternatives-4966)
- [vercel-labs/skills（agent skills 生态）](https://github.com/vercel-labs/skills)

**姊妹篇**

- [《AI 视频生成全景：有哪些方式、技术范式、开源与商业 SOTA（2026）》](/posts/ai-video-generation-survey/) · [《AI 音乐生成全景（2026）》](/posts/ai-music-generation-survey/)
