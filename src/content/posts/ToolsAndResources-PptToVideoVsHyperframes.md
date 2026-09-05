---
title: 【实践记录】PPT 转视频路线实测与选型：WPS COM 死路、静态拼片管线与 HyperFrames 对比
published: 2026-09-04
description: 「先用 pptx skill 做 PPT、再把 PPT 做成视频」在本机怎么走：五条方案全景与实测——真 PowerPoint 原生导出（本机无 Office）、WPS COM 自动化死路（CreateVideo 静默空操作、SaveAs 视频枚举被降级存 pptx，附官方文档查证）、开源渲染拼片（soffice→PDF→ffmpeg 逐页对时，缺 LibreOffice）、HyperFrames 混合管线（全动效但双层维护）、在线 SaaS 一笔带过；外加保留 PPT 动效的三条正路（装 Office、录屏、WPS GUI）、竖版 9:16 画幅实测（精确对齐 1080×1920）、与 HyperFrames 的逐维度对比，以及 2026-09-04 实操增补：WPS COM 转 PDF 端到端可用、首个 11 页 deck 交付与 QA 战报；动效追记：63 动效 timing XML 全量注入通过结构校验，但 WPS 放映引擎实测不执行自动序列动画（advTm 自动换片与页内旁白 mp3 正常），WPS COM 再添 SlideShowSettings 与 TextRange 两项缺口。
lang: zh
tags: [实践记录]
abbrlink: ppt-to-video-vs-hyperframes
---

分析日期：2026-09-03。上承同日报告[《Anthropic 官方 PPTX 技能调研报告》](/posts/anthropic-pptx-skill-survey/)。本机环境与 WPS COM 行为均为当日实测；hyperframes 引用本机插件缓存 0.8.6 的 SKILL.md 原文。

## 摘要

「先用 pptx skill 做 PPT、再把 PPT 做成视频」在本机可行的主路有两条：①渲染拼片管线（PPT 出稿 → 转静态页图 → ffmpeg 逐页拼片 + MiMo 旁白逐页对时），全自动、零动效、页级对时，唯一缺口是 LibreOffice 未装；②混合管线（PPT 渲染页作为素材装进 hyperframes 线性组合，转场、强调动画、词级字幕、渲染交给 hyperframes），全动效但成本高。两个清醒剂：本机没有真 Microsoft Office——`PowerPoint.Application` COM 被 WPS（wpp.exe）接管，且 WPS COM 导出视频已实测死路（官方文档无 `CreateVideo`、视频枚举值 37/39 被静默降级存 pptx、未定义值弹模态框卡死无头进程）；hyperframes 自己的「PPT 对称物」slideshow 恰恰被官方禁止 render 成 MP4（会静默截断），且其 TTS 字段是保留未接线的占位。若要「保留 PPT 动效」，比 hyperframes 简单的路是装 PowerPoint 用原生导出，或零安装的录屏方案（见专题节）。若最终交付物只是视频，直接走已在产的 hyperframes faceless-explainer 比经 PPT 中转更优；PPT 路线的真正价值是「一稿两用」——PPT 本身要交付（讲课、汇报），视频是衍生品。

## 一、本机环境基线（2026-09-03 实测）

| 组件 | 状态 | 对方案的影响 |
|---|---|---|
| ffmpeg | 在（D:\Development\ffmpeg-master-latest\bin） | 拼片/混音/封装全可用 |
| PyMuPDF 1.27.2（conda） | 在 | PDF→PNG 出帧可替代 pdftoppm |
| pywin32（conda） | 在 | COM 自动化可用 |
| python-pptx（conda） | 已装 1.0.2（2026-09-03 为动效验证补装） | pptx 编辑与动画 XML 手术可用 |
| 真 Microsoft Office | 不在（无 POWERPNT.EXE） | PowerPoint 原生导出路线不可用（装 Office 即恢复为最简单正解） |
| WPS（wpp.exe） | 在，且接管 `PowerPoint.Application` COM（`Name` 自报 Microsoft PowerPoint） | COM 自动化导出视频已实测死路：`CreateVideo` 调用不报错但无产物、状态恒 0；`SaveAs` 枚举 35-41 无视频格式（35-39=pptx、40/41=老 .ppt），42 弹模态框卡死无头进程；仅剩 GUI 人工通道 |
| LibreOffice soffice | 不在 | 开源渲染管线的唯一硬缺口 |
| pdftoppm（Poppler） | 不在 | 可由 PyMuPDF 顶替，无需安装 |
| pptx skill（Z.AI 0.1.4） | 在 | 其依赖表要求的 LibreOffice/Poppler 未满足，转 PDF 一环需补 |
| hyperframes（插件 0.8.6 + 全局 CLI 0.8.20） | 在 | article-to-video / ai-news-digest 视频线已在产 |

## 二、PPT→视频方案全景

### 方案 A：真 PowerPoint 原生导出（本机不可用）

PowerPoint 桌面版的「导出为视频」（COM 侧 `Presentation.CreateVideo`，或另存为 MP4）是唯一能完整保留 PPT 内嵌动画、转场、旁白、自动计时的路线，产物即 MP4。前提是装有桌面版 Office——本机没有（`PowerPoint.Application` 实际解析到 WPS 的 wpp.exe）。列为不可用，除非将来装 Office。

### 方案 B：WPS 导出视频（COM 自动化已实测死路，仅剩 GUI 人工）

本机实际承担 Office 职责的是 WPS。2026-09-03 端到端实测 + 2026-09-04 WPS 官方开发文档查证（V13 二次开发文档）：

- COM `CreateVideo(file, timings, defaultSec, vertRes)`：调用不抛错，但 90 秒无任何产物、`CreateVideoStatus` 恒为 0。官方文档层确认：WPS Presentation 方法全集 27 个**没有 CreateVideo**、全站导航树零命中——COM 类型库注册了方法名（故 DISPID 可解析），对象模型未实现，调用是静默空操作。
- COM `SaveAs` 枚举扫描（35-42）：产物 35-39 全是 zip 头、40/41 是 OLE2 头、42 弹模态框卡死无头进程（taskkill 清理）。按 MS 官方 PpSaveAsFileType 对照，**37=WMV、39=MP4 才是视频值**——WPS 收到视频枚举值会**静默降级存成 pptx**（39 实测产物即 zip 头），即「方法在、格式被吞」；40=AnimatedGIF、41/42 未定义。结论不变：无头导出视频不可行，且禁再无头扫描该枚举区间。
- 结论：WPS COM 自动化导出视频不可用。剩余通道：GUI「输出为视频」（纯 UI 路径，本机版本是否携带待查，部分版本限会员），人工操作、无法进管线；云端替代是 WebOffice 平台（需上传文件，SaaS，理念冲突）。

### 方案 C：开源渲染拼片管线（推荐基线，缺一个安装）

把 PPT 当「静态分镜」用：每一页渲成图，按旁白时长逐页拼接。

```
pptxgenjs 出稿（pptx skill 三段 QA + judge 视觉验收）
  → soffice --headless --convert-to pdf   ← 唯一缺口：LibreOffice 未装
  → PyMuPDF 逐页出 PNG（matrix 缩放 2x ≈ 1920×1080，替代 pdftoppm）
  → 每页讲稿 → MiMo TTS（tts-generation）→ 得每页旁白时长
  → ffmpeg concat demuxer：每页 duration = 该页旁白时长 + 0.3s 呼吸
  → 旁白音频 concat + BGM amix（或 sidechain 压伴奏）
  → 字幕：从讲稿生成页级 SRT（无词级时间轴）
```

特性：全自动、可进 skill 管线（断点续跑模式现成）、分钟级出片、成本最低。代价：PPT 内动画全部丢失（soffice 只渲静态页）、对时粒度是页级（旁白一页一页对，没有词级字幕）、soffice 渲染保真度弱于真 PowerPoint（复杂字体/图表有偏差，pptx skill 原版也因此要求出图后走视觉 QA）。

### 方案 D：PPT 为版面层 + hyperframes 为动效层（混合，全链路可用）

PPT 页照方案 C 渲染成 PNG 后，不直接拼片，而是作为素材装进 hyperframes 线性组合（general-video 形态，不是 slideshow）：每页一张 `<img>` 用 `data-start`/`data-duration` 排时间轴，转场（推入、擦除、缩放）、局部强调动画（在页面之上叠 kinetic 层）、词级字幕、音频对时、最终 `hyperframes render` 出片全由 HF 承担。仓库视频线的现成资产（封面模板、QA agent、worker 并发派发、两秒留存纪律）全部复用。

特性：动效与字幕达到 hyperframes 水准、PPT 侧只负责版面与信息设计（pptx skill 的图表/设计纪律正好擅长）。代价：双层管线维护面大、HF 帧渲染有实际时长成本（SelfMediaTools 项目 Stage C 实测帧渲染段 16-43 分钟方差）、页面仍是静态整图（页内元素不能单独动，除非在 HF 里重建）。

### 方案 E：在线托管服务（一笔带过）

Gamma、Plus AI 类「PPT 一键转视频/出片」SaaS。与 SelfMediaTools 项目离线、可断点、零外发的管线理念冲突，仅作存在性记录。

### 专题：比 hyperframes 更简单的「保留 PPT 动效」方案（2026-09-03 追记）

先澄清一点：方案 D（hyperframes 混合）并不「保留」PPT 动效——页是静态整图，动效是 hyperframes 重新做的，属于替代重建。真正保留 PPT 动效，需要有引擎把 pptx「播放」一遍并录下来或渲出来。按简单度排序：

1. **装 PowerPoint 桌面版 → 导出视频（最简单的正解）**。「文件→导出→创建视频」是 PowerPoint 原生功能，动画、转场、旁白、自动计时全部保留；COM 侧 `Presentation.CreateVideo` 在真 Office 上是成熟实现（异步生成、轮询状态），可进自动化管线。Microsoft 365 还有 Record（录制旁白+出片一体）。代价只有一个：Office 授权。
2. **录屏（本机零新安装、保真 100%）**。WPS 放映模式本身支持动画播放，用 ffmpeg `gdigrab`（或 OBS、Xbox Game Bar）录全屏放映——放映成什么样视频就是什么样。要点：动画与换片需设为自动时序（`advTm` 自动换片、动画 `afterPrev`/固定延迟——python-pptx 已装，XML 手术即可批量改）；旁白两种做法：放映时同步播放 TTS 音频并录进声卡，或后配（TTS 时长对齐换片时序）。弱点：实时录制，视频时长=放映时长；窗口焦点与分辨率敏感；属半自动。
3. **WPS GUI「输出为视频」**。人工点击，若本机版本携带此入口则可用（部分版本限会员）；COM 通道已实测死路（见方案 B）。

已排除的路：**Aspose.Slides**——Python 版不能直接出视频（官方论坛确认，只能转带转场的 GIF）；.NET/C++ 版可逐帧渲染动画再 FFMpegCore 编码，但要引入 .NET 工具链加商业授权，复杂度不低于 hyperframes；其免费在线转换器需上传文件（SaaS，理念冲突）。**Office 网页版**没有导出视频功能（桌面版专属）。

结论：「保留 PPT 动效」若为硬需求，最省事的是装 PowerPoint 导出，不想装/花钱就用录屏（零安装、保真、半自动）；若动效不必来自 PPT 本身，hyperframes 混合（方案 D）以管线复杂度换词级字幕与全自动化。

## 三、竖版与任意画幅（2026-09-04 实测补记）

PPT 画布支持任意自定义比例（宽高各上限 56 英寸），竖版不是「能不能」的问题、只是设计体系问题。实测（`%TEMP%\pptx_video_test\aspect_9_16.pptx` / `aspect_10_21.pptx`：pptxgenjs `defineLayout` 造稿，python-pptx 读回验证）：

- **9:16** → 7.5×13.333 英寸，读回宽高比 0.5625 精确命中。该画布在 144dpi 下渲染恰好 1080×1920，与抖音/视频号/B 站竖版视频原生画幅一致——竖版链路无需裁剪或补边。
- **10:21** → 7.5×15.75 英寸同样可造（读回 0.4762）。但 1:2.1 比 9:16 更瘦，无主流平台使用此画幅，若尺寸来自特定平台要求需先核对原始数值；走 WPS GUI 导视频建议先用小样验证输出分辨率是否跟随画布。
- 设置入口三处：pptxgenjs `defineLayout`（创建线）／python-pptx `slide_width/height`（编辑线）／GUI 设计→幻灯片大小→自定义。

真正的坑不在画布、在设计体系：pptx skill 的字号纪律（标题 44-72pt、正文 ~24pt）按 13.33×7.5 横版调校，竖版宽度 7.5 英寸只有横版的 56%，同字号显得更大、每行字数大减。三个处理法：

1. PPT 侧直接自定义竖版画布，字号按竖版重调——skill 的设计方法论（焦点、密度、Avoid 清单）仍适用，数值需换算；大字少字恰好贴合视频两秒留存纪律，对视频反而是优势。
2. 横版页在竖版画布里居中、上下留白做设计——信息区只有画面中部约 1/3，投影可读性差。
3. 内容层改写：横版页拆成多屏竖版要点——这已是重做，不再是「转」。

结论：**竖版画布技术上零障碍（9:16 精确对齐 1080×1920），障碍在设计层——横版页面不能直接平移，要按竖版重排**。「PPT 转视频」天然适合横版场景（B 站、YouTube、课程录屏、电视投屏）；竖版短视频场景要走 PPT 路线就得按竖版画布从头排版。另外注意信息密度错位：PPT 页为「读」设计（高密度、小字、多图表），视频为「两秒留存」设计（低密度、大字）——任何方案都不能拿汇报稿直接转，出稿时要按视频密度重写页面。

## 四、与 hyperframes 的对比

先摆一个容易混淆的点：hyperframes 侧的「PPT 对称物」是 slideshow skill（可导航 deck、片段揭示、分支、演示者模式），但其 SKILL.md 明文规定 **「Do not hyperframes render a slideshow into a single MP4」**——deck 由多个顶层 scene 组成、无 master-root，`render` 只会渲第一个 scene 产出静默截断的 MP4（官方例子：40 秒的 deck 只出 6 秒）；线性主线导出被官方 defer，当前支持的输出是 `present` 演示与逐页 snapshot 静图。且 island 里的 `ttsScript`/`ttsAudioUrl`/`ttsDurationMs` 标注为 **Reserved——TTS 播放尚未接线**。所以「hyperframes 做 PPT」得到的是可演示 deck 而不是视频；hyperframes 出视频必须走线性组合（faceless-explainer / general-video），与 PPT 是两套表达。

| 维度 | PPT 路线（C 拼片 / D 混合） | hyperframes 直出（faceless-explainer） |
|---|---|---|
| 最终交付物 | PPT 文件 + 视频双产物 | 仅视频（slideshow 形态可出交互 deck，但不出 MP4） |
| 动效 | C 零动效；D 有转场与叠加动效，页内元素仍静态 | 原生全动效（kinetic typography、图表动画、转场、keyframes） |
| 旁白对时 | 页级（每页一段旁白） | 词级字幕与对时（article-to-video 在产） |
| 画幅 | 横版原生，竖版要重设计 | 任意画布原生，竖版在产 |
| 信息密度 | 沿用 PPT「可读」密度，转视频偏密，需按视频纪律重写 | 按两秒留存纪律设计 |
| QA | pptx skill 三段 QA + judge 逐页验收；出片后还需拼片层校验 | lint/check/snapshot 确定性渲染 + 视频线 QA agent，管线在产 |
| 出片成本 | C 分钟级（ffmpeg 拼片为主）；D 加帧渲染 | 帧渲染时长（Stage C 实测方差 16-43 分钟） |
| 自动化 | C/D 全自动可进 skill 断点管线 | 已在产（ai-news-digest / article-to-video） |
| 新增维护面 | C 需装 LibreOffice + 新拼片脚本；D 双层管线 | 零（沿用现有） |

一句话概括：**hyperframes 是「为视频而生的表达」，PPT 是「为文档而生的表达」**；PPT→视频是格式转换（有损），文章→hyperframes 是原生创作。经 PPT 中转唯一不可替代的理由是 PPT 本身要交付。

## 五、选型建议（按场景）

1. 最终物是视频、素材是文章/主题 → 直接 hyperframes faceless-explainer。在产、词级字幕、全动效、竖版原生；经 PPT 中转每一层都有损。
2. PPT 本身是交付物（讲课/汇报/公众号图文配套），视频是衍生品 → 方案 C 做基线（装 LibreOffice 后全自动），要动效升级方案 D。
3. 必须保留 PPT 内做的动画 → 装 PowerPoint 桌面版用原生导出（最简单正解，COM 可自动化）；不想装就用录屏（零新安装、保真 100%、半自动，动画需改自动时序）。WPS COM 已实测死路，GUI 人工通道视版本而定。
4. 要的是可交互演示（点击翻页、分支） → hyperframes slideshow + `present`，但明确它不出 MP4。
5. 竖版短视频场景 → 画布技术零障碍（9:16 精确对齐 1080×1920，见 §三），但横版页面须按竖版重排、成本≈重做，一般仍以 hyperframes 直出为优；横版课程/录屏场景 → PPT 路线天然成立。

## 六、遗留缺口（选此路前要补的事）

- LibreOffice 未装——但已非硬前置：WPS COM 转 PDF 实测可用（见实操增补 §七），方案 C/D 的 pptx→PDF 环节与 QA 出图均可用它等价替代；装 LibreOffice 仍是静态管线的最干净路径（无 COM 依赖、可无头批量），按需决定。
- 竖版 PPT 画布的字号体系无人调过（若选竖版路线）。
- 已结清：WPS COM 视频导出（实测+官方文档双重定案，见方案 B）；WPS COM 转 PDF（2026-09-04 实测可用）；python-pptx（已补装 1.0.2）。

## 七、2026-09-04 实操增补

**pptx skill 的「配置安装」是伪问题**：ZCode 内置自带 document-skills 0.1.4（pptx/docx/pdf/xlsx），不在 `installed_plugins.json`（该文件只记用户额外安装的插件，判定装没装看缓存目录+会话 skill 列表）。真正要做的是补运行依赖，已全部备齐：pptxgenjs（npm 全局）、python-pptx 1.0.2 与 markitdown[pptx]（conda 补装）、defusedxml/PIL/PyMuPDF/pywin32/ffmpeg 原有。WPS GUI 导视频路线下 LibreOffice/Poppler/playwright 均不需要。

**WPS COM 转 PDF 端到端可用（结清一个待验证假设）**：`Presentations.Open(path, ReadOnly, Untitled, WithWindow=False)` + `pres.SaveAs(pdf_path, 32)`（ppSaveAsPDF）——11 页真实 deck 秒级出有效 PDF，再 PyMuPDF 出 PNG，全程无弹窗。这意味着 pptx→PDF 渲染可免装 LibreOffice（方案 C 的静态化环节、pptx skill QA 出图均可走此链）。

**首个 deck 产物已交付**：`_research/PPT转视频方案分享/`——11 页《PPT转视频方案与HyperFrames对比.pptx》（每页带演讲者备注约 1500 字，将来 WPS 导视频时可直接作 TTS 旁白稿）+ build_deck.js（pptxgenjs 构建，改文案重跑即新版）+ deck.pdf + qa/ 验收图。QA 战报：Code QA（python-pptx 溢出/越界/重叠估算）初版抓 8 处修复后全绿；视觉 QA 11 页全过（3 页修复复审：徽章对齐/卡内溢出/行距）——judge 子代理图像通道故障按其契约兜底降级主 agent 看图，视觉链路踩 CDN 内容去重坑（换文件名无效，须改字节重编码拿新缓存对象）与并行限流坑（429 后串行小批量）。

**产物可编辑性定案（用户疑「元素不可编辑」后实证）**：pptxgenjs 产物是原生可编辑 OOXML——全 deck 0 图片、163 个原生形状/文本对象 + 1 个原生表格，WPS/PowerPoint 双击即改（python-pptx 改 run 实测通）；枚举显示 AUTO_SHAPE 而非 TEXT_BOX 只是 pptxgenjs 给 addText 写了矩形 prstGeom 的归类差异，勿误判。qa/*.png 是验收快照、deck.pdf 是衍生物，均非 pptx 内容物。skill 合规：创建线/依赖/设计纪律/Code QA 全对应 document-skills:pptx 条文，唯一偏离=Visual QA 出图工具替换（无 Poppler/LibreOffice→WPS COM+PyMuPDF；judge 故障后按契约兜底）。

**装 Poppler/LibreOffice ≠ 保动效（追问定案，勿再答错）**：这两个组件在管线里只做静态化（soffice→PDF→位图），而 PDF 是固定版式格式没有动画层——动画在 pptx→PDF 首跳即丢；LibreOffice Impress 放映模式能播动画（兼容有限）但无任何导出视频能力（无 `--convert-to mp4` 之类），放映捕获=录屏属另一方案。装它们的全部价值=补方案 C 静态全自动出片+QA 标准工具链；动效保留仍然只有专题节三路。

**动效进 PPT 的工程方案（2026-09-04 二追记，含日报风复刻实践）**：已完成日报视频风格的静态复刻（`_research/PPT转视频方案分享/AI日报视频风复刻_2026-09-03.pptx`，7 页 9:16，色板/版式元素从 hf-faceless 帧源逐 hex 换算）。动效层三条路：①**python-pptx timing XML 注入（全自动核心路，已验证可注入、WPS 可打开）**——PPT 动画=`<p:timing>` 树节点（presetClass entr/emph/exit+delay/dur），与视频动效映射：VO 逐词 reveal→进入-淡入（delay=词时间戳）、数据条生长→擦除 Wipe、落地脉冲→强调-缩放、帧转场→`<p:transition>`+`advTm`；**时序数据源现成**：`_video/hf-faceless/audio_meta.json` 的 `voices[frame].words[]`（词级秒）就是 GSAP 时间轴的时序源，advTm=帧 duration_s。②WPS 动画窗格手工加（一次性场景）。③动效后置回方案 D（对照项）。**旁白闭环**：每帧 TTS 音频现成（`assets/voice/NN.mp3`），插入每页+自动播放，WPS「输出为视频」导出即带旁白+动画、时序天然对齐。能力边界（诚实）：PPT 无 count-up 原生动画、无弹性 easing、无无限呼吸（advTm 到点即翻页）、逐词字幕动画节点量不可行（字幕后混走 ASS——见替代分析）；复杂 timing 序列在 WPS 放映的兼容性需先小样本人工验证再批量注入（已注入全量 63 动效版：`AI日报视频风复刻_动效版.pptx`）。**「PPT 管线替代日报视频线」的完整可行性分析另立报告**：[《PPT 管线替代 hyperframes 可行性分析》](/posts/ppt-pipeline-vs-hyperframes-feasibility/)（结论：可替代但不切换，立项为备份产线；词级字幕可 ASS 后混补齐、出片走 WPS 放映+ffmpeg 录屏后混，不走 WPS 导出）。

**放映实测定案与全量注入要点（2026-09-04 三追记，推翻二追记「元素动画待人工验收」表述——放映实测已见分晓）**：

1. **「withEffect+外层组 delay=0」自动序列在 WPS 放映不执行（实锤）**：放映+定时截屏+橙像素统计三连实测（T4=15.5s 与 T2=9.7s 画面恒定、statA「2.4」与数据条从头到尾常显）证明 WPS 放映引擎忽略该结构的元素动画——**但注意安全侧：忽略 timing 时元素保持常显（静态完整页），不会出现「元素被隐藏后不出现」的丢内容事故**。同场实测确认 **advTm 自动换片正常**（P1→P2 按时切换，橙像素 17233→9250）、**页内旁白 mp3 自动播放正常**（p:audio delay=0 节点生效）。结论：WPS 对 timing 的取舍 = 转场/换片/媒体节点认、mainSeq 内自动动画序列不认。修复方向（未试）：标准 clickEffect 结构改自动触发（afterEffect 链）、或动画节点移出 mainSeq 挂 tmRoot 独立 par——待下次实验。
2. **WPS COM 缺口清单再添两项**（与 CreateVideo/视频 SaveAs 并列，勿再踩）：`SlideShowSettings`（放映启动对象模型）不存在、`shape.TextFrame.TextRange`（文本读取）不存在——WPS COM 可用面基本只剩 Presentations/Open/Close/SaveAs(32=PDF)/Slides.Count。
3. **放映启动与录屏实测方法（可复现）**：COM 放映死路后的替代=Open(WithWindow=True)+`WScript.Shell` AppActivate+SendKeys `{F5}` 启动放映（已跑通）；ffmpeg gdigrab `-i desktop` 抓的是**整个虚拟桌面**（本机 6400×2160 双屏拼接，放映区在右半屏）；画面变化检测用「特征色像素统计」（火橙 #FF6A2B 容差采样计数，跨时刻对比）比视觉模型便宜可靠。
4. **全量注入的实现要点**（inject_full_timing.py，63 动效结构校验全过）：shape 定位三法——精确/包含文本匹配、填充色+尺寸特征（橙 OVAL=进度亮点、扁长橙矩形=数据条）、按 top 排序做同组 stagger（180ms）；词点解析=候选词顺序匹配 words[] 取 start，miss 则按帧时长比例 fallback；**坑：章号=条目号（P2 章号是 01）≠页码**，按页码拼「0%d」定位必 miss。

## 八、信息源

- 本机实测（2026-09-03）：ffmpeg/PyMuPDF/pywin32/python-pptx/soffice/pdftoppm/Office 存在性探测；`PowerPoint.Application` COM 进程归属（tasklist 实证 wpp.exe）；WPS COM 端到端验证——两页测试稿（自动动画+自动换片，`make_test_pptx.py`）→ `CreateVideo` 无产物实测（`wps_createvideo_test.py`）→ `SaveAs` 枚举 35-42 扫描与产物 magic 判读（`wps_sweep_test.py`，42 卡模态框后 taskkill 收尾）；测试件在 `%TEMP%\pptx_video_test\`。
- 本机实测（2026-09-04）：WPS COM `SaveAs(32)` 转 PDF（11 页 deck，render_pdf.py）；MS 官方 PpSaveAsFileType 枚举对照与 WPS 官方 V13 二次开发文档查证（CreateVideo 全站零命中）；任意画幅造稿验证——9:16（7.5×13.333 英寸，144dpi 恰 1080×1920）与 10:21（7.5×15.75 英寸）均 pptxgenjs `defineLayout` 可造、python-pptx 读回精确命中（aspect_test.js）；deck 产物与 QA 过程见 §七；放映实测三连（F5+gdigrab+橙像素统计）与全量 timing 注入（inject_full_timing.py）见 §七三追记。
- 记忆层沉淀：视觉 QA 链路坑（CDN 内容去重/限流/judge 兜底）在 auto-memory `vision-qa-local-images-cdn-trick`；本机环境基线在 `local-office-render-baseline`。
- Aspose.Slides 视频能力：官方文档与论坛（Python 版仅 GIF、.NET/C++ 逐帧+FFMpegCore）。
- hyperframes slideshow SKILL.md（插件缓存 0.8.6）：输出形态与 render 禁令、TTS 保留字段、media 纪律。
- pptx skill SKILL.md（zcode-plugins-official/document-skills 0.1.4）：三段 QA、soffice→PDF→pdftoppm 出图管线、依赖表。
- [《Anthropic 官方 PPTX 技能调研报告》](/posts/anthropic-pptx-skill-survey/)（2026-09-03）：pptx skill 完整解剖与渠道。
