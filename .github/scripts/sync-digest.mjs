import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

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
      .replace(/^(#.*)$/m, '<!-- $1 -->')
    writeFileSync(targetPath, frontmatter + body)
    synced++
    console.log(`Synced: ${file} -> ${targetPath}`)
  }
}

console.log(`Done. Synced ${synced} file(s).`)
