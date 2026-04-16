import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const POSTS_SRC = '_posts'
const POSTS_DST = 'src/content/posts'

let migrated = 0
let failed = 0

// Ensure output directory exists
mkdirSync(POSTS_DST, { recursive: true })

const files = readdirSync(POSTS_SRC).filter(f => f.endsWith('.md'))

// Track used filenames to detect duplicates
const usedFilenames = new Set()

for (const file of files) {
  try {
    const srcPath = join(POSTS_SRC, file)
    const raw = readFileSync(srcPath, 'utf-8')

    // Parse frontmatter and body
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
    if (!fmMatch) {
      console.error(`SKIP (no frontmatter): ${file}`)
      failed++
      continue
    }

    const frontmatterRaw = fmMatch[1]
    const body = fmMatch[2]

    // Extract date from filename: YYYY-MM-DD-Title.md
    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/)
    if (!dateMatch) {
      console.error(`SKIP (no date in filename): ${file}`)
      failed++
      continue
    }
    const published = dateMatch[1]
    let targetFilename = `${dateMatch[2]}.md`

    // Handle duplicate filenames by prepending the date
    if (usedFilenames.has(targetFilename)) {
      targetFilename = `${published}-${dateMatch[2]}.md`
      console.log(`NOTE: Duplicate detected, using dated filename: ${targetFilename}`)
    }
    usedFilenames.add(targetFilename)

    // Parse frontmatter fields
    const titleMatch = frontmatterRaw.match(/^title: (.*)$/m)
    const tagsMatch = frontmatterRaw.match(/^tags:\s*\[(.+)\]$/m)

    const title = titleMatch ? titleMatch[1].trim() : dateMatch[2]
    const tagsStr = tagsMatch ? tagsMatch[1].trim() : ''

    // Build tags array in YAML format
    const tags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    // Extract description from body before <!--more-->
    let description = ''
    const moreSplit = body.split('<!--more-->')
    const excerpt = moreSplit[0]

    // Find the first non-heading, non-link-only paragraph
    const lines = excerpt.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      // Skip empty lines, headings, pure links, images
      if (!trimmed)
        continue
      if (trimmed.startsWith('#'))
        continue
      if (trimmed.startsWith('!['))
        continue
      // Skip lines that are just a markdown link
      if (/^\[.+\]\(.+\)$/.test(trimmed))
        continue
      // Skip horizontal rules
      if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed))
        continue

      // This is our description paragraph
      // Strip any markdown formatting for a plain text description
      description = trimmed
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links -> text
        .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // bold/italic
        .replace(/`([^`]+)`/g, '$1') // inline code

      // Truncate to 160 chars
      if (description.length > 160) {
        description = `${description.substring(0, 157)}...`
      }
      break
    }

    // Remove <!--more--> from body
    const cleanBody = moreSplit.length > 1 ? moreSplit.join('') : body

    // Build new frontmatter
    const tagsYaml
      = tags.length > 0 ? `tags: [${tags.map(t => `"${t}"`).join(', ')}]` : ''

    const newFrontmatter = [
      `title: "${title.replace(/"/g, '\\"')}"`,
      `published: ${published}`,
      `description: "${description.replace(/"/g, '\\"')}"`,
      `lang: zh`,
      tagsYaml,
    ]
      .filter(Boolean)
      .join('\n')

    const output = `---\n${newFrontmatter}\n---\n${cleanBody}`

    const dstPath = join(POSTS_DST, targetFilename)
    writeFileSync(dstPath, output, 'utf-8')
    console.log(`OK: ${file} -> ${targetFilename}`)
    migrated++
  }
  catch (err) {
    console.error(`FAIL: ${file}: ${err.message}`)
    failed++
  }
}

console.log(`\nDone: ${migrated} migrated, ${failed} failed`)
