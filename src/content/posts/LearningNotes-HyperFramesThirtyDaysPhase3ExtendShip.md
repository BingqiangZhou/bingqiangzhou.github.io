---
title: 【学习笔记】HyperFrames 30 天拆解（四）Extend and ship：模板、目录与云渲染的交付工程
published: 2026-08-25
description: HyperFrames「30 天」系列第四篇，全内容拆解 Days 20-30「Extend and ship」阶段：Claude Design 设计交接四步与合格标准；云渲染完整细节（OAuth/API key 鉴权、zip 上传渲染下载流程、fps 1-240、draft/standard/high 画质、mp4/webm/mov 透明格式、4k 计费、变量渲染、asset_id 上传一次多次重渲、--no-wait 加 webhook 回调与幂等键、cloud list/get/delete、200MB 限额与 .hyperframesignore）；组件目录双层结构与接线（block 五属性挂载 vs component 三段融合、按意图英文检索两档排名、dropped/unindexed 偏斜、search-miss 需求闭环）；变量系统全貌（七种类型、data-var-text/data-var-src 直接绑定、CSS 自定义属性、嵌套组合 per-instance 传值、CLI --variables 与 rows.json 批渲、batch-concurrency、不能变量化清单、strict-variables）；调色全操作（先校正后风格化、十三预设、九组控件、四个示波器、grade-compare、data-color-grading 三段存储、LUT 的 Rec.709/LOG 边界）；媒体特效四族十八效果与 overlay 语气映射；三官方托管模板与四条渲染路线；贡献目录从建目录到 PR 的全流程与五条评审问题；Prompt Guide 七层地图。读完本篇无需再翻官方文档。
lang: zh
tags: [学习笔记]
abbrlink: hyperframes-thirty-days-phase-3
---

> **系列导航**：[（一）总览](/posts/hyperframes-thirty-days-notes/) → [（二）Start and create](/posts/hyperframes-thirty-days-phase-1/) → [（三）Direct and refine](/posts/hyperframes-thirty-days-phase-2/) → **（四）Extend and ship（本篇）** → [（五）创作路径](/posts/hyperframes-thirty-days-creation-paths/) → [（六）Prompt Guide](/posts/hyperframes-thirty-days-prompt-guide/) → [（七）Catalog](/posts/hyperframes-thirty-days-catalog/)
> **调研日期**：2026-08-25
> **本篇对象**：Days 20-30 + 官方 [Cloud rendering](https://hyperframes.heygen.com/deploy/cloud) / [Deploy overview](https://hyperframes.heygen.com/deploy/overview) / [Deploy guide](https://hyperframes.heygen.com/guides/deploy) / [Variables](https://hyperframes.heygen.com/concepts/variables) / [Color grading](https://hyperframes.heygen.com/guides/color-grading) / [Media effects](https://hyperframes.heygen.com/guides/media-effects) / [Overlays](https://hyperframes.heygen.com/prompting/overlays-and-lower-thirds) / [Contributing](https://hyperframes.heygen.com/contributing/catalog) 全文
> **说明**：官方页面的事实、命令、表格、边界全录于此，目标是读完本篇不再需要翻网站

## 一、第三阶段的本质

Days 20-30 十一天全在讲复用与交付：设计方向复用（Day 20）、渲染算力复用（Day 21、27）、运动积木复用（Day 22、28、29）、composition 复用（Day 23）、视觉语言复用（Day 24、26）、知识复用（Day 25）。官方对本阶段的定义：**从一个 composition 走向可重复的流水线——可复用积木、变量、调色，以及在你笔记本之外的地方渲染**。

## 二、Day 20：Claude Design——设计方向直接进项目

（源：[Bring a design into a project](https://hyperframes.heygen.com/guides/design-tools)、[Prompt Guide](https://hyperframes.heygen.com/prompting/overview)）

课程原话：把设计方向带进 HyperFrames 项目而**不用手工重画**。机制（来自 Prompt Guide 的设计工具协作章节 + [Design tools](https://hyperframes.heygen.com/guides/design-tools)）：

**Claude Design / Open Design 交接四步**：① 给设计工具 [HyperFrames 指令文件](https://github.com/heygen-com/hyperframes/blob/main/docs/guides/design-tools-hyperframes.md)与你的品牌材料；② **要 working project，不要 loose mockups**；③ 存盘后用编码代理打开那个文件夹；④ 让代理检查 timing、motion、media、captions、rendering。

**交接合格标准**：方向清晰；真资产或诚实标注的占位；可能变化的部分有可编辑源；本地媒体与字体；项目能打开。自查：`npx hyperframes check` + `npx hyperframes preview`，然后到 Studio **看它动**——静帧看不出时序。**没有设计工具能告诉你动起来对不对**，静态观感定稿后，运动、媒体与渲染交还编码代理。

## 三、Day 21：云渲染（HeyGen 托管）

（源：[Cloud rendering](https://hyperframes.heygen.com/deploy/cloud)）

[Cloud rendering](https://hyperframes.heygen.com/deploy/cloud) 全部要点——渲染不掉本地机器、免自建基础设施、免本地 Chrome/FFmpeg：

**鉴权**：`npx hyperframes auth login` 走 OAuth（浏览器授权、回环端口捕获 token）；CI/无头环境用 `--api-key`（隐藏输入或 stdin）。凭据存 `~/.hyperframes/`，与 TTS、媒体目录共用。

**流程**：CLI 打包项目 zip → 上传托管端点 → 云端容器渲染 → 下载 MP4 到本地。

**渲染参数：**

| 参数 | 取值 |
| --- | --- |
| `--fps` | 1 到 240 |
| `--quality` | draft（最快）/ standard / **high（推荐交付）** |
| `--format` | mp4 / webm / **mov（可带 alpha 通道，透明视频）** |
| `--resolution` | 1080p / 4k（4k 按 1.5 倍计费档） |
| `--aspect` | auto（沿用组合自带画幅） |

**变量支持**：渲染命令可直接带 `--variables`，模板已就位、改值即出片（见 Day 23）。

**三个运维级设计**：

1. **上传一次、多次重渲**：首次上传返回 `asset_id`，之后换变量、换参数重渲都复用同一上传，不再重复传项目；
2. **异步与回调**：`--no-wait` 立即返回任务句柄，`--callback-url` 挂 webhook——渲染流水线可以进你的 CI；幂等键让重复提交不重复渲染计费；
3. **云端资产管理**：`cloud list / get / delete` 管理托管端的项目与产物。

**边界**：单项目上传上限 **200MB**；逼近或超限时用 `cloud render --dry-run --json` 排查 `.hyperframesignore`（哪些资产被卷进包）——**永远不要仅仅因为某个资产大就忽略它**。

## 四、Day 22：组件目录（消费侧）

（源：[Catalog](https://hyperframes.heygen.com/catalog)；接线与检索细节源自本机 `/hyperframes-registry` 与 `/hyperframes-cli` 技能，权威版本见 [skills 目录](https://github.com/heygen-com/hyperframes/tree/main/skills)）

Catalog 是官方注册表，llms.txt 全目录清单收录 **370 余个条目**（block 150 余、component 210 余）。双层结构决定两套用法：

| | Block（块） | Component（组件） |
| --- | --- | --- |
| 本质 | 独立子组合（自带尺寸、时长、时间线） | 效果片段（无自有尺寸） |
| 安装到 | `compositions/<name>.html` | `compositions/components/<name>.html` |
| 接线 | 声明式挂载 | 手工融合 |

```bash
hyperframes add data-chart               # 按名装一个块
hyperframes add shimmer-sweep            # 装一个组件
hyperframes add captions                 # 按标签装全部字幕块
npx hyperframes catalog --query "reveal a headline one line at a time"   # 按意图检索
```

**Block 接线五属性**（`data-composition-id` 必须与块内部 ID 完全一致）：

```html
<div
  data-composition-id="data-chart"
  data-composition-src="compositions/data-chart.html"
  data-start="2"
  data-duration="15"
  data-track-index="1"
  data-width="1920"
  data-height="1080"
></div>
```

**Component 三段融合**：读安装产物，把 HTML 元素拷进宿主组合、`<style>` 并进样式块、`<script>` 并进脚本区（组件暴露 GSAP timeline 钩子时再在时间线里调用）。安装后 CLI 打印可粘贴的起始片段，时间属性自己补。

**检索四规则**：① **描述效果而非机制**（查询写「想要什么动作」）；② **必须英文**——索引是英文的，中文查询返回 `No searchable words in query`，这是查询语言问题不是缺组件，别上报 gap；③ **两档排名**——默认词汇匹配（words，纯本地零外发）、`--on-device` 语义排名（首次约 33MB 本地模型，同样零外发），`--json` 输出标明哪档答的话；④ **两个偏斜计数**——`dropped`（向量库有、本注册表装不了）与 `unindexed`（注册表有、索引看不见），前者清 `~/.hyperframes/catalog/` 缓存，后者重跑 `--on-device` 自动重取索引。**离线边界**：manifest 有 24h TTL，断网可搜（用最后一份清单）但 `add` 安装永远要联网。

**缺口反馈**：`hyperframes feedback --search-miss "<查询>" --wanted "<想要的效果>" --tier <words|on-device>`——官方明说这是目录**唯一的需求数据源**，描述效果、不写想象中的组件名、不带评分不进考核。

## 五、Day 23：变量与模板

（源：[Reuse a design with variables](https://hyperframes.heygen.com/concepts/variables)）

[Variables](https://hyperframes.heygen.com/concepts/variables) 全部要点。判断标准：**设计应跨版本保持稳定时用变量；结构本身要变时做普通源码编辑**。

### 5.1 声明（组合根元素上）

```html
<html data-composition-variables='[
  {"id":"title","type":"string","label":"Title","default":"Pro"},
  {"id":"accent","type":"color","label":"Accent color","default":"#6c5ce7"},
  {"id":"logo","type":"string","label":"Logo","default":"assets/logo.svg"}
]'></html>
```

**七种类型**：string（文本或媒体路径）、number（数量/位置/尺寸/强度）、color、boolean（开关）、enum（受批列表选一）、**font**（字体族选择）、**image**（图片路径或图片值）。类型让 Studio 显示正确控件、让渲染捕获非法值。必填四件套 `id` / `type` / `label` / `default`。

### 5.2 无脚本绑定（常态）

```html
<h1 data-var-text="title">Pro</h1>
<img data-var-src="logo" src="assets/logo.svg" alt="" />
<style>.card-title { color: var(--accent); }</style>
```

`data-var-text` 替换元素文本；`data-var-src` 替换图片/视频/音频/源的 URL（**运行时重读 DOM 装载新源——换片头视频不用改结构**）；**标量变量自动成为 CSS 自定义属性**（`var(--accent)` 跟随覆盖）。需要条件、循环或派生值时才用脚本：`window.__hyperframes.getVariables()`。

### 5.3 嵌套组合的每实例传值

父级可多次复用同一组合，`data-variable-values` 各给各的（注意第二个实例的 `data-start="card-pro"` 是**相对另一实例的相对时间**）：

```html
<div data-composition-id="card-pro" data-composition-src="compositions/card.html"
     data-start="0" data-duration="3" data-track-index="1"
     data-variable-values='{"title":"Pro","accent":"#ff4d4f"}'></div>
<div data-composition-id="card-enterprise" data-composition-src="compositions/card.html"
     data-start="card-pro" data-duration="3" data-track-index="1"
     data-variable-values='{"title":"Enterprise","accent":"#22c55e"}'></div>
```

### 5.4 从数据渲出版本与批量

```bash
npx hyperframes render \
  --variables '{"title":"Enterprise","accent":"#22c55e"}' \
  --strict-variables --output enterprise.mp4
```

`--variables-file` 用 JSON 文件；`--batch` 让同一组合按数据行各渲一次。`rows.json` 是**JSON 数组**、每个元素一组变量值，`{name}` 占位符命名输出：

```json
[{"name":"acme","title":"Acme Pro"},
 {"name":"northstar","title":"Northstar Pro"}]
```

```bash
npx hyperframes render --batch rows.json --strict-variables \
  --output "renders/{name}.mp4"
```

默认**单行并发**；真实渲染稳定、机器内存足够后再调 `--batch-concurrency`。优先级链：组合默认值 → 宿主 `data-variable-values` → CLI 覆盖（后者永远赢）。

### 5.5 不能变量化（官方清单）

组合视口尺寸；根组合的总渲染时长；帧率；输出格式/编码/画质（这些在组合逻辑运行前从源码或渲染设置读取）；父/兄弟组合（除非显式向其传值）。

### 5.6 校验

`npx hyperframes lint` 抓畸形声明、缺字段、默认值类型错、非法 enum 选项；`--strict-variables` 把未声明或类型错误的渲染值变成错误。

## 六、Day 24：调色（Color grading）

（源：[Color grade images and footage](https://hyperframes.heygen.com/guides/color-grading)）

[调色指南](https://hyperframes.heygen.com/guides/color-grading)全部要点。调色改变图片/视频**看起来**如何，磁盘文件永不变；**一次作用于一个媒体元素**，文字、字幕、SVG 与普通 HTML 在自己的层上不受影响。

**顺序纪律：先校正，后风格**。曝光、白平衡、对比、饱和度先做到可信；然后塑形影调范围或单一颜色；然后预设或 LUT；**grain、vignette、胶片效果最后**。没有任何预设能救回曝掉的高光、死黑的阴影或选错的镜头。

**Studio 操作**：选中图片或视频（画布、Layers 或时间线）→ Inspector 的 **Grade**。**13 个预设**从 Neutral、Clean Studio 到 Night Lift，Studio 把每个预设渲成**你这一帧**的缩略图（不是别人的样图）；**Strength** 在无与全之间拨。按住面板头的 compare 键闪回原图。**动素材先擦几处再定**——讨好一帧的调色可能毁掉下一帧。

**九组控件**：预设与强度；曝光/对比/高光/阴影/白/黑（整体与分影调）；暖度/色温/自然饱和/饱和（去色偏或加色）；**色轮**（影调分离调色：阴影/中间调/高光各自 tint）；**RGB 曲线**（重画亮度坡，整图或 R/G/B 单通道）；**色相曲线**（挑一个色相只动它：偏移、加饱和、提亮）；**HSL 选区**（键控一段色相/饱和/亮度只校正那些像素，**最多四个、按序**）；grain 与 vignette；自定义 LUT。

**读示波器，别信屏幕**（屏幕可能过亮）：

| 示波器 | 读什么 |
| --- | --- |
| Histogram | 全帧暗/中/亮分布；堆在两端 = 细节已丢 |
| Waveform | 亮度从左到右的分布——看见**哪部分**曝掉了 |
| RGB parade | 波形按 RGB 拆开；某通道骑高 = 色偏点名 |
| Vectorscope | 色相圆：方向是哪种颜色、离圆心是饱和度；肤色落在一条已知线上，查脸最快 |

**一图比候选**：`npx hyperframes grade-compare --for frame.png --grades grades.json`——`--grades` 是 `{label, grading}` 的 JSON 数组，原图打头（`--no-baseline` 去掉），最多 16 格四列排进 `grade-compare.png`；换 `--luts a.cube,b.cube` 同样比 LUT。

**对代理描述问题即可**（不需要记控件名）：

```text
The interview looks too dark and slightly cold.
Keep skin natural, recover the background enough to read, and avoid a filtered look.
```

配套命令：`npx hyperframes media-treatment --capabilities --json`（列有什么）、`--selector '#interview' --analyze --json`（改前测量源：颜色元数据、亮度位置、什么在削波、一个有界的起步校正）。

**复用调色**：Copy grade to 把当前调色应用到其他媒体（同文件或跨项目）——起点而非保证，同样的数字很少同时适合两个镜头。跨项目复制拒绝相对 LUT 路径（换个组合目录那路径含义就变了）；留在当前文件，或用 URL / data URL 可达的 LUT。

**LUT 边界（承重知识）**：LUT 是把每个输入颜色映射到输出颜色的查找表；HyperFrames 读最高每边 64 点的 3D `.cube`，按设定强度混入。**没有东西先归一化你的素材**——HyperFrames 不识别相机配置文件、不跑 ACES/OCIO。安全场景是**创意 Rec.709 LUT**（为普通 web/广播视频构建，也是这套控件唯一工作的色彩空间）；**LOG 素材**（刻意拍平保细节）需要相机期望的变换，否则出来是「错」不是「风格化」。

**存储格式**：结果写进 `data-color-grading`，**分命名段**：校正在 `adjust`、grain/vignette 在 `details`、风格化处理在 `effects`：

```html
<video src="./interview.mp4" data-color-grading='{"preset":"skin-soft","intensity":0.7,"adjust":{"exposure":0.15},"effects":{"bloom":0.4}}'></video>
```

嵌套不可省——`{"exposure":0.15}` 这种扁平对象**渲染不出任何东西**；`lint` 会抓并点名控件属于哪段。

**做不到的**：按值选像素、**从不按位置**——没有人脸跟踪、区域跟踪、rotoscoping 或遮罩（HSL 选区是颜色限定器不是形状）；要处理画面一部分，把它拆成独立媒体层单独调。只针对媒体元素——**整场景含 HTML 文字不能一起调**。支持的是 SDR；4K 可用但预览渲染成本更高；HDR 源（iPhone HDR、HLG）得到 SDR 预览加横幅提示，不是真 HDR 调色。远程媒体需要宽松 CORS 且可能渲染前消失——**媒体留在项目里**。

## 七、Day 25：Prompt Guide 七层课程

（源：[Prompt Guide](https://hyperframes.heygen.com/prompting/overview)，全文深读见[篇六](/posts/hyperframes-thirty-days-prompt-guide/)）

官方提示词体系的大成（本系列[篇六](/posts/hyperframes-thirty-days-prompt-guide/)全文深读），此处只放阶梯总表：

| Level | 主题 | 学会后能做什么 |
| --- | --- | --- |
| 1 | Your first video | 一条提示词得到成片——工作流替你填空缺 |
| 2 | Control | 六段骨架：route / spec / beats / copy / technique / negatives |
| 3 | Life | 运动与转场读起来高级而非幻灯片 |
| 4 | Substance | 真能力：代码动画、数据可视化、overlay、字幕、生成艺术、VFX、3D |
| 5 | Voice & sound | 旁白、音乐与你给的任何素材，正确配乐混音 |
| 6 | Scale | 设计系统与变量模板 |
| 7 | Capstone | 每种技法汇成一部影片 |

## 八、Day 26：媒体特效与 overlay

（源：[Apply media effects](https://hyperframes.heygen.com/guides/media-effects)、[Overlays and lower thirds](https://hyperframes.heygen.com/prompting/overlays-and-lower-thirds)）

[Media effects](https://hyperframes.heygen.com/guides/media-effects)全部要点：特效改变素材**看起来**如何而非它是什么，原文件永不变，之后可调、可动画、可整体摘除。全家福：**18 种效果、16 种色彩 look、4 条 LUT 路径**，全在一个媒体层上、事后全部可编辑。

**四族效果**：

| 族 | 效果 | 用途 |
| --- | --- | --- |
| Essentials | Blur、Pixelate、Bloom | 藏东西、把注意力拉到别处、亮区发光 |
| Retro 与 glitch | Tape Damage、Film Artifacts、Scanlines、CRT Curvature、Channel Separation、Digital Glitch、Chroma Softening | 像旧磁带、旧胶片、旧显示器或坏信号——**损坏按真实行为构建**（跟踪抖动、渗色、撕裂），不是随机彩噪 |
| Print | Halftone、Two-Ink Print、Ordered Dither、Mono Screen | 印刷网点或双色海报 |
| Art | ASCII、Engraving、Crosshatch、Kuwahara Paint | 重画为字符、雕线、排线或油画笔触；**ASCII 单独有八种风格** |

grain 与暗角归调色；HUD、漏光、闪光归 Catalog overlay。

**Studio 操作**：选媒体 → Inspector 的 **Effects** → 挑一个、调、**完整播一遍**（有些特效动起来才露馅）。**特效覆盖整个媒体层**，不跟脸、不跟屏幕、不跟物体——只改局部就先裁剪/遮罩成独立层。Blur、Bloom、Kuwahara 是贵的，大层上堆几个会拖慢预览与渲染。

**对代理说话**（不用记控件名）：`Make this product clip feel like a clean two-ink editorial print. Keep the product shape and label readable.` 命令面：`media-treatment --capabilities --json` 查能力、`--capability twoInkPrint` 看单族、`--selector '#product' --grading '{"preset":"two-ink-print"}' --apply --json` 应用、`--dry-run` 试、`--analyze` 先测量、`--clear` 摘除——**写的也是 Studio 读的同一份 `data-color-grading`，两边永不打架**。

**有用纪律**：真想藏/揭示才用 blur/pixelate；选了强 look 就**贯彻**（半强度 ASCII 读起来像失误）；对着原版比；特效开始跟故事抢戏就摘掉。两条边界：特效跑 SDR 管线，原生 HDR 层走独立路径**不会**出现这些效果（必须进最终文件就先转 SDR）；远程文件要 CORS 且可能消失——媒体留在项目里。

**Overlay 与 lower third**（[提示词章](https://hyperframes.heygen.com/prompting/overlays-and-lower-thirds)）：overlay 是坐在素材/场景之上的**定时块**——提示词在「在某个时刻**加**点什么」时触发：`add a lower third at 0:03 with the name and title`、`show an animated tweet during the intro`。给时间戳、文案、语气，代理把块放到素材上方的轨道。两组：**Lower thirds**（说话人名条，分 cards 有底与 cardless 无底两路——活素材上优先 cardless，带文字阴影不加框；背景太乱用 lt-dark-card 炭色卡）按品牌语气映射：Minimal → lt-clean-bar / lt-soft-pill；High-energy → lt-bold-block / lt-color-block；Cardless over footage → lt-accent-underline / lt-kicker-name / lt-mask-reveal / lt-side-rule；Broadcast → lower-third-bild / news-ticker；两段式 wipe（名 + 头衔）→ lt-stack-bars。**Social overlays** 是平台 UI 的动画复刻（帖子、卡片、通知、关注提示）。课程那句「两到六条精心设计的色坡改变整片视觉语言」就是这一天的点题。

## 九、Day 27：部署——四条渲染路线

（源：[Choose a rendering path](https://hyperframes.heygen.com/deploy/overview)、[Deploy a preview and render API](https://hyperframes.heygen.com/guides/deploy)）

[Choose a rendering path](https://hyperframes.heygen.com/deploy/overview)：按基础设施所有权，渲染有四个去处——**本地机器、应用后端、HeyGen 托管云、你自运营的分布式基础设施（AWS Lambda / Google Cloud Run）**。CLI 对照（`hyperframes-cli` 技能）：

| 需求 | 命令 |
| --- | --- |
| 本地快速迭代 | `render --quality draft` |
| 本地最终交付 | `render --quality high --output out.mp4` |
| 可复现容器渲染 | `render --docker --strict` |
| 本地变量批量 | `render --batch rows.json --output "renders/{name}.mp4"` |
| HeyGen 托管零基础设施 | `cloud render` |
| 自管分布式 AWS | `lambda render <project> --width 1920 --height 1080 --wait` |
| 自管分布式 GCP | `cloudrun render <project> --width 1920 --height 1080 --wait` |

选择原则：要托管渲染但不想碰 Chrome/FFmpeg/云 → 托管云；**只有当基础设施所有权是硬要求时才上 Lambda / Cloud Run**。

**应用后端路线**（[Deploy guide](https://hyperframes.heygen.com/guides/deploy)）：三个官方托管模板，各自用 `<hyperframes-player>` 预览捆绑组合、在服务端 Chrome + FFmpeg 渲染 MP4：

| 模板 | 渲染运行时 | 产物存储 | 适合 |
| --- | --- | --- | --- |
| [Vercel](https://github.com/heygen-com/hyperframes-vercel-template) | Vercel Sandbox | Vercel Blob | 已在 Vercel 上的 Next.js 应用（`/api/render` 恢复预置 Sandbox、跑 render、传 Blob、返回公开 URL） |
| [Cloudflare](https://github.com/heygen-com/hyperframes-cloudflare-template) | Cloudflare Container | R2 | Workers 应用需要容器化渲染器（RenderContainer Durable Object 渲染并流式写 R2；附可选 OpenRouter 提示词生成——公开演示前关掉，**需 Workers Paid**） |
| [Modal](https://github.com/heygen-com/hyperframes-modal-template) | Spawned Modal Function | Modal Volume | Python 服务、渲染作业跑在 web 请求之外（FastAPI `POST /api/render` 起独立函数返回 call ID，浏览器轮询取 MP4；部署 `modal deploy src/app.py`） |

换自己的组合：本地 `init → preview → check` 通过后，替换模板的组合目录并改一行配置（Vercel 改 `lib/preview.ts` 的 `PREVIEW_COMPOSITION_DIR`；Cloudflare 设环境变量；Modal 改 `src/app.py` 的 `PREVIEW_COMPOSITION`）；非 1920x1080 还要改播放器尺寸。**公开暴露端点前**：这些是可运行示例不是完整多租户渲染服务——先加认证、请求限制、输入校验、成本控制；要重试/优先级/受控并发就加队列；为分布式作业设计的基础设施用 Lambda / Cloud Run。

## 十、Day 28：贡献 Catalog

（源：[Contribute to the Catalog](https://hyperframes.heygen.com/contributing/catalog)）

[Contribute to the Catalog](https://hyperframes.heygen.com/contributing/catalog)全部要点。Catalog 从 HyperFrames 仓库的 registry 生成，两条贡献路径：**提想法**（开 GitHub issue 附视觉参考——录屏、Figma 草图或别家工具的例子即可起步）；**建条目**（让代理用 `/hyperframes-registry` 技能，或照下述流程手工做）。

**条目类型与目录结构**：Block（固定尺寸时长的独立组合）需要 `registry-item.json` + 组合 HTML；Component（装进别的组合的片段）额外需要独立 `demo.html`（没有它 Catalog 预览生成器会跳过）。每个条目一个目录，**元素 ID 一律加条目名缩写前缀**防子组合安装时碰撞：

```text
registry/blocks/my-block/        registry/components/my-effect/
  my-block.html                    my-effect.html
  registry-item.json               demo.html
                                   registry-item.json
```

**manifest 要点**：遵循 [registry item schema](https://github.com/heygen-com/hyperframes/blob/main/packages/core/schemas/registry-item.json)；block 声明 `dimensions` 与 `duration`，component **不得**；`params` 暴露别人在 Studio 不改 HTML 就能换的值，控件四种：`color` / `text` / `number` / `select`；可选字段含 `author`、`relatedSkill`、`registryDependencies`、`license`、`sourcePrompt`、`deprecated` 等。

**复用性铁律**（每个条目必须）：用注册在 `window.__timelines` 的暂停 GSAP 时间线；`data-composition-id` 与注册时间线 ID 一致；前缀元素 ID；不用 `Date.now()`、未播种 `Math.random()`、实时动画循环；**任意帧正确 seek**；装到源目录之外也能工作。一次性示例放 Examples，不进 Catalog。

**验证与预览**：`bun run lint:registry-items my-block`（裸 `lint` 不行——CLI 找 `index.html` 而条目是 `<name>.html`）；完整门禁：`init scratch` → `add my-block` → `check`（注意 `add` 不能装未发布的本地条目，它从 `hyperframes.json` 的 registry URL 解析——发布进 manifest 后再从干净项目测）；生成 Catalog 页与预览资产：`npx tsx scripts/generate-catalog-pages.ts` + `generate-catalog-previews.ts --only my-block`；**不要手改生成的条目页**——改 manifest 或生成器再重生成。全速看预览：**过 check 证明组合有效，不证明运动可读或有用**。五条评审问题：有没有一个视觉主角（第一秒知道看哪）？重要文字能读一遍吗（信息落地、切前保持）？运动有加速与落定吗（不像幻灯匀速漂移）？别人能换肤吗（品牌值暴露为参数）？真的可复用吗（解决重复出现的生产问题）？

**PR 内容**：条目目录；`registry/registry.json` 对应条目；重新生成的 Catalog 产物；`npx hyperframes publish` 的 hyperframes.dev 预览；使用时机、有效时长范围、已知坑。外部贡献者附预览 MP4，最终 Catalog 媒体由维护者发布。

## 十一、Days 29-30：组件更新与收官

（源：[30 Days](https://hyperframes.heygen.com/thirty-days)、[Product updates](https://hyperframes.heygen.com/developers/product-updates)）

- **Day 29 Components update**：把扩充后的整套组件组合进单个项目——组件库是活的，消费端吃下迭代（官方描述仅此一句，配套入口是 [Product updates](https://hyperframes.heygen.com/developers/product-updates) 页）；
- **Day 30 Thirty for thirty**：收官混剪——三十天每课一秒、从 Day 1 安装到全系列。官方原话：*"Thirty days in one cut — a second from every lesson, back to back. From install on Day 1 to the whole series here."*

## 十二、阶段篇收束

四个阶段篇合起来，HyperFrames 讲的是一句话：**给视频配上软件工程的全部基础设施**——工程文件（HTML+data-*，可 diff 可 lint）、导演沟通（BRIEF.md + 六段骨架）、看片审片（storyboard 板 + check/snapshot/compare）、手工重复（Catalog + 变量 + 批渲）、渲染农场（四条路线）、老剪辑师脑子里的经验（FRAME.md + skills + Prompt Guide）。我的行动清单：① 拿本博客一篇笔记喂 faceless-explainer 走全流程；② 把博客封面视觉语言沉淀成 frame.md；③ 把封面工作流改造成带变量的 HyperFrames 模板体验 `render --batch` 与云端重渲；④ 学「30 天日更、先做后发、每课链原帖」的内容打法。专题续读：[（五）创作路径](/posts/hyperframes-thirty-days-creation-paths/)、[（六）Prompt Guide](/posts/hyperframes-thirty-days-prompt-guide/)、[（七）Catalog](/posts/hyperframes-thirty-days-catalog/)，另见[《公众号系列封面生成：HTML 模板 + 无头 Chrome 截图》](/posts/wechat-series-cover-workflow/)。
