import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { formatFor } from 'autocorrect-node'

const digestDir = process.argv[2]
if (!digestDir) {
  console.error('Usage: node sync-digest.mjs <daily-digests-dir>')
  process.exit(1)
}

// Normalize CJK/ASCII spacing with autocorrect, but mask Markdown link
// URLs first so autocorrect cannot insert spaces inside them (it would
// break CJK anchors like #ai-科技日报-2026-04-09 → #ai-科技日报 -2026-04-09).
// Same masking approach as scripts/format-posts.ts. Only the body is
// formatted — frontmatter is built separately below and never passed
// through autocorrect.
const URL_PLACEHOLDER = i => `ACURLHOLD${i}ENDHOLD`
const URL_PLACEHOLDER_RE = /ACURLHOLD(\d+)ENDHOLD/g

function formatBody(body) {
  const urls = []
  let masked = body.replace(/(!?\]\()([^)]*)(\))/g, (_m, pre, inner) => {
    urls.push(inner)
    return `${pre}${URL_PLACEHOLDER(urls.length - 1)})`
  })
  masked = masked.replace(/^(\[[^\]]+\]:\s*)(\S.*)$/gm, (_m, pre, url) => {
    urls.push(url)
    return `${pre}${URL_PLACEHOLDER(urls.length - 1)}`
  })
  try {
    const formatted = formatFor(masked, 'digest.md')
    return formatted.replace(URL_PLACEHOLDER_RE, (_m, i) => urls[Number(i)] ?? '')
  }
  catch (error) {
    console.error(`⚠️ autocorrect failed, writing body unformatted: ${error}`)
    return body
  }
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

    const body = formatBody(
      readFileSync(join(source, file), 'utf-8')
        .replace(/^(#.*)$/m, '<!-- $1 -->'),
    )
    mkdirSync(target, { recursive: true })
    writeFileSync(targetPath, frontmatter + body)
    synced++
    console.log(`Synced: ${file} -> ${targetPath}`)
  }
}

console.log(`Done. Synced ${synced} file(s).`)
