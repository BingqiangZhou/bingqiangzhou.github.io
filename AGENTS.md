# AGENTS.md

Guidance for AI agents working in this repo. This is the **sole** instruction file —
project-specific facts future ZCode agents would otherwise miss.

## What this repo is

Personal blog (content mostly in Chinese, default locale `zh`) built on **Astro 6** using a
customized fork of the **astro-theme-retypeset** theme. Static site deployed to GitHub Pages.
Package manager is **pnpm v10.33.0**; CI uses Node 22. Path alias `@/*` → `src/*`.

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

- `src/pages/[...lang]/` — all pages (home, post list, news, podcasts, tags, about, search, feeds)
- `src/components/` — Astro components (Comment integrations: Giscus/Twikoo/Waline; Widgets: TOC,
  CodeCopy, ImageZoom, NewsList, PodcastList)
- `src/plugins/` — custom remark/rehype plugins (containers, leaf directives, reading time,
  KaTeX/Mermaid, slug, heading anchors, image processing, external links, code-copy)
- `src/layouts/` — Head.astro (SEO/meta/OG), Layout.astro (main wrapper)
- `src/utils/content.ts` — content querying (posts, news, podcasts with date-grouping utilities)
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
- **Existing tags**: 碎碎念, 学习笔记, 工具分享, 折腾记录, 论文阅读笔记, 读书笔记.
- **Body**: No H1 (`# title`) in the body — frontmatter `title` renders as the page `<h1>`. Start
  the body directly with text, blockquotes, or H2+.
- **URL**: post URLs use `abbrlink` if set, otherwise the file's `id` (filename without extension).
- **Images**: `public/assets/images/<year>/<yearmonthday>/`.

### News & podcasts

Separate content collections (simpler schema than posts) with list pages grouped by year/month.

- **Directories**: `src/content/news/` and `src/content/podcasts/`.
- **Minimal frontmatter**: `title`, `published` (YYYY-MM-DD), `lang`. Optional `draft`. URL slug is
  the file's `id`. List components `NewsList.astro` / `PodcastList.astro`; pages under
  `src/pages/[...lang]/news/` and `/podcasts/`; query functions in `src/utils/content.ts`.

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

## Auto-generated content — do not hand-edit

`.github/workflows/sync-digest.yml` runs daily (cron) and on manual dispatch:

1. Clones `github.com/BingqiangZhou/DailyDigest` (shallow).
2. Runs `node .github/scripts/sync-digest.mjs` to regenerate `src/content/news/` and
   `src/content/podcasts/`.
3. Commits and pushes the result, which in turn triggers a deploy.

**Treat `src/content/news/` and `src/content/podcasts/` as generated output.** Edits there will be
overwritten by the next sync. Authoritative content for these lives in the external `DailyDigest`
repo, not here. Manual content work belongs in `src/content/posts/`.

## Branches & deployment

- The deploy workflow (`.github/workflows/deploy.yml`) triggers on **push to `main`** (also
  `workflow_dispatch`, and after the daily `Sync Daily Digest` run). Pushing to `main` publishes.
- `origin/HEAD` points at `master` and the README still says "push to master" — that is **stale**.
  The live publishing branch is **`main`**. When in doubt, check `deploy.yml`.

## Notes

- `Dockerfile.dev` at the repo root is a **legacy Jekyll artifact and is unused** — ignore it.
- `dist/` is build output; don't edit by hand.
- `pnpm update-theme` merges from upstream `radishzzz/astro-theme-retypeset` master branch — be
  cautious of conflicts with local customizations.
