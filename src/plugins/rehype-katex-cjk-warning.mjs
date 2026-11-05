import { visit } from 'unist-util-visit'

/**
 * Warn at build time when KaTeX math source contains CJK characters outside
 * \text-like commands — almost always two bare `$` currency amounts pairing
 * a chunk of Chinese prose into accidental math (prices vanish, prose turns
 * into italic glyphs). rehype-katex renders the original TeX into the MathML
 * `<annotation encoding="application/x-tex">` element, which this inspects.
 */
// CJK ideograph blocks: Ext-A U+3400..U+4DBF, Unified U+4E00..U+9FFF,
// Compat Ideographs U+F900..U+FAFF
const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u
const TEXT_LIKE = /\\(?:text|mathrm|textrm|textbf|textit|textsf|texttt|mbox|operatorname)\{([^{}]*)\}/g

function nodeText(node) {
  if (node.type === 'text')
    return node.value
  return (node.children ?? []).map(nodeText).join('')
}

export function rehypeKatexCjkWarning() {
  return (tree, file) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'annotation' || node.properties?.encoding !== 'application/x-tex')
        return
      const tex = nodeText(node)
      // CJK inside \text{...}-like groups is intentional; anything else is suspect.
      const outsideTextLike = tex.replace(TEXT_LIKE, '')
      if (CJK.test(outsideTextLike)) {
        const src = file?.path ?? file?.history?.[0] ?? '<unknown>'
        console.warn(
          `[katex-cjk] Possible accidental $ pairing swallowed CJK prose into math\n  file: ${src}\n  tex : ${tex.slice(0, 120)}`,
        )
      }
    })
  }
}
