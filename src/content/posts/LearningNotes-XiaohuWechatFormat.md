---
title: 【学习笔记】深度拆解 xiaohu-wechat-format：Claude Code 公众号排版技能的工程实现
published: 2026-07-08
description: 逐文件研读 xiaohuailabs/xiaohu-wechat-format（一个把"排版→封面→发布"串成一条龙的 Claude Code 技能），拆解它的 Markdown 排版引擎、微信兼容黑科技、主题系统、画廊预览、AI 增强与一键发布到草稿箱的完整链路。
lang: zh
tags: [学习笔记, 工具分享]
---

> 本篇是对 [xiaohuailabs/xiaohu-wechat-format](https://github.com/xiaohuailabs/xiaohu-wechat-format) 的源码研读笔记。
>
> 这是一个挂在 Claude Code 上的**公众号全流程发布技能**：给它一篇 Markdown（甚至是粗糙的纯文本），它负责"排版 → 配封面 → 推送到草稿箱"一整条龙。最有意思的不是它有 85 个主题，而是它为了**对抗微信编辑器的 HTML 清洗**所做的一整套工程化妥协——内联样式、列表转 section、引用块转 section、margin 简写合并、外链转脚注……每一条背后都有一个真实的踩坑 issue。
>
> 我把仓库 clone 下来逐文件读了一遍，本篇按"项目全貌 → 排版引擎 pipeline → 微信兼容黑科技 → 主题系统 → 画廊预览 → AI 增强 → 一键发布 → 配封面 → 自动回复评论"的顺序整理。

---

## 一、项目全貌：一条龙的 Claude Code 技能

先给它一个定位：它**不是**一个 Web 编辑器（区别于 doocs/md、MdNice），而是一个**命令行 + Claude Code 技能**的本地工具。整个交互模型是：

1. 你对 Claude Code 说一句"排版这篇文章 /path/to/article.md"
2. Claude 按 `SKILL.md` 的流程：读文章 → 标点质检 → 结构化预处理（按需）→ AI 内容增强 → 推荐主题 → 打开画廊
3. 你在浏览器画廊里用**真实文章**预览 34 个主题，挑一个
4. Claude 排版，可选地"配个封面""发布到草稿箱"

仓库结构很清爽（git ls-files 一共也就百来个文件）：

```
SKILL.md                  # 技能主指令（给 Claude 读的）
README.md / README_CN.md  # 英中文说明
config.example.json       # 配置模板
scripts/
  format.py               # ★ 排版引擎，3090 行，整个项目的核心
  publish.py              # 推送到微信草稿箱（465 行）
  generate.py             # 封面图生成（720 行，调 Gemini Image API）
  theme_lint.py           # 主题质量检查（151 行）
  zh_punctuation_fix.py   # 中文半角标点修复（142 行）
  comment_reply.py        # 读者评论自动回复机器人（334 行）
templates/
  preview.html            # 单主题浏览器预览（含"复制到微信"按钮）
  gallery.html            # 多主题画廊（A/B 切换 + 字号/字体实时调）
themes/                   # 85 个主题 JSON（画廊精选 34 个）
cover/
  SKILL.md                # 封面子技能指令
  config.example.json     # 封面 API 配置
```

技术栈非常克制：**核心只依赖 Python 3 + `markdown` 库**（发布再加 `requests`）。封面生成用 `urllib`，连 requests 都不依赖。这点我挺欣赏——一个本地工具越少依赖越好装。

许可证 MIT。

---

## 二、排版引擎 `format.py`：一条 3090 行的 pipeline

这是整个项目的灵魂。我按代码里 `main()` 的实际执行顺序拆成几个阶段。

### 2.1 整体 pipeline（从 Markdown 到微信 HTML）

输入一篇 Markdown，它会依次走完这些阶段（每一步对应一个独立函数）：

| 阶段 | 函数 | 干什么 |
|------|------|--------|
| 0. 配置 | 模块级 | 读 `config.json`，解析路径、默认主题、是否自动开浏览器 |
| 1. 元信息 | `extract_title` / `count_words` | 从 frontmatter → H1 → 文件名提取标题；统计字数（CJK 按字、英文按词） |
| 2.（可选）AI 增强 | `smart_enhance_markdown` | `--smart` 时调 LLM 加语义标记，详见第七节 |
| 3. 文本预处理 | 一组正则函数 | 见下方 2.2，**最精华的一段** |
| 4. 图片处理 | `convert_wikilinks` / `copy_markdown_images` | 解析 Obsidian `![[img]]` 和标准 `![](img)`，复制到输出目录 |
| 5. MD→HTML | `md_to_html` | 只用 python-markdown 内置三个扩展：`tables`/`fenced_code`/`nl2br` |
| 6. HTML 后处理 | `extract_links_as_footnotes` / `inject_inline_styles` / ... | 外链转脚注、**注入全部内联样式**、列表/引用转 section、布局包装 |
| 7. 输出 | 写文件 | `article.html`（干净的可粘贴 HTML）+ `preview.html`（带工具栏预览） |

一个**关键设计点**：它没有用 python-markdown 的 `Extension` 机制去扩展语法树，而是**全部用正则在"原始 Markdown 文本"层（阶段 3）和"生成后的 HTML"层（阶段 6）做前后处理**。理由很现实——正则够用、可控、不依赖 markdown 库的内部 AST。代价是 3000 行里大半是 `re.sub`，可读性见仁见智，但**可调试性其实不错**（每一步都是纯字符串变换）。

### 2.2 阶段 3：文本预处理（精华）

这一段把所有"微信不友好"或"我们要加料"的 Markdown 扩展语法都处理掉，顺序很重要：

1. `strip_frontmatter` —— 去掉 YAML 头
2. 若 frontmatter 有 title 而正文没 H1，**补一个 H1**（hero/timeline 布局要靠它识别标题区）
3. `fix_cjk_spacing` —— **CJK 自动加空格**（中英文之间补空格）
4. `fix_cjk_bold_punctuation` —— **加粗标记把中文标点挤出去**（`**文字，**` → `**文字**，`）
5. `_auto_detect_byline` —— 文末 `## 小互说` / `**小互说：**` 自动转 `:::byline[小互说]`
6. `process_callouts` —— Obsidian/GitHub 风格 `> [!tip]` 提示框
7. `process_manual_footnotes` —— 手写脚注 `[^N]`
8. `process_fenced_containers` —— `:::dialogue[标题]` 等围栏容器
9. `~~删除线~~` → `<del>`
10. `%%Obsidian 注释%%` → 删除
11. `==高亮==` → `<mark>`
12. 任务列表 `- [x]` → `✅`、`- [ ]` → `⬜`

其中第 8 步 `process_fenced_containers` 最复杂。它用一个**基于深度计数器的正则**解析 `:::type[title] ... :::`，支持嵌套（遇到内层 `:::` 就递归调用自己）。支持的容器类型有 13 种，每种都有独立构建器：

| 容器 | 用途 |
|------|------|
| `:::dialogue[标题]` | 访谈对话气泡（左右交替，**先出现的说话人固定在左**） |
| `:::gallery[标题]` | 横向滚动画廊（≥3 图） |
| `:::longimage[标题]` | 超长图固定高度纵向滚动 |
| `:::stat` | 大数字数据块（单数字或多行 `值 \| 说明`） |
| `:::timeline[标题]` | 时间线节点 |
| `:::steps[标题]` | 自动编号步骤 |
| `:::compare` | A vs B 双列对比 |
| `:::quote[标题]` | 带大引号 ❝ 的引用 |
| `:::byline[作者]` | 作者署名块 |
| `:::video[标题]` | 视频卡片（▶ 徽章，微信不能嵌播放器所以走脚注） |
| `:::intro[标签]` | 文首彩底导读 |
| `:::end[CTA]` | — END — + 可选"点赞在看"引导 |
| `:::history[往期回顾]` | 往期文章卡片列表 |

还有两个特殊的 Markdown 层引用卡片，**故意放在 MD 层而不是 HTML 层处理**——代码里有条注释解释得很到位：

> python-markdown 会把相邻引用块合并成一棵树，HTML 层无法可靠区分层级

所以 `>>` 金句卡（白底阴影）和 `>>>` 居中金句卡（mdnice 同款）必须在 Markdown 源码层用正则识别并转成 `<section data-container="quote-card-*">`。

### 2.3 阶段 6：`inject_inline_styles`（3090 行里最关键的一个函数）

这个函数是"主题应用器"。它做的事按顺序：

1. 把主题 JSON 里每个标签的样式字典（`font_size`、`color` 这种下划线 key）拼成 CSS 字符串
2. 列表 `<ul>/<ol>` → `<section>` + flex 布局（见第三节）
3. callout 着色（按类型查语义色表）
4. 引用块加装饰（大引号前缀）
5. 代码块套 Mac 红黄绿圆点 + 语法高亮 + 空格保护 + `\n`→`<br>`
6. **三层标题结构**渲染（见第四节）
7. 给 `h1`-`h6`、`p`、`strong` 等所有标签注入内联 style
8. 表格斑马纹（自动判深浅色）+ 移动端 4 列以上自适应
9. 容器样式注入（第 8 步生成的 `<section data-container=...>`）
10. 脚注占位符替换
11. 布局包装（hero / timeline / card）
12. 暗色模式属性注入
13. **最后一步**：`<blockquote>` → `<section>`（详见第三节）

整个过程读下来，我最大的感受是：**它把"主题"和"微信兼容"这两件事拧在了同一个函数里**，因为它们本质都在玩"给每个标签拼一段合法的内联 CSS"。

---

## 三、微信兼容黑科技（全项目的灵魂）

这是我觉得最值得记的部分。每一条都对应一个真实的微信编辑器坑。

### 3.1 为什么必须全部内联

微信网页编辑器会**清洗粘贴进来的 HTML**：剥掉 `<style>` 标签、剥掉 `class` 属性、剥掉 `<script>`、剥掉很多 CSS 属性。**只有写在每个标签上的 `style="..."` 能活下来。**

这一条约束决定了整个架构——所以才有 `inject_inline_styles` 这个 800+ 行的函数，把主题里描述的所有样式一条条塞进每个元素的 `style`。

### 3.2 列表 `<ul>/<ol>` → `<section>` + flex

微信编辑器会**破坏原生列表的语义和缩进**。解决办法是把每个列表项变成一个 flex 行：

```python
result = (
    f'<section style="{row_style}{indent}">'
    f'<span style="{bullet_s}">{bullet}</span>'   # • 或 1. 当文本写
    f'<span style="{text_style}">{main_text}</span>'
    f"</section>"
)
```

嵌套列表递归处理，缩进按 `padding-left:{16*depth}px` 累加，并强制 `box-sizing:border-box`（注释里说否则微信会把 padding 压没）。

### 3.3 引用块 `<blockquote>` → `<section>`（doocs/md #447）

这是注释里最有故事的一条：

```python
# === 10. blockquote → section（防新版编辑器重写）===
# 2024-11 起微信灰度的新编辑器会把 <blockquote> 重写成自家引用格式、剥掉自定义样式
# （doocs/md #447）。样式已全部内联，标签语义可以舍弃，统一换成 section 保平安
html = html.replace("<blockquote ", '<section data-role="blockquote" ')
```

也就是说：从 2024 年 11 月起，微信新版编辑器会把 `<blockquote>` 重写成它自己的引用格式并剥光自定义样式。既然样式已经全部内联到 `style` 上了，`<blockquote>` 这个标签名就只剩语义、可以舍弃——**全替换成 `<section>` 换平安**。这一步刻意放在最后做。

### 3.4 margin 简写合并（doocs/md #504）

```python
# margin 分拆写法自动合并为简写——margin-top/bottom 分开写在公众号编辑器
# 有被丢弃的报告（doocs/md #504，2025-01），简写更稳
```

主题 JSON 里可能写成 `margin_top` / `margin_bottom` 分项，但在生成 CSS 时会合并成 `margin: top right bottom [left]` 简写。因为分开写有用户报告被微信编辑器丢掉。

### 3.5 CJK 自动加空格（`fix_cjk_spacing`）

经典 pangu 算法的内联实现。逐行处理，跳过代码块，然后：

1. **保护**：把行内 code、URL、图片、链接用 `\x00P{i}\x00` 占位符替换出来（防止误伤）
2. **加空格**：`re.sub(f"({cjk})({latin})", r"\1 \2", line)` 和反向
3. **还原**：把占位符换回去

CJK 字符集覆盖了基本汉字 `\u4e00-\u9fff`、扩展 A `\u3400-\u4dbf`、兼容汉字 `\uf900-\ufaff`。

### 3.6 加粗标记把中文标点挤出去（`fix_cjk_bold_punctuation`）

```python
text = re.sub(rf"\*\*([^*]+?)({cjk_punct}+)\*\*", r"**\1**\2", text)
```

把 `**文字，**` 变成 `**文字**，`——把中文标点从加粗区间里挪到外面。理由：标点被加粗后会同时拿到粗体字重和主题色，视觉上很脏。斜体版本用 `(?<!\*)\*(?!\*)` 的前后瞻避免误匹配 `**`。

### 3.7 SVG → PNG（`_localize_image`）

公众号素材库**不收 SVG**。代码用 macOS 的 `qlmanage`（Quick Look）把本地 `.svg` 栅格化成 1600px 的 PNG：

```python
subprocess.run(["qlmanage", "-t", "-s", "1600", "-o", str(images_dir), str(img_path)], ...)
```

注意这是 **macOS 专属**——外链 SVG 则只能打警告（微信也转码不了）。

### 3.8 视频链接自动识别成卡片（`_auto_video_cards`）

公众号**不支持外链视频**。代码用一个正则识别**独占一行的** YouTube / youtu.be / B 站 / b23.tv / 视频号 / `.mp4|.mov|.webm` 链接，把它们包成 `:::video` 容器，最终渲染成一张深色"视频卡片"（▶ 徽章 + 标题 + 走脚注的观看链接）。提醒用户：真要内嵌播放器得在后台手动插视频号/腾讯视频。

### 3.9 Obsidian 图片解析（`convert_wikilinks`）

`![[image.jpg|300]]` 这种 wiki 链接，会沿 `vault_root` + 配置里的 `image_search_paths` 列表用 `os.walk(followlinks=True)` 全树搜索，找到就复制到输出目录的 `images/`，SVG 顺手转 PNG。找不到就留一个灰字占位 `[图片: 文件名]`。

### 3.10 外链转脚注（占位符机制）

微信正文**屏蔽外链**。所有 `[text](http://...)` 会被转成 `text[1]` + 文末"参考链接"列表。这个机制用了一个**很聪明的占位符技巧**（我单独拎出来讲，见第五节）。

---

## 四、主题系统：把"换色游戏"治住的工程

85 个主题听起来很多，但读代码后发现它有一套**避免主题沦为"同骨架换色"**的设计。

### 4.1 主题 JSON 结构

一个主题就是一个 JSON，大致分四块：

```jsonc
{
  "name": "报纸",
  "description": "纽约时报风 #326891 蓝灰 ...",
  "colors": { "primary": "...", "accent": "...", "background": "..." },
  "styles": {
    "h1": { "font_size": "26px", "border_top": "2px solid #111", ... },
    "h2": { ... },
    "p":  { "font_size": "16px", "line_height": "1.75", ... },
    "blockquote": { ... },
    "blockquote_p": { ... },   // 引用块里的 <p> 单独样式
    // ... 还有 code/table/hr/img_wrapper/list_*/callout_*/footnote_* 等
    "h2_inner": { ... },       // 三层标题结构的内层（可选，见 4.3）
    "h2_prefix": { ... },
    "h2_suffix": { ... }
  },
  "decor": {
    "h2": { "prefix_text": "{n}", "suffix_text": "" },  // {n} 自动编号
    "blockquote": { "prefix_text": "❝" }
  },
  "layout": "hero | timeline | card | （缺省）",
  "hero": { "dark_header": true, "numbered": true, "pull_quotes": true, ... },
  "dark_mode": { ... }   // 暗色模式覆盖（可选，缺了会自动生成）
}
```

样式字典的 key 用下划线（`font_size`），在 `build_style_string` 里统一转成 CSS 连字符（`font-size`）。

### 4.2 矩阵组合：layout × palette（`merge_layout_palette`）

主题名带 `-` 时走矩阵模式：`accent-ocean` = `layouts/accent.json` + `palettes/ocean.json`。合并方式很巧妙——**把整个 layout JSON 序列化成字符串，对占位符做全局替换，再 parse 回来**：

```python
replacements = {"{{accent}}": palette["accent"], "{{accent_light}}": ..., ...}
# 还会算派生色：{{accent_10}} = accent 的 10% 透明度
layout_str = json.dumps(layout, ensure_ascii=False)
for placeholder, value in replacements.items():
    layout_str = layout_str.replace(placeholder, value)
result = json.loads(layout_str)
```

这招省掉了写递归 JSON walker 的麻烦，占位符可以出现在树的任何位置。

### 4.3 三层标题结构（治"换色游戏"的根）

这是 2026-06-12 加的设计，专门对付"主题就是换换标题颜色"的批评。

主题声明了 `h2_inner` / `h2_prefix` / `h2_suffix`（h1-h6 同理）就触发三层渲染：

```html
<h2 style="外层只管布局">
  <span style="prefix">01</span>
  <span style="inner">标题文字</span>
</h2>
```

- **视觉挂在 inner 上**（`inline-block` 自动收缩，**色块宽度 = 文字宽度**）
- `prefix`/`suffix` 是 `::before`/`::after` 伪元素的**实体替身**（伪元素被微信剥掉，所以用真 span 代替）——可以放编号、楔子、装饰符号
- `decor.h2.prefix_text` 里的 `{n}` 会自动替换成 `01`、`02` 递增序号

老主题不写新字段就走原单层逻辑，**零破坏**。参考实现：`data-report`（编号标题）、`interview`（吊牌标题 + 居中短下划线 + 大引号）。

### 4.4 三种布局

| 布局 | 特点 |
|------|------|
| **card** | 按 `<h1>/<h2>` 切段，每段包一个卡片 section，外层 flex 居中 |
| **timeline** | 每个 `<h2>` 是个时间线节点，**用 `inline-block` + 负 margin 代替 `position:absolute`** 画圆点（注释明确说"微信兼容"），最后给个 — END — |
| **hero** | 最复杂：暗色首屏（kicker + 大白标题 + 强调色下划线）、章节大编号、短引用转 pull-quote、交替背景、加粗段转卡片组、双列表格转 flex… |

hero 布局里有个**很聪明的归因识别**：短引用里的 `— Karpathy`（归因，小灰字）和中文翻译（较长、含 CJK）会被启发式区分开，分别套不同样式——检查归因文本是否以 `—/–/-` 开头或是否短且没有 5+ 连续 CJK。

### 4.5 暗色模式的两种处理

- 主题声明了 `dark_mode` 就用它
- 没声明？`_auto_dark_mode` 会**自动合成合理默认值**（如 `p → #c8c8c8`、`strong → #e0a060`），而不是报错或漏掉
- 然后给元素加微信暗色模式专有属性 `data-darkmode-color` / `data-darkmode-bgcolor`——这是微信暗色引擎读的属性

### 4.6 theme_lint.py：主题质量门禁

`theme_lint.py` 会扫所有 `themes/*.json`，检查：

- 标题字号梯度不能倒挂（`h1 < h2 < h3 < h4`）
- 正文 ≥ 14px
- H3 不能小于正文
- 移动端规则：H1 ≤ 28px（微信正文宽约 345px，29px 一行只能放 ~11 个汉字，长标题会换三行）、H2 ≤ 22px、正文在 15-17px、行高 ≥ 1.7
- 三层标题用 `max(外层, 内层)` 取有效字号

`format.py` 在画廊前会**非阻塞**跑一次 lint（只警告不中断）；展示型主题（大标题本身就是风格）在根加 `"lint": {"display_type": true}` 豁免 H1/H2 上限。

---

## 五、几个值得单独拎出来的"巧思"

读源码时圈了几个我觉得特别机灵的点。

### 5.1 UUID 脚注占位符（解耦结构与样式）

```python
_FN_PREFIX = f"__FN_{uuid.uuid4().hex[:8]}_"
FOOTNOTE_PLACEHOLDERS = {
    "footnote_sup": f"{_FN_PREFIX}SUP__",
    "footnote_section": f"{_FN_PREFIX}SECTION__",
    ...
}
```

脚注结构在**主题未知时**就建好了，但脚注样式要等 `inject_inline_styles` 跑完才知道。怎么办？先用一个 UUID 前缀的占位符字符串塞进 `style="{占位符}"` 的位置——**UUID 保证不会和正文撞**，它能安然穿过所有 HTML 变换，最后再一次性替换成真实主题样式。

这种"用唯一占位符解耦两阶段"的套路，在处理"结构先于样式"的场景里很实用。

### 5.2 `json.dumps` → 字符串替换 → `json.loads`（矩阵配色）

见 4.2。用序列化 - 替换 - 反序列化做深度占位符替换，省掉手写递归遍历。

### 5.3 `>>` / `>>>` 必须在 Markdown 层处理

见 2.2——python-markdown 会合并相邻引用块，HTML 层分不出层级，所以必须在源码层识别。这种"**认清工具边界、在正确的那一层下手**"的判断，比硬写一个 HTML parser 强。

### 5.4 时间线圆点用负 margin 而不是 absolute

微信会破坏 `position:absolute`。用 `display:inline-block` + `margin-left:-33px` 达到同样的"圆点压到竖线上"的视觉效果，且微信安全。

### 5.5 pull-quote 归因识别

见 4.4。内容感知的样式（区分英文归因 vs 中文翻译）。

### 5.6 代码块空格保护和换行保护

微信会压缩连续空格、吃掉 `<pre>` 里的原始换行。代码做了两件事：在标签边界切分，只对文本节点的空格替换成 `&nbsp;`（保留缩进）；把 `<pre>` 里的 `\n` 换成 `<br>`（强制换行存活）。语法高亮只在**标了语言**的代码块上跑（避免正则高亮器糟蹋 URL 或纯文本）。

### 5.7 手写正则语法高亮（不依赖 Pygments）

`_basic_syntax_highlight` 是个手搓的正则高亮器（装饰器、注释、f-string、模板串、字符串、数字、~60 关键字、~25 内建），硬编码 VS Code 暗色配色。**零额外依赖**。

---

## 六、画廊预览：用真实文章 A/B 比主题

`--gallery` 是默认推荐的选主题方式。它的实现思路我很喜欢。

### 6.1 并行渲染 34 个主题

pipeline 只跑到 `md_to_html` + 外链转脚注，得到一份**与主题无关的**中间 HTML。然后用 `ThreadPoolExecutor(max_workers=min(8, N))` **并行**给 34 个画廊主题各自跑一遍 `inject_inline_styles`。每个主题的完整渲染结果都塞进画廊页面，默认只显示第一个、其余 `display:none`。

> 注：画廊画廊里 34 个主题是 2026-06-12 从 59 个里**精选去重**出来的——砍掉了 25 款"同骨架换色"的变体（文件还留在 `themes/` 可以单独用，只是不进画廊）。被分到 10 个类目：新主题候选 / 纸系·Kami / 新做精选 / 特色布局 / 卡片系列 / 深度长文 / 科技产品 / 文艺随笔 / 活力动态 / 模板布局。

### 6.2 实时切换 + 滚动位置保持

`switchTheme('tid')` 的细节很贴心：

1. **切换前记录** `scrollTop / scrollHeight` 比例
2. 隐藏所有预览、显示目标预览（带 fade-in）
3. **按比例恢复滚动位置**——这样你在读某一段时切主题，还停在同一段，方便 A/B 对比

### 6.3 两条复制路径

画廊页面提供了两种"拿走结果"的方式：

1. **主按钮"确认"**：复制一段命令字符串（如 `"newspaper 16px"`）到剪贴板，你粘回 Claude Code，由 Claude 跑 `format.py --theme newspaper`。**人和 AI 协作的闭环**。
2. **次按钮"复制当前预览"**：直接把当前主题的渲染 HTML 复制到剪贴板，粘贴进微信后台。

字号（15/16/17px）和字体（默认/衬线/宋体/楷体/圆体/仿宋）都能实时切换并 `localStorage` 持久化。

### 6.4 复制到剪贴板的实现

预览页 `preview.html` 的复制用了个**双 HTML 技巧**：文章 HTML 注入两份——一份可见的 `#articleContent`（带预览外壳样式），一份藏在 `left:-9999px` 的 `#wechatHtml`（纯净的微信兼容 HTML）。复制时用 `Range` 选中隐藏那份，**临时取消隐藏**（部分浏览器拒绝复制隐藏元素）再 `document.execCommand('copy')`，失败再 fallback 到 Clipboard API。这个细节很实用，我之前自己也踩过"复制隐藏元素失败"的坑。

---

## 七、AI 增强：克制的、有护栏的 LLM 调用

`--smart` 会调一个 **OpenAI 兼容**的 `/chat/completions`（默认走 `config.smart_api`，模型默认 `gpt-4o-mini`，`temperature: 0.3`）。这是整个项目里唯一碰 LLM 的地方（不算封面的图像 API），设计得**异常克制**。

### 7.1 它只加标记，绝不改正文

系统提示词要求模型当"公众号排版预处理器"，**只允许加 5 类语义标记**：

1. `> [!important]` —— 核心判断（每节 ≤1，全文 ≤3）
2. `:::stat` —— 数据高亮（全文 ≤2）
3. `:::byline[作者]` —— 文末署名
4. `> — 作者名` —— 归因行
5. 保留 `**术语：** 解释` 并列段

**硬规则：不改原文一个字。**

### 7.2 三道安全护栏

1. **预检**：文章已有 ≥3 个标记就直接跳过 LLM 调用（省钱）
2. **后校验**：把增强版和原文都剥掉所有标记后比对，若增强版长度 < 原文 90%，判定"模型改太多了"→**丢弃，用原文**
3. **计数**：报告实际加了多少个标记

这种"**让 AI 只提结构建议、且能证明它没乱改**"的设计，是 AI 辅助写作里很值得借鉴的范式。比起让 LLM 直接重写，这种"加 annotation"的粒度既安全又可回滚。

> 另外，`SKILL.md` 里还有一大段**"反炫技自检"**写作规则——callout 总数 > 4 砍、高亮 > 5 处砍、表格只有 2 行改写句子、emoji 标题 > 3 砍、连续 6 个章节都用 ①②③ 必须改……这些是给 Claude 写作时用的约束，等于把"审美"也工程化了。

---

## 八、一键发布到草稿箱（`publish.py`）

配好 `wechat.app_id` / `wechat.app_secret` 后，`publish.py` 能把排好版的文章直接推到公众号草稿箱。完整链路：

1. 拿 access_token（`cgi-bin/token`，`grant_type=client_credential`）
2. **重传正文图片**：扫 `article.html` 里所有 `src=`，分类处理——已在微信 CDN（`mmbiz.qpic.cn`）的跳过；外链的先下载再传；本地的解析路径再传。上传走 `media/uploadimg`（返回 CDN url），把 HTML 里的 `src` 全部重写成 CDN 地址
3. **上传封面**到永久素材库（`material/add_material`，返回 `thumb_media_id`）——封面找不到会直接退出，因为微信强制要缩略图
4. 推草稿（`draft/add`），字段含 `title`/`author`/`content`/`content_source_url`（"阅读原文"链接）/`thumb_media_id`

### 8.1 两个最容易踩的坑

- **40164（IP 不在白名单）**：`get_access_token` 会专门识别这个 errcode 并提示"→ IP 不在白名单中，请到公众号后台添加当前 IP"。这是发布流程**最高频的失败**——你得把公网 IP 加到公众号后台的 IP 白名单里
- **`ensure_ascii=False`**：推草稿的 JSON 序列化必须关掉 ascii 转义（注释明确写），否则 `\uXXXX` 转义会让微信**算错标题长度**

### 8.2 错误处理细节

- 图片上传 `max_retries=3`，**线性退避**（2s、4s）
- 标题硬限 64 字（微信 API 上限）→ 退出；>30 字软警告 → 交互确认
- 全部图片都传失败 → 退出；部分失败 → 交互确认（`--yes` 跳过）
- `--dry-run` 跑完除最后推草稿外的所有步骤

---

## 九、配封面：调 Gemini Image API（`generate.py` + `cover/SKILL.md`）

封面生成是独立子技能 `xiaohu-wechat-cover`，触发词"公众号封面/给这篇文章配个封面"。

### 9.1 它调的是 Gemini 原生 `generateContent`（不是 OpenAI 兼容）

这点和我一开始以为的不一样——`generate.py` 是个 **Gemini 原生 REST 客户端**，请求体是 `{"contents":[...], "generationConfig":{"responseModalities":["TEXT","IMAGE"], "imageConfig":{...}}}`，从响应的 `candidates[0].content.parts[*].inlineData` 里抠 base64 图片。

它还做了**API 版本和鉴权方式的自动探测**：

- 版本：把 `base_url` 末尾的 `/v1`/`/v1beta`/`/v1alpha` 剥掉，依次试 `v1beta`（官方默认）→ `v1`，404 就换下一个
- 鉴权：`auto` 模式先试 `x-goog-api-key`（google 方式），401/403 再试 `Authorization: Bearer`（bearer 方式）

### 9.2 一个值得注意的"视觉描述 vs API 参数"的错位

封面提示词模板里**视觉描述写的是 2.35:1**（公众号封面标准比例，Notion 插画风），但 **YAML frontmatter 里的 `aspect_ratio` 必须写 `"21:9"`**——因为 Gemini API 不支持 `2.35:1`，`21:9` 是最接近的。所以 `2.35:1` 只是给模型看的视觉描述，`21:9` 才是真正的 API 参数。这种"文档描述和代码参数故意不一致"的处理，读代码时容易困惑，记一笔。

### 9.3 提示词模板要点

- Notion 插画风、高饱和、手绘质感、不要写实元素
- 主视觉居中/偏左（**右侧留白给标题**）、1-2 个卡通人物/图标/剪影
- 涉及敏感/版权人物要用替代形象（且模型不能拒生成）
- 标题 ≤8 字、可选一行副标题、字体匹配插画
- 默认中文、所有可读文字用简体中文（英文只做点缀）

文章 → 提示词的"提炼一句话主题"由 Claude 在技能层完成，`generate.py` 本身只吃 `--prompt-file`/`--prompt`，是个通用 runner。

---

## 十、自动回复评论：一个有人格的机器人（`comment_reply.py`）

这是个意外收获——仓库里还藏了个**读者评论自动回复机器人**。

### 10.1 流程

1. `freepublish/batchget` 拉已发文章列表，正则抠出每篇的 `mid`
2. `comment/list` 拉每篇最多 50 条评论
3. `find_unreplied` 过滤掉已回复的（以微信侧 `reply.content` 是否存在 + 本地 `comment_state.json` 双重判断；注释提到"精选评论"字段不可靠，所以**对所有未回复评论都回**）
4. 调 **OpenAI 兼容**接口（默认 OpenRouter + `claude-sonnet-4`）生成回复，`max_tokens=150`，`temperature=0.7`
5. `comment/reply/add` 发回复，`comment_state.json` 立刻存档，`sleep(1)` 限速

### 10.2 有人格的系统提示词

提示词给机器人定了**两种模式**：

- **Mode A**（问文章内容）：基于文章内容答，10-40 字
- **Mode B**（其他一切）：极简 2-8 字、无 emoji、无废话。例子：求助技术 → "问龙虾"；纯 yes/no → "不能"

还有**公共发言分寸**的护栏：不点名批评具体公司/个人、不预测未来、敏感话题（裁员、内斗）用模糊措辞、禁止重复回复并列了各类场景的批准话术。

> 看到"问龙虾"我笑了——这种把作者人设塞进提示词的玩法，是"个人公众号"才玩得起的奢侈。

---

## 十一、我学到的几条工程经验

读完整个仓库，提炼几条对自己写工具有用的经验：

1. **认清平台约束，把它变成架构地基**。微信"只认内联 style"这一条，催生了整个 `inject_inline_styles`——不要试图绕过它，而是围绕它设计。每个 hack 都对应一个真实 issue（#447、#504），**踩坑记录就是最好的架构文档**。

2. **在正确的层下手**。`>>`/`>>>` 必须在 Markdown 源码层处理，因为 python-markdown 会合并引用块；内联样式必须在 HTML 层注入；矩阵配色在 JSON 字符串层做替换。**遇到"分不出层级"的问题，先想"换一层处理"而不是"硬写 parser"**。

3. **用占位符解耦两阶段**。UUID 脚注占位符让"结构先建、样式后填"成为可能。这种思路在编译/模板场景通用。

4. **AI 增强要克制、要可证伪**。`--smart` 只加标记不改正文 + 长度校验 + 标记计数 + 预检跳过——四道护栏让 LLM 的介入"可审计、可回滚"。比起"让 AI 重写一遍"，"让 AI 加 annotation"是更安全的粒度。

5. **主题≠换色**。三层标题结构 + theme_lint 移动端规则 + 矩阵去重，把"主题"从纯视觉差异提升到了结构差异，并用 lint 卡住质量底线。

6. **画廊的"真实文章预览 + 滚动保持 + 双复制路径"** 是本地工具人机协作的好范式——AI 渲染、人选主题、选完把命令字符串贴回给 AI 执行。

7. **文档描述和代码参数不一致时要注释**。`2.35:1`（视觉）vs `21:9`（API）这种错位，不写注释后人一定懵。

---

## 十二、和同类工具的对比（顺带更新一下我的旧笔记）

我之前写过一篇 [微信公众号排版工具对比](../ToolsAndResources-WeChatFormattingTools) 的笔记，这次深读后对 `xiaohu-wechat-format` 的定位可以补几句更准确的：

| 维度 | xiaohu-wechat-format | doocs/md | inkpress |
|------|----------------------|----------|----------|
| 形态 | Claude Code 技能 + CLI | Web 编辑器 | Python 引擎 + Claude Skill |
| 主题数 | 85（画廊精选 34） | 丰富 | 25 |
| 排版哲学 | **正则在 MD/HTML 两层前后处理** | Vue 编辑器 | Python 核心引擎 |
| 微信兼容深度 | **最硬核**（#447/#504 都治了，列表/引用转 section，margin 合并） | 强 | 较基础 |
| 三层标题/伪元素替代 | ✅ | — | — |
| 暗色模式 | 自动生成 + 微信属性注入 | — | — |
| AI 增强 | 有（只加标记，有护栏） | 多模型集成 | Claude Skill |
| 封面生成 | ✅ Gemini Image | ❌ | ❌ |
| 一键发布草稿 | ✅ | ❌ | ❌ |
| 评论自动回复 | ✅（有人格） | ❌ | ❌ |
| 平台限制 | macOS 亲和（qlmanage 转 SVG） | Web 跨平台 | 跨平台 |

**一句话选型**：如果你是 Claude Code 用户、且想要"排版 + 封面 + 发草稿 + 回评论"一条龙，这是目前最完整的选择；它的代价是**强绑定 Claude 工作流**、且**排版引擎重度针对微信**（换个平台那些 hack 就白写了）。

---

## 参考

- 仓库：<https://github.com/xiaohuailabs/xiaohu-wechat-format>
- 技能主指令 `SKILL.md`（触发词、工作流、容器语法、写作反炫技规则）
- 排版引擎 `scripts/format.py`（3090 行）
- 发布脚本 `scripts/publish.py`、封面生成 `scripts/generate.py`、标点修复 `scripts/zh_punctuation_fix.py`、评论机器人 `scripts/comment_reply.py`、主题门禁 `scripts/theme_lint.py`
- 画廊模板 `templates/gallery.html`、预览模板 `templates/preview.html`
- 关联踩坑 issue：doocs/md #447（blockquote 被重写）、#504（margin 分写被丢）

> 📝 **笔记生成时间**：2026-07-08（基于 clone 当时的源码，共 6 个 Python 脚本 + 85 个主题 JSON 逐文件研读）
