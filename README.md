# bingqiangzhou.github.io

个人博客，基于 [Astro](https://astro.build/) 构建，使用定制化的 [astro-theme-retypeset](https://github.com/radishzzz/astro-theme-retypeset) 主题。

**在线访问**：[bingqiangzhou.github.io](https://bingqiangzhou.github.io)

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

## 文章管理

```bash
# 创建新文章
pnpm new-post <标题>

# 格式化中英文排版（CJK 标点、空格）
pnpm format-posts

# 代码检查
pnpm lint
```

## 文章结构

文章存放在 `src/content/posts/` 目录下，使用 Markdown 编写。

**文件命名**：`CategoryPrefix-TopicPascalCase.md`，如 `DailySummary-BuildPersonalBlog.md`

**Frontmatter 示例**：

```yaml
---
title: "【学习笔记】搭建github.io博客的总结（一）"
published: 2019-08-12
description: "文章摘要"
lang: zh
tags: ["学习笔记"]
---
```

**现有标签**：碎碎念、学习笔记、工具分享、折腾记录、论文阅读笔记、读书笔记

## 技术栈

- [Astro 6](https://astro.build/) — 静态站点生成
- [UnoCSS](https://unocss.dev/) — 原子化 CSS，暗色/亮色主题
- [Shiki](https://shiki.style/) — 代码语法高亮
- [KaTeX](https://katex.org/) — 数学公式渲染
- [Mermaid](https://mermaid.js.org/) — 图表支持
- [Pagefind](https://pagefind.app/) — 静态站内搜索
- [Waline](https://waline.js.org/) / [Giscus](https://giscus.app/) / [Twikoo](https://twikoo.js.org/) — 评论系统（可选）

## 部署

推送到 `master` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。

## 致谢

- 主题：[astro-theme-retypeset](https://github.com/radishzzz/astro-theme-retypeset)
- 框架：[Astro](https://astro.build/)
