import type { ReactNode } from 'react'

// Parses **bold** and *italic* into React nodes.
// Constructs JSX elements directly — never uses innerHTML or dangerouslySetInnerHTML.
// React escapes all text content automatically, so AI output containing
// <script>, HTML tags, or other injections renders as literal text.
function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Match **bold** first, then *italic* (order matters to avoid * consuming **)
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/gs
  let last = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    if (match[1] !== undefined) {
      nodes.push(<strong key={match.index}>{match[1]}</strong>)
    } else {
      nodes.push(<em key={match.index}>{match[2]}</em>)
    }
    last = match.index + match[0].length
  }

  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

// Inline — use inside an existing block element (p, li, span, etc.)
export function md(text: string): ReactNode[] {
  return parseInline(text)
}

// Block — splits on double newlines, wraps each paragraph in <p>
export function mdBlock(text: string): ReactNode {
  const paras = text.split(/\n\n+/).filter(Boolean)
  if (paras.length <= 1) {
    return parseInline(text)
  }
  return paras.map((para, i) => (
    <p key={i}>{parseInline(para)}</p>
  ))
}
