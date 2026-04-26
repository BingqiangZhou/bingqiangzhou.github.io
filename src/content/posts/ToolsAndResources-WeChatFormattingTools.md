---
title: "【工具分享】微信公众号排版工具对比与选型"
published: 2026-04-26
description: "主流 Markdown 转微信公众号排版工具对比，涵盖 inkpress、doocs/md、md2wechat 等方案的选型建议。"
lang: zh
tags: ["工具分享", "学习笔记"]
---

> 本笔记对比了主流的 Markdown → 微信公众号排版工具，帮助快速选型。

---

<!-- ## 目录

- [一、inkpress 仓库介绍](#一inkpress-仓库介绍)
- [二、同类仓库推荐](#二同类仓库推荐)
  - [1. doocs/md — 最成熟的微信 Markdown 编辑器 ⭐ 11.7k](#1-doocsmd--最成熟的微信-markdown-编辑器--117k)
  - [2. xiaohu-wechat-format — Claude Code 全流程发布技能](#2-xiaohu-wechat-format--claude-code-全流程发布技能)
  - [3. md2wechat — 面向 AI Agent 的转换工具](#3-md2wechat--面向-ai-agent-的转换工具)
  - [4. MdNice — 老牌在线排版工具](#4-mdnice--老牌在线排版工具)
- [三、横向对比与选型建议](#三横向对比与选型建议)

--- -->

## 一、inkpress 仓库介绍

**仓库地址**：[https://github.com/michellewkx/inkpress](https://github.com/michellewkx/inkpress)

**一句话定位**：一款为创作者打造的 **Markdown → 微信公众号/小红书 HTML 排版引擎**，主打零依赖、全离线、25 个精品主题。

### 核心特性

| 特性 | 说明 |
|------|------|
| **25 个精选主题** | 横跨 5 大系列：经典、东方、杂志、社交等，全部手工打磨 |
| **零外部依赖** | 纯 Python 核心引擎，不依赖任何第三方 API |
| **完全离线** | 无需联网即可工作 |
| **微信优化** | 输出内联样式 HTML，可直接复制粘贴到公众号编辑器 |
| **小红书适配** | 支持小红书长文排版（coming soon） |
| **YAML 主题系统** | 用 YAML 文件自定义主题，几分钟即可创建 |
| **JS 渲染器** | 浏览器端 1:1 复刻 Python 引擎，支持实时预览 |
| **Claude Code Skill** | 可作为 Claude Code 技能安装，用自然语言排版 |

### 5 大主题系列

| 系列 | 包含主题 |
|------|----------|
| **经典 Classic** | default, minimal, mono, elegant-serif, aurora, ocean, sunset, latte, bluehl, corporate, forest, sunshine |
| **东方 Oriental** | chinese-ink, zen-garden, tang-poetry, sanguo, inkwash |
| **杂志 Magazine** | vogue, bauhaus, editorial, academy |
| **社交 Social** | xiaohongshu, mint, mint-highlight, sakura |

### 安装与使用

```bash
# 安装依赖
pip install markdown pygments pyyaml

# CLI 转换文章
python -m inkpress convert article.md -t aurora -o output.html

# 查看所有主题
python -m inkpress themes

# 启动本地预览服务
python -m inkpress serve
```

```python
# Python API
from inkpress import convert, list_themes

html = convert("# Hello\nWorld", theme="aurora")
```

### 自定义主题

在 `~/.inkpress/themes/` 放一个 YAML 文件即可：

```yaml
name: "My Theme"
description: "A custom theme"
series: "custom"

h1:
  style: |
    font-size: 24px;
    color: #333;
    font-weight: bold;

paragraph:
  style: |
    font-size: 15px;
    line-height: 1.75;
    color: #444;
```

### 项目状态

- **Stars**：较新项目（2026 年 3 月创建），31 次提交
- **语言构成**：JavaScript 74.1%、Python 14.7%、HTML 11.1%
- **许可证**：MIT
- **在线演示**：[http://michellewkx.com/inkpress/](http://michellewkx.com/inkpress/)

---

## 二、同类仓库推荐

### 1. doocs/md — 最成熟的微信 Markdown 编辑器 ⭐ 11.7k

**仓库地址**：[https://github.com/doocs/md](https://github.com/doocs/md)

| 维度 | 说明 |
|------|------|
| **定位** | 一款高度简洁的微信 Markdown 编辑器（Web 应用） |
| **技术栈** | Vue3 + TypeScript + Vite |
| **核心功能** | 完整 Markdown 支持、数学公式、Mermaid/PlantUML 图表、代码高亮、AI 集成（DeepSeek/OpenAI/通义千问等） |
| **图床支持** | 13 种图床（GitHub、阿里云、腾讯云、七牛、MinIO、S3、公众号图床、Telegram 等） |
| **部署方式** | 在线使用 / npm CLI / Docker 一键部署 |
| **许可证** | WTFPL |
| **在线地址** | [https://md.doocs.org](https://md.doocs.org) |

> **最适合**：需要在线编辑器体验、多图床、AI 辅助写作的场景。

### 2. xiaohu-wechat-format — Claude Code 全流程发布技能

**仓库地址**：[https://github.com/xiaohuailabs/xiaohu-wechat-format](https://github.com/xiaohuailabs/xiaohu-wechat-format)

| 维度 | 说明 |
|------|------|
| **定位** | Claude Code 技能，覆盖 **排版 → 封面生成 → 发布草稿** 全流程 |
| **技术栈** | Python 87% |
| **核心功能** | 30 个主题、可视化主题画廊、AI 内容增强（对话/引用/图集自动识别）、一键发布到微信草稿箱 |
| **特色** | 中英文间距修复、中文标点加粗修复、外部链接自动转脚注、Obsidian wiki-link 支持 |
| **封面生成** | 集成 Gemini Image API，自动生成 2.35:1 比例封面图 |
| **许可证** | MIT |

> **最适合**：使用 Claude Code 的开发者，需要从写作到发布一条龙完成的场景。

### 3. md2wechat — 面向 AI Agent 的转换工具

**仓库地址**：[https://www.npmjs.com/package/md2wechat](https://www.npmjs.com/package/md2wechat) / [https://www.md2wechat.com](https://www.md2wechat.com)

| 维度 | 说明 |
|------|------|
| **定位** | 将 Markdown 转换为微信公众号兼容 HTML 的命令行工具 |
| **技术栈** | Node.js (npm 包) |
| **核心功能** | 40+ 语言代码高亮、KaTeX 数学公式、多级引用、多种主题 |
| **特色** | 专为 AI Agent 设计，提供 Agent API 接口 |
| **版本** | v2.0.5 |

> **最适合**：Node.js 生态、需要集成到 AI Agent 工作流中的场景。

### 4. MdNice — 老牌在线排版工具

**仓库地址**：[https://github.com/mdnice/markdown-nice](https://github.com/mdnice/markdown-nice)

| 维度 | 说明 |
|------|------|
| **定位** | 老牌 Markdown 转微信公众号排版工具 |
| **核心功能** | 多主题、代码高亮、数学公式、一键复制 |
| **特色** | 社区活跃，用户基数大，主题丰富 |

> **最适合**：快速在线排版，不需要本地部署的场景。

---

## 三、横向对比与选型建议

| 维度 | inkpress | doocs/md | xiaohu-wechat-format | md2wechat | MdNice |
|------|----------|----------|----------------------|-----------|--------|
| **类型** | Python 引擎 | Web 编辑器 | Claude Code 技能 | npm CLI | Web 应用 |
| **语言** | Python | JS/TS | Python | Node.js | JS |
| **主题数** | 25 | 丰富 | 30 | 多种 | 丰富 |
| **离线使用** | ✅ | ❌(需部署) | ✅ | ✅ | ❌ |
| **AI 集成** | Claude Skill | 多模型 | Claude Skill | Agent API | ❌ |
| **一键发布** | ❌ | ❌ | ✅ 草稿箱 | ❌ | ❌ |
| **封面生成** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **图床支持** | ❌ | 13 种 | ✅ | ❌ | 有限 |
| **自定义主题** | YAML | CSS | YAML/CSS | - | CSS |
| **Stars** | 新项目 | **11.7k** | 新项目 | - | 较高 |
| **适合场景** | Python 自动化 | 日常排版写作 | Claude 全流程 | Node.js/Agent | 快速在线排版 |

### 选型建议

- **日常写公众号文章** → [doocs/md](https://github.com/doocs/md)，功能最全，在线即用
- **Python 自动化流水线** → [inkpress](https://github.com/michellewkx/inkpress)，零依赖纯 Python，主题精美
- **Claude Code 用户** → [xiaohu-wechat-format](https://github.com/xiaohuailabs/xiaohu-wechat-format)，排版 + 封面 + 发布一条龙
- **Node.js / AI Agent** → [md2wechat](https://www.npmjs.com/package/md2wechat)，Agent API 友好
- **快速在线排版** → [MdNice](https://github.com/mdnice/markdown-nice)，老牌稳定

---

> 📝 **笔记生成时间**：2026-04-26
