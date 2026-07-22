---
title: 【学习笔记】HyperFrames 子 skill 运行流程手册：十个工作流怎么一步步跑
published: 2026-07-23
description: 上一篇拆了 HyperFrames 的架构，这篇落到运行流程——faceless-explainer、product-launch-video、pr-to-video、music-to-video、motion-graphics、website-to-video、slideshow、talking-head-recut、embedded-captions、remotion-to-hyperframes 这十个工作流子 skill，各自从输入到产物的每一步是什么、哪里卡 gate、哪里派子代理。附三种工作流范式对比与选型建议。
lang: zh
tags: [学习笔记, Agent Skill]
abbrlink: hyperframes-workflow-runbook
---

上一篇《[拆解 HyperFrames](/posts/hyperframes-skills-deep-dive)》我讲了这套体系的整体架构——入口分诊、意图层、核心契约、动画、CLI、技能生命周期。这篇换一个视角，**落到地面上**：HyperFrames 的入口把请求路由到具体工作流之后，**每个工作流子 skill 内部到底是怎么一步步跑的**。

HyperFrames 一共十个工作流子 skill（加上通用兜底的 `general-video`）。它们共享同一套核心契约和 CLI，但每个的**步骤数量、门控位置、子代理派发时机、产物文件**都不一样。这篇我把每个工作流的运行流程拆开讲，重点放在三件事上：**每一步产出什么文件、哪几步是用户卡点（gate）、哪一步派子代理**。

先把十个工作流按形态分三类，因为同类的流程高度相似，理解了一类就理解了大半。

---

## 三类工作流，三种运行范式

### 第一类：叙事创作型（六步流水线）

属于这类的有四个：`faceless-explainer`（话题讲解）、`product-launch-video`（产品发布）、`pr-to-video`（PR 讲解）、`website-to-video`（网站转视频）。

它们的流程骨架几乎一样，都是六步左右的流水线：

```
Step 0 建项目 + 确认 brief
  → Step 1 摄取素材（capture 或 fetch）
    → Step 2 设计系统（frame.md）
      → Step 3 故事板 + 脚本（用户卡点）
        → Step 3.1 音频（后台）
          → Step 4 每帧视觉设计
            → Step 5 逐帧构建（派子代理）+ 组装
              → Step 6 检查 + 用户审 + 渲染
```

差别只在**第一步怎么拿素材**、**第二步用什么设计预设**、**第三步拿什么故事模板**。

### 第二类：自治直达型（无卡点或少卡点）

`motion-graphics`（短动效）。它**天生就是自治的**——最多问一个澄清问题，然后一路跑到渲染。用户卡点最少，流程最短。

### 第三类：已有素材加工型

`talking-head-recut`（给人像视频加图形覆盖）、`embedded-captions`（给视频加字幕）、`music-to-video`（音乐驱动）。它们的输入是一段**已经存在的素材**（视频 / 音频），工作流围绕这段素材做加工，而不是从零创作。

剩下的两个比较特殊：`slideshow`（演示文稿）产出的是**可导航的 deck 而非 mp4**；`remotion-to-hyperframes` 是**单向迁移**，有自己独立的五步。

下面逐个拆。

---

## 一、faceless-explainer：从一段文字到一个讲解视频

**定位**：输入是一段文字（文章、笔记、话题），输出是一个"无人出镜"的讲解视频——所有视觉都是发明的（字体、抽象图形、图示、数据可视化）。没有产品要卖，没有网站要抓。甜区 30-90 秒，硬上限约 3 分钟。

### 运行流程

**Step 0 — 建项目 + 确认 brief**

先 `npx hyperframes init "videos/<project>"`。然后**在问 brief 之前先展示登录状态**——`npx hyperframes auth status`，原样转述输出（它会告诉你语音 / 背景音乐是用 HeyGen 还是本地引擎）。没登录就停下来等用户决定：登录，还是说"go"/"offline"用本地引擎。这是个真决策点，不能含糊带过。

brief 确认分两轮：第一轮问模式（协作还是自治）；第二轮（协作模式）问三个问题——**角度**（概念 / 教程 / 清单 / 叙事，推荐文本自身形状暗示的那个）、**长度**（30-90 秒甜区，按文本实际教多少缩放）、**目标平台**（YouTube/嵌入→16:9；X/LinkedIn/Instagram→1:1；Shorts/TikTok→9:16）。一个"go"接受所有推荐默认值。

**Gate**：`hyperframes.json` 存在，brief 字段锁定。

**Step 1 — 把文字折进项目（无 capture）**

faceless **没有网站抓取，没有真实素材**。把用户输入原样存到 `capture/extracted/visible-text.txt`，手工建一个 `tokens.json`（title/description 从 brief 填，colors/fonts 留空除非用户给了品牌色字体）。如果用户粘了脚本，存成 `user_script.txt`，问一次"原样用还是重构"，答案存成 `VO_MODE`。

**关键**：别跑 `npx hyperframes capture`（没有 URL）。别建 `asset-descriptions.md`——无面视觉在 Step 4-5 发明，不是抓来的。

**Gate**：`visible-text.txt` 和 `tokens.json` 存在。

**Step 2 — 设计系统**

唯一的判断点：**挑哪个预设**。读设计规范，浏览 `frame-presets/`，挑最贴合话题 / 基调 / 受众的那个。然后跑脚本：

```bash
node <SKILL_DIR>/scripts/build-frame.mjs --preset <name> --hyperframes .
```

脚本确定性完成剩下的事：把预设的 `FRAME.md` 复制成 `frame.md`，按 `tokens.json` 里的品牌 token 做**混音**（品牌色按角色映射到预设的色键上），复制字幕皮肤，自校验（映射坏了退出 1）。退出 0 就继续，**别手改 spec**。

faceless 通常没有品牌色字体（tokens.json 的 colors/fonts 空）→ 脚本保留预设自己的配色，一套完整的可发布设计。

**Gate**：`build-frame.mjs` 退出 0，`frame.md` 存在。

**Step 3 — 故事板和脚本（用户卡点）**

把文字变成逐帧的教学计划。读故事脊柱（钩子语言、价值先于证据、故事板即提案）、故事设计、蓝图索引、故事板格式、脚本格式。用它们写 `STORYBOARD.md`，需要旁白时写 `SCRIPT.md`。

**序列来自叙事设计，不是输入文本的段落顺序**——重排、合并、省略、压缩。对每个 beat，把旁白写成它候选蓝图暗示的形状，标签上 `blueprint:` id（但故事真相决定哪些 beat 存在——别为了凑一个现成形状而硬造 beat）。

起草后，按"故事板即提案"的方式呈现：先复述"这条片子告诉【受众】【信息】"，然后帧表（每帧一行：帧·beat·屏上内容·为什么）。同一消息里问用户两件事：(a) 批准还是改；(b) 要不要看故事板脚手架的实时预览。迭代到批准。这是个**检查点 gate**——自治模式下把同样的总结当告知发出去就继续。

**Gate**：`STORYBOARD.md` 存在，每帧有必要叙事字段，`SCRIPT.md` 需要旁白时存在，用户批准了。

**Step 3.1 — 音频（后台）**

Step 3 批准后开始音频。后台跑，同时继续 Step 4。

**要点**：如果用户的请求指定了声音，挑匹配的 voice id 并传 `--voice <id>`。管道默认是 **Marcia（女声）**——所以"要男声"这种请求如果不传 flag 会被静默忽略。

**Gate**：音频任务已开始，或项目标记为静音。

**Step 4 — 每帧视觉设计**

在原 `STORYBOARD.md` 上原地编辑（别新建另一个故事板）。用 `frame.md` 作为颜色、字体、布局手感的真相来源。给每个帧写一个**时间编码的镜头序列**：挑它的蓝图，用**这一帧的**内容实例化它，把每个场景的揭示节奏对上旁白——让帧在它的整段时长里展开，而不是一开始全亮然后冻住。加一个全片级的 `## Video direction` 块。

**别改故事、脚本、转场、素材**。这一步**不写 HTML**。

**Step 5 — 逐帧构建（派子代理）**

等 Step 3.1 音频跑完，然后机械地同步时长（真语音时长优先，静音帧保留估计，绝不手改同步后时长）、抓 SFX。读子代理派发规范，**每帧派一个 frame-worker 子代理**，能并行就并行。每个 worker 拿到恰好一帧，写出 `compositions/frames/NN-*.html`，遵守 HyperFrames 契约（暂停的 GSAP 时间线、`class="clip"`、稳定 id、确定性）。**worker 永远不跑 `hyperframes` CLI**——那些命令操作的是组装后的项目，现在还不存在。

每个 worker 返回后，把那帧在 `STORYBOARD.md` 里标记 `animated`。音频时长存在后，后台建字幕，组装 index。

**Gate**：每帧标记 `animated`，`index.html` 存在，字幕建好或显式跳过。

**Step 6 — 终验**

注入转场，跑检查（lint→check→snapshot），然后**暂停等用户审**。在最终预览处等批准——自治模式下这是模式保留的唯一问题："先预览还是直接渲染？"。

只在用户批准后渲染：`npx hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4`。渲染后别重跑 lint/validate/inspect/snapshot，除非用户要求。

**Gate**：渲染前 lint/validate/inspect 都过了；用户在审查暂停处批准了；`renders/video.mp4` 存在。

---

## 二、product-launch-video：卖或展示一个产品

**定位**：输入是一个产品 / 营销 URL、一段脚本或 brief，输出是产品发布 / 宣传片。甜区 30-90 秒，硬上限约 3 分钟。

### 它和 faceless 的关键差别

流程骨架**几乎一模一样**（Step 0 到 Step 6），所以我只讲差异：

**Step 1 是真 capture**。和 faceless 不同，这里用 `npx hyperframes capture "<URL>" -o ./capture` 抓真实网站。分类输入：有明确 URL → 抓；粘的脚本 → 存 `user_script.txt` 问 VO_MODE，再定 capture 目标；只有品牌名 → 搜一下确认 URL 再抓；没有 URL → 走 no-capture 路径手工建。`asset-descriptions.md` 是主素材清单，真 capture 后要是缺了它就停下报告 capture 不完整。

**brief 多一个问题**：先问"**卖还是展示？**"——推销产品（宣传片），还是原样展示网站（tour/showcase）？展示意图不是另一条流水线，写进 brief，流程正常走——抓到的屏幕变成被突出的 `asset_candidates`。

**Gate 一致**：角度（故事形状）、长度、目标平台。

---

## 三、pr-to-video：把一个 PR 讲成视频

**定位**：输入是一个 GitHub PR（URL / `owner/repo#N` / 检出仓库里的"this PR"），通过 `gh` 读。输出是变更日志、功能揭示、修复讲解或重构走查。硬上限约 3 分钟。

### 运行流程（差异点）

骨架还是六步，但 Step 1 完全不同——**用 `gh` 摄取 PR，不是抓网站**。

**Step 0 — 长度从 PR 改动量推，不是拍脑袋**

brief 确认前，先 peek 一次（只读）：

```bash
gh pr view <PR_REF> --json title,additions,deletions,changedFiles
```

按 `additions + deletions`（`changedFiles` 微调）选档：琐碎（≲50 行）~20-40s；聚焦（~50-200 行）~40-70s；实质（~200-600 行）~70-110s；大（≳600 行或 25+ 文件）~110-180s。一句话给依据（"~40s——小改动，+44/−13，12 个文件"）。**档位是故事的天花板，不是要填满的下限**——一个标题级的故事无论档位都建议落在 30-90s 甜区。

风格固定为 **claude**（暖编辑风；为 diff 做的深蓝代码面）。

**Step 1 — 摄取 PR（无 capture）**

`fetch-pr.mjs` 确定性地跑 `gh`——用分页 `gh api` 补全文件列表（大 PR 不会在 ~100 文件处截断），只写 `capture/pr.json` + `capture/diff.patch`。对已合并的 PR 还尽力解析一个 `shipped_version`，这样结尾卡能引真实版本而非瞎编。然后 `ingest.mjs` 离线把它折进合成 capture 包（tokens.json 的 colors 为空→claude 配色；visible-text.txt；people.json 贡献者，机器人过滤，头像存 `assets/<login>.png`）。

如果 `fetch-pr.mjs` 退出 1（gh 认证 / 找不到 / 私有），报 stderr 停下——**绝不编造 PR 内容**。

**Step 3 — PR 原生帧类型**

故事设计按 PR 原型：changelog / feature-reveal / fix-explainer / refactor-walkthrough。PR 原生帧类型、钩子、每帧字数预算、致谢结尾。特征 2-4 个真实 diff hunk（每个一小段可读的），每个帧场景里标它要的 `code-*` 块。帧除了致谢结尾不携带 `asset_candidates`（1-6 个贡献者头像）。

**Step 4 — code 块是焦点**

对代码帧，`code-*` 块是帧的 `focal`，场景编排围绕它的 claude 代码面（文件/头进入、镜头推到 hunk、落点行）——**不是**代码动画本身（那是块自带的）。每个代码帧的字段后立刻加一个 `### Source excerpt`，fenced `diff` 块，只含 worker 必须渲染的那个真实 hunk（最多 12 行）。这里从 `diff.patch` 选——**worker 被禁止重新打开完整 diff**。

**Step 5 — 最多三个 worker**

`pr-to-video` 限制 **最多三个 worker 总数**，跨 packet 路径均衡。每个 worker 可顺序构建多个分配的帧。worker 只读它的 packet 和 `frame.md`，绝不打开完整 `STORYBOARD.md`、`diff.patch` 或 `visible-text.txt`。

---

## 四、music-to-video：一条音轨驱动整条片

**定位**：输入是一条音乐（音频文件、或从视频里抽音频、或按心情描述生成一条），输出是节拍同步的视频。**音乐驱动所有节奏**；用户可选的图片/视频被剪到同一个节拍网格上。无旁白、无网站抓取。

### 运行流程（和叙事型的差异更大）

**两个贯穿全局的理念**：

1. **一个分析器，信它**。`analyze-beatgrid.py` 是唯一的节拍分析器——绝不拿别的工具重新量节拍或靠耳朵。它的能量/密度/rolls/onsets/静音段永远可靠；但 `bpm` 和 `beats_sec` **只在音乐真有节奏时可靠**，舒缓音乐上这个网格是跟踪器强加的一个节拍器，要按乐句和能量来走。判断属于哪种情况是每帧的 `pacing`（Step 2）。
2. **一帧一文件，组在帧里面**。Step 2 把音轨切成帧，每帧变成一个 composition 文件，由一个 frame-worker 建。一个帧可以再细分成组。**额外密度加在组里面**，所以**帧数追踪的是不同的处理，不是节拍**——快曲子不会让子代理数量爆炸。

**Step 0 — 音乐是脊柱**

音乐来源先确定。用户给了音频就用；没给就按心情描述生成（HeyGen 检索或本地 Lyria/MusicGen）。音轨落到 `assets/bgm.mp3`。**品牌（字体 + 配色）在 Step 3 选，不在这一步**——别提前挑风格或曲目类型。

**Step 1 — 分析音乐（唯一的分析）**

```bash
python3 <SKILL_DIR>/scripts/analyze-beatgrid.py "$PROJECT_DIR/assets/bgm.mp3" \
  -o "$PROJECT_DIR/audiomap.json" --print
```

写出 `audiomap.json`：能量相位、onsets + onset_rate、rolls、静音段、hard_stops、key_moments、乐句、tempo/grid、`audio.duration_sec`。确定性——同一个文件永远给同一张图。

**Step 2 — 帧骨架（只搭结构）**

自己读 `audiomap.json` 翻成 `STORYBOARD.md` 的骨架——**没有中间 JSON**。在真实的音乐变化处切帧（hard_stops、SURGE/DROP 的 key_moments、一个 roll 的边缘、一段没有 onset 的区间、一次大的能量跳），每个边界 snap 到一个 audiomap 锚点。每帧设 `span_sec`、`pacing`（Step 1 那个信任判断的结论：`beat_cut` 网格是真的时 / `phrase_flow` 强加在舒缓音乐上的节拍器时）、`mood`、一行 `feel`。这里**只分类和排布**——每帧的 `### Groups` 留 `TBD`，frontmatter 的 `style` 留空。预期 ~1-6 帧。

**Step 3 — 填计划（用户卡点）**

做两件事：(1) **挑品牌**——从预设里挑一个，**只用它的字体和颜色**（模板拥有构图），原样复制成 `frame.md`；(2) **填每帧**——决定它的组，给每个组一个处理（模板 / 自由组合 / 资产处理，且**遵守 pacing**）。写文案。**你拥有 WHAT，worker 拥有 HOW——绝不在故事板里写毫秒级 tween**。跑 `validate-plan.mjs` 验证，修掉每个 `✗`，然后展示帧级总结给用户迭代到批准。

**Step 4 — 逐帧构建**

每帧派一个 frame-worker。worker 把引用的锚点转成帧本地秒（`local_t = track_t − span_sec[0]`），用 0ms 切换 gate 它的组，写一个 seek-safe 的帧文件。

**Step 5 — 组装（确定性，无子代理）**

`assemble-index.mjs` 是确定性的——没有子代理、没有判断。它在累积的 `data-start` 处引用每个帧文件，把 `assets/bgm.mp3` 挂到 track 11，帧之间硬切（帧铺满音轨没有间隙，所以**没有转场注入器**）。

**Step 6 — 验证和渲染**

CLI 跑在**组装后的项目**上（这是正确的单位，每帧 worker 没法跑它）。在 `t=0`、每个帧起点、最强的 DROP/SURGE、每个 `hard_stops[].t`、最后一帧处审。失败就自己做**最便宜的安全修复**，改 `compositions/frames/NN-*.html`。**绝不改时长或音频时序来掩盖同步问题**。

---

## 五、motion-graphics：天生自治，一路到渲染

**定位**：一个短的、设计主导的、无旁白的动效——动效即信息。通常 10 秒内（最多 ~30s）。动态排版、数字计数、图表命中、logo 定音、下三分之一、地图、推文/新闻/标题动画、网页动画、或把真实图片的几何融进图表。渲染成 MP4 或透明 overlay。

### 运行流程（最短，无用户卡点）

这是**天生自治**的工作流——最多一个澄清问题（由它的 director 步骤拥有），然后一路到渲染。协作/自治的区分在这里不加 gate。

**资产优先**：先决定资产策略、拿到真实素材，**然后**围绕你有的东西设计镜头。

| 阶段 | 产物 |
| --- | --- |
| init | `hyperframes.json` |
| plan（子代理：Director Part 1） | `shot-plan.json` 草稿 |
| source（Bash：media-use，条件性） | `assets/` + `assets/index.md` |
| design（子代理：Director Part 2） | `shot-plan.json` 最终版 |
| build（子代理：Builder） | `compositions/index.html` |
| render（Bash） | `renders/video.mp4` |
| verify（Bash→失败时修复子代理） | 原地修复 |

**关键 fork 在 plan 的第一个决策**：这个需要搜索吗？

- **不需要** → 挑一个**形态类别**（kinetic-type / stat / charts / logo-reveal / lower-thirds / maps）；内容用户给；`asset_needs: []`。
- **需要** → 往 `asset_needs[]` 里吐一个搜索计划。具体的**搜索驱动类别**（webpage / news / tweet / asset-fusion）由 Step 2 返回的内容类型确认。

source 那步（`◇`）**只在选中的类别声明了资产时才跑**。纯代码/文字类别（kinetic-type、大多数 charts/stat）`asset_needs: []`，直接从 plan 跳到 design。

**Step 5 渲染**可以输出透明 overlay：`--format webm`（或 mov）。

**Step 6 验证**：`check` 退出 0 就完事。lint/inspect 错误时派修复子代理——**修复时绝不改一个已经定死的时长**。

**运行中不开预览**。只在用户要求时、渲染**之后**开一次。

---

## 六、website-to-video：把一个普通网站变成视频

**定位**：抓一个**普通**网站/URL，变成一个**关于这个网站的**视频——tour、展示、社交短片，用抓到的截图和网站自己的品牌素材。**不是产品发布**（那走 product-launch）。

### 运行流程（七步，和叙事型略有不同）

website-to-video 有 7 步，命名风格也不一样（step-0 到 step-6 的 references 文件）：

- **Step 0 — 抓取 & 理解品牌**：抓站点，读抽取的数据理解品牌和产品（做什么、给谁、什么口吻、什么氛围）。**策略优先**——先讲产品做什么给谁、品牌口吻，再讲资产/色/字体清单。
- **Step 1 — 品牌身份**：写 `DESIGN.md`（品牌速查表：色、字体、组件风格、布局原则）。快速路径下可以是 50 行摘要。
- **Step 2 — 策略 & 信息**：先和用户对齐**这条片子必须说什么**，再谈视觉或资产。锁住视频类型、时长、格式、**信息和叙事弧线**。
- **Step 3 — 故事板 + 脚本（用户卡点）**：概念优先写故事板（信息→叙事弧→服务于弧的 beat→每 beat 的技巧→最后品牌点缀）。
- **Step 4 — VO、时长 + 字幕（用户卡点）**：问 TTS 提供商（HeyGen / ElevenLabs / Kokoro），生成音频，转录，把时间戳映射到 beat。然后问字幕。
- **Step 5 — 构建 composition**：子代理在每个 beat 上跑 lint 和 snapshot 后回报。主代理逐 beat 通读 `compositions/beat-N.html`。
- **Step 6 — 验证 & 交付**：snapshot 数量按公式缩放（`max(beats × 3, ceil(duration_seconds / 2))`）。交付 localhost Studio 项目 URL——**只在用户明确要求时渲染成 MP4**。

**一个特别的纪律**：website-to-video 强调"**自治模式不是跳过所有 gate**"。自治模式覆盖**用户偏好**问题（TTS 提供商、声音、配色强调、beat 数、要不要音乐/字幕），**不覆盖质量验证 gate**——资产审计、逐 beat HTML 通读、DoD 清单、诚实披露（"我没验证什么"必须出现在最终总结里）。如果你发现自己在想"auto 模式偏向行动，所以我跳过 X"——而 X 是验证 gate 不是偏好问题——这个推理是错的。

---

## 七、talking-head-recut：给现有人像视频套图形卡

**定位**：拿一段**完整播放**的人像视频，在它上面叠一系列带时序的、设计过的**图形卡**——标题、下三分之一、数据点、引言、侧栏、画中画——同步到转写。**底下的视频原样不动**。重定时、重新着色、重构图、重排、改音频都是 NLE 编辑，**出范围**。

### 运行流程（十一步，自给自足）

这个工作流**完全跑在 hyperframes CLI + 系统 ffmpeg/ffprobe 上**，转录是本地 Whisper，不需要第三方服务、API key 或限速代理。

1. **检查环境**（`doctor` + 确认 bundled 资产）
2. **建工作目录**（`videos/<project-name>/`）
3. **抽音频和元数据**（ffprobe 出 duration/w/h/fps；ffmpeg 抽 audio.mp3）
4. **转录**（`hyperframes transcribe`，本地 Whisper，词级 `transcript.json`）
5. **校正转写**（修 ASR 错误，**保留 start/end 时间戳**）
6. **起草轻量故事板**（在对话里设计卡片，`storyboard.json` 是 agent 内部规划产物，**没有 CLI 命令消费它**）
7. **定渲染策略**（先问用户：输出比、布局、风格组、卡片密度预设——用 AskUserQuestion 或纯文本回退）
8. **写每张卡的 HTML**（`public/cards/card-XX.html`，动画用 `data-anim-*` 声明而非写脚本）
9. **组装 composition HTML**（把卡粘进 `index.html`，编译 `data-anim-*` 进一条主 GSAP 时间线，视频重新编码成密集关键帧 `-g 30` 保证每帧可 seek）
10. **渲染成 MP4**
11. **报告结果**

**卡片数量怎么定**：从一个**基础步频**（按视频时长）× **密度乘数**（按转写信息密度：高×0.7 / 中×1.0 / 低×1.5）推出，下限固定最少 5 张，**无上限**——长视频自然产生更多卡。

**一个核心设计**：动画**声明而非编码**——用 `data-anim-*` 属性（`fade-in`、`slide-in`、`kinetic-chars`、`count-up`、`grow-x` 等 13 种），Step 9 把每个声明编译进单条主 GSAP 时间线。卡 HTML 里**禁止 `<script>` 标签**。

---

## 八、embedded-captions：给视频加字幕

**定位**：一个 catalog（36 个视觉身份）后面两个引擎。给一段 talking-head 视频加字幕——可以是**前景轨道**（标准下三分之一字幕，大部分文字），加上偶尔的**嵌入高潮**（一个词合成**到人背后**，靠抠像遮挡）。本地端到端跑，自己转录、自己抠像，不要 API key。

### 运行流程（五步）

**前置决策 gate**：先探测视频，**拒绝坏素材**——多说话人/硬切（按镜头分割各自渲染，或拒绝）、无人像、不到 3 秒、无语音、脸从不清楚出现、**源视频已经烧了字幕/重文字图形**、转写是垃圾、手持摇晃快动（抠像闪烁）。

1. `hyperframes init`（目录已存在且内有视频则跳过）
2. `bash scripts/prepare.sh`（抠像 ∥ 转录 ∥ 音频包络并行，然后安全区 v2——一条命令搞定）
3. **[唯一的创作步骤]** 写一个小 JSON 的创作选择（先读 `safe-zones.json`）
4. `node scripts/preview-frames.cjs`（~2 秒/帧的忠实合成预览，**渲染前**做视觉 QA）
5. `bash scripts/render-and-composite.sh`（gate → `final.mp4`）

**字幕模型是关键**：每个说的短语是三件事之一——`drop`（填充词，不显示）/ `rail`（默认，普通口语内容，干净下三分之一，**在前面**）/ `embed`（被提升的高潮，一个大词合成**在人背后**）。**rail 承载大部分文字，embed 是稀缺的、挣来的高潮**。把每个词都嵌入是最常见的错误。

**铁律**：视频原样交付，字幕是唯一添加的东西；抠像只是让人能遮挡嵌入轨道。**绝不给视频重新分级/重新着色**。赛博朋克/CRT 质感属于字幕元素里面，不在整帧上。

---

## 九、slideshow：产出可导航的 deck，不是 mp4

**定位**：一个演示文稿、pitch deck 或可交互 deck——离散的幻灯片、片段揭示、分支、热点导航、内置的演讲者模式。**输出是一个可导航的 deck，不是渲染的 mp4**。

### 运行流程（和别的都不一样）

slideshow 是一个**正常的 HyperFrames composition**，只多了一样东西：一个 **JSON island**，声明哪些场景是幻灯片、它们怎么连。播放器的 `SlideshowController` 读这个 island，把连续的 GSAP 时间线变成离散的、可导航的 deck。

**核心警告**：**别把 slideshow `hyperframes render` 成单个 mp4。** deck 是几个顶层场景 composition（每张一个 `data-composition-id`）授权的，**没有主根 composition 包裹**，所以 `render` 只解析**第一个** composition，吐出一个**静默截断**的 mp4（比如 40 秒的 deck 只出 6 秒）。线性主线导出（只主幻灯片，排除分支）是**推迟的**——目前支持的输出是实时的 `present` deck 和逐幻灯片的 `snapshot` 静图。

**幻灯片写作硬约束**：标题是完整句子的论断不是标签；一张幻灯片一个观点 + 一个视觉；**结论先行**；只做自下而上的市场估算（别写"$50B TAM"不展示算法）；字体最小 30pt 等效（1920×1080 下标题 72-96px，正文 48px）。

**片段**：一个片段是幻灯片 `[start, end]` 范围内的一个绝对时间线时间，控制器在那里保持一个揭示状态。导航是**seek 驱动的，不是 play 驱动的**——控制器绝不为了在片段间移动而开始播放，每次导航是一次到目标保持时间的确定性 seek。

---

## 十、remotion-to-hyperframes：单向迁移

**定位**：**只**在用户明确要求移植/转换/迁移/翻译一个已有的 **Remotion**（React）composition 的源到 HyperFrames HTML 时用。单向、Remotion-only。

### 运行流程（五步）

1. **Lint 源**：`lint_source.py` 检测没法干净翻译的模式。**Blocker**（拒绝 + 推荐 interop）：`useState`、`useReducer`、带非空 deps 的 `useEffect`/`useLayoutEffect`、异步 `calculateMetadata`、第三方 React UI 库。**Warning**（丢掉结构后翻译）：`@remotion/lambda` 配置、`delayRender`、`useCallback`、`useMemo`。任何 blocker 触发就**停**。
2. **计划翻译**：读 `api-map.md`——每个 Remotion API 及其 HF 等价物的索引。只加载源用到的那几个 reference。
3. **生成 HF composition**：根 `<div id="stage">` 带 `data-*`；场景 div 的扁平列表；内联 `<style>` 设每个动画属性的 from 态；底部一个 `<script>` 含一条暂停的 `gsap.timeline`；每个 `useCurrentFrame()` 推导变成这条时间线上正确偏移的一个 tween。
4. **验证**：跑评估 harness——渲染 Remotion 基线、渲染 HF 翻译、SSIM diff。阈值：约低于源的复杂档 p05 的 0.02。两边渲染必须用匹配的像素格式（Remotion 源设 `Config.setVideoImageFormat("png")` + `Config.setColorSpace("bt709")`），否则 diff 量的是编码器差异而非翻译保真度。
5. **记录缺口**：没干净翻译的东西写进 `TRANSLATION_NOTES.md`。

**明确不做**：翻译 React 状态机（靠 `useState` + `useEffect` 驱动动画的不是 seek 模型下的确定性帧捕获目标）；反向导出（HF → Remotion）。

---

## 三种范式对比与选型

把十个工作流按"**卡点数量**"和"**子代理派发**"两个维度看，三种范式很清楚：

| 范式 | 代表 | 用户卡点 | 子代理 | 适用 |
| --- | --- | --- | --- | --- |
| 叙事创作型 | faceless / product-launch / pr / website | 多（brief、故事板、渲染前审） | Step 5 逐帧派 frame-worker | 从零创作一条讲解/宣传片 |
| 自治直达型 | motion-graphics | 几乎无（最多一个问题） | plan/design/build 各派一个 | 短的、无旁白的单镜头动效 |
| 素材加工型 | talking-head / captions / music | 少（素材已定，策略可问可不问） | 少或无（流程确定性高） | 已有一段视频/音频要加工 |

**选型建议**：

- 如果你要从一段文字/文章讲清楚一个概念 → `faceless-explainer`。
- 如果你要给一个产品做宣传片 → `product-launch-video`。
- 如果你要把一个 PR 的代码改动讲成视频 → `pr-to-video`。
- 如果你要做一条短的、酷的、动效即信息的东西（logo 定音、数字计数、动态标题）→ `motion-graphics`。
- 如果你要把一段音乐变成节拍同步的视觉化 → `music-to-video`。
- 如果你有了一段人像视频，想给它加设计的图形覆盖（标题、数据点、下三分之一）→ `talking-head-recut`。
- 如果你只是想给视频加字幕（而且是要酷的那种）→ `embedded-captions`。
- 如果你要做的是一个**演示文稿**（可导航、有演讲者模式）→ `slideshow`。
- 如果你要把一个现有的 Remotion 项目搬到 HyperFrames → `remotion-to-hyperframes`。
- 以上都不精确匹配 → `general-video`（兜底，也是所有协作共创模式的宿主）。

---

## 几个跨工作流的共性纪律

读完十个工作流，有几条规律是反复出现的，值得单独拎出来：

**1. brief 在 init 之后、作为第一个动作写。** `init` 拒绝非空目录，所以 BRIEF.md 永远在 init 之后写，绝不在之前。之后不再问任何 brief 问题。

**2. 登录状态原样转述，不当附带说明。** 几乎所有涉及音频的工作流，Step 0 都先 `npx hyperframes auth status` 并**原样转述输出**，不意译不改写。没登录就停下等用户选——这是个真决策点，不能折进 brief 问题里，也不能把 key 写进 per-repo 的 `.env`。

**3. 背景图不能设在 `#root` 上。** 多个工作流的 Step 5 都强调：满屏背景要挂在一个 `class="clip"` 的全时长背景层上，**绝不**设在 `#root`/`data-composition-id` 元素上——否则它被 clip 门控在帧的窗口里，深色内容会落到黑色的宿主 body 上渲染成不可见。全片的基地底色由组装器从 `frame.md` 的 canvas 色画到 index 的 `#root` 上。

**4. worker 永远不跑 CLI。** 逐帧构建的 worker 只写文件到契约然后停。CLI 命令操作的是组装后的项目，那时还不存在。验证在组装之后（Step 6）。

**5. 渲染前永远卡一道人审。** 检查通过不等于该渲染。自治模式保留的唯一问题通常是"先预览还是直接渲染"。渲染后别重跑 lint/validate/inspect/snapshot，除非用户要求。

**6. 恢复表是标配。** 几乎每个工作流都有一张"你现在有什么产物 → 从哪一步继续"的表。这让中断后恢复变成机械的查表，不用重新推理。

---

这篇和上一篇《[拆解 HyperFrames](/posts/hyperframes-skills-deep-dive)》是配对的：上一篇讲**架构**（入口怎么分诊、意图层怎么收敛、core 契约怎么保证确定性），这篇讲**运行**（每个工作流内部怎么一步步跑）。两篇合起来，基本覆盖了 HyperFrames 这套 skill 体系的全部——从一个模糊的"给我做个视频"请求，到一条渲染好的 mp4，中间每一层在干什么、卡在哪里、派谁干活。

如果你只记一件事：**HyperFrames 的每个子 skill 都是一个有明确 gate 的流水线，gate 的位置（brief、故事板、渲染前审）是它区别于"让 AI 随便生成"的关键——把可重复的确定性交给脚本，把真正需要人判断的节点卡住。**
