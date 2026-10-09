import { base } from '@/config'

// Determine if the path matches a specific page type
function matchPageType(path: string, prefix: string = '') {
  // Remove base path if configured
  const pathWithoutBase = base && path.startsWith(base)
    ? path.slice(base.length)
    : path

  // Remove leading and trailing slashes from the path
  const normalizedPath = pathWithoutBase.replace(/^\/|\/$/g, '')

  // Homepage check: matches root path ('')
  if (prefix === '') {
    return normalizedPath === ''
  }

  // Ensure strict segment boundary matching to prevent partial matches
  const startsWithSegment = (target: string, segment: string) =>
    target === segment || target.startsWith(`${segment}/`)

  return startsWithSegment(normalizedPath, prefix)
}

export function isHomePage(path: string) {
  return matchPageType(path)
}

export function isPostPage(path: string) {
  return matchPageType(path, 'posts')
}

export function isTagPage(path: string) {
  return matchPageType(path, 'tags')
}

export function isAboutPage(path: string) {
  return matchPageType(path, 'about')
}

export function isSearchPage(path: string) {
  return matchPageType(path, 'search')
}

// Prefix a site-root path (e.g. '/rss.xml') with the configured base
export function withBase(path: string): string {
  return base ? `${base}${path}` : path
}

// Returns page context with page types
export function getPageInfo(path: string) {
  return {
    isHome: isHomePage(path),
    isPost: isPostPage(path),
    isTag: isTagPage(path),
    isAbout: isAboutPage(path),
    isSearch: isSearchPage(path),
  }
}
