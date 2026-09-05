---
title: 【学习笔记】拆解 frontend-slides：让编码代理直接生成可放映的零依赖 HTML 幻灯片
published: 2026-09-05
description: 拆解 GitHub 28.7k star 的 frontend-slides skill：面向编码代理（Claude Code / Codex / Kimi Code 等）的单 skill，从零或从 PPTX 生成零依赖、动画丰富的单文件 HTML 演示文稿。本文覆盖 SKILL.md 六阶段工作流（低/高密度二分、三风格预览的 show don't tell、浏览器截图验收溢出）、NON-NEGOTIABLE 的固定 1920×1080 舞台模型（禁 display:none、CSS 函数取负静默失效坑）、12 安全预设 + 34 bold 模板的三层渐进披露资产组织（禁 bulk 读）、反 AI 味成文纪律、34/34 模板的 CJK 字体配对与排版修正清单，以及与两轮 PPT 调研的路线对照（PPTX 二进制 / HTML 交互演示 / HTML 时间轴视频）和五条可借鉴的 skill 工程模式。
lang: zh
tags: [学习笔记, Agent Skill]
abbrlink: frontend-slides-skill-survey
---

调研对象：https://github.com/zarazhangrui/frontend-slides （2026-09-04 全量浅克隆审读，非仅 README）

## 1 一句话定位

面向编码代理（Claude Code / Codex / Kimi Code / OpenCode / Gemini CLI 等）的单 skill，从零或从 PPTX 生成「零依赖、动画丰富」的 HTML 演示文稿——单 HTML 文件、内联 CSS/JS、无构建工具，在浏览器里直接放映。核心理念是 show, don't tell：不问用户「你要什么审美」，而是直接生成 3 个风格预览成品让用户挑。

## 2 仓库概况

| 项 | 值 |
|---|---|
| Star / Fork | 28.7k / 2.3k |
| 作者 | zarazhangrui |
| 许可 | MIT |
| 版本 | v2.1.0（plugin.json） |
| 提交 | 30 次，最新 2026-06-23（加新手教程与视频，此后静默约 2.5 个月） |
| 克隆体积 | 3.9MB |

**双形态分发，内容零差异**（diff 验证过）：

- 根目录 = 独立 skill 形态，手动复制到 `~/.claude/skills/frontend-slides/` 即可被任意代理读 `SKILL.md` 使用；
- `plugins/frontend-slides/` = Claude Code 插件形态（`plugin.json` + marketplace 清单），`/plugin marketplace add <URL>` + `/plugin install` 两步安装，调用带命名空间 `/frontend-slides:frontend-slides`。

注意仓库实际只有** 1 个 skill**（同名），不是 skill 集；「skills」复数指的是它的可复用资产层（12 预设 + 34 模板 + 3 脚本）。

## 3 工作流：SKILL.md 六阶段

`SKILL.md`（381 行）是纯工作流地图，无代码。阶段如下：

- **Phase 0 模式检测**：A 新建 / B PPTX 转换 / C 增强既有 HTML。Mode C 有专门修改守则：加内容前先清点现有元素是否超密度上限、图必须塞进 1920×1080 画布（塞不下就拆页）、任何改动后用 1280×720 加一个手机视口截图复核、预判溢出就主动拆页告知。
- **Phase 1 内容发现**：4 个问题（用途 / 页数 / 内容就绪度 / 密度档）一次性问完，环境有结构化提问 UI 就用它。密度档是本 skill 的贯穿性二分：**低密度演讲型**（一页一观点、大字、1-3 条 bullet、宁多拆页）vs **高密度阅读型**（结构化网格 / 表格 / 4-8 条 bullet、适合异步传阅）；需求混合时就近归入其一，明确禁止发明中间档。用户带图时进入图片评估步：逐图用视觉能力判 USABLE / NOT USABLE，图与大纲**共同设计**（3 张截图 → 3 页功能页），确认后才进下一阶段；可用 logo 以 base64 嵌进后续 3 个风格预览，让用户看到自己品牌被 3 种风格各自演绎。
- **Phase 2 风格发现（show, don't tell 落地）**：直接生成 3 个单页 HTML 预览（存 `.frontend-slides/slide-previews/style-{a,b,c}.html`，自动打开），配比固定为 **1 个安全预设 + 至少 1 个 bold 模板 + 1 个 wildcard**（wildcard 可以是第 2 个 bold 模板或自由定制设计）。预览混合按场合调档：保守高赌注场合（董事会 / 法务 / 医疗）安全项要克制、wildcard 要「权威而非装饰」；表达型场合 wildcard 要冒险、与另两个拉开差异。用户明确点名过某预设或模板时，它占一席，其余围绕它生成。
- **Phase 3 生成**：单文件、`viewport-base.css` 全文内联、字体只许 Fontshare / Google Fonts（禁系统字体）、每个 CSS 段落带 `/* === SECTION NAME === */` 注释。用户选了 bold 模板后**只读那一个** `design.md` 作为设计配方（保字体 / 色板 / 装饰词汇 / 间距节奏 / 组件语法，但禁抄演示内容）；选了 wildcard 则该预览自身就是设计配方，全 deck 从同一视觉系统扩展，**禁止中途切回预设**。生成后必须浏览器截图验证文字溢出与面板叠压——文档明说 `scrollHeight` 检查不够（网格面板能互相盖住而不触发滚动溢出）。
- **Phase 4 PPT 转换**：`extract-pptx.py` 抽取（标题 / 正文 / 图片 / 演讲者备注）→ 向用户呈现抽取结果确认 → 走 Phase 2 选风格 → 生成时保留全部文本、图片、页序，演讲者备注转为 HTML 注释。
- **Phase 5 交付**：删预览目录、浏览器打开、汇报文件位置 / 风格名 / 页数 / 导航方式（方向键 / 空格 / 触摸）/ 自定义入口（`:root` 变量改色、字体链接改字、`.reveal` 类控动画）/ 内联编辑（E 键或悬停左上角进入，点任意文本直接改，Ctrl+S 保存）。
- **Phase 6 分享导出（可选，先问再做）**：6A 部署 Vercel 拿在线 URL（对零基础用户有逐步引导：装 Node → 注册 → `vercel login` → 确认后部署）；6B Playwright 逐页截图合成 PDF（1920×1080，动画不保留；`--compact` 档 1280×720，体积减 50-70%）。两个方向都把 gotcha 写死在文档里：部署侧 CSS `background-image` 引用的资产不会被自动打包、多资产优先整文件夹部署；导出侧要求 `.slide` 类名、相对路径图片、首跑要下约 150MB Chromium。

## 4 固定舞台模型：唯一的技术不变量

这是整个 skill 最强硬的工程决策，SKILL.md 标注 **NON-NEGOTIABLE**：

- 所有页面在固定 1920×1080 设计画布上排版，舞台（stage）作为整体用 `transform: translate(...) scale(...)` 缩放适配视口，允许 letterbox / pillarbox，**绝不按设备重排内容**，手机上也保持 16:9 等比缩放；
- 页面切换只许用 `visibility / opacity / pointer-events`（`.active` / `.visible`），**禁用 `display: none / block`**——后续布局类如 `.slide-content { display: flex }` 会在 CSS 层覆盖它导致所有页同屏（这是真实踩坑成文）；
- `viewport-base.css`（134 行）必须**整份**内联进每份产物：视口锁定、`.deck-stage`、`.slide` 堆叠、`@media print`（一页一 slide，浏览器打印即得 PDF）、`prefers-reduced-motion`；
- CSS 函数不可直接取负（`-clamp()` 被浏览器静默丢弃整条声明），必须 `calc(-1 * clamp(...))`——SKILL.md 与 STYLE_PRESETS.md 两处重复强调，属 LLM 生成 CSS 的高频暗坑；
- `clamp()` 只许用于舞台外的非 slide UI。

配套的 `deck-stage.js`（619 行）是 bold 模板包来源的 web component：演讲者备注 JSON、键盘 / 触摸导航、自动缩放、`noscale` 属性（1:1 渲染，供 PPTX 导出器取 DOM 几何）、`slidechange` 自定义事件、幻灯片**隐藏而不卸载**（视频 / 表单 / iframe 状态跨页保留）。

## 5 风格资产：三层渐进披露

资产组织是本 skill 最值得学的部分——严格按需加载，明确防 context 浪费：

| 层 | 载体 | 何时读 | 体量 |
|---|---|---|---|
| 安全预设 | `STYLE_PRESETS.md`（12 个） | Phase 2 选候选 | 每个约 40 行：vibe / 布局 / 字体配对 / 色板 CSS 变量 / 签名元素 |
| bold 模板索引 | `selection-index.json`（34 个） | Phase 2 圈候选 | 每个约 20 行元数据：mood / tone / formality / density / scheme / best_for / avoid_for |
| 风格卡 | `templates/*/preview.md` | 入围后才读 | bold-poster 样例 55 行 |
| 完整设计系统 | `templates/*/design.md` | **用户选定后只读这一个** | bold-poster 样例 713 行：色板 / 字号 scale / 布局 / 深度 / Do's & Don'ts / 迭代指南 10 条 |

文档明令：**不 bulk 读 `design.md`、不读 `template.html`**（除非选定模板的 design.md 缺关键实现细节）。这套「索引 → 卡片 → 全文」的加载纪律直接对冲了 LLM 一次性吞全库的倾向。

12 个安全预设分三档：暗色 4（Bold Signal / Electric Studio / Creative Voltage / Dark Botanical）、亮色 4（Notebook Tabs / Pastel Geometry / Split Pastel / Vintage Editorial）、特色 4（Neon Cyber / Terminal Green / Swiss Modern / Paper & Ink）。34 个 bold 模板来自同作者上游库 `zarazhangrui/beautiful-html-templates`（4.5k star，36 commits，MIT），风格从 8-bit 像素霓虹到复古意式海报都有。

**反 AI 味是成文纪律**，不是口号：`DO NOT USE` 清单列死禁用字体（Inter / Roboto / Arial / 系统字体）、禁用色（`#6366f1` 通用靛、白底紫渐变）、禁用布局（万物居中 / 通用 hero / 相同卡片阵列）；SKILL.md 还点名「你（模型）会跨代收敛到 Space Grotesk 这类常见选择，必须跳出」。

## 6 三个脚本

- **`extract-pptx.py`**（97 行，python-pptx）：按页抽标题 / 文本 / 图片（shape_type 13，落 `assets/`）/ 演讲者备注，输出 `extracted-slides.json` 加终端逐页摘要。简单直接，只做抽取不做理解——理解留给 agent。
- **`deploy.sh`**：扫 HTML 里 `src="..."` 引用自动捆资产，支持单文件或整文件夹（多资产推荐文件夹），`vercel deploy --prod`，重部署覆盖同 URL。
- **`export-pdf.sh`**（419 行，最重的一个）：临时目录 npm 装 Playwright + Chromium → 起本地 HTTP server（Google Fonts 与相对路径资产需要 HTTP 才能加载）→ 三种导航策略兼容外部 HTML（直接 inline style 改 display / 调 `presentation` API / `scrollIntoView`）→ 强制 `.reveal` 元素可见 → 逐页截图 → 再用一个浏览器页面把截图拼成 PDF。用 inline style 改 `display` 而非 CSS 类，规避了第 4 节说的优先级覆盖坑——作者对那个坑的理解是自洽的。

## 7 CJK 支持：模板包全覆盖，预设层缺席

34/34 个 bold 模板的 `design.md` 都有独立的 `CJK & International Content` 章节，深度远超同类项目。以 bold-poster 为例：

- 拉丁 → 中文字体配对表（Shrikhand → 思源宋体 900，Libre Baskerville → 思源宋体 400，Space Grotesk → 思源黑体 500），全部 Google Fonts CDN 加载；
- 通用 CJK 修正清单：行高 +15-25%、CJK 字距归 0、去 `text-transform: uppercase`、全角标点、display 级标题不加句号、中西文之间加盘古之白、整句单字族策略（思源宋体自带拉丁字形，不许中途 fallback）；
- **诚实标注已知缺口**：Shrikhand 的意大利体育杂志 slab-script 风格无中文等价物（用倾斜、正红、印刷结构语言补位）、无 CDN 中文等宽字体；需要文学气质时给出霞鹜文楷备选。

但 12 个安全预设全是西文字体方案，`STYLE_PRESETS.md` 无任何 CJK 适配段——中文用户走预设路线要靠 agent 自行翻译，走 bold 模板路线才有成文支持。

## 8 局限与风险

- **只能进不能出**：PPTX → HTML 有管道，HTML → PPTX 没有。PDF 导出丢动画。想进 Office 生态二次编辑是死路。
- **静态预设与 CJK 的错位**（第 7 节），加上思源系全走 Google Fonts CDN——国内网络环境（本机 GFW 场景）字体加载是现实坑，落地需自备字体或镜像。
- **PDF 导出首跑重**：临时装 Playwright + 约 150MB Chromium，每次运行都重装一遍（临时目录不复用）。
- **Vercel 部署需账号与外网**；对国内分享场景不如导出 PDF / 自托管实在。
- **作者 2026-06-23 后静默**约 2.5 个月（截至本报告克隆时点），30 commits 的仓库，单作者维护。
- **依赖模型品位**：12 预设 + 34 模板是对 LLM 审美收敛的对冲，但 wildcard 自由设计路径的本质仍是模型自我表达，质量方差存在——它的解法是用预览让用户当裁判，而不是相信单次生成。

## 9 与SelfMediaTools 项目调研线的对照

SelfMediaTools 项目已完成两轮 PPT 调研（[Anthropic PPTX skill](/posts/anthropic-pptx-skill-survey/)、[PPT→视频方案与 HyperFrames 对比](/posts/ppt-to-video-vs-hyperframes/)），frontend-slides 补上了幻灯片技术版图的第三条路线：

| 路线 | 代表 | 产物 | 放映形态 |
|---|---|---|---|
| PPTX 二进制 | Anthropic pptx skill（本机 document-skills:pptx 为改编版） | .pptx | PowerPoint/WPS 打开，可二次编辑，可借 COM/soffice 转链 |
| HTML 交互演示 | **frontend-slides** | 单 .html | 浏览器翻页放映，人在场驱动 |
| HTML 时间轴视频 | HyperFrames | .mp4 | 无人值守确定性渲染 |

frontend-slides 与 HyperFrames 同为 HTML 技术栈但目的正交：前者解决「人面对观众翻页」，后者解决「渲染成视频分发」。frontend-slides 的固定舞台是 1920×1080 横版整体缩放，与 HyperFrames 竖版 1080×1920 序列恰成镜像；两者对「确定性 / 不重排」的执念同源。对SelfMediaTools 项目「PPT→视频」线的含义：若未来做横版讲演型 deck 且需要人在场放映，frontend-slides 是现成答案；若终点仍是视频，此前结论（直接 HyperFrames，勿经 PPT 中转）不变——frontend-slides 没有渲染 MP4 的通道。

以下 5 点是可借鉴的 skill 工程模式（列事实供裁定，未裁定采纳）：

1. **show, don't tell 三预览流**——审美问题用 3 个成品候选让用户挑，与SelfMediaTools 项目「设计候选必须用户裁定（3-5 成品等选）」的既定工作方式同构，且它把「何时该克制 / 何时该冒险」的配比规则写成了文。
2. **三级渐进披露资产组织**（索引 JSON → 风格卡 → 完整设计文档 + 禁 bulk 读的明令）——对 common-content 的图像 prompt 模板 / 写作方法论的分层加载有直接参照价值，也与「文档协议单一真源」纪律互补。
3. **预览真实性规则**（NON-NEGOTIABLE 级）：禁止把 preview / template / Option A/B/C / 模板名 / 用户需求备注等内部工作流文本渲染到成品画面上——这是对 LLM 常见污染模式的针对性防御，SelfMediaTools 项目封面线 / 视频帧线的 QA 清单可考虑同类条目。
4. **踩坑成文而非踩坑发现**：display:none 被 flex 覆盖、CSS 函数取负静默失效、`~` 兄弟选择器 hover 断链（改 JS 400ms 延迟）、scrollHeight 查不出面板叠压——每条都是作者实测坑并写进对应文件的对应位置。
5. **CJK 排版适配清单**（行高 / 字距 / 盘古之白 / 标点 / 单字族策略 / 已知缺口诚实标注）——中文创作者场景下，这份清单本身就可作为SelfMediaTools 项目文字类产物（封面 / 视频帧 / 文章排版）的参照系。

## 10 本机落地可行性

- 手动安装路径：仓库根目录即 skill 本体，复制 `SKILL.md` + 5 个支持文件 + `scripts/` + `bold-template-pack/` 到 `~/.claude/skills/frontend-slides/`（或参照SelfMediaTools 项目 `.zcode/skills/` 结构放工作区内），无需插件机制，ZCode 读 `SKILL.md` 即可驱动——README 明言任意文件系统代理可用。
- 依赖面：纯生成阶段零依赖；PPT 转换需 python-pptx（本机 conda 环境可装）；PDF 导出需 Node + Playwright（本机 Node 18+ 已备，Chromium 首跑约 150MB）；Vercel 部署需账号（国内场景可跳过）。
- 字体注意：思源系走 Google Fonts CDN，本机网络环境需代理或改引本地字体文件。
