---
title: 【AI实测】Pollinations 六个免费文生图模型实测：zimage 不输 Agnes、还更快
published: 2026-06-27
description: '8 道经典 benchmark 横评 Pollinations 六个免费文生图模型（flux/zimage/gptimage/klein/nova-canvas/gptimage-large）：zimage 全篇最强、中文思维导图大字唯一画对、秒级 GET 出图，质量不输 Agnes 还更快；gptimage-large 海报/英文最高保真。'
lang: zh
tags: [AI实测]
abbrlink: pollinations-image-realtest
---

前面 Agnes、智谱两家测完了。这一篇轮到 Pollinations——开源圈最“出圈”的免费图片 API。

它最讨喜的地方很直接：**不用 POST、不用 JSON body，一行 GET URL 就能出图**——返回的直接是图片字节，key 塞进 `Authorization` 头（或 `?key=`）就行：

```
https://gen.pollinations.ai/image/a%20cat%20on%20the%20moon?model=flux&width=1024&height=1024&seed=42
```

这种“URL 即图片”的接口形态，在所有免费图 API 里独一份（Agnes、智谱都得 POST + JSON body）。这次我测了 **六个**文生图模型：`flux`、`zimage`、`gptimage`、`klein`、`nova-canvas`、`gptimage-large`，**8 道经典 benchmark 题 × 6 模型 = 48 张图，全在下面逐张展示**。（另有图片**编辑**模型 `kontext`，不是文生图、没进横评，第四章顺带提。）

📌 这是 **Pollinations 实测系列的图片篇**，和 Agnes、智谱用同一套 benchmark 横评。🔧 **这次实测怎么跑下来的**：统一网关按 pollen 计费，单 key 单小时约回 0.15 pollen——这次 56 张统一网关图（48 张横评 + 8 张 kontext 探针）跑了 9 个整点周期（~8 小时）才跑完。额度细节见第四章。

## 太长不看

- **质量不输 Agnes**：英文招牌 `AGNES AI`、中文海报、手部（无畸形）都能拉平 Agnes；**中文思维导图是分水岭——6 模型里只有 zimage 把中心 + 四分支标题都画对**（但说明小字也乱码；gptimage 只中心对，gptimage-large 全乱）。
- **速度 + 调用是赢点**：zimage ~7s、flux ~5s 秒级出图（Agnes ~26s），而且 GET 一行 URL、不用 POST+JSON——这是 Pollinations 最讨喜的地方。
- **模型分化**：zimage 全篇最强（唯一把思维导图的大字画对，小字仍乱码）；gptimage / gptimage-large 海报/英文/手部强、但思维导图都栽；flux 快但只擅长英文/简单场景，中文复杂题连续翻车；klein 中文文字不行；nova-canvas 文字/结构整体差。
- **都有的短板**：精确数量 6 模型全栽（餐具对不上“恰好 6”）；思维导图说明小字全员乱码（连 zimage 也不例外），分支大字也只有 zimage 全部画对。
- **免费**：要 key、按 pollen 计费（Seed 档每小时约 0.15 pollen），不是真免费；只有转录和文本 LLM 接近敞开免费。
- **推荐**：首选 **`zimage`**（中英文稳、思维导图大字最准、~7s、~0.002 pollen）——质量不输 Agnes、速度和调用还略胜一筹；要海报/英文最高保真再上 **`gptimage-large`**（慢且贵，思维导图它也栽）。要纯免费不限量才转 Agnes。

下面是完整过程——8 题逐张展示。

## 一、八道题逐张横评

下面 8 道题逐张展示，每题 6 个模型。网格顺序固定为：上行 `flux / zimage / gptimage`，下行 `klein / nova-canvas / gptimage-large`（真实身份 / 参数量 / pollen / 速度见第四章）。

### 第 1 题：宇航员骑马（语义合成 + 主体组合）

文生图“Hello World”——测能否理解“骑”、把宇航员合理放马背上、火星地貌。

**提示词**：An astronaut riding a horse on Mars, photorealistic, cinematic lighting, full-frame centered composition, the astronaut and horse filling most of the frame

<table>
<tr><th>flux</th><th>zimage</th><th>gptimage</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/astronaut_horse__flux.png" width="100%" alt="宇航员-flux"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/astronaut_horse__zimage.png" width="100%" alt="宇航员-zimage"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/astronaut_horse__gptimage.png" width="100%" alt="宇航员-gptimage"/></td>
</tr>
<tr><th>klein</th><th>nova-canvas</th><th>gptimage-large</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/astronaut_horse__klein.png" width="100%" alt="宇航员-klein"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/astronaut_horse__nova-canvas.png" width="100%" alt="宇航员-nova-canvas"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/astronaut_horse__gptimage-large.png" width="100%" alt="宇航员-gptimage-large"/></td>
</tr>
</table>

**判定**：6 个模型都正确画出“宇航员骑马 + 火星红土地貌 + 满框构图”（flux/zimage/gptimage 经视觉模型逐个确认；klein/nova-canvas/gptimage-large 生成成功、场景正确）。语义合成这关**全员过关**——这是文生图的基本功，6 个模型都没问题。

### 第 2 题：霓虹招牌 "AGNES AI"（英文文字渲染）

文字渲染是文生图公认难点。

**提示词**：A neon sign on a brick wall that reads "AGNES AI" in glowing pink letters, night photography, the sign large and centered filling most of the frame

<table>
<tr><th>flux ✅</th><th>zimage ✅</th><th>gptimage ✅</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/text_rendering__flux.png" width="100%" alt="文字-flux"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/text_rendering__zimage.png" width="100%" alt="文字-zimage"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/text_rendering__gptimage.png" width="100%" alt="文字-gptimage"/></td>
</tr>
<tr><th>klein ✅</th><th>nova-canvas ❌</th><th>gptimage-large ✅</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/text_rendering__klein.png" width="100%" alt="文字-klein"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/text_rendering__nova-canvas.png" width="100%" alt="文字-nova-canvas"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/text_rendering__gptimage-large.png" width="100%" alt="文字-gptimage-large"/></td>
</tr>
</table>

**视觉模型逐字誊抄**：flux / zimage / gptimage / klein / gptimage-large 都把 **“AGNES AI” 七字母全部画对**；**nova-canvas 画成 “AGNESS AI”**（多一个 S）。**英文文字 5/6 过关**（nova-canvas 不行）。

### 第 3 题：两只橘猫下棋（中文提示词 + 多主体）

一题压三能：中文遵循、多主体（两只猫）、复杂场景（棋盘+霓虹+雨夜）。

**提示词**：赛博朋克风格，两只橘猫在霓虹灯下的街道上对弈国际象棋，雨夜，高细节，电影感，两只猫和棋盘居中填满画面主体

<table>
<tr><th>flux ❌</th><th>zimage ✅</th><th>gptimage ✅</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/two_cats_chess__flux.png" width="100%" alt="猫-flux"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/two_cats_chess__zimage.png" width="100%" alt="猫-zimage"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/two_cats_chess__gptimage.png" width="100%" alt="猫-gptimage"/></td>
</tr>
<tr><th>klein ✅</th><th>nova-canvas ⚠️</th><th>gptimage-large ✅</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/two_cats_chess__klein.png" width="100%" alt="猫-klein"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/two_cats_chess__nova-canvas.png" width="100%" alt="猫-nova-canvas"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/two_cats_chess__gptimage-large.png" width="100%" alt="猫-gptimage-large"/></td>
</tr>
</table>

**判定**：zimage / gptimage / klein / gptimage-large 都画出 **2 只猫 + 棋盘 + 赛博朋克雨夜**。**flux 翻车**——无视 prompt 画成一幅亭子+草地+远山的风景画，没猫没棋盘；**nova-canvas 画了 2 只猫但没棋盘**（还把左猫画成紫色）。**4 过、flux 翻车、nova-canvas 半对。**

### 第 4 题：中秋海报（中文文字渲染——海报场景）

主标题「花好月圆」+ 副标题「中秋特惠 全场八折」，竖版构图。参考 PosterBench。

**提示词**：中秋促销海报，深蓝色夜空一轮圆月，下方桂花枝条装饰，主标题大字「花好月圆」四个汉字居中放大，副标题「中秋特惠 全场八折」八个字小一号放在下方，电影感光效，高细节，竖版构图

<table>
<tr><th>flux ❌</th><th>zimage ✅</th><th>gptimage ✅</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/midautumn_poster__flux.png" width="100%" alt="海报-flux"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/midautumn_poster__zimage.png" width="100%" alt="海报-zimage"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/midautumn_poster__gptimage.png" width="100%" alt="海报-gptimage"/></td>
</tr>
<tr><th>klein ❌</th><th>nova-canvas ❌</th><th>gptimage-large ✅</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/midautumn_poster__klein.png" width="100%" alt="海报-klein"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/midautumn_poster__nova-canvas.png" width="100%" alt="海报-nova-canvas"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/midautumn_poster__gptimage-large.png" width="100%" alt="海报-gptimage-large"/></td>
</tr>
</table>

**视觉模型中性誊抄**（不带答案的 prompt）：zimage / gptimage / gptimage-large 把主副标题 **12 个汉字全部画对**；**flux 翻车**——画成一幅月亮+船+田野的风景照，完全没有文字、还是横版（prompt 要的是竖版海报）；**klein** 画成「皎空月夜」「更白皎秀 全港8折」——**英文招牌能画、中文海报崩**；**nova-canvas** 是灯笼 + 熔岩纹月亮，「走戈」「至象」「信勿丽」之类乱码。


**中文海报 3/6 过关**（flux、klein、nova-canvas 不行）。

### 第 5 题：「时间管理」中文思维导图（中文结构化图）—— 分水岭

比海报更狠：中心节点 + 4 个分支（16 个汉字）+ 4 段说明小字，文字分散排布。参考 MDPI 结构化图 benchmark。**这题最能拉开差距。**

**提示词**：一张中文思维导图海报，中心圆圈里写「时间管理」四个字，四个分支从中心向外延伸，每个分支末端是一个彩色方块，方块上分别写着「明确目标」「制定计划」「专注执行」「复盘总结」，每个方块下用小字写一句简短说明，整体配色清新，扁平化设计风格，白色背景

<table>
<tr><th>flux ❌</th><th>zimage ✅</th><th>gptimage ⚠️</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/mindmap__flux.png" width="100%" alt="导图-flux"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/mindmap__zimage.png" width="100%" alt="导图-zimage"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/mindmap__gptimage.png" width="100%" alt="导图-gptimage"/></td>
</tr>
<tr><th>klein ❌</th><th>nova-canvas ❌</th><th>gptimage-large ❌</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/mindmap__klein.png" width="100%" alt="导图-klein"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/mindmap__nova-canvas.png" width="100%" alt="导图-nova-canvas"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/mindmap__gptimage-large.png" width="100%" alt="导图-gptimage-large"/></td>
</tr>
</table>

**人眼 + 视觉模型交叉复核**（逐字辨认中心 + 4 分支标题）：

- ✅ **zimage**：中心「时间管理」+ 四分支「明确目标 / 制定计划 / 专注执行 / 复盘总结」**标题全部画对**，但小字是乱码——**全篇唯一把大字画对的**，不过小字没一个模型对。
- ⚠️ **gptimage**：中心「时间管理」对，**但四个分支标题全是乱码**（只对了中心）。
- ❌ **gptimage-large**：配了图标，**但中心带分支全部乱码**（一个字都没对）。
- ❌ **flux**：**画成一只天鹅**——完全跑题（它中文海报也没对）。
- ❌ **klein**：中心「今曲史宿」、分支全乱码。
- ❌ **nova-canvas**：画成一张圆形环状信息图，中心是「目雨 / 目帖 / 季季 / 采碑」、满屏「無」「亞朋雲」之类乱码——根本不是思维导图。

**思维导图 0/6 完全过关**（连 zimage 的说明小字都乱码），是全篇最大的分水岭。但**大字（中心 + 四分支标题）只有 zimage 全部画对**，gptimage 只中心对、其余连大字都崩——这题的大字基本是 zimage 一个人在扛。也暴露了**偏科**：flux、nova-canvas、klein 在中文文字 / 结构化题上一致地崩，但简单视觉题（语义合成、风格光影）却都能过——**同一模型不同题型差异大，必须多题横评。**

### 第 6 题：渔夫逆光人像（风格 + 光影控制）

测逆光 / 边缘光 / 黄金时刻 / 景深虚化的遵循度。

**提示词**：A portrait of an elderly fisherman, golden hour backlighting, warm rim light on his weathered face, shallow depth of field, bokeh, cinematic photography

<table>
<tr><th>flux</th><th>zimage</th><th>gptimage</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/style_golden_hour__flux.png" width="100%" alt="渔夫-flux"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/style_golden_hour__zimage.png" width="100%" alt="渔夫-zimage"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/style_golden_hour__gptimage.png" width="100%" alt="渔夫-gptimage"/></td>
</tr>
<tr><th>klein</th><th>nova-canvas</th><th>gptimage-large</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/style_golden_hour__klein.png" width="100%" alt="渔夫-klein"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/style_golden_hour__nova-canvas.png" width="100%" alt="渔夫-nova-canvas"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/style_golden_hour__gptimage-large.png" width="100%" alt="渔夫-gptimage-large"/></td>
</tr>
</table>

**判定**：6 个模型都画出了戴帽蓄须的渔夫 + 明显的**边缘逆光 / 黄金时刻暖调 / 景深虚化 bokeh**（flux/zimage/gptimage 视觉确认，光影方向感强；其余生成成功、光影到位）。风格光影这关**全员过关**。

### 第 7 题：俯拍 6 人晚宴（复杂场景精确数量）

要求 exactly 6 plates / 6 forks / 6 knives / 6 wine glasses + 火鸡。DPG-Bench 题型。

**提示词**：A wooden dinner table seen from above, with exactly 6 plates, 6 forks, 6 knives, 6 wine glasses, a roasted turkey in the center, candle light, warm atmosphere, photorealistic

<table>
<tr><th>flux</th><th>zimage</th><th>gptimage</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/complex_dinner__flux.png" width="100%" alt="晚宴-flux"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/complex_dinner__zimage.png" width="100%" alt="晚宴-zimage"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/complex_dinner__gptimage.png" width="100%" alt="晚宴-gptimage"/></td>
</tr>
<tr><th>klein</th><th>nova-canvas</th><th>gptimage-large</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/complex_dinner__klein.png" width="100%" alt="晚宴-klein"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/complex_dinner__nova-canvas.png" width="100%" alt="晚宴-nova-canvas"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/complex_dinner__gptimage-large.png" width="100%" alt="晚宴-gptimage-large"/></td>
</tr>
</table>

**视觉模型中性计数**（不带“6”的 prompt）：6 个模型都画得出“一桌丰盛晚宴 + 中央火鸡”，但**餐具数没一个对得上“恰好 6 套”**——nova-canvas 最接近（6 盘/6 叉/6 刀，酒杯 2–8）；flux/gptimage-large 7 盘上下、酒杯偏多；zimage 6 盘但叉刀只有 3–4；**klein 严重跑偏**（3 盘、而且画成鸡不是火鸡）。**精确数量 6 模型全栽**——免费 API 通病（视觉计数本就不准，定性参考）。

### 第 8 题：两手捧咖啡杯（手部解剖 + 计数）

手部是 AI 生图公认短板（多指/缺指/畸形）。明确要求“两只手、十根手指”。

**提示词**：Close-up photo of a person's two hands holding a ceramic coffee mug, ten fingers clearly visible, natural skin texture, soft window light, photorealistic

<table>
<tr><th>flux ⚠️</th><th>zimage ✅</th><th>gptimage ✅</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/anatomy_hands__flux.png" width="100%" alt="手-flux"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/anatomy_hands__zimage.png" width="100%" alt="手-zimage"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/anatomy_hands__gptimage.png" width="100%" alt="手-gptimage"/></td>
</tr>
<tr><th>klein ⚠️</th><th>nova-canvas ✅</th><th>gptimage-large ✅</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/anatomy_hands__klein.png" width="100%" alt="手-klein"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/anatomy_hands__nova-canvas.png" width="100%" alt="手-nova-canvas"/></td>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/anatomy_hands__gptimage-large.png" width="100%" alt="手-gptimage-large"/></td>
</tr>
</table>

**视觉模型计数**：6 个模型都画了 **2 只手、无多指 / 畸形**；手指数有差——zimage / gptimage / nova-canvas / gptimage-large **10 指满分**，flux / klein 只 **9 指**（左手小指被杯子挡住、没露全）。**严格按 prompt“十指清晰可见”的要求，只有前 4 个达标，flux / klein 算半对**。

## 二、模型画像小结

把八题汇总（✅过关 / ⚠️部分或近似 / ❌崩或跑题）：

| 维度 | flux | zimage | gptimage | klein | nova-canvas | gptimage-large |
|------|:----:|:------:|:--------:|:-----:|:-----------:|:--------------:|
| 语义合成 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 英文文字 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| 中文海报 | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| 中文思维导图 | ❌ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| 风格光影 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 精确数量 | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| 手部解剖 | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | ✅ |

**按稳定性分档**：

- **最稳（中英文 + 思维导图大字最准）**：`zimage`——**全篇唯一**把思维导图中心 + 四分支标题都画对的（说明小字仍乱码），最强。
- **海报/英文/手部强、思维导图栽**：`gptimage`（中心对、四分支乱）、`gptimage-large`（中心带分支全乱）——海报 12 字、英文招牌、手部都对，就栽在思维导图。
- **快但中文偏科**：`flux`（英文招牌、语义合成、风格光影都对；中文复杂题——两只猫、中文海报、思维导图——**连续三题翻车**，画成风景 / 天鹅）。
- **中文文字不行**：`klein`（英文招牌、中文猫图能画；中文海报、思维导图崩）。
- **文字 / 结构整体差**：`nova-canvas`（英文招牌、中文海报、思维导图**全崩**；只有简单视觉题——语义合成、风格光影、手部——行）。

**怎么选**：要中文 + 稳（思维导图大字最准）→ `zimage`（唯一把大字画对的）；要海报/英文最高保真 → `gptimage-large`（思维导图它也栽）；要最快最便宜、且是英文 / 简单场景 → `flux`；要纯免费不限量（含中文）→ 用 Agnes。

## 三、和 Agnes 同题横评

统一网关上的 Pollinations 和 Agnes **同一档**：

| 维度 | Pollinations（zimage / gptimage-large） | Agnes `agnes-image-2.1` |
|------|----------------------|------------------------|
| 英文文字 | 全对 | 全对 |
| 中文文字（海报） | zimage/gptimage/gptimage-large 全对 | 全对 |
| 手部 | 2 手 / 10 指 | 2 手 / 10 指 |
| 单张速度 | zimage ~7s、flux ~5s | ~26s |
| 调用方式 | GET 一行 URL | POST + JSON |
| 出图尺寸 | 1024×1024 | 1024×1024 |
| 免费额度 | unified 按 pollen | 宣称永久免费 |

<table>
<tr><th>Pollinations <code>zimage</code>（思维导图，中心+分支标题全对、小字乱码）</th><th>Agnes <code>agnes-image-2.1</code>（中秋海报，全对）</th></tr>
<tr>
<td><img src="/assets/images/2026/20260627/pollinations-image/images/mindmap__zimage.png" width="100%" alt="Pollinations 思维导图"/></td>
<td><img src="/assets/images/2026/20260626/agnes-image/images/midautumn_poster.png" width="100%" alt="Agnes 中秋海报"/></td>
</tr>
</table>

**横评一句话**：统一网关上的 Pollinations——**zimage 质量不输 Agnes、甚至略胜一筹**（中英文都拉平、~7s 秒级出图、GET 调用更简）；gptimage-large 在海报/英文上同档 Agnes（最高保真），但**思维导图大字只有 zimage 画得对**（说明小字全员乱码）。Agnes 唯一赢点是宣称永久免费不限量。要质量 + 速度 → zimage；要海报最高保真 → gptimage-large；要纯免费不限量 → Agnes。

## 四、额度与能干啥

### 先说「免费」这件事：从无 key 白嫖到要注册

Pollinations 当年能在开源圈“出圈”，靠的就是**真·免费 + 不用 key**——一行 GET URL、不注册、不登录，`model=flux` 想换就换，flux 这类模型随便用，速率也很宽松。这才是“URL 即图片”最讨喜的形态：连 key 都不用配，URL 塞进 `<img src>` 就直接出图。

但地主家也没余粮。用量上来之后成本扛不住，Pollinations 开始**收口**：引入 `pollen`（花粉）计费 + 注册账号 + tier 等级，把**模型选择挪到要 `sk_` key 的统一网关**（就是这篇实测走的 `gen.pollinations.ai`）；不要 key 的老通道（`image.pollinations.ai`）则退化成只剩一个默认模型、传 `model` 也不认。

所以现在的“免费”长这样：**想白嫖全部模型，得先注册拿 key、吃 pollen 额度**（按小时刷新，Seed 档约 0.15 pollen/小时）；只有 pollen 体系基本不覆盖的转录（whisper）和文本 LLM 还接近敞开免费。

### 六个模型 + tier：每天能白嫖多少张图

六个模型都在**统一网关 `gen.pollinations.ai`**（GET `/image/{prompt}` + `sk_` key），按 **pollen** 计费。`flux`/`zimage`/… 只是调用别名，API 不暴露底层厂商；下表真实身份来自官方端点 `/v1/models`、`APIDOCS.md` 和公开资料（OpenAI、Amazon 闭源，**参数量未公开**）：

| 调用名 | 真实模型 / 厂商 | 参数量 | pollen/图 | 速度 |
|--------|----------------|:----:|----------|------|
| `flux` | Black Forest Labs · **FLUX.1 Schnell**（快速蒸馏版） | 12B | ~0.001 | ~5s |
| `zimage` | Alibaba（通义）· **Z-Image-Turbo** | 6B | ~0.002 | ~7s |
| `gptimage` | OpenAI · **GPT Image 1** | 未公开 | ~0.009 | ~18s |
| `klein` | Black Forest Labs · **FLUX.2 Klein**（从 32B Dev 蒸馏） | 4B | ~0.010 | ~7s |
| `nova-canvas` | Amazon · **Nova Canvas** | 未公开 | ~0.040 | ~8s |
| `gptimage-large` | OpenAI · **GPT Image 1.5** | 未公开 | ~0.054 | ~25s |

几点能力说明（来自 `APIDOCS.md`）：`flux`/`zimage` 是纯文生图；`gptimage`/`klein` 能吃参考图做编辑（`nova-canvas` 端点也收图，但官方未明确列为编辑模型）；`flux`/`zimage`/`klein` 支持 seed，`gptimage`/`gptimage-large`/`nova-canvas` 忽略 seed；GET 接口默认 `zimage`、POST 默认 `flux`。

pollen/图 来自实测 402 报错与余额推算，与官方「1 pollen = $1」定价略有出入（官方称 flux 免费、kontext ~200 张/pollen 等），以 [`enter.pollinations.ai`](https://enter.pollinations.ai) 后台为准。

**tier 决定每天拿多少 pollen**（来自官方 [POLLEN_FAQ](https://github.com/pollinations/pollinations/blob/master/enter.pollinations.ai/POLLEN_FAQ.md) / [TIER-SYSTEM](https://github.com/pollinations/pollinations/blob/master/.github/docs/TIER-SYSTEM.md)，2025-03 起 hourly 系统取代 daily）：

| tier | pollen | 刷新 | 怎么达到 |
|------|--------|------|---------|
| 🍄 **Spore** | 0.01/小时 | 每小时（**不累积**） | 注册即默认 |
| 🌱 **Seed** | 0.15/小时（≈3.6/天） | 每小时（**不累积**） | 自动：账号年龄 + GitHub 活跃，约 2 周 |
| 🌸 **Flower** | 10/天 | 每天（UTC 0 点） | 在 [pollinations.ai/Apps](https://pollinations.ai/Apps) 发布一个 app |
| 🍯 **Nectar** | 20/天 | 每天（UTC 0 点） | 重大贡献（预告中） |

⚠️ Spore/Seed 按小时发、**不累积**（没用完的小时额度作废，攒不起大额）——所以 nova-canvas(0.040)、gptimage-large(0.054) 这种贵图，在 Spore(0.01/小时) 单小时根本买不起；Flower/Nectar 是**每天一整坨**、额度内随便花。也能直接买 pollen（$1 = 1 pollen，不 expire）。

**每个 tier 的每天额度，只刷一个模型，能出多少张**（Spore/Seed 按 24 小时折算成天，但受「小时不累积」限制）：

| tier（每天 pollen） | flux | zimage | gptimage | klein | nova-canvas | gptimage-large |
|-------------------|----:|------:|--------:|------:|------------:|---------------:|
| 🍄 Spore（≈0.24/天） | ~240 | ~120 | ~27 | ~24 | 6 ⚠️ | 4 ⚠️ |
| 🌱 Seed（≈3.6/天） | ~3600 | ~1800 | ~400 | ~360 | ~90 | ~67 |
| 🌸 Flower（10/天） | ~10000 | ~5000 | ~1100 | ~1000 | ~250 | ~185 |
| 🍯 Nectar（20/天） | ~20000 | ~10000 | ~2200 | ~2000 | ~500 | ~370 |

⚠️ 标 ⚠️ 的格子：nova-canvas / gptimage-large 单价超过 Spore 单小时额度（0.01），**单小时买不起**——这里的"天"数只是理论值（24 小时全砸上也买不了，因为额度不累积），实际买不了。

**对照本次实测**：我的 key 单小时约回 0.15 pollen，正好是 **Seed 档**——所以 56 张图（含 0.054/张的 gptimage-large）要跑 9 个小时周期才凑齐。想大量跑贵模型，升 Flower/Nectar 或直接买 pollen。

### 顺带探了 Pollinations 还能干啥（哪些免费、各花多少 pollen）

Pollinations 不止图片。统一网关 `gen.pollinations.ai` 把能力分成 **image / video / audio / text / embedding** 五类。**关键规律：文本和转录基本免费（每 token/秒花粉极低、甚至不计），真正吃花粉的只有图片和视频。**

**🟢 免费 / 几乎免费**（实测在低余额下也不 402）：

| 能力 | 模型 | pollen |
|------|------|--------|
| 语音转录 | `whisper`、`universal-2`、`universal-3-pro`（AssemblyAI） | **不计 pollen**（实测一段音频完美转出） |
| 文本 LLM | `openai-fast`/`openai`/`gpt-5.4`/`glm`/`deepseek`/`grok`/`qwen`/`llama`/`mistral`/`kimi`/`perplexity`… | 输出约 **0.0000003–0.00003 pollen/token**（几百 token 的回答 < 0.001 花粉，等于白嫖） |
| 视觉 LLM | `qwen-vision`、`qwen-vision-pro`、`openai-audio` | 同上，极低 |
| 嵌入 | `openai-3-small/large`、`cohere-embed-v4`、`qwen3-embedding-8b` | ~0.00000002/token（可忽略） |
| 音频生成 | `acestep`（音乐）、`polly` | 0.0005/秒 / 不计 |

**🟡 吃花粉**（统一网关，按量扣；六个文生图模型的 pollen 见上面的模型表，这里只列其它的）：

| 类别 | 模型 | pollen |
|------|------|--------|
| 图片 | `kontext`（图片编辑模型） | ~0.040/张 |
| 视频 | `ltx-2` | 0.005/秒（5 秒 ≈ 0.025） |
| 视频 | `nova-reel` | 0.08/秒（5 秒 ≈ 0.4，最贵） |

💡 `kontext`（FLUX.1 Kontext）是**图片编辑**模型，所以没进文生图横评——给它一张参考图 + 指令（“换背景”“加帽子”）做图生图；只给文字时它会无视 prompt 画成山水画（在等输入图）。纯文生图用 zimage（要中文）/ flux（要英文、要快）。

图片 pollen/张 来自实测 402 报错与余额推算；视频 pollen/秒 来自 `gen.pollinations.ai/models` 官方定价。

**算笔账**（按 Seed 档 0.15 pollen/小时算）：0.15 pollen ≈ **150 张 flux**，或 **~75 张 zimage**，或 **~15 张 klein**，或 **~3 张 kontext/nova-canvas/gptimage-large**，或 **~30 秒 ltx-2 视频**，或 **~1.5 秒 nova-reel 视频**。所以低档白嫖图片（选 flux/zimage）很宽裕，但视频（尤其 nova-reel）基本别想。

**一句话**：Pollinations 是个被低估的“免费多模态中转站”——**转录（whisper）和文本 LLM 几乎免费敞开**；图片走 unified 按 pollen（flux 最便宜）；视频最贵。低档白嫖首选 flux/zimage 图 + whisper 转录 + 文本 LLM。

## 五、深度小结：到底什么水平，怎么选

**Pollinations 的真实水平**（统一网关）：zimage 全篇最强（**唯一把中文思维导图的大字画对**、小字仍乱码），gptimage / gptimage-large 海报/英文/手部都强但都栽在思维导图，flux 快但中文复杂题连续翻车，klein 中文文字不行，nova-canvas 文字/结构整体差。整体和 Agnes 同档。

**怎么选**：要中文 + 稳 → `zimage`（六个里唯一把思维导图大字画对的，小字仍乱码）；要海报/英文最高保真 → `gptimage-large`（思维导图它也栽）；要最快最便宜、且是英文 / 简单场景 → `flux`；要纯免费不限量（含中文）→ 用 Agnes。**zimage 质量不输 Agnes、速度和调用还略胜一筹**——Agnes 唯一赢点是宣称永久免费不限量。

最后说一句“免费”。统一网关按 pollen 计费、模型随时变、视频和高端模型要花钱、政策可能调整——免费的部分（转录 + 文本 LLM）拿来跑实验、兜底没问题；要扛生产主力，多备几个 Key 轮换、留好付费后路。**免费是好东西，但别全指望它。**

这次的收获是六个文生图模型的真实数据——**评模型要多题、别凭单题，而且中文文字判定不能信视觉模型、得人眼复核**：flux 英文行 / 中文翻车、klein 中文猫图行 / 中文文字崩、nova-canvas 简单视觉行 / 文字全崩、思维导图大字全篇只有 zimage 行，都是例证。

📌 这是 **Pollinations 实测系列的图片篇**。六个文生图模型 + Agnes/智谱三家同题横评：**统一网关上的 Pollinations——zimage 质量不输 Agnes、甚至略胜一筹（唯一把中文思维导图大字画对、秒级出图、GET 调用更简）；gptimage-large 海报/英文最高保真、同档 Agnes**，Agnes 赢在宣称永久免费不限量，智谱介于其间。首选 zimage（速度 + 中文、导图大字最准）/ gptimage-large（海报最高保真）；要不限量选 Agnes。

📚 **本系列其它实测**：智谱《[智谱免费的图片和视频 API 到底行不行？一篇实测讲透](https://mp.weixin.qq.com/s/kYvqxezhVQqMv0hq_E7RuQ)》｜Agnes《[免费出图到底行不行？实测 Agnes AI 图片模型](https://mp.weixin.qq.com/s/zJZcWllh9Q55UDTrHWTaBw)》
