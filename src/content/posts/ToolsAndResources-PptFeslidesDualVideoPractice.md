---
title: 【实践记录】PPT 管线 × frontend-slides 双线复刻：AI 日报视频替代管线实测对比
published: 2026-09-05
description: 分别用 PPT 管线与 frontend-slides 复刻同一期 AI 日报视频的实战对比报告。PPT 线走了三条路：原生 timing 动画+WPS 放映录屏被 8 轮实验否决（WPS 放映引擎不执行自动序列动画、命令行启动连 advTm 都失效、桌面独占），终态定为 WPS COM 无头转 PDF+PyMuPDF 出帧+ffmpeg 后期缓推动效+ASS 逐词卡拉OK 字幕+旁白后混，全链约 2 分钟一次跑通；FES 线按 frontend-slides 固定舞台纪律产出竖版 deck，playwright 无头 recordVideo 82.4 秒一次跑通，词级字幕 HTML 内嵌、元素级词点动效最接近原片。附三方对比表（清晰度/动效/字幕/时序确定性/体积）与回填可行性分析的四条结论。
lang: zh
tags: [实践记录]
abbrlink: ppt-feslides-dual-video-practice
---

实践日期：2026-09-04。任务：分别用 PPT 管线与 frontend-slides 方案生成 `ai-news/2026/09/2026-09-03_0500_4cb05e_AI日报/_video/视频.mp4` 类似效果的视频，全部中间件留档于本目录（`ppt-line/`、`feslides-line/`），对比实际效果。

## 〇、产出总览

| 产物 | 规格 | 时长 | 体积 | 位置 |
|---|---|---|---|---|
| 参照片（hyperframes 原片） | h264+aac / 1080×1920 / 30fps | 177.5s（14 帧全量） | 23.3MB | 原期目录 |
| **PPT 线成片** | h264+aac / 1080×1920 / 30fps | 82.2s（7 页浓缩） | 10.8MB | `ppt-line/ppt_成片.mp4` |
| **FES 线成片** | h264+aac / 1080×1920 / 30fps | 82.5s（7 页浓缩） | 3.9MB | `feslides-line/fes_成片.mp4` |

两线统一采用 7 页浓缩结构（hook＋五条大事＋outro），内容/词点/旁白同源（hf-faceless 的 audio_meta words[] 与 voice mp3），因此横向可比；与原片的时长差是**结构取舍**（14 帧含子帧 vs 7 页浓缩），非管线能力限制。机器门规格（h264+aac、恰 1+1 流、1080×1920、30fps）两线全部达标。

## 一、PPT 线实录（走了三条路，前两条被实测否决）

**路线 A：PPT 原生 timing 动画＋WPS 放映＋录屏（原计划）**——注入侧全程成功：63 个元素动画按词点注入（章号/kicker/数据行/数据条 wipe/进度点亮起），WPS 结构校验通过。放映侧被三重实测否决：①**WPS 放映引擎不执行 withEffect 自动序列动画**（放映+定时截屏+橙像素统计实锤：元素常显、无动画）；②advTm 自动换片只在交互 F5 启动时生效，`/s` 命令行启动的放映不自动推进（录到 90s 恒定 P1）；③多实例干扰使 `/s` 间歇性不弹窗，六轮录屏实验（SendKeys/PostMessage/AppActivate/AttachThreadInput 前置探针）两次成功四次废片，且每轮需独占桌面——被用户叫停。中间件留档：`ppt-line/make_variants.py`（timing 结构变体）、`record_*.py`（v1-v6 录屏尝试全记录）。

**路线 B（最终形态）：WPS COM 无头转 PDF → PyMuPDF 出帧 → ffmpeg 后期动效 → ASS 词级字幕 → 旁白后混**。全后台零打扰，一次跑通：`deck.pdf` → `pages/page_1-7.png`（1080×1920 精确）→ 每页 zoompan 缓推（1.0→1.05）＋页首 0.3s 淡入（不跨页、音画对齐无损）→ `subs.ass`（36 组、`\k` 卡拉OK 逐词高亮，样式暖白底盒+墨/灰词，橙框为 ASS 能力外）→ 旁白 7 段 concat 后混。抽帧验收：版式/字幕逐词色差全部可见，两帧抽验 PASS。
值得注意：这条「渲染拼片+后期动效」路线的成片观感（缓推+淡入+逐词字幕）**优于录屏版**（录屏即使成功也只是静态页硬切）——PPT 管线在本机的最优形态不是「借 WPS 当播放引擎」，而是「借 WPS 当渲染器（PDF）＋ffmpeg 做动效」。

## 二、FES 线实录（一次成功）

[frontend-slides](/posts/frontend-slides-skill-survey/) 仓库浅克隆留档（`feslides-line/frontend-slides-repo/`，MIT）。按其架构纪律产出竖版 deck：`viewport-base.css` 的固定舞台模型竖版化（stage/slide 1080×1920，transform 缩放、visibility/opacity 翻页、禁 display:none 的坑位规则全保留）；字体纪律偏离（其规定 Google Fonts，本机 GFW 环境改用本地微软雅黑/Consolas——实践报告如实记录此偏差）；7 页版式复刻日报视觉语言（色板逐 hex 同源）；词点 reveal 用 CSS `animation-delay`（词点预编译进 HTML）；**词级字幕内嵌**（JS 按 words[] 时间轴逐词高亮，样式暖白底+橙描边，能力优于 ASS 后混）；自动放映（`?auto=1`）。
录制：`pw-env/`（playwright-core 本地安装，中间件留档）+ `channel:chrome` 连本机 Chrome **无头**录制 `recordVideo`——**82.4s 一次跑通**（waitForFunction FES-DONE 精确收尾）；ffmpeg 转码 h264/30fps＋旁白后混。抽帧验收两页 PASS（版式/字幕 pill/进度点全对）。

## 三、三方效果对比

| 维度 | 参照片（hyperframes） | PPT 线 | FES 线 |
|---|---|---|---|
| 画面清晰度（视觉盲评） | 基准 | **最锐**（PDF 矢量渲染+超采样缩放） | 略柔（浏览器缩放录制） |
| 视觉语言一致性 | 基准 | 同色板同版式，一致 | 同色板同版式，一致 |
| 元素动效 | GSAP 全语法（词点 reveal/擦除/脉冲） | 后期缓推+淡入（页级，无元素级） | **词点 reveal+数据条擦除**（元素级，最接近原片） |
| 词级字幕 | 合成轨原生（逐词高亮+橙描边 pill） | ASS 后混（逐词高亮✓，橙描边✗） | HTML 内嵌（逐词高亮✓+橙描边✓，机制与原片等价） |
| 旁白音画对齐 | 渲染时间轴原生 | 后混按帧时长拼接（±10ms 级） | 同左 |
| 时序确定性 | 确定性逐帧渲染 | **确定性**（帧时长硬编码+concat） | 实时录制（±几十 ms 抖动，本片未见失步） |
| 出片耗时 | 帧渲染分钟-十分钟级 | 全链 ~2 分钟（PDF+帧+编码） | 全链 ~3 分钟（录制实时 1×+编码） |
| 工程稳定性 | 在产（零新增） | **一次跑通**（但走了三条路，前两条共 8 轮实验） | **一次跑通零波折** |
| 自动化/无人值守 | ✅ | ✅（COM 无头+ffmpeg） | ✅（无头浏览器，可并发） |
| 体积/码率 | 23.3MB/177s | 10.8MB/82s | 3.9MB/82s（最省） |

## 四、结论（回填可行性分析）

1. **FE-Slides+Playwright 组合线的预判被实践正面验证**：无头全自动、一次跑通、出片前可程序化预览（HTML 即最终画面）、词级字幕原生——[可行性分析](/posts/ppt-pipeline-vs-hyperframes-feasibility/) §三 给它的「工程底座最健康」判断成立，且「时序抖动」在本片量级（82s/7 页）未构成可感问题。
2. **PPT 管线的预判被实践部分修正**：可行性分析把「WPS 放映+录屏」列为首选（验证度 60%）——实测放映路线的脆弱性比预判更差（放映引擎连 advTm 都受启动方式影响、多实例干扰、桌面独占），8 轮实验 2 成 6 废；反而未被重点分析的「**WPS COM 无头渲染（PDF）+ffmpeg 后期动效**」是 PPT 管线在本机的稳定终态——建议可行性分析 §二A 降级、该路线升为 PPT 线首选（本次实践已留全套脚本：`ppt-line/ass_gen.py` 即完整流水线）。
3. **「类似效果」达成度**：两线都保住了日报视频的视觉签名（色板/版式/词级字幕/进度点/ghost）；差距集中在动效语言——FES 线有元素级词点 reveal（接近原片），PPT 终线只有页级缓推；原片的 GSAP 全语法（脉冲/过冲/呼吸）两线均无。若要更高保真，FES 线的 CSS 动画还有提升空间（加 scale 脉冲/擦除时长调优），PPT 终线的动效天花板就是 ffmpeg 滤镜集。
4. **两线都用 7 页浓缩结构**，与原片 14 帧的信息密度差约一半——若要 1:1 复刻全帧，两线的构建器都是数据驱动（PAGE_FRAME 表加帧即可），工程上无障碍，属范围取舍。

## 五、文件清单

- `ppt-line/`：deck.pdf、pages/（7 帧）、subs.ass、segs、visual_nosub.mp4、**ppt_成片.mp4**、旁白_concat.mp3、ass_gen.py（完整流水线）、make_variants.py+record_ppt~v6.py（路线 A 实验全档）、probe/（实验探针帧）
- `feslides-line/`：frontend-slides-repo/（克隆留档）、make_feslides_deck.py、deck.html、pw-env/（playwright+录制脚本）、rec/（webm 原录）、**fes_成片.mp4**、旁白_concat.mp3、frames/（验收帧）、narr_list.txt
- 三方对比帧：`C:\Users\12990\AppData\Local\Temp\deckqa\cmp_three.jpg`（ref|ppt|fes 三联）
