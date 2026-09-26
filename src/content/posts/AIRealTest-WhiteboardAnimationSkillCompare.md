---
title: 【AI实测】同一个火柴人故事，三个白板手绘动画 skill 的横向实测：geeklee、nikola 与 HandDraw
published: 2026-09-26
description: 把《减肥第一天》这个 42 秒火柴人小剧场，用同一份字幕、同一条配音轨、同一套代码绘制的线稿，分别交给 geeklee/srt-whiteboard-animation、nikola 手绘讲解 skill 和 HandDraw-Skill 三条技术路线实测出片。本文记录三版的制作过程、同帧对比图、体积与工时数据，以及一个有趣的实锤：nikola 的逐笔路线就是 vendor 了 geeklee 的引擎。文末给出这三类方案的选择建议。
lang: zh
tags: [AI实测, Agent Skill]
abbrlink: whiteboard-animation-skill-compare
---

给结论先：**三个都能出片，但它们其实不是同一种东西**。geeklee 和 nikola 是"成品图 + 遮罩揭示"的老派白板机制（VideoScribe 那一套），胜负手在编排和工程化；HandDraw 是"SVG 真描边 + Remotion"的动画 DSL 路线，胜负手在精确控制和可编程性。最有趣的发现是：**nikola 的逐笔路线直接 vendor 了 geeklee 的渲染器**（仓库里有 `UPSTREAM.md` 实锤），所以这两版的画面天然同源，比的是增强层；而 HandDraw 和它们连"画"的定义都不一样。

下面是完整的实验记录。

---

## 实验设计：把变量钉死

我此前拆解过 srt-whiteboard-animation 的实现原理（分区遮罩 + 骨架笔迹 + 预览台工作流），但只跑一个 skill 终究是"纸上谈兵"。这次我给它加了对照组：

**同一个故事**：《减肥第一天》，三幕反转结构——深夜上体重秤爆表痛下决心 → 清晨热血出门跑步、五百米后扶树喘成风箱 → 深夜躺沙发刷美食视频、最终抱着一桶炸鸡含泪投降。每幕 14 秒，全片 42 秒。

**统一的变量**：

- 同一份 SRT 字幕（6 条口播，含"减肥？还是从明天开始吧！"的名言收尾）
- 同一条配音轨：Edge TTS 云希音色、语速 +10%，先混出一条 `track.wav`，三个版本共用（避免各 skill 内置 TTS 的音色/时序差异污染对比）
- 同一套视觉语言：暖米黄纸底 `#F5EBD7`、深灰线条、红/橙/蓝少量点缀、画面无文字
- **线稿统一用代码画，不用 AI 生图**。原因有二：一是排除生图模型的随机性，保证"同一套素材"名副其实；二是我的环境里本来就没有生图 API。火柴人恰好是线条加圆圈，用 PIL 按骨骼坐标画即可，还天然符合各 skill 对"清晰线稿"的要求

**三位选手**（选择标准：能在我这台 Windows 上真正本地出片，且技术路线互不相同）：

| 选手 | 技术路线 | 时序来源 | stars |
|---|---|---|---|
| ① geeklee/srt-whiteboard-animation | 位图 + 分区遮罩 + 骨架笔迹（Python/OpenCV） | SRT 分区 | 3.5k |
| ② hi-nikola/hand-drawn-explainer-video-nikola | 逐笔路线 vendor geeklee 引擎 + 自己的 QA 层 | SRT 分区 | 346 |
| ③ ToBeWin/HandDraw-Skill | SVG 描边动画 + Remotion（JSON DSL） | DSL 精确到对象/秒 | 3 |

**没参赛的选手**也交代一下：brandonvant/claude-skill-whiteboard-explainer 需要 openai-whisper 词级时间戳和按元素拆图的生图管线；nutllwhy/whiteboard-book-video-skill 依赖 AI 生图与 BGM 服务；YangAgent、universal-whiteboard、zjs 这三个与 geeklee 同范式，信息增量低；RSA-Whiteboard-Animation 和 geeklee 自家的 srt-vox-director 只出分镜文档/提示词包，不出片。

---

## ① geeklee：上篇的主角，这次的基准

制作流程就是调研时拆解的那套：`parse_srt.py` 解析字幕分镜 → 每幕一张线稿 PNG + 同名 `annotation.json`（分区、时序、字幕绑定）→ `render_stream_whiteboard.py --ink-path skeleton` 逐幕渲染 → `merge_scenes.py` 合并 → ffmpeg 混音。三幕各 2 个叙事分区（左右语义岛），笔尖沿 Zhang-Suen 骨架逐笔画线，起笔铺线稿（ink）→ 添彩还原原色（color），未画的分区被遮罩死死捂住。

这次没有踩任何新坑——管线在先前的调研中已经全部跑通，本次只是换了故事和素材。

## ② nikola：同一台引擎，多一层工程化

先说实锤。上次调研时我从 nikola 的 README 猜测它的逐笔路线与 geeklee 同源，这次克隆下来验证了：

```text
nikola-skill/vendor/srt-whiteboard-animation/
├── UPSTREAM.md            # 记录上游 repo、MIT 许可、bundled commit
├── scripts/               # render_stream_whiteboard.py 等，与 geeklee 同名同构
└── assets/drawing-hand.png
```

对渲染器做规范化 diff（忽略换行符）后，nikola 相对上游的改动集中在四处：

1. **渲染前 schema 校验**：新增 `annotation_schema.py`，坐标越界、画布尺寸不符、缺时序字段直接阻断
2. **手部缓动跟随**（`--hand-follow`，默认 1.0，建议 0.35）：手以缓动追随笔尖，降低跨笔画时手部瞬移的视觉跳动
3. **手部尺寸控制**（`--hand-height`）：16:9 复杂场景建议 260–340，而不是默认的 493 大手
4. **空帧行为修复**：无可画像素时保持画布，不再把手印在画布正中央

所以 nikola 版的制作为：`stroke_story_preflight.py` 六项预检（含一次本地冒烟渲染）→ 三份标注全部通过 schema 校验 → 用 `--hand-follow 0.35 --hand-height 320` 渲染 → 合并混音。一次通过，没有返工。

画面内容与 geeklee 版完全一致（同一套 PNG、同一台引擎），你能看到的区别是：**手更小、更稳**。这也是两个版本体积差异的来源——nikola 版 1.65MB 对 geeklee 版 2.0MB，小手的运动像素少，压缩自然省。

## ③ HandDraw：换掉范式的 SVG 描边路线

前两版的"笔迹"本质是**遮罩揭示**——图早就画好了，笔只是揭开幕布的手。HandDraw 完全不同：每个元素是一条条 SVG path，`draw` 动画用 stroke-dashoffset 沿路径真描边，笔到哪线到哪。时序由 JSON DSL 精确定义：

```json
{ "id": "runner", "kind": "svg", "asset": "runner.svg",
  "x": 320, "y": 478, "width": 380, "height": 420,
  "animations": [{ "type": "draw", "start": 1.0, "duration": 3.5 }] }
```

我为三个场景手写了 20 个 SVG 素材（火柴人就是 line/circle/path，SVG 原生友好），选用 `narrative-sketch` 模式（去掉商务页眉和矢量手，纯纸面），Remotion 渲染（首次运行自动下载 Chrome Headless Shell，约 113MB）。

踩了三个坑，都值得记下来：

- **树冠又长眼睛了**。我在场景二画了树冠大圆 + 两侧低处小圆，位置一旦靠近圆的下缘就酷似一张脸——和上一篇文章里画 PNG 线稿时犯的是同一个错。纯 SVG 重画时干脆去掉两个小圆，棒棒糖树最稳
- **头和脊柱脱节**。跑步小人的头部圆和脊柱线段坐标没对齐，定格帧里脑袋悬空。修法是把头圆心精确放在脊柱延长线、距离等于半径处
- **`HANDDRAW_PYTHON` 在 Windows 上不生效**。它的 CLI 用 `python3` 调 edge-tts 合成旁白，按文档设置环境变量后运行时依然取不到。最后我干脆绕开它的音频环节，用渲染包直接出无声视频，再混用那条公共音轨——因祸得福，三版的音频变量反而更干净了

---

## 同一时刻，三条管线在画什么

![三个 skill 同帧对比：t=4.2s 作画中、t=9.0s 第二分区、t=41.5s 结尾定格](/assets/images/2026/20260926/whiteboard-compare/compare-sheet.webp)

这张同帧对比图信息量很大：

- **t=4.2s（幕 1 作画中）**：① ② 的照片手正沿着骨架笔画推进，火柴人已成形；③ 的地面和体重秤已画完，小人才描到一半——头部圆弧还没闭合、手臂刚起笔。它按 DSL 声明的对象顺序逐个真描边，每个对象独占自己的时间段
- **t=9.0s（幕 1 第二分区）**：① ② 的分区遮罩保证了左侧画完的内容完好保留、右侧镜子区域正在落墨；③ 的镜子小人的头和肚子还是两段圆弧——SVG 描边是按路径长度比例推进的，圆要转一圈才闭合
- **t=41.5s（结尾定格）**：① ② 几乎一致（同素材）；③ 构图相同但气质不同——没有上色阶段，线条保持细描边，画面更"线稿"、更平静

③ 有一个隐藏差异值得单独看：它的叙事模式去掉了"手"，观众看到的是线条自己生长。![HandDraw 版场景二定格：跑步与树](/assets/images/2026/20260926/whiteboard-compare/handdraw-scene2-final.webp)

## 成片与数据

三版成片（同一条配音轨，建议声音打开）：

**① geeklee/srt-whiteboard-animation**（960×540@60fps，2.0MB）

<video controls preload="metadata" src="/assets/images/2026/20260926/whiteboard-compare/videos/geeklee.mp4"></video>

**② nikola（同引擎 + 手部平滑）**（960×540@60fps，1.65MB）

<video controls preload="metadata" src="/assets/images/2026/20260926/whiteboard-compare/videos/nikola.mp4"></video>

**③ HandDraw-Skill（SVG 描边 + Remotion）**（1920×1080@30fps，1.03MB）

<video controls preload="metadata" src="/assets/images/2026/20260926/whiteboard-compare/videos/handdraw.mp4"></video>

| 维度 | ① geeklee | ② nikola | ③ HandDraw |
|---|---|---|---|
| 分辨率/帧率 | 960×540 / 60fps | 960×540 / 60fps | 1920×1080 / 30fps |
| 体积（42s） | 2.0MB | 1.65MB | 1.03MB |
| "手" | 照片手（作者品牌笔杆） | 照片手（可调大小/平滑） | 无（narrative 模式可开简笔手） |
| 上色阶段 | 有（ink→color 2:1） | 有 | 无（描边即完成） |
| 时序粒度 | 分区级（startMs/durationMs） | 分区级 | 对象级（秒，可精确到 0.01） |
| 元素运动能力 | 无（揭示即静止） | 无 | 支持 move/rotate/scale/fade/highlight |
| 本次工时 | ≈0（管线复用） | ≈10 分钟，一次通过 | ≈1 小时，两轮返工 |
| 依赖 | Python + OpenCV/PyAV | 同左（自带预检） | Node + Remotion + Chrome Headless |

工时一栏要说明：① 的"零工时"是因为上一篇文章已经把环境和素材流程全部趟通，从零开始它的成本约等于 ②；② 比想象中顺利，预检和 schema 校验把错误挡在了渲染之前；③ 的成本在"手写 SVG + DSL 编排"，以及 Windows 兼容性的小坑，但这笔钱换来的是三版里最强的可控性——想让某个元素晚 0.5 秒出场、或者让它平移入场，改一个数字就行，前两版则需要重新理解遮罩几何。

## 怎么选

- **要"真·手绘白板"的质感**（照片手、先线稿后上色、纸张氛围）：选 geeklee / nikola 路线。两者之间选 nikola——手部平滑和预检层是实打实的体验提升，而且它的程序动画路线（HTML/SVG/GSAP）还能兜底"画面需要图表和精确文字"的场景，这是纯遮罩方案做不到的
- **要精确时序和元素动效**（步骤演示、流程动画、以后想加运镜）：选 HandDraw 路线。它的美术上限就是你写 SVG 的水平，火柴人恰好是这个范式的舒适区
- **有 AI 生图 API、追求口播词级同步**：值得去试 brandonvant 和 nutllwhy 这两个 HyperFrames 系 skill——Whisper 词级时间戳做时序源是这条赛道里独一档的精细度，本次因环境限制未能实测
- **一个冷知识**：这条赛道所有的"手绘感"，本质都是 VideoScribe 2008 年的机制——成品图加遮罩揭示，或者矢量路径描边。真正的分水岭从来不是"像不像手画的"，而是**时序从哪来**（SRT 分区 / Whisper 词级 / DSL 手排）和**编排层有多少工程化保障**

## 附：复现信息

- 故事与素材：《减肥第一天》三幕 × 14s；SRT 6 条；PIL 绘制的线稿 PNG（1600×900）与 SVG 素材各一套；公共配音轨 `track.wav`（edge-tts，zh-CN-YunxiNeural，+10%）
- ① geeklee：`.venv` + `render_stream_whiteboard.py --ink-path skeleton --cap-long-edge 960`，三幕渲染后 `merge_scenes.py` 合并、ffmpeg 混音
- ② nikola：vendor 引擎同上，增加 `--hand-follow 0.35 --hand-height 320`；渲染前跑 `stroke_story_preflight.py` 与 `annotation_schema.py`
- ③ HandDraw：`npm install && npm run build`，JSON DSL 三场景 × 7–8 对象，`renderProject` 直出 1080p30，ffmpeg 混音（绕过其 CLI 的 `python3` 依赖）
- 三个成片与本页配图均已包含在本文，工作区目录 `stick-figure-compare/{geeklee,nikola,handdraw}/` 保留了全部中间产物（标注 JSON、SVG、DSL 工程、预检报告）
