// ANSI / 終端輸出工具：驗證控制字元、計算顯示寬度、轉成 HTML。

import { eastAsianWidth } from 'get-east-asian-width'

const SGR_SOURCE = String.raw`\x1b\[[0-9;]*m`
const ZERO_WIDTH_RE = /[\p{Mn}\p{Me}\p{Cf}]/u

export function stripSgr(text: string): string {
  return text.replace(new RegExp(SGR_SOURCE, 'g'), '')
}

/**
 * 回傳第一個不允許的控制字元說明，沒有則回傳 null。
 * 只允許換行；顏色開啟時另外允許 SGR（ESC[...m）。
 * 游標移動、清畫面、\r、\t 等都會破壞展示頁，一律禁止。
 */
export function findBadControl(text: string, allowColor: boolean): string | null {
  if (!allowColor && new RegExp(SGR_SOURCE).test(text)) {
    return 'ANSI 顏色碼（本次規則不允許顏色）'
  }
  for (const ch of stripSgr(text)) {
    const o = ch.codePointAt(0)!
    if (ch === '\n') continue
    if (o < 0x20 || o === 0x7f || (o >= 0x80 && o <= 0x9f)) {
      if (ch === '\x1b') return '非顏色的 ANSI 控制序列（例如游標移動、清畫面）'
      return `控制字元 U+${o.toString(16).toUpperCase().padStart(4, '0')}`
    }
  }
  return null
}

export function charWidth(ch: string): number {
  if (ZERO_WIDTH_RE.test(ch)) return 0
  return eastAsianWidth(ch.codePointAt(0)!)
}

export function displayWidth(line: string): number {
  let w = 0
  for (const ch of stripSgr(line)) w += charWidth(ch)
  return w
}

/** 去掉尾端空白行後的行列表。 */
export function visibleLines(text: string): string[] {
  const lines = text.split('\n')
  while (lines.length && !stripSgr(lines.at(-1)!).trim()) lines.pop()
  return lines
}

// ---- ANSI -> HTML ----

const BASE16 = [
  '#000000',
  '#cd3131',
  '#0dbc79',
  '#e5e510',
  '#2472c8',
  '#bc3fbc',
  '#11a8cd',
  '#e5e5e5',
  '#666666',
  '#f14c4c',
  '#23d18b',
  '#f5f543',
  '#3b8eea',
  '#d670d6',
  '#29b8db',
  '#ffffff',
] as const

interface SgrState {
  fg?: string
  bg?: string
  bold?: boolean
  dim?: boolean
  italic?: boolean
  underline?: boolean
}

const hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')

function color256(n: number): string {
  if (n < 16) return BASE16[n]!
  if (n < 232) {
    const i = n - 16
    const steps = [0, 95, 135, 175, 215, 255]
    return hex(steps[Math.floor(i / 36)]!, steps[Math.floor(i / 6) % 6]!, steps[i % 6]!)
  }
  const v = 8 + (n - 232) * 10
  return hex(v, v, v)
}

function applySgr(params: string, st: SgrState): void {
  const codes = params ? params.split(';').map((p) => (p ? Number.parseInt(p, 10) : 0)) : [0]
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i]!
    if (c === 0) for (const k of Object.keys(st)) delete st[k as keyof SgrState]
    else if (c === 1) st.bold = true
    else if (c === 2) st.dim = true
    else if (c === 3) st.italic = true
    else if (c === 4) st.underline = true
    else if (c === 22) {
      delete st.bold
      delete st.dim
    } else if (c === 23) delete st.italic
    else if (c === 24) delete st.underline
    else if (c >= 30 && c <= 37) st.fg = BASE16[c - 30]
    else if (c >= 90 && c <= 97) st.fg = BASE16[c - 90 + 8]
    else if (c >= 40 && c <= 47) st.bg = BASE16[c - 40]
    else if (c >= 100 && c <= 107) st.bg = BASE16[c - 100 + 8]
    else if (c === 39) delete st.fg
    else if (c === 49) delete st.bg
    else if (c === 38 || c === 48) {
      const key = c === 38 ? 'fg' : 'bg'
      if (codes[i + 1] === 5 && i + 2 < codes.length) {
        st[key] = color256(codes[i + 2]! % 256)
        i += 2
      } else if (codes[i + 1] === 2 && i + 4 < codes.length) {
        const [r, g, b] = codes.slice(i + 2, i + 5).map((v) => Math.min(v, 255))
        st[key] = hex(r!, g!, b!)
        i += 4
      }
    }
  }
}

function style(st: SgrState): string {
  const parts: string[] = []
  if (st.fg) parts.push(`color:${st.fg}`)
  if (st.bg) parts.push(`background:${st.bg}`)
  if (st.bold) parts.push('font-weight:bold')
  if (st.dim) parts.push('opacity:.6')
  if (st.italic) parts.push('font-style:italic')
  if (st.underline) parts.push('text-decoration:underline')
  return parts.join(';')
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]!)
}

/** 把只含 SGR 的輸出轉成 HTML 片段（放進 <pre> 用）。 */
export function toHtml(text: string): string {
  const out: string[] = []
  const st: SgrState = {}
  let pos = 0
  const emit = (chunk: string) => {
    if (!chunk) return
    const s = style(st)
    out.push(s ? `<span style="${s}">${escapeHtml(chunk)}</span>` : escapeHtml(chunk))
  }
  for (const m of text.matchAll(new RegExp(SGR_SOURCE, 'g'))) {
    emit(text.slice(pos, m.index))
    applySgr(m[0].slice(2, -1), st)
    pos = m.index + m[0].length
  }
  emit(text.slice(pos))
  return out.join('')
}
