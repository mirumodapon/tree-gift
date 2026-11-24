// ANSI / 終端輸出工具：驗證控制字元、計算顯示寬度、轉成 HTML。

import { eastAsianWidth } from 'get-east-asian-width'

const SGR_SOURCE = String.raw`\x1b\[[0-9;]*m`
const CSI_RE = new RegExp(String.raw`^\x1b\[([0-9;?]*)([@-~])`)
const ZERO_WIDTH_RE = /[\p{Mn}\p{Me}\p{Cf}]/u

export function stripSgr(text: string): string {
  return text.replace(new RegExp(SGR_SOURCE, 'g'), '')
}

export interface ControlScan {
  /** 第一個不允許的控制序列說明；沒有則為 null */
  bad: string | null
  /** 是否含有游標移動等動畫用的序列（有就視為動畫作品） */
  motion: boolean
}

/** 動畫允許的 CSI 結尾字元：游標移動（A–H、f）、清除（J、K）、儲存／還原游標（s、u） */
const MOTION_CSI = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'f', 'J', 'K', 's', 'u'])
/** 動畫允許的私有模式：隱藏／顯示游標（?25）、替代畫面（?1049） */
const MOTION_PRIVATE = new Set(['?25h', '?25l', '?1049h', '?1049l'])

const codePoint = (o: number) => `U+${o.toString(16).toUpperCase().padStart(4, '0')}`

/**
 * 逐一檢查輸出中的控制字元與 ANSI 序列。
 *
 * - 靜態：只允許換行與顏色（SGR，ESC[...m；allowColor 為 false 時也禁止）
 * - 動畫：另外允許 \r、\b、游標移動、清除、儲存／還原游標、隱藏游標、替代畫面
 * - 一律禁止：OSC（ESC ]，例如超連結）、DCS、終端機查詢與重設、\t、BEL 等其他控制字元
 *
 * allowMotion 為 false（rules.animation.enabled 關閉）時，動畫用的序列也視為不允許。
 */
export function scanControls(text: string, allowColor: boolean, allowMotion = true): ControlScan {
  let motion = false
  const fail = (bad: string): ControlScan => ({ bad, motion })
  const NO_MOTION = '游標移動、\\r 等動畫用的控制碼（本次規則不允許動畫）'
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    const o = ch.codePointAt(0)!
    if (ch === '\n') continue
    if (ch === '\r' || ch === '\b') {
      if (!allowMotion) return fail(NO_MOTION)
      motion = true
      continue
    }
    if (ch !== '\x1b') {
      if (o < 0x20 || o === 0x7f || (o >= 0x80 && o <= 0x9f))
        return fail(`控制字元 ${codePoint(o)}`)
      continue
    }
    const next = text[i + 1]
    if (next === '7' || next === '8') {
      // ESC 7 / ESC 8：儲存／還原游標
      if (!allowMotion) return fail(NO_MOTION)
      motion = true
      i++
      continue
    }
    if (next !== '[') {
      if (next === ']') return fail('OSC 序列（ESC ]，例如超連結或設定標題）')
      return fail(`不支援的 ESC 序列（ESC ${JSON.stringify(next ?? '')}）`)
    }
    // CSI：ESC [ 參數 結尾字元；不接受中間字元
    const m = CSI_RE.exec(text.slice(i, i + 32))
    if (!m) return fail('不完整或不支援的 CSI 序列')
    const [seq, params, final] = m as unknown as [string, string, string]
    i += seq.length - 1
    if (final === 'm' && !params.includes('?')) {
      if (!allowColor) return fail('ANSI 顏色碼（本次規則不允許顏色）')
      continue
    }
    if (params.startsWith('?')) {
      if (MOTION_PRIVATE.has(params + final)) {
        if (!allowMotion) return fail(NO_MOTION)
        motion = true
        continue
      }
      return fail(`不支援的終端機模式 ESC[${params}${final}`)
    }
    if (MOTION_CSI.has(final) && !params.includes('?')) {
      if (!allowMotion) return fail(NO_MOTION)
      motion = true
      continue
    }
    return fail(`不支援的 CSI 序列 ESC[${params}${final}`)
  }
  return { bad: null, motion }
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
