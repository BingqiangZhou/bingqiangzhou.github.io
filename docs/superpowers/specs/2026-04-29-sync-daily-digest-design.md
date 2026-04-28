# Sync Daily Digest to Blog — Design

## Goal

Automatically sync content from [DailyDigest](https://github.com/BingqiangZhou/DailyDigest) to the blog's News and Podcasts sections via a scheduled GitHub Actions workflow.

## Content Mapping

| DailyDigest source | Blog target | Frontmatter tag |
|---|---|---|
| `daily-digests/tech/YYYY-MM-DD.md` | `src/content/news/YYYY-MM-DD.md` | `科技日报` |
| `daily-digests/podcast/YYYY-MM-DD.md` | `src/content/podcasts/YYYY-MM-DD.md` | `播客日报` |

## Architecture

```
Blog repo GitHub Actions (daily at 09:00 Beijing time)
    |
    v
1. Checkout blog repo
2. Clone DailyDigest public repo (git clone --depth 1)
3. Diff: list files in DailyDigest vs blog content dirs
4. For each missing file: add frontmatter, copy to blog
5. If changes exist -> git commit + push
```

The script compares file names (YYYY-MM-DD.md) between the two repos. Only missing files are processed. Existing files are never overwritten. This provides both incremental daily sync and automatic gap-filling if a previous run was missed.

## Content Transformation

Input: DailyDigest raw Markdown (no frontmatter).

Output: Markdown with frontmatter prepended, body unchanged.

Tech digest example:
```yaml
---
title: "2026-04-28 科技日报"
published: 2026-04-28
lang: zh
tags: [科技日报]
---

# Daily Digest -- 2026-04-28
...(original body preserved as-is)
```

Podcast digest example:
```yaml
---
title: "2026-04-28 播客日报"
published: 2026-04-28
lang: zh
tags: [播客日报]
---

...(original body preserved as-is)
```

Transformation rules:
- `title`: `YYYY-MM-DD 科技日报` or `YYYY-MM-DD 播客日报`, determined by source directory
- `published`: parsed from filename
- `lang`: fixed `zh`
- `tags`: fixed array, one tag per type
- Body: unchanged

## Schema Change

File: `src/content.config.ts`

Add `tags` field to both news and podcasts schemas:

```ts
tags: z.array(z.string()).optional()
```

## GitHub Actions Workflow

File: `.github/workflows/sync-digest.yml`

- **Schedule**: `cron: '0 1 * * *'` (UTC 01:00 = Beijing 09:00)
- **Manual trigger**: `workflow_dispatch` supported for initial full sync and ad-hoc runs
- **Steps**:
  1. `actions/checkout@v4` on blog repo
  2. `git clone --depth 1` DailyDigest to temp directory
  3. Run `node .github/scripts/sync-digest.mjs <digest-dir>`
  4. Commit and push if changed (config as `github-actions[bot]`)

## Sync Script

File: `.github/scripts/sync-digest.mjs`

Node.js script. Accepts one argument: path to DailyDigest's `daily-digests/` directory.

Logic:
1. Read all `.md` filenames from `tech/` subdirectory
2. For each file, check if corresponding file exists in `src/content/news/`
3. If missing: prepend frontmatter, write to `src/content/news/`
4. Repeat for `podcast/` → `src/content/podcasts/`
5. Exit with summary (e.g., "Synced 3 news, 1 podcasts")

## File Changes Summary

| Action | File | Description |
|---|---|---|
| Create | `.github/workflows/sync-digest.yml` | Scheduled sync workflow |
| Create | `.github/scripts/sync-digest.mjs` | Diff + transform script |
| Modify | `src/content.config.ts` | Add `tags` field to news and podcasts schemas |

No changes needed to page templates, list components, query functions, or path helpers.
