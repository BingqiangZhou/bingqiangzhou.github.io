# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog built with **Astro 6.x** using a customized fork of the **astro-theme-retypeset** theme. Deployed to GitHub Pages (`bingqiangzhou.github.io`) via GitHub Actions on push to `master`. Content is primarily in Chinese (default locale `zh`).

## Commands

```bash
pnpm dev              # Start dev server (runs astro check + astro dev)
pnpm build            # Production build (astro check + build + LQIP image optimization)
pnpm preview          # Preview production build locally
pnpm new-post <title> # Scaffold a new post with frontmatter template
pnpm format-posts     # Fix CJK punctuation/spacing in all content files
pnpm lint             # ESLint (antfu config with Astro + UnoCSS)
pnpm lint:fix         # ESLint with auto-fix
```

Package manager is **pnpm v10.33.0**. Node 22 in CI. Pre-commit hook runs `eslint --fix` via `lint-staged` on `*.{js,mjs,ts,astro}` files.

## Architecture

### Core Config Chain

`src/config.ts` is the master config — site metadata, theme colors, locale, comments, SEO, footer settings. `src/content.config.ts` defines Zod schemas for content collections. `astro.config.ts` wires everything together with integrations and remark/rehype plugins.

### Key Integrations

UnoCSS (Wind3 preset, dark/light theming via oklch), MDX, Pagefind (search), astro-og-canvas, Partytown, Sitemap, astro-compress. Path alias `@/*` → `src/*`.

### Markdown Pipeline

remark plugins: math (`remark-math`), custom container/leaf directives, reading time. rehype plugins: KaTeX, Mermaid, slug, heading anchors, image processing, external links, code copy buttons. Syntax highlighting via Shiki (github-light/github-dark).

### i18n

11 locales with `[...lang]` dynamic routing. Locale utilities in `src/i18n/` (`config.ts`, `lang.ts`, `path.ts`, `ui.ts`).

### Source Layout

- `src/pages/[...lang]/` — All pages (home, post list, tags, about, search, feeds)
- `src/components/` — Astro components (Comment integrations: Giscus/Twikoo/Waline, Widgets: TOC, CodeCopy, ImageZoom)
- `src/plugins/` — Custom remark/rehype plugins
- `src/layouts/` — Head.astro (SEO/meta/OG), Layout.astro (main wrapper)
- `src/utils/content.ts` — Post querying (getPosts, getPinnedPosts, getPostsByYear, getPostsGroupByTags)

## Content Conventions

### Post Files

Posts live in `src/content/posts/` as `.md` or `.mdx` files.

**Naming**: `CategoryPrefix-TopicPascalCase.md` (English only, no spaces/Chinese characters). Category prefixes: `DailyJungle-`, `DailySummary-`, `PaperReading-`, `ReadingNotes-`, `Narration-`, `ToolsAndResources-`.

**Title format**: `【标签】中文描述` (e.g., `【学习笔记】搭建github.io博客的总结（一）`).

**Frontmatter** (required fields):

```yaml
title: "【标签】标题"
published: 2026-04-24
description: "一句话摘要"
lang: zh
tags: ["标签名"]
```

Optional fields: `updated` (date), `draft` (boolean), `pin` (0-99), `toc` (boolean), `abbrlink` (URL slug, lowercase alphanumeric + hyphens). Dates use `YYYY-MM-DD` format.

**Existing tags**: 碎碎念, 学习笔记, 工具分享, 折腾记录, 论文阅读笔记, 读书笔记.

**Body**: No H1 (`# title`) in the body — frontmatter `title` renders as the page heading. Start body content directly with text, blockquotes, or H2+.

### Images

Post images in `public/assets/images/` organized by year and date (e.g., `public/assets/images/2020/20200605/`).

### Slug Resolution

Post URLs use `abbrlink` if set, otherwise fall back to the file's `id` (filename without extension).

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`): push to `master` triggers `pnpm install → pnpm build → deploy to GitHub Pages`. `Dockerfile.dev` at root is a legacy Jekyll artifact, no longer used.

## Theme Updates

`pnpm update-theme` merges from upstream `radishzzz/astro-theme-retypeset` master branch. Be cautious of conflicts with local customizations.
