import type { ReactNode } from 'react'

const KW = new Set([
  'def', 'return', 'if', 'else', 'elif', 'for', 'while', 'in', 'and', 'or', 'not', 'import', 'from', 'class', 'True', 'False', 'None', 'print', 'range', 'len',
  'function', 'const', 'let', 'var', 'new', 'this', 'true', 'false', 'null', 'undefined', 'console', 'async', 'await', 'of',
  'public', 'static', 'void', 'int', 'String', 'boolean', 'double', 'char', 'float', 'include', 'printf', 'main', 'System',
])

export function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\/\/.*$|#(?!include).*$|"[^"]*"|'[^']*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index))
    const t = m[0]
    let cls = ''
    if (t.startsWith('//') || (t.startsWith('#') && !t.startsWith('#include'))) cls = 'com'
    else if (/^["'`]/.test(t)) cls = 'str'
    else if (/^\d/.test(t)) cls = 'num'
    else if (KW.has(t)) cls = 'kw'
    out.push(cls ? <span key={i++} className={cls}>{t}</span> : t)
    last = m.index + t.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

interface Props {
  lines: string[]
  title: string
  onPick?: (lineNo: number) => void
  marks?: Record<number, 'hint' | 'correct' | 'wrong' | 'answer'>
}

export function CodeView({ lines, title, onPick, marks = {} }: Props) {
  return (
    <div className={`code ${onPick ? 'clickable' : ''}`}>
      <div className="head">
        <i style={{ background: '#ff6b6b' }} /><i style={{ background: '#ffd23f' }} /><i style={{ background: '#7be36f' }} />
        <span style={{ marginLeft: 8 }}>{title}</span>
      </div>
      <div style={{ padding: '10px 0' }}>
        {lines.map((l, idx) => {
          const n = idx + 1
          return (
            <div key={n} className={`line ${marks[n] ?? ''}`} onClick={() => onPick?.(n)}>
              <span className="n">{n}</span>
              <pre>{highlight(l) }{l === '' ? ' ' : null}</pre>
            </div>
          )
        })}
      </div>
    </div>
  )
}
