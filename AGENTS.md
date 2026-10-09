# AGENTS.md

Guidance for AI agents working in this repo. This is the **sole** instruction file —
project-specific facts future ZCode agents would otherwise miss.

## What this repo is

Personal blog (content mostly in Chinese, default locale `zh`) built on **Astro 7** using a
customized fork of the **astro-theme-retypeset** theme. Static site deployed to GitHub Pages.
Package manager is **pnpm v10.33.0**; CI uses Node 22. Path alias `@/*` → `src/*`.

Upgraded to Astro 7 (2026-08-25). Migration notes: markdown plugins go through
`processor: unified({...})` from `@astrojs/markdown-remark` (the legacy
`markdown.remarkPlugins` form is deprecated); `compressHTML: true` is pinned explicitly to
keep v6 whitespace behavior for CJK typography; `astro.config.ts` scrubs any machine-level
`BASE_URL` env var (Vite-reserved — an API-endpoint value leaks into pagefind's bundle path
on local builds). The old `patches/@qwik.dev__partytown@0.11.2.patch` backport was removed
after `@astrojs/partytown@2.1.7` moved to partytown 0.13.2 natively. katex stays on 0.16.x
(rehype-katex@7 depends on katex ^0.16) and typescript on 6.0.x (`@astrojs/check` peer is
^5 || ^6).

## Commands

```bash
pnpm dev            # astro check + dev server (dev runs typecheck first — type errors block it)
pnpm build          # astro check + build + LQIP image optimization
pnpm preview        # preview production build locally
pnpm new-post <title-or-path>   # scaffold a post; arg is used as the filename
pnpm format-posts   # fix CJK punctuation/spacing in all content files
pnpm lint           # ESLint (antfu config with Astro + UnoCSS)
pnpm lint:fix       # ESLint with auto-fix
pnpm update-theme   # merge from upstream radishzzz/astro-theme-retypeset — mind conflicts
```

Both `pnpm dev` and `pnpm build` run `astro check`, so type errors fail builds. A pre-commit hook
runs `eslint --fix` (via `lint-staged`) on `*.{js,mjs,ts,astro}`.

**Registry**: `registry.npmjs.org` is unreachable from the local machine (TCP connect timeout —
a bare `pnpm install` hangs for minutes and must be killed). Always pass the npmmirror registry
explicitly on local installs:

```bash
pnpm install --registry=https://registry.npmmirror.com
```

The flag leaves `pnpm-lock.yaml` clean (registry deps store only integrity hashes). CI
(`deploy.yml`) runs on GitHub runners where npmjs is reachable, so the workflow stays as-is.

## Architecture

### Core config chain

- `src/config.ts` — master config: site metadata, theme colors, locale, comments, SEO, footer.
- `src/content.config.ts` — Zod schemas for content collections.
- `astro.config.ts` — wires integrations + remark/rehype plugins.

### Key integrations

UnoCSS (Wind3 preset, dark/light theming via oklch), MDX, Pagefind (search), astro-og-canvas,
Partytown, Sitemap, astro-compress.

### Markdown pipeline

- **remark**: math (`remark-math`), custom container/leaf directives, reading time.
- **rehype**: KaTeX, Mermaid, slug, heading anchors, image processing, external links, code-copy.
- Syntax highlighting via Shiki (github-light/github-dark).

### i18n

11 locales with `[...lang]` dynamic routing. Locale utilities in `src/i18n/` (`config.ts`,
`lang.ts`, `path.ts`, `ui.ts`). `trailingSlash: 'always'` in `astro.config.ts` is deliberate
("Not recommended to change").

## Where things live (source map)

- `src/pages/[...lang]/` — all pages (home, post list, tags, about, search, feeds)
- `src/components/` — Astro components (Comment integrations: Giscus/Twikoo/Waline; Widgets: TOC,
  CodeCopy, ImageZoom)
- `src/plugins/` — custom remark/rehype plugins (containers, leaf directives, reading time,
  KaTeX/Mermaid, slug, heading anchors, image processing, external links, code-copy)
- `src/layouts/` — Head.astro (SEO/meta/OG), Layout.astro (main wrapper)
- `src/utils/content.ts` — content querying (posts with date-grouping utilities)
- `scripts/` — `new-post.ts`, `format-posts.ts`, `apply-lqip.ts`, `update-theme.ts`

## Content conventions

### Post files

Posts live in `src/content/posts/` as `.md` / `.mdx`. Schema is defined in `src/content.config.ts`.

- **Filename**: `CategoryPrefix-TopicPascalCase.md` — ASCII only, no spaces or CJK. Category
  prefixes: `DailyJungle-`, `DailySummary-`, `PaperReading-`, `ReadingNotes-`, `Narration-`,
  `ToolsAndResources-`.
- **`title`**: `【标签】中文描述` (e.g., `【学习笔记】搭建github.io博客的总结（一）`).
- **Required frontmatter**: `title`, `published` (YYYY-MM-DD), `description`, `lang`, `tags`.
- **Optional**: `updated`, `draft`, `pin` (0-99), `toc`, `abbrlink` (URL slug: lowercase
  alphanumeric + hyphens). Dates use `YYYY-MM-DD`.
- **Existing tags** (18, as of 2026-08): 学习笔记, 工具分享, 实践记录, 读书笔记, Claude Code,
  AI前沿, 财商, 论文阅读笔记, AI实测, 碎碎念, WWDC, Apple, 优质转载, Agent Skill, Skill,
  Agent, 折腾记录, AI图像生成. Prefer reusing an existing tag over minting a new one.
- **Body**: No H1 (`# title`) in the body — frontmatter `title` renders as the page `<h1>`. Start
  the body directly with text, blockquotes, or H2+.
- **URL**: post URLs use `abbrlink` if set, otherwise the file's `id` (filename without extension).
- **Images**: `public/assets/images/<year>/<yearmonthday>/`, **WebP format (quality ~80)** —
  content images are WebP-only since 2026-08-25 (178 legacy PNGs >500KB bulk-converted, 213MB
  saved). Convert new screenshots/photos to WebP before committing (sharp is installed). PNG only
  where tooling demands it (`public/icons/favicon.png`, `og-logo.png` for astro-og-canvas).

## Adding content — use the skills

Two canonical skills under `.zcode/skills/` define the real workflows; prefer them over
improvising:

- **`add-blog-post`** — import an external Markdown note as a new blog post. Establishes the
  frontmatter schema, naming, title format, tag taxonomy, and body rules. Trigger phrases include
  "加入博客", "发布文章", "add post".
- **`repost-article`** — faithfully repost an external web article verbatim with attribution,
  downloading images locally into `public/assets/images/`. Produces a `【优质转载】` post. Use this
  only for verbatim reposts, not for writing your own notes about a source.

Both skills' descriptions are in Chinese. When the user asks to add/repost content, follow the
relevant skill rather than the generic steps above.

## Legacy Jekyll URLs

The old Jekyll site served posts at `/YYYY/MM/DD/Title.html` (TeXt `permalink: date`). Those URLs
are intentionally **not** redirected — the old posts live only at their Astro URLs
(`/posts/<abbrlink|id>/`). A redirect experiment (static pages, then an Astro
`/[year]/[month]/[day]/[...slug]` route) was fully removed on 2026-08-25; don't re-add it.

## Branches & deployment

- The deploy workflow (`.github/workflows/deploy.yml`) triggers on **push to `main`** (also
  `workflow_dispatch`). Pushing to `main` publishes.
- The old Jekyll-era `master` branch and legacy `Dockerfile.dev` were removed (2026-08-25);
  `origin/HEAD` points at `main`.

## Notes

- `dist/` is build output; don't edit by hand.
- The DailyDigest-synced news/podcast collections were **fully removed** on 2026-10-08
  (`sync-digest` workflow + script, `src/content/{news,podcasts}/`, their pages/components and all
  code references). The external `BingqiangZhou/DailyDigest` repo may still generate digests; they
  are just no longer synced into this site. Don't re-introduce the sync pipeline.
- `.astro/data-store.json` caches rendered markdown per entry and survives config changes.
  If rendered output looks stale/wrong after switching configs or Astro versions,
  `rm -rf .astro` and rebuild before debugging anything else.
- `pnpm update-theme` merges from upstream `radishzzz/astro-theme-retypeset` master branch — be
  cautious of conflicts with local customizations (upstream still pins the partytown patch we
  removed).
