/**
 * Format posts by fixing spaces and punctuations between CJK
 * Project: https://github.com/huacnlee/autocorrect
 * Usage: pnpm format-posts
 *
 * NOTE on link URL protection:
 * autocorrect inserts a space at CJK/ASCII boundaries even *inside* Markdown
 * link URLs, which silently breaks in-page anchor jumps. Two failure modes:
 *
 *   1. Plain `format(body)` auto-detects as non-Markdown and rewrites URLs
 *      broadly, e.g. `#ai-科技日报-2026-04-04` → `#ai-科技日报 -2026-04-04`.
 *   2. Even `formatFor(body, filePath)` (Markdown mode) still inserts a space
 *      at *naked* CJK-ASCII adjacencies, e.g. `#6-语音tts-模型` →
 *      `#6-语音 tts-模型`.
 *
 * So neither API fully preserves URLs. `formatBody()` below therefore masks
 * every link/image URL (and reference-definition URL) with an ASCII placeholder
 * before formatting, then restores the original verbatim. Body text still gets
 * the desired CJK/ASCII spacing; only URLs are frozen.
 */

import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { formatFor } from 'autocorrect-node'
import fg from 'fast-glob'

interface MarkdownContent {
  frontmatter: string
  body: string
  hasFrontmatter: boolean
}

// Split Markdown file into frontmatter and content
function splitContent(content: string): MarkdownContent {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/m)
  if (!match) {
    return {
      frontmatter: '',
      body: content,
      hasFrontmatter: false,
    }
  }

  return {
    frontmatter: match[1],
    body: match[2],
    hasFrontmatter: true,
  }
}

// Placeholder used to mask link URLs so autocorrect cannot touch them.
// Pure ASCII with no CJK, so autocorrect leaves it (and the URL it stands in
// for) untouched.
const URL_PLACEHOLDER = (i: number) => `ACURLHOLD${i}ENDHOLD`
const URL_PLACEHOLDER_RE = /ACURLHOLD(\d+)ENDHOLD/g

// Mask Markdown link/image URLs (and reference-definition URLs), run autocorrect
// on the rest, then restore the original URLs verbatim. This guarantees URLs —
// including in-page anchor fragments like `#ai-科技日报-2026-04-04` — are never
// modified, while body text still gets CJK/ASCII spacing fixes.
function formatBody(body: string, filePath: string): string {
  const urls: string[] = []

  // 1. Inline links and images: capture the `(...)` URL (+ optional title).
  //    `[text](url)`, `[text](url "title")`, `![alt](url)`
  let masked = body.replace(/(!?\]\()([^)]*)(\))/g, (_m, pre, inner) => {
    urls.push(inner)
    return `${pre}${URL_PLACEHOLDER(urls.length - 1)})`
  })

  // 2. Reference-style definitions: `[id]: url` (line-anchored).
  //    Footnote definitions (`[^note]: …`) must be excluded: their body often
  //    contains already-masked inline links, and re-masking the whole line
  //    nests placeholders that the single restore pass below cannot unroll
  //    (this exact leak shipped literal `ACURLHOLD<i>ENDHOLD` into posts once).
  masked = masked.replace(/^(\[(?!\^)[^\]]+\]:\s*)(\S.*)$/gm, (_m, pre, url) => {
    urls.push(url)
    return `${pre}${URL_PLACEHOLDER(urls.length - 1)}`
  })

  const formatted = formatFor(masked, filePath)

  const restored = formatted.replace(URL_PLACEHOLDER_RE, (_m, i) => urls[Number(i)] ?? '')
  if (/ACURLHOLD/.test(restored)) {
    throw new Error(`URL placeholder leaked through mask/restore in ${filePath}`)
  }
  return restored
}

// Get all Markdown files to process
async function getMarkdownFiles(): Promise<string[]> {
  console.log('🔍 Scanning Markdown files...')
  const files = await fg(['src/content/**/*.{md,mdx}'])
  console.log(`📦 Found ${files.length} Markdown files`)
  return files
}

// Format a single Markdown file
async function formatSingleFile(filePath: string): Promise<boolean> {
  const content = await readFile(filePath, 'utf8')
  const { frontmatter, body, hasFrontmatter } = splitContent(content)

  const formattedBody = formatBody(body, filePath)
  const newContent = hasFrontmatter
    ? `---\n${frontmatter}\n---\n${formattedBody}`
    : formattedBody

  // Skip if content hasn't changed
  if (content === newContent) {
    return false
  }

  // Write updated content to file
  await writeFile(filePath, newContent, 'utf8')
  console.log(`✅ ${filePath}`)
  return true
}

// Report formatting results
function reportResults(changedCount: number, errorCount: number) {
  if (changedCount === 0) {
    console.log('✅ Check complete, no files needed formatting changes')
  }
  else {
    console.log(`✨ Formatted ${changedCount} files successfully`)
  }

  if (errorCount > 0) {
    console.log(`⚠️ ${errorCount} files failed to format`)
  }
}

// Main function to format all Markdown files
async function formatMarkdownFiles(): Promise<void> {
  const files = await getMarkdownFiles()

  let changedCount = 0
  let errorCount = 0

  for (const file of files) {
    try {
      const wasChanged = await formatSingleFile(file)
      if (wasChanged) {
        changedCount++
      }
    }
    catch (error) {
      console.error(`❌ ${file}:`, error)
      errorCount++
    }
  }

  reportResults(changedCount, errorCount)
}

formatMarkdownFiles().catch((error) => {
  console.error('❌ Execution failed:', error)
  process.exit(1)
})
