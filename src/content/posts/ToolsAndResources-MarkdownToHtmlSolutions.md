---
title: "【学习笔记】Markdown 转 HTML 方案"
published: 2026-04-26
description: "Python 中将 Markdown 转换为 HTML 的主流方案对比、代码实现及微信公众号内联样式适配实战。"
lang: zh
tags: ["学习笔记", "工具分享"]
---

> 本笔记记录了 Python 中将 Markdown 转换为 HTML 的主流方案、代码实现及微信公众号适配实战。

---

<!-- ## 目录

- [一、方案对比](#一方案对比)
- [二、各方案代码实现](#二各方案代码实现)
  - [方案 1：markdown（python-markdown）— 功能最全](#方案-1markdownpython-markdown--功能最全)
  - [方案 2：mistune — 性能最佳](#方案-2mistune--性能最佳)
  - [方案 3：markdown2 — 简洁灵活](#方案-3markdown2--简洁灵活)
  - [方案 4：markdown-it-py — 高兼容性](#方案-4markdown-it-py--高兼容性)
  - [方案 5：inkpress — 开箱即用的微信排版引擎](#方案-5inkpress--开箱即用的微信排版引擎)
- [三、实战：适配微信公众号的内联样式 HTML](#三实战适配微信公众号的内联样式-html)
- [四、方案选型建议](#四方案选型建议)

--- -->

## 一、方案对比

| 库 | 特点 | 性能 | 扩展性 | 适用场景 |
|----|------|------|--------|----------|
| **`markdown`** (python-markdown) | 功能最全，生态成熟，扩展丰富 | ★★★☆ | ★★★★★ | 通用转换、需要丰富扩展时首选 |
| **`mistune`** | 轻量快速，符合 CommonMark，支持 AST | ★★★★★ | ★★★★ | 高性能需求、需要自定义渲染器 |
| **`markdown2`** | 简洁轻量，extras 机制灵活 | ★★★★ | ★★★ | 快速集成、简单场景 |
| **`markdown-it-py`** | Markdown-it 的 Python 移植，Compliance 高 | ★★★★ | ★★★★ | 需要与 JS 生态保持一致 |
| **`inkpress`** | 专为微信/小红书设计，25 主题，零依赖全离线 | ★★★★ | ★★★★ | 微信公众号排版，开箱即用 |

> **推荐**：通用场景用 `markdown`，追求性能用 `mistune`，需要精细控制输出用 `markdown-it-py`，**微信排版直接用 `inkpress`**。

## 二、各方案代码实现

### 方案 1：`markdown`（python-markdown）— 功能最全

```python
# pip install markdown
import markdown

md_text = """
# 标题一

这是一段包含 **粗体** 和 *斜体* 的文字。

## 代码块

```python
print("Hello, WeChat!")
```

## 表格

| 功能 | 状态 |
|------|------|
| 转换 | ✅ |
| 发布 | ✅ |

> 这是一段引用文字

1. 有序列表一
2. 有序列表二

[访问链接](https://example.com)
"""

# 基础转换
html = markdown.markdown(md_text)
print(html)

# 带扩展的转换（表格、代码高亮、脚注、TOC 等）
html = markdown.markdown(
    md_text,
    extensions=[
        "tables",          # 表格支持
        "fenced_code",     # 围栏代码块
        "toc",             # 目录生成
        "footnotes",       # 脚注
        "nl2br",           # 换行转 <br>
        "sane_lists",      # 更智能的列表
    ],
)
```

### 方案 2：`mistune` — 性能最佳

```python
# pip install mistune
import mistune

md_text = """
# 标题一

这是 **粗体** 和 *斜体*。

```python
print("Hello!")
```

| 列A | 列B |
|-----|-----|
| 1   | 2   |
"""

# 一行搞定（mistune >= 3.0）
html = mistune.html(md_text)
print(html)

# 高级用法：创建实例，启用插件
markdown = mistune.create_markdown(
    escape=False,
    hard_wrap=True,
    plugins=[
        "strikethrough",   # 删除线 ~~text~~
        "table",           # 表格
        "footnotes",       # 脚注
        "url",             # 自动链接
    ],
)
html = markdown(md_text)

# 自定义渲染器（精细控制输出）
from mistune import HTMLRenderer

class WeChatRenderer(HTMLRenderer):
    """自定义渲染器，适配微信格式"""

    def heading(self, text, level):
        color = "#1a1a1a" if level <= 2 else "#333333"
        size = "24px" if level == 1 else "20px" if level == 2 else "17px"
        return (
            f'<h{level} style="color:{color};font-size:{size};'
            f'font-weight:bold;margin:24px 0 16px 0;">'
            f'{text}</h{level}>\n'
        )

    def paragraph(self, text):
        return (
            f'<p style="margin:16px 0;line-height:1.8;'
            f'font-size:16px;color:#333;">{text}</p>\n'
        )

    def block_quote(self, text):
        return (
            f'<blockquote style="border-left:4px solid #ddd;'
            f'margin:16px 0;padding:8px 16px;color:#666;'
            f'background:#f9f9f9;">{text}</blockquote>\n'
        )

    def codespan(self, text):
        return (
            f'<code style="background:#f0f0f0;padding:2px 6px;'
            f'border-radius:3px;font-size:14px;color:#c7254e;">'
            f'{text}</code>'
        )

renderer = WeChatRenderer(escape=False)
markdown = mistune.create_markdown(renderer=renderer)
html = markdown(md_text)
```

### 方案 3：`markdown2` — 简洁灵活

```python
# pip install markdown2
import markdown2

md_text = "# Hello\n\nThis is **bold** text."

# 基础转换
html = markdown2.markdown(md_text)
print(html)

# 启用 extras（扩展功能）
html = markdown2.markdown(md_text, extras=[
    "tables",              # 表格
    "fenced-code-blocks",  # 围栏代码块
    "header-ids",          # 标题自动加 id
    "strike",              # 删除线
    "cuddled-lists",       # 紧凑列表
    "nl2br",               # 换行转 <br>
    "target-blank-links",  # 链接新窗口打开
])

# 获取元数据（如果使用 metadata extra）
html = markdown2.markdown(md_text, extras=["metadata"])
```

### 方案 4：`markdown-it-py` — 高兼容性

```python
# pip install markdown-it-py
from markdown_it import MarkdownIt

md_text = "# 标题\n\n**粗体** 和 *斜体*\n\n> 引用"

# 使用预设
md = MarkdownIt("commonmark", {"html": True}).enable("table")
html = md.render(md_text)
print(html)

# 自定义渲染规则
def wechat_heading_open(tokens, idx, options, env):
    level = tokens[idx].tag[1]  # h1 -> 1
    size = {1: "24px", 2: "20px", 3: "17px"}.get(level, "16px")
    return f'<h{level} style="font-size:{size};font-weight:bold;">'

md = MarkdownIt()
md.add_render_rule("heading_open", wechat_heading_open)
html = md.render(md_text)
```

### 方案 5：`inkpress` — 开箱即用的微信排版引擎

> **仓库地址**：[https://github.com/michellewkx/inkpress](https://github.com/michellewkx/inkpress)

专为微信公众号和小红书设计的排版引擎，25 个精品主题，零依赖全离线，一行代码即可完成转换。

```bash
# 安装依赖
pip install markdown pygments pyyaml

# CLI 使用
python -m inkpress convert article.md -t aurora -o output.html

# 查看所有主题
python -m inkpress themes

# 启动本地预览服务
python -m inkpress serve
```

```python
# Python API
from inkpress import convert, list_themes

# 一行搞定
html = convert("# Hello\nWorld", theme="aurora")

# 浏览所有主题
for name, desc in list_themes().items():
    print(f"{name}: {desc}")
```

**5 大主题系列**：经典（12 个）、东方（5 个）、杂志（4 个）、社交（4 个），支持 YAML 自定义主题。

**核心优势**：

| 特性 | 说明 |
|------|------|
| 零外部依赖 | 纯 Python 核心，不依赖任何第三方 API |
| 完全离线 | 无需联网即可工作 |
| 微信优化 | 输出内联样式 HTML，可直接粘贴到公众号编辑器 |
| YAML 主题 | 几分钟即可创建自定义主题 |
| JS 渲染器 | 浏览器端 1:1 复刻，支持实时预览 |
| Claude Skill | 可作为 Claude Code 技能安装 |

> **最适合**：不想自己处理微信内联样式适配、需要精美主题开箱即用的场景。

## 三、实战：适配微信公众号的内联样式 HTML

微信公众号**不支持 `<style>` 标签和 class**，所有样式必须写成 **内联 style**。以下是一个完整的适配方案：

```python
# pip install markdown
import markdown
import re


def md_to_wechat_html(md_text: str) -> str:
    """将 Markdown 转换为微信公众号兼容的内联样式 HTML"""

    # 第1步：Markdown → 基础 HTML
    html = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "nl2br", "sane_lists"],
    )

    # 第2步：用正则为各标签注入内联样式
    style_map = {
        "h1": "font-size:24px;font-weight:bold;color:#1a1a1a;margin:30px 0 15px 0;text-align:center;",
        "h2": "font-size:20px;font-weight:bold;color:#1a1a1a;margin:25px 0 12px 0;border-bottom:2px solid #eee;padding-bottom:8px;",
        "h3": "font-size:17px;font-weight:bold;color:#333;margin:20px 0 10px 0;",
        "h4": "font-size:16px;font-weight:bold;color:#333;margin:16px 0 8px 0;",
        "p": "font-size:15px;color:#333;line-height:2;margin:10px 0;letter-spacing:0.5px;",
        "blockquote": "border-left:4px solid #ddd;margin:16px 0;padding:10px 16px;background:#f7f7f7;color:#666;",
        "strong": "font-weight:bold;color:#1a1a1a;",
        "em": "font-style:italic;color:#555;",
        "a": "color:#576b95;text-decoration:none;",
        "ul": "margin:10px 0;padding-left:20px;color:#333;",
        "ol": "margin:10px 0;padding-left:20px;color:#333;",
        "li": "line-height:2;margin:5px 0;font-size:15px;",
        "code": "background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:14px;color:#c7254e;font-family:Menlo,Monaco,Consolas;",
        "pre": "background:#2b2b2b;padding:16px;border-radius:6px;margin:16px 0;overflow-x:auto;",
        "table": "width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;",
        "th": "background:#f5f5f5;border:1px solid #ddd;padding:8px 12px;text-align:left;font-weight:bold;",
        "td": "border:1px solid #ddd;padding:8px 12px;",
        "hr": "border:none;border-top:1px solid #eee;margin:24px 0;",
        "img": "max-width:100%;border-radius:4px;margin:10px 0;",
    }

    for tag, style in style_map.items():
        pattern = rf'(<{tag})(?![^>]*style=)([^>]*)>'
        replacement = rf'\1 style="{style}"\2>'
        html = re.sub(pattern, replacement, html, flags=re.IGNORECASE)

    # 第3步：处理 pre > code 中的代码块样式（白色文字）
    html = re.sub(
        r'(<pre[^>]*>)(\s*<code)',
        r'\1\2 style="color:#f8f8f2;background:none;padding:0;"',
        html,
    )

    return html


# ==================== 使用示例 ====================
if __name__ == "__main__":
    sample_md = """
# 微信公众号文章标题

## 副标题

这是一段正文，包含 **粗体**、*斜体* 和 `行内代码`。

### 代码示例

```python
def hello():
    print("Hello, WeChat!")
```

### 表格

| 方案 | 推荐度 | 说明 |
|------|--------|------|
| markdown | ⭐⭐⭐⭐⭐ | 功能最全 |
| mistune | ⭐⭐⭐⭐ | 性能最佳 |

> 这是一段引用，用于强调重要信息。

---

1. 第一步
2. 第二步
3. 第三步

[点击访问](https://example.com)
"""

    result = md_to_wechat_html(sample_md)
    print(result)

    # 保存到文件预览
    with open("wechat_article.html", "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>微信文章预览</title>
<style>body{{max-width:640px;margin:0 auto;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}}</style>
</head>
<body>{result}</body>
</html>""")
    print("✅ 已保存到 wechat_article.html，可在浏览器中预览效果")
```

## 四、方案选型建议

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| **微信公众号排版** | `inkpress` | 专为微信设计，25 主题开箱即用，零依赖全离线 |
| **通用 MD 转 HTML** | `markdown` + 内联样式注入 | 扩展丰富，配合正则注入样式最灵活 |
| **高性能批量处理** | `mistune` | 速度最快，支持自定义渲染器直接输出内联样式 |
| **简单快速集成** | `markdown2` | extras 机制简洁，上手快 |
| **需要 AST 操作** | `markdown-it-py` | 完整的 token 流，适合做深度定制 |

> **最佳实践**：
> - 微信公众号排版 → 直接用 **`inkpress`**，省去样式适配的麻烦
> - 需要深度定制渲染逻辑 → 用 **`mistune` + 自定义 `WeChatRenderer`**，在渲染阶段直接输出内联样式 HTML，比后置正则替换更可靠、更优雅

---

> 📝 **笔记生成时间**：2026-04-26
