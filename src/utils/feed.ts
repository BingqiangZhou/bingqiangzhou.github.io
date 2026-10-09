import { getCollection } from 'astro:content'
import { Feed } from 'feed'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'
import { base, themeConfig } from '@/config'
import { getPostDescription } from '@/utils/description'

const markdownParser = new MarkdownIt()
const { title, description, url, author } = themeConfig.site
const { folo } = themeConfig.seo ?? {}

/**
 * >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
 * Generate a feed object supporting both RSS and Atom formats
 *
 * @returns A Feed instance ready for RSS or Atom output
 */
export async function generateFeed() {
  const siteURL = `${url}${base}/`

  // Create Feed instance
  const feed = new Feed({
    title,
    description,
    id: siteURL,
    link: siteURL,
    language: 'zh',
    copyright: `Copyright © ${new Date().getFullYear()} ${author}`,
    updated: new Date(),
    generator: 'Astro-Theme-Retypeset with Feed for Node.js',

    feedLinks: {
      rss: new URL(`${base}/rss.xml`, url).toString(),
      atom: new URL(`${base}/atom.xml`, url).toString(),
    },

    author: {
      name: author,
      link: siteURL,
    },
  })

  // Exclude drafts
  const posts = await getCollection('posts', ({ data }) => !data.draft)

  // Sort posts by published date in descending order and limit to the latest 25
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.data.published).getTime() - new Date(a.data.published).getTime())
    .slice(0, 25)

  // Add posts to feed
  for (const post of recentPosts) {
    const slug = post.data.abbrlink || post.id
    const link = new URL(`posts/${slug}/`, siteURL).toString()

    // Optimize content processing
    const postContent = post.body
      ? sanitizeHtml(
          // Remove HTML comments before rendering markdown
          markdownParser.render(post.body.replace(/<!--[\s\S]*?-->/g, '')),
          {
            // Allow <img> tags in feed content
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
          },
        )
      : ''

    // publishDate -> Atom:<published>, RSS:<pubDate>
    const publishDate = new Date(post.data.published)
    // updateDate -> Atom:<updated>, RSS has no update tag
    const updateDate = post.data.updated ? new Date(post.data.updated) : publishDate

    feed.addItem({
      title: post.data.title,
      id: link,
      link,
      description: getPostDescription(post, 'feed'),
      content: postContent,
      author: [{
        name: author,
        link: siteURL,
      }],
      published: publishDate,
      date: updateDate,
    })
  }

  // Add folo verification if available
  if (folo?.feedID && folo?.userID) {
    feed.addExtension({
      name: 'folo_challenge',
      objects: {
        feedId: folo.feedID,
        userId: folo.userID,
      },
    })
  }

  return feed
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Generate RSS 2.0 format feed
export async function generateRSS() {
  const feed = await generateFeed()

  // Add XSLT stylesheet to RSS feed
  let rssXml = feed.rss2()
  rssXml = rssXml.replace(
    '<?xml version="1.0" encoding="utf-8"?>',
    `<?xml version="1.0" encoding="utf-8"?>\n<?xml-stylesheet href="${base}/feeds/rss-style.xsl" type="text/xsl"?>`,
  )

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}

// Generate Atom 1.0 format feed
export async function generateAtom() {
  const feed = await generateFeed()

  // Add XSLT stylesheet to Atom feed
  let atomXml = feed.atom1()
  atomXml = atomXml.replace(
    '<?xml version="1.0" encoding="utf-8"?>',
    `<?xml version="1.0" encoding="utf-8"?>\n<?xml-stylesheet href="${base}/feeds/atom-style.xsl" type="text/xsl"?>`,
  )

  return new Response(atomXml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  })
}
