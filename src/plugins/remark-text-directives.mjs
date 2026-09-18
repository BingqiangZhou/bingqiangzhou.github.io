import { visit } from 'unist-util-visit'

// Serialize a directive label (the `[...]` part) back to plain text.
function serializeLabel(children) {
  if (!children?.length)
    return ''
  const text = children
    .map(child => (child.type === 'text' ? child.value : serializeLabel(child.children)))
    .join('')
  return `[${text}]`
}

function serializeAttrs(attributes) {
  const pairs = Object.entries(attributes || {}).map(([key, value]) =>
    value == null ? key : `${key}="${value}"`,
  )
  return pairs.length ? `{${pairs.join(' ')}}` : ''
}

// remark-directive parses any prose `:name` followed by whitespace (e.g. the
// "14:50 " inside a timestamp) as a text directive. No plugin here consumes
// text directives, so mdast-util-to-hast renders them as empty <div> and the
// text silently disappears. Render them back as literal text instead.
export function remarkTextDirectives() {
  return (tree) => {
    visit(tree, 'textDirective', (node) => {
      const literal = `:${node.name}${serializeLabel(node.children)}${serializeAttrs(node.attributes)}`
      Object.assign(node, { type: 'text', value: literal })
      delete node.name
      delete node.attributes
      delete node.children
      delete node.data
    })
  }
}
