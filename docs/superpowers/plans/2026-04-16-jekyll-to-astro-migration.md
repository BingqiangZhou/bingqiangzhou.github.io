# Jekyll to Astro (Retypeset) Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the personal blog from Jekyll (TeXt Theme) to Astro (Retypeset Theme), preserving all 37 posts and 64 images, deploying to GitHub Pages via GitHub Actions.

**Architecture:** Clone the Retypeset theme into the current repo, replace Jekyll files, migrate content with transformed frontmatter, configure for Chinese-only mode, and set up CI/CD.

**Tech Stack:** Astro 6, UnoCSS, TypeScript, pnpm, KaTeX (remark-math + rehype-katex), Shiki syntax highlighting

---

## File Structure Map

### Files to Create (from Retypeset theme)
- `astro.config.ts` — Astro configuration with plugins
- `uno.config.ts` — UnoCSS configuration
- `tsconfig.json` — TypeScript configuration
- `package.json` — Dependencies
- `pnpm-lock.yaml` — Lockfile (generated)
- `eslint.config.mjs` — ESLint config
- `.gitignore` — Updated gitignore
- `.editorconfig` — Editor config
- `src/config.ts` — Site configuration
- `src/content.config.ts` — Content schema
- `src/env.d.ts` — Type declarations
- `src/pages/**` — All page routes
- `src/layouts/**` — Layout components
- `src/components/**` — UI components
- `src/i18n/**` — Internationalization
- `src/styles/**` — Global styles
- `src/plugins/**` — Astro plugins
- `src/types/**` — Type definitions
- `src/utils/**` — Utility functions
- `src/assets/**` — Theme assets
- `public/**` — Static assets (favicon, icons)
- `scripts/**` — Build scripts

### Files to Create (migration-specific)
- `src/content/posts/*.md` — 37 migrated blog posts
- `src/content/about/zh.md` — About page
- `.github/workflows/deploy.yml` — GitHub Actions deployment
- `public/assets/images/**` — 64 images (moved from `assets/images/`)

### Files to Delete (Jekyll-specific)
- `Gemfile`, `_config.yml`, `jekyll-text-theme.gemspec`
- `_layouts/`, `_includes/`, `_sass/`, `_data/`
- `404.html`, `archive.html`, `index.html`, `about.md`
- `.travis.yml`, `.eslintrc`, `.stylelintrc`, `.stylelintignore`
- `browserconfig.xml`, `favicon.ico`, `myblog.code-workspace`
- `assets/css/`, `assets/search.js`, `assets/site.webmanifest`
- `tools/`, `todo.md`
- Original `_posts/` directory (after migration verified)
- Original `assets/images/` directory (after migration verified)

---

## Phase 1: Project Initialization

### Task 1.1: Clone Retypeset theme to temporary directory

**Files:**
- Create: `/tmp/astro-theme-retypeset/` (temporary)

- [ ] **Step 1: Clone the Retypeset theme**

```bash
git clone --depth 1 https://github.com/radishzzz/astro-theme-retypeset.git /tmp/astro-theme-retypeset
```

Expected: Repository cloned successfully.

- [ ] **Step 2: Verify clone contains expected files**

```bash
ls /tmp/astro-theme-retypeset/src/config.ts /tmp/astro-theme-retypeset/package.json /tmp/astro-theme-retypeset/astro.config.ts
```

Expected: All three files listed.

### Task 1.2: Install pnpm (if not already installed)

- [ ] **Step 1: Check pnpm availability**

```bash
pnpm --version
```

Expected: Version number (e.g., 10.x.x). If not installed:

```bash
npm install -g pnpm
```

### Task 1.3: Copy Retypeset theme files into project

**Files:**
- Create: `astro.config.ts`, `package.json`, `uno.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.editorconfig`
- Create: `src/` directory tree (all theme files)

- [ ] **Step 1: Copy core config files**

```bash
cd /Users/bingqiangzhou/Workspaces/Projects/bingqiangzhou.github.io
cp /tmp/astro-theme-retypeset/astro.config.ts .
cp /tmp/astro-theme-retypeset/package.json .
cp /tmp/astro-theme-retypeset/uno.config.ts .
cp /tmp/astro-theme-retypeset/tsconfig.json .
cp /tmp/astro-theme-retypeset/eslint.config.mjs .
cp /tmp/astro-theme-retypeset/.editorconfig .
cp /tmp/astro-theme-retypeset/.gitignore .
cp /tmp/astro-theme-retypeset/pnpm-lock.yaml .
cp -r /tmp/astro-theme-retypeset/patches .
cp -r /tmp/astro-theme-retypeset/scripts .
cp -r /tmp/astro-theme-retypeset/public .
```

- [ ] **Step 2: Copy src directory**

```bash
cp -r /tmp/astro-theme-retypeset/src .
```

- [ ] **Step 3: Copy assets directory (theme assets)**

```bash
cp -r /tmp/astro-theme-retypeset/assets .
```

### Task 1.4: Move blog images to public directory

**Files:**
- Move: `assets/images/` → `public/assets/images/`

- [ ] **Step 1: Create target directory and move images**

```bash
mkdir -p public/assets
cp -r assets/images public/assets/images
```

- [ ] **Step 2: Verify image count matches**

```bash
echo "Original:" && find assets/images -type f | wc -l
echo "Copied:" && find public/assets/images -type f | wc -l
```

Expected: Both counts equal 64.

### Task 1.5: Delete Jekyll-specific files

**Files:**
- Delete: All Jekyll infrastructure files

- [ ] **Step 1: Remove Jekyll files**

```bash
rm -f Gemfile _config.yml jekyll-text-theme.gemspec .travis.yml .eslintrc .stylelintrc .stylelintignore
rm -f 404.html archive.html index.html about.md browserconfig.xml favicon.ico
rm -f myblog.code-workspace todo.md LICENSE
rm -rf _layouts _includes _sass _data tools
rm -rf assets/css assets/search.js assets/site.webmanifest
rm -rf assets/images/logo assets/images/2019 assets/images/2020
```

Note: `_posts/` is kept for now; will be deleted after content migration is verified.

- [ ] **Step 2: Verify Jekyll files are gone**

```bash
ls Gemfile _config.yml 2>&1
```

Expected: "No such file or directory" for both.

### Task 1.6: Install dependencies

- [ ] **Step 1: Run pnpm install**

```bash
pnpm install
```

Expected: Dependencies installed successfully, `node_modules/` created.

- [ ] **Step 2: Verify build works with default theme content**

```bash
pnpm build
```

Expected: Build completes without errors, `dist/` directory created.

- [ ] **Step 3: Commit Phase 1**

```bash
git add -A
git commit -m "feat: initialize Astro project with Retypeset theme"
```

---

## Phase 2: Content Migration

### Task 2.1: Write content migration script

**Files:**
- Create: `scripts/migrate-posts.mjs`

- [ ] **Step 1: Create the migration script**

```javascript
// scripts/migrate-posts.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'

const POSTS_DIR = '_posts'
const TARGET_DIR = 'src/content/posts'

function extractExcerpt(content) {
  const separator = '<!--more-->'
  const idx = content.indexOf(separator)
  if (idx === -1) {
    // Take first paragraph if no separator
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('---') && !trimmed.startsWith('#') && !trimmed.startsWith('![') && !trimmed.startsWith('[')) {
        return trimmed.slice(0, 160)
      }
    }
    return ''
  }
  const before = content.slice(0, idx).trim()
  const lines = before.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('---') && !trimmed.startsWith('#') && !trimmed.startsWith('![') && !trimmed.startsWith('[')) {
      return trimmed.slice(0, 160)
    }
  }
  return ''
}

function migratePost(filePath) {
  const raw = readFileSync(filePath, 'utf-8')

  // Extract frontmatter
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) {
    console.warn(`No frontmatter found in ${filePath}`)
    return null
  }

  const fmRaw = fmMatch[1]
  const body = raw.slice(fmMatch[0].length)

  // Parse frontmatter fields
  const titleMatch = fmRaw.match(/title:\s*['"]?(.+?)['"]?\s*$/m)
  const tagsMatch = fmRaw.match(/tags:\s*\[(.+?)\]/)

  const title = titleMatch ? titleMatch[1].trim() : basename(filePath, '.md')
  const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')) : []

  // Extract date from filename: YYYY-MM-DD-Title.md
  const dateMatch = basename(filePath).match(/^(\d{4}-\d{2}-\d{2})/)
  const date = dateMatch ? dateMatch[1] : '2020-01-01'

  // Remove date prefix from filename for the target
  const targetName = basename(filePath).replace(/^\d{4}-\d{2}-\d{2}-/, '')

  // Extract excerpt and remove <!--more-->
  const description = extractExcerpt(body)
  const cleanedBody = body.replace('<!--more-->', '').trim()

  // Build new frontmatter
  const newFm = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `published: ${date}`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `lang: zh`,
  ]
  if (tags.length > 0) {
    newFm.push(`tags: [${tags.map(t => `"${t}"`).join(', ')}]`)
  }
  newFm.push('---')

  const newContent = newFm.join('\n') + '\n\n' + cleanedBody + '\n'

  return { targetName, content: newContent }
}

// Main
mkdirSync(TARGET_DIR, { recursive: true })

// Remove example posts from theme (cleaned up separately in Task 2.2 Step 1)

const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))
let migrated = 0
let failed = 0

for (const file of files) {
  const result = migratePost(join(POSTS_DIR, file))
  if (result) {
    writeFileSync(join(TARGET_DIR, result.targetName), result.content)
    console.log(`Migrated: ${file} -> ${result.targetName}`)
    migrated++
  } else {
    console.error(`Failed: ${file}`)
    failed++
  }
}

console.log(`\nDone: ${migrated} migrated, ${failed} failed`)
```

### Task 2.2: Run migration script

- [ ] **Step 1: Clean up theme example posts**

```bash
rm -rf src/content/posts/examples src/content/posts/guides
rm -f src/content/posts/Universal\ Post.md
```

- [ ] **Step 2: Run the migration script**

```bash
node scripts/migrate-posts.mjs
```

Expected: "Done: 37 migrated, 0 failed"

- [ ] **Step 3: Verify post count**

```bash
ls src/content/posts/*.md | wc -l
```

Expected: 37

- [ ] **Step 4: Spot-check one migrated post**

```bash
head -10 src/content/posts/DailySummary-NormalizationStandardizationRegularization.md
```

Expected: New frontmatter with `title`, `published`, `description`, `lang: zh`, `tags`. Body content preserved with `<!--more-->` removed.

- [ ] **Step 5: Spot-check a math-heavy post**

```bash
head -10 src/content/posts/PaperReading-SemanticInstanceSegmentationViaDeepMetricLearning.md
```

Expected: Same frontmatter format. Then verify math notation preserved:

```bash
grep -c '\$\$' src/content/posts/DailySummary-NormalizationStandardizationRegularization.md
```

Expected: Count > 0 (math formulas present).

### Task 2.3: Migrate about page

**Files:**
- Create: `src/content/about/zh.md`

- [ ] **Step 1: Create the about page**

Read the existing `about.md` content. Then create the new file with Retypeset frontmatter. If the original `about.md` was already deleted, check git for its content:

```bash
git show HEAD:about.md
```

Write `src/content/about/zh.md`:

```markdown
---
lang: zh
---

[Original about.md content here, preserving all Markdown body]
```

### Task 2.4: Commit Phase 2

- [ ] **Step 1: Commit migrated content**

```bash
git add src/content/posts/ src/content/about/
git commit -m "feat: migrate 37 posts and about page from Jekyll to Astro"
```

---

## Phase 3: Site Configuration

### Task 3.1: Configure site settings

**Files:**
- Modify: `src/config.ts`

- [ ] **Step 1: Update site configuration**

Replace the `themeConfig` object in `src/config.ts`. Key changes:

```typescript
import type { ThemeConfig } from '@/types'

export const themeConfig: ThemeConfig = {
  site: {
    title: '惟愿此心无怨尤',
    subtitle: 'TO BE, TO UP.',
    description: 'TO BE, TO UP.',
    i18nTitle: false,
    author: 'Bingqiang Zhou',
    url: 'https://bingqiangzhou.github.io',
    base: '/',
    favicon: '/icons/favicon.svg',
  },

  color: {
    mode: 'auto', // light | dark | auto
    light: {
      primary: 'oklch(25% 0.005 298)',
      secondary: 'oklch(40% 0.005 298)',
      background: 'oklch(96% 0.005 298)',
      highlight: 'oklch(0.93 0.195089 103.2532 / 0.5)',
    },
    dark: {
      primary: 'oklch(92% 0.005 298)',
      secondary: 'oklch(77% 0.005 298)',
      background: 'oklch(22% 0.005 298)',
      highlight: 'oklch(0.93 0.195089 103.2532 / 0.2)',
    },
  },

  global: {
    locale: 'zh',
    moreLocales: [], // Chinese only, no other languages
    fontStyle: 'sans',
    dateFormat: 'YYYY-MM-DD',
    toc: true,
    katex: true,
    reduceMotion: false,
  },

  comment: {
    enabled: false,
    giscus: {
      repo: '',
      repoId: '',
      category: '',
      categoryId: '',
      mapping: 'pathname',
      strict: '0',
      reactionsEnabled: '1',
      emitMetadata: '0',
      inputPosition: 'bottom',
    },
    twikoo: {
      envId: '',
    },
    waline: {
      serverURL: '',
      emoji: [],
      search: false,
      imageUploader: false,
    },
  },

  seo: {
    twitterID: '',
    verification: {
      google: '',
      bing: '',
      yandex: '',
      baidu: '',
    },
    googleAnalyticsID: '',
    umamiAnalyticsID: '',
    folo: {
      feedID: '',
      userID: '',
    },
    apiflashKey: '',
  },

  footer: {
    links: [
      {
        name: 'GitHub',
        url: 'https://github.com/BingqiangZhou',
      },
      {
        name: 'Email',
        url: 'bingqiangzhou@qq.com',
      },
    ],
    startYear: 2019,
  },

  preload: {
    imageHostURL: '',
    customGoogleAnalyticsJS: '',
    customUmamiAnalyticsJS: '',
  },
}

export const base = themeConfig.site.base === '/' ? '' : themeConfig.site.base.replace(/\/$/, '')
export const defaultLocale = themeConfig.global.locale
export const moreLocales = themeConfig.global.moreLocales
export const allLocales = [defaultLocale, ...moreLocales]
```

### Task 3.2: Configure i18n for Chinese-only

**Files:**
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Update Chinese translations**

In `src/i18n/ui.ts`, update the `'zh'` entry:

```typescript
'zh': {
  title: '惟愿此心无怨尤',
  subtitle: 'TO BE, TO UP.',
  description: 'TO BE, TO UP.',
  posts: '文章',
  tags: '标签',
  about: '关于',
  toc: '目录',
},
```

### Task 3.3: Update content schema for single-language

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Verify schema is compatible**

The content schema already supports `lang: zh` since `'zh'` is in `allLocales`. With `moreLocales: []`, the only valid lang values are `''` and `'zh'`. No changes needed to `src/content.config.ts` — the schema dynamically references `allLocales` from config.

Verify by reading `src/content.config.ts` and confirming the `allLocales` import chain is intact.

### Task 3.4: Update astro.config.ts for GitHub Pages

**Files:**
- Modify: `astro.config.ts`

- [ ] **Step 1: Verify site URL is correct**

The `astro.config.ts` reads `site` from `themeConfig.site.url` which is now `https://bingqiangzhou.github.io`. No changes needed.

Confirm `output` is `'static'` (Retypeset defaults to static output, no SSR).

- [ ] **Step 2: Commit Phase 3**

```bash
git add src/config.ts src/i18n/ui.ts
git commit -m "feat: configure site settings for bingqiangzhou.github.io"
```

---

## Phase 4: Validation & Testing

### Task 4.1: Build and verify

- [ ] **Step 1: Run full build**

```bash
pnpm build
```

Expected: Build completes with zero errors. `dist/` directory contains HTML files.

If build fails, read the error message carefully and fix:
- Frontmatter validation errors → check `src/content.config.ts` schema vs post frontmatter
- Import errors → check `src/config.ts` exports
- Missing assets → check image paths

- [ ] **Step 2: Verify all 37 posts are generated**

```bash
find dist -name "*.html" | grep -c "posts"
```

Expected: At least 37 post HTML files.

- [ ] **Step 3: Start dev server for visual verification**

```bash
pnpm dev
```

Open `http://localhost:4321` in a browser.

### Task 4.2: Visual verification checklist

- [ ] **Step 1: Homepage loads correctly**
  - Site title shows "惟愿此心无怨尤"
  - Post list displays 37 posts
  - Navigation shows correct links

- [ ] **Step 2: Individual post renders correctly**
  - Open a math-heavy post (e.g., 归一化/标准化/正则化)
  - Verify KaTeX formulas render correctly (`$$...$$` and `$...$`)
  - Verify code blocks have syntax highlighting
  - Verify images load

- [ ] **Step 3: Tag pages work**
  - Click on a tag link
  - Verify posts are filtered by that tag

- [ ] **Step 4: About page loads**

- [ ] **Step 5: Dark mode toggle works**
  - Click the theme toggle
  - Verify page switches between light and dark

- [ ] **Step 6: Archive page shows all posts**

- [ ] **Step 7: Verify image loading**
  - Open a post with images
  - Check that `/assets/images/...` paths resolve correctly

### Task 4.3: Fix any issues found during validation

- [ ] **Step 1: Fix any broken image paths**

If images don't load, verify `public/assets/images/` directory exists and paths match.

- [ ] **Step 2: Fix any frontmatter validation errors**

If specific posts fail, check their frontmatter against the schema in `src/content.config.ts`. Common issues:
- Missing `title` or `published` fields
- Date format not parsing correctly (should be `YYYY-MM-DD`)
- Special characters in title not properly escaped

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve validation issues"
```

---

## Phase 5: Deploy to GitHub Pages

### Task 5.1: Create GitHub Actions workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Build site
        run: pnpm build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Task 5.2: Clean up and final commit

- [ ] **Step 1: Remove temporary migration script**

```bash
rm -f scripts/migrate-posts.mjs
```

- [ ] **Step 2: Remove original _posts directory**

Only after all posts are verified in Phase 4:

```bash
rm -rf _posts
```

- [ ] **Step 3: Remove theme example content if any remains**

Check for any leftover Retypeset example files that aren't part of the blog.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: add GitHub Actions deployment and clean up migration artifacts"
```

### Task 5.3: Configure GitHub Pages settings

- [ ] **Step 1: Push to remote**

```bash
git push origin master
```

- [ ] **Step 2: Configure GitHub Pages in repository settings**

Go to repository Settings → Pages:
- Source: "GitHub Actions" (not "Deploy from a branch")

- [ ] **Step 3: Verify deployment**

Check the Actions tab for the workflow run. Wait for it to complete.

Then visit https://bingqiangzhou.github.io and verify:
- Homepage loads
- Posts are accessible
- Images load
- Math renders
- Dark mode works
