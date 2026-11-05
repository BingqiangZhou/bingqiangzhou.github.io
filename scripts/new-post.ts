/**
 * Create a new post with frontmatter
 * Usage: pnpm new-post <title>
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import process from 'node:process'
import { themeConfig } from '../src/config'

// Process file path
const rawPath = process.argv[2] ?? 'new-post'
const baseName = basename(rawPath).replace(/\.(md|mdx)$/, '')
const targetFile = ['.md', '.mdx'].includes(extname(rawPath))
  ? rawPath
  : `${rawPath}.md`
const fullPath = join('src/content/posts', targetFile)

// Check if file already exists
if (existsSync(fullPath)) {
  console.error(`❌ File already exists: ${fullPath}`)
  process.exit(1)
}

// Create directory structure
mkdirSync(dirname(fullPath), { recursive: true })

// Prepare file content
// - title quoted: unquoted titles break YAML when they contain ': ', '#', '{', …
// - published as local YYYY-MM-DD: display paths format via UTC ISO strings,
//   so an ISO datetime scaffolded before 08:00 Beijing time would render as
//   the previous day
// - description empty on purpose: author fills a one-line summary,
//   hard cap 300 chars per repo convention (see .claude/skills/add-blog-post)
const now = new Date()
const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const content = `---
title: ${JSON.stringify(baseName)}
published: ${localDate}
description: ''
updated: ''
tags:
  - Tag
draft: false
pin: 0
toc: ${themeConfig.global.toc}
abbrlink: ''
---
`

// Write to file
try {
  writeFileSync(fullPath, content)
  console.log(`✅ Post created: ${fullPath}`)
}
catch (error) {
  console.error('❌ Failed to create post:', error)
  process.exit(1)
}
