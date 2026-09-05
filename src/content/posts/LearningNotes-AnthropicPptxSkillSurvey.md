---
title: 【学习笔记】拆解 Anthropic 官方 PPTX skill：三路由指令集、强制三段 QA 与 Z.AI 改编版对照
published: 2026-09-04
description: Anthropic 的 PPTX skill 是其 Agent Skills 体系四个文档技能之一：一份单文件 SKILL.md 三路由指令集（pptxgenjs 创建 / OOXML 原生编辑 / markitdown 读取）、5 个捆绑 Python 脚本、约 20 条 pptxgenjs 坑清单、10 个命名色板与强制三段 QA。本文梳理其 2025-09 至 2026-07 的时间线、许可证边界（source-available、禁再分发）、获取渠道（claude.ai / API 容器 / 插件市场），并与本机 ZCode 插件市场的 Z.AI 改编版 0.1.4 逐项对照——零脚本、QA 降为 recommended、新增 CJK 字体与模板继承章节，末尾附对自家 skill 工程的七条启示。
lang: zh
tags: [学习笔记, Agent Skill]
abbrlink: anthropic-pptx-skill-survey
---

调研日期：2026-09-03。信息源：anthropics/skills 仓库（GitHub 抓取）、Claude 官方平台文档、Anthropic 官方新闻与工程博客、本机 ZCode 插件缓存（zcode-plugins-official/document-skills 0.1.4）。全部链接见文末。

## 摘要

Anthropic 的 PPTX skill 是其 Agent Skills 体系里四个「文档技能」之一（pptx / xlsx / docx / pdf），驱动 Claude.ai 网页端的 PowerPoint 文件创建功能，2025 年 9 月底随 Sonnet 4.5 的 file creation 能力上线，随后在 anthropics/skills 仓库以 source-available 形式公开（专有许可，禁改作与再分发）。它的核心形态是：一份单文件 SKILL.md 指令集（三路由：pptxgenjs 创建 / OOXML 原生编辑 / markitdown 读取）+ 5 个捆绑 Python 脚本（缩略图、克隆幻灯片、清理、校验、LibreOffice 包装）+ 三段强制 QA。本机 ZCode 插件市场的 document-skills 0.1.4 是 Z.AI 出品的独立改编版（无捆绑脚本、QA 降为 recommended、新增 CJK 字体与模板继承章节），与 Anthropic 原版同源不同体。

## 一、定位与时间线

Agent Skills 是「指令 + 脚本 + 资源的文件夹」，agent 按需发现加载；skill 目录以 SKILL.md（YAML frontmatter 含 name/description）为入口。Anthropic 工程博客给出三个设计原则：渐进式披露（三层：name/description 常驻系统提示 → SKILL.md 正文按需加载 → 捆绑文件按需读取，因此 skill 可携带的上下文「实际上无边界」）、纯文件系统形态（agent 自己导航目录）、捆绑可执行代码（确定性代码优于 token 生成）。

PPTX skill 的关键时间点：

- 2025-09-29：Sonnet 4.5 发布，Claude apps 内置代码执行与文件创建（表格、幻灯片、文档），付费计划可用——文档技能的前身与主要消费场景。
- 2025-10-16：Anthropic 发布工程博客《Equipping agents for the real world with Agent Skills》，Agent Skills 体系正式亮相。
- 2025-12-01：anthropics/skills 仓库重构，示例技能归入 skills/ 目录（commit #129）。
- 2025-12：Agent Skills 成为开放标准（agentskills.io）。
- 2026-02-04：文档技能集中大更新（#330）；同日删除 legacy html2pptx.tgz 依赖（#331）——早期渲染管线含 HTML 转 PPTX 组件，后被移除。
- 2026-07-17：docx/pptx/xlsx 三技能协同更新（#1447）。
- 仓库现状：约 173k stars、20.6k forks、53 commits；更新多为四文档技能批量打包提交。

## 二、原版 pptx skill 解剖

### 2.1 文件结构

```
skills/pptx/
├── SKILL.md            # 全部指令（frontmatter 无 version 字段）
├── LICENSE.txt         # 专有许可
└── scripts/
    ├── __init__.py
    ├── thumbnail.py    # 带标签幻灯片缩略图网格（需 deck 名前缀参数防覆盖）
    ├── add_slide.py    # 安全复制幻灯片/布局（-o 输出，否则原地重写；克隆体与源共享图表部件）
    ├── clean.py        # 删除幻灯片后清理孤儿部件
    └── office/         # 四文档技能共享的脚本树
        ├── validate.py     # schema/关系/图表校验；--original 用于模板衍生 deck
        ├── soffice.py      # LibreOffice 包装（裸 soffice 会挂起）
        └── helpers/ schemas/ validators/
```

SKILL.md 开篇是一张路由表：创建 → pptxgenjs 脚本；编辑/套模板 → 解包 zip 直接改 `ppt/slides/slideN.xml` 再打包；读取 → markitdown 或 thumbnail.py。

### 2.2 创建线（pptxgenjs + 约 20 条坑清单）

要点包括：先设 `pres.layout`（pptxgenjs 默认画布是 10×5.625 英寸而非 13.3）；hex 色值禁 `#` 前缀、禁 8 位（两者均损坏文件，透明度走 `transparency`/`opacity` 属性）；pptxgenjs 会就地变异传入的选项对象，禁跨调用共享；负 shadow offset 损坏文件；堆积柱状图配 `outEnd` 数据标签位置会触发 PowerPoint「修复」并丢图表；次轴组合图需 `valAxes`+`catAxes` 各两条否则图表被丢弃；字距用 `charSpacing`（`letterSpacing` 被静默忽略）；列表用 `bullet: true` 禁手写 `•`（双重圆点）；图表一律原生 `addChart` 禁渲成图片；图标管线 react-icons → SVG → sharp 栅格化 → base64 `addImage`；`writeFile()` 后必须跑 validate.py。

### 2.3 编辑线（原生 OOXML）

bash 工作流：解包 → 复制幻灯片部件与 .rels → 编辑 `sldIdLst` → clean.py → 在目录内部 re-zip。纪律：结构改动先于内容编辑；禁手工拷贝幻灯片文件（用 add_slide.py 做包簿记）；XML 变换用 `defusedxml.minidom`（ElementTree 会损坏命名空间）；每个列表项一个 `<a:p>`；带首尾空格的文本需 `xml:space="preserve"`。另覆盖 python-pptx 的三个能力缺口、legacy .ppt 转换、.potx 模板处理、bullet 继承。

### 2.4 设计指南与 QA

设计指南五节：起手三决定（主题化色板、60-70% 主导色 + 单一 accent、深浅「三明治」+ 一个贯穿 motif，明确禁止色条/边条）；10 个命名色板（Midnight Executive、Forest & Moss、Coral Energy 等，各带 hex 三元组）；每页必备一个视觉元素与一个焦点；字体表分「安全」（Arial/Calibri/Cambria 等）与「QA 不可靠」（Georgia/Garamond/Consolas 等）两档，明令 Never default to Aptos，标题 36-44pt / 正文 14-16pt；间距 0.5 英寸边距、0.3-0.5 英寸块距。Avoid 清单针对「AI 生成感」：不逐页重复布局、不居中正文、无 accent 条与标题下划线、不默认米色底、不许文字溢出。

QA 是 Required（强制）三段：

1. 内容 QA：markitdown 提取全文 + grep 占位残留（lorem/TODO 等）。
2. 文件 QA：validate.py（模板衍生的 deck 加 `--original`），能抓只有真 PowerPoint 才报的图表损坏。
3. 视觉 QA：按固定清单看渲染图（先溢出、再重叠、对齐、对比度、遗留占位符）。

出图管线四连：soffice → PDF → `pdftoppm -jpeg -r 150` → 列出绝对路径；任何修复后四命令全部重跑。依赖：pptxgenjs（npm）、markitdown/Pillow/defusedxml/lxml（pip）、LibreOffice、pdftoppm。

### 2.5 许可证

LICENSE.txt 为专有条款：使用由 Anthropic 消费者/商业服务条款治理；禁止从服务中提取或服务外留存、复制（临时副本除外）、创作衍生品、分发/再许可/转让、商业利用其中体现的发明、逆向工程；Anthropic 保留全部权利。仓库 README 明说这四个文档技能「source-available, not open source」（仓库其余技能多为 Apache 2.0），公开目的是「作为生产 AI 应用中实际使用的复杂 skill 的参考」。

## 三、获取渠道与 API 用法（官方文档）

预置技能恰为四个：pptx、xlsx、docx、pdf。可用渠道：

- **claude.ai**：创建文档时自动激活（不可禁用）；自定义技能走 Settings > Features 上传 zip（Pro/Max/Team/Enterprise）。
- **Claude API**：在 Messages API 的 `container` 参数里指定 `skill_id`（如 `pptx`），并挂 code execution 工具；容器把技能目录挂载到 `/skills`。沙箱无网络、无运行时安装包——技能必须自带全部依赖。
- **Claude Platform on AWS / Microsoft Foundry**：同样提供。
- **Claude Code**：官方文档称预置文档技能「not available in Claude Code」；但仓库 README 给出插件市场安装路径 `/plugin marketplace add anthropics/skills` + `/plugin install document-skills@anthropic-agent-skills`。两处表述并存，以实际安装结果为准（README 路径是后来加的市场发布）。

其他约束：使用技能的请求不在零保留（ZDR）范围内；安全建议只装可信来源、审计捆绑代码与外指网络指令。

## 四、与本机 ZCode document-skills 0.1.4（Z.AI 版）的对照

本机 ZCode 插件市场装的 document-skills 0.1.4（`C:\Users\12990\.zcode\cli\plugins\cache\zcode-plugins-official\document-skills\0.1.4\`）frontmatter 署名 `author: Z.AI`、自版本号 1.1、Proprietary——是 Z.AI 独立出品/改编的同名技能包，不是 Anthropic 原版的转售（原版许可证也禁止再分发）。插件包额外捆绑 agents/judge.md（视觉验收子代理）与 image_search MCP。逐项对照：

| 维度 | Anthropic 原版 | Z.AI 0.1.4（本机） |
|---|---|---|
| 捆绑脚本 | 5 个（thumbnail/add_slide/clean/validate/soffice） | 零脚本，明写「克隆逻辑自己写」 |
| QA 定位 | Required，三段（内容 grep + validate.py + 视觉清单） | recommended，一段（pdftoppm 出图 + judge 子代理；禁外部 VLM） |
| 色板 | 10 个命名色板带 hex | 无现成色板，只给 BACKGROUND→PRIMARY→ACCENT 方法论 |
| 字体 | 安全/QA 不可靠两档表（拉丁为主，Never Aptos） | 新增整节 CJK 字体纪律（微软雅黑/等线/苹方；禁楷体行楷隶书艺术字做正文；CJK 框加 15% 宽） |
| 模板流程 | OOXML 克隆为主，add_slide.py 承担簿记 | 独立「模板继承」强制节：两模式（Clone & fill / Fill-in）、角色分类法、orig_len×1.1 字数预算规则 |
| 编辑路径 | bash 解包 + defusedxml 原生 XML | Approach A（python-pptx 替换，附完整 helper 代码）+ Approach B（原生 OOXML）双层 |
| 独有坑条目 | 次轴 combo 双轴配置、图标管线、legacy 格式 | rich-text 数组每 run 发一个 `<a:pPr>` 违反 schema（仅 PowerPoint 首帧后乱版）、LAYOUT_WIDE 必须显式设、bullet 美化（indent 10-16pt 杀「漂浮点」）、负 shadow/堆积图 outEnd 等与原版重叠 |
| 画布口径 | 同一套字号警告（13.33×7.5 为准） | 同（明显继承原版结论） |
| 依赖 | pptxgenjs/markitdown/Pillow/defusedxml/lxml/LibreOffice/pdftoppm | 另加 playwright、sharp |

总体判断：Z.AI 版把原版「脚本承载的机械操作」换成了「指令承载的代码模板」（更适合无预装脚本的插件环境），删掉了现成色板与字体表，换上了中文创作场景必需的 CJK 与模板继承章节，并把视觉 QA 从「自己看」改为 judge 子代理单通道验收。两版的设计纪律（三明治结构、Avoid 清单、禁 accent 条、字号体系）高度同源，措辞与数值大量重合。

## 五、对SelfMediaTools 项目的启示（启示记录，非裁定）

1. **渐进式披露同构**：原版三层加载（frontmatter 常驻 → SKILL.md 按需 → references 按需）与SelfMediaTools 项目 SKILL.md + references/ 分层已是同一架构，佐证现有做法。
2. **确定性代码优先**：原版把易错操作全部脚本化（validate.py 抓真 PowerPoint 才报的图表损坏），与SelfMediaTools 项目 validate_pipeline_artifacts.py + 防复活断言同构；「能用脚本断言的不靠模型自觉」在两侧一致。
3. **QA 分层可借鉴**：内容层（markitdown 提取 + grep 占位符）/ 文件层（schema 校验）/ 视觉层（渲染出图）三段分离，且修复后全链重跑——比单一视觉检查便宜且可回归。
4. **字数预算规则**：`budget = orig_len × 1.1` 作为可程序化验证的溢出防线，明确写着「别用每行字数公式过度工程，orig_len 上限已覆盖」——对SelfMediaTools 项目视频旁白/封面文字的字数带设计是同类思路。
5. **渲染管线确定性**：soffice → PDF → pdftoppm 固定管线 + judge 式子代理逐页 JSON verdict（分类 + 证据、禁凭空像素值），与 ai-news-digest 视频线 QA agent 的形态一致，可对照其裁决格式。
6. **生产 prompt 当资产发布**：Anthropic 把生产环境真实使用的 skill 以 source-available 形式公开作「复杂 skill 参考」，本身是 skill 工程的标杆样本（结构、坑清单粒度、QA 协议都值得按需取法）。
7. **沙箱自足原则**：API 容器无网络、无运行时安装，技能必须自带一切——若SelfMediaTools 项目 skill 未来考虑跨环境分发，需按此约束设计。

## 六、信息源

- 仓库：https://github.com/anthropics/skills （README、skills/pptx 目录、commits、LICENSE.txt、raw SKILL.md，2026-09-03 抓取）
- 官方文档：https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- 官方新闻：https://www.anthropic.com/news/claude-sonnet-4-5
- 工程博客：https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- 本机实证：zcode-plugins-official/document-skills 0.1.4 插件包（pptx SKILL.md 全文、judge.md、plugin.json）
