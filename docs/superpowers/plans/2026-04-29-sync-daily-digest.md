# Sync Daily Digest to Blog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically sync tech and podcast daily digests from DailyDigest repo to the blog's News and Podcasts sections.

**Architecture:** A scheduled GitHub Actions workflow in the blog repo clones the DailyDigest public repo, runs a Node.js script that diffs file lists and copies missing files with frontmatter prepended, then commits and triggers a site rebuild.

**Tech Stack:** Node.js (ESM), GitHub Actions, Astro content collections

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/content.config.ts` | Add `tags` field to news and podcasts schemas |
| Create | `.github/scripts/sync-digest.mjs` | Diff + transform: compare DailyDigest files against blog content, prepend frontmatter, copy missing files |
| Create | `.github/workflows/sync-digest.yml` | Scheduled workflow: clone DailyDigest, run sync script, commit, trigger deploy |

---

### Task 1: Add tags field to content schemas

**Files:**
- Modify: `src/content.config.ts:38-56`

- [ ] **Step 1: Add `tags` to news schema**

In `src/content.config.ts`, add `tags` field after `lang` in the `news` collection schema (line 44):

```ts
const news = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    published: z.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
    lang: z.enum(['', ...allLocales]).optional().default(''),
  }),
})
```

- [ ] **Step 2: Add `tags` to podcasts schema**

Add the same `tags` field in the `podcasts` collection schema (line 55):

```ts
const podcasts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/podcasts' }),
  schema: z.object({
    title: z.string(),
    published: z.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
    lang: z.enum(['', ...allLocales]).optional().default(''),
  }),
})
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build`

Expected: Build succeeds. Existing news/podcasts content (without `tags` in frontmatter) still works because the field is optional.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add optional tags field to news and podcasts schemas"
```

---

### Task 2: Create the sync script

**Files:**
- Create: `.github/scripts/sync-digest.mjs`

- [ ] **Step 1: Create `.github/scripts/` directory**

```bash
mkdir -p .github/scripts
```

- [ ] **Step 2: Remove placeholder content files**

The existing files contain sample content ("示例资讯内容", "示例播客内容") that will block the sync script from writing real content for those dates. Delete them so the sync can fill in real data:

```bash
rm src/content/news/2026-04-26.md
rm src/content/podcasts/2026-04-27.md
```

- [ ] **Step 3: Write the sync script**

Create `.github/scripts/sync-digest.mjs` with this content:

```js
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const digestDir = process.argv[2]
if (!digestDir) {
  console.error('Usage: node sync-digest.mjs <daily-digests-dir>')
  process.exit(1)
}

const mappings = [
  {
    source: join(digestDir, 'tech'),
    target: 'src/content/news',
    tag: '科技日报',
  },
  {
    source: join(digestDir, 'podcast'),
    target: 'src/content/podcasts',
    tag: '播客日报',
  },
]

let synced = 0

for (const { source, target, tag } of mappings) {
  if (!existsSync(source)) {
    console.log(`Source directory not found, skipping: ${source}`)
    continue
  }

  const files = readdirSync(source).filter(f => f.endsWith('.md'))

  for (const file of files) {
    const targetPath = join(target, file)
    if (existsSync(targetPath)) {
      continue
    }

    const date = file.replace('.md', '')
    const title = `${date} ${tag}`
    const frontmatter = [
      '---',
      `title: "${title}"`,
      `published: ${date}`,
      'lang: zh',
      `tags: [${tag}]`,
      '---',
      '',
    ].join('\n')

    const body = readFileSync(join(source, file), 'utf-8')
    writeFileSync(targetPath, frontmatter + body)
    synced++
    console.log(`Synced: ${file} -> ${targetPath}`)
  }
}

console.log(`Done. Synced ${synced} file(s).`)
```

- [ ] **Step 4: Verify script locally with a dry run**

Clone DailyDigest to a temp location and run the script to confirm it works:

```bash
git clone --depth 1 https://github.com/BingqiangZhou/DailyDigest.git /tmp/daily-digest-test
node .github/scripts/sync-digest.mjs /tmp/daily-digest-test/daily-digests
```

Expected: Script prints synced files for tech digest (the podcast directory should be empty/skipped). Check that files in `src/content/news/` have correct frontmatter.

- [ ] **Step 5: Inspect a synced file**

Run: `head -8 src/content/news/2026-04-28.md`

Expected output should look like:
```
---
title: "2026-04-28 科技日报"
published: 2026-04-28
lang: zh
tags: [科技日报]
---

# Daily Digest -- 2026-04-28
```

- [ ] **Step 6: Verify build still passes with synced content**

Run: `pnpm build`

Expected: Build succeeds. All synced news and podcast pages are generated.

- [ ] **Step 7: Commit**

```bash
git add .github/scripts/sync-digest.mjs src/content/news/ src/content/podcasts/
git commit -m "feat: add sync script and import historical daily digest content"
```

---

### Task 3: Create the GitHub Actions workflow

**Files:**
- Create: `.github/workflows/sync-digest.yml`

- [ ] **Step 1: Write the workflow file**

Create `.github/workflows/sync-digest.yml`:

```yaml
name: Sync Daily Digest

on:
  schedule:
    - cron: '0 1 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout blog
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Clone DailyDigest
        run: git clone --depth 1 https://github.com/BingqiangZhou/DailyDigest.git /tmp/daily-digest

      - name: Run sync script
        run: node .github/scripts/sync-digest.mjs /tmp/daily-digest/daily-digests

      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add src/content/news/ src/content/podcasts/
          git diff --cached --quiet || git commit -m "sync: daily digest $(date +%Y-%m-%d)"
          git push

      - name: Trigger deploy
        if: always()
        run: gh workflow run deploy.yml
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Note: The deploy workflow (`deploy.yml`) triggers on push to master. However, pushes made by `GITHUB_TOKEN` in Actions do not trigger subsequent workflows. The final step explicitly triggers `deploy.yml` via `workflow_dispatch` to ensure the site rebuilds.

- [ ] **Step 2: Verify workflow file syntax**

Run: `cat .github/workflows/sync-digest.yml`

Confirm the YAML is valid and all steps are present.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/sync-digest.yml
git commit -m "feat: add scheduled workflow to sync DailyDigest content"
```

---

### Task 4: Push all changes and verify

- [ ] **Step 1: Push to remote**

```bash
git push origin master
```

Expected: All commits pushed. The `deploy.yml` workflow triggers automatically from the push and rebuilds the site with the new content.

- [ ] **Step 2: Verify on GitHub**

Go to the Actions tab and confirm:
1. `Deploy to GitHub Pages` workflow runs and succeeds
2. `Sync Daily Digest` workflow is visible (will run next at 09:00 Beijing time or can be triggered manually)

- [ ] **Step 3: Verify the live site**

Visit `bingqiangzhou.github.io/news/` and `bingqiangzhou.github.io/podcasts/` and confirm synced content appears correctly.
