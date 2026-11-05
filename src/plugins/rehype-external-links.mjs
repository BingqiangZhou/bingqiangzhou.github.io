import { visit } from 'unist-util-visit'

/**
 * Open external links in a new tab with outbound tracking, but leave links
 * pointing at this site's own origin alone (same-site links should not open
 * new tabs or pollute outbound analytics).
 */
export function rehypeExternalLinks(options = {}) {
  const siteOrigin = options.site
    ? new URL(options.site).origin
    : null

  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a' || !node.properties?.href)
        return
      const href = node.properties.href
      if (!/^(?:https?:|\/\/)/.test(href))
        return
      if (siteOrigin) {
        try {
          if (new URL(href, siteOrigin).origin === siteOrigin)
            return
        }
        catch {
          // Unparseable href — treat as external (previous behavior)
        }
      }
      node.properties.target = '_blank'
      node.properties.rel = ['noopener', 'noreferrer']

      // Add Umami outbound link tracking
      node.properties.dataUmamiEvent = 'outbound-link-click'
      node.properties.dataUmamiEventUrl = href
    })
  }
}
