// 用 headless 終端機重播動畫，取出最後一格畫面、預覽時間點與可安全裁切的顯示範圍。

import xterm from '@xterm/headless'
import { displayWidth } from './ansi.ts'

export interface CastEvent {
  /** 距離開始的秒數 */
  time: number
  data: string
}

export interface Replay {
  /** 最後一格畫面（純文字，已去掉行尾空白與結尾空行） */
  finalFrame: string
  /** 預覽用的時間點：最後一格；若最後一格是空的，取內容最多的一格 */
  posterTime: number
  /** 是否曾出現任何可見字元 */
  hasInk: boolean
  /** 播放時可用的終端機大小：裁切到實際用到的範圍，且逐格驗證畫面與完整大小相同 */
  viewCols: number
  viewRows: number
}

const newTerm = (cols: number, rows: number) =>
  new xterm.Terminal({ cols, rows, allowProposedApi: true, scrollback: 0 })

const write = (term: xterm.Terminal, data: string) =>
  new Promise<void>((resolve) => term.write(data, resolve))

/** 畫面左上角 cols × rows 範圍內的文字（每行去掉行尾空白） */
function frame(term: xterm.Terminal, cols: number, rows: number): string[] {
  const buf = term.buffer.active
  const lines: string[] = []
  for (let y = 0; y < rows; y++) {
    lines.push(buf.getLine(buf.viewportY + y)?.translateToString(true, 0, cols) ?? '')
  }
  return lines
}

function trimEnd(lines: string[]): string[] {
  const out = [...lines]
  while (out.length && !out.at(-1)!.trim()) out.pop()
  return out
}

/** 用 cols × rows 的終端機重播，每一格都和完整大小的終端機左上角比對 */
async function sameWhenCropped(
  events: CastEvent[],
  full: { cols: number; rows: number },
  cols: number,
  rows: number,
): Promise<boolean> {
  const a = newTerm(full.cols, full.rows)
  const b = newTerm(cols, rows)
  try {
    for (const e of events) {
      await Promise.all([write(a, e.data), write(b, e.data)])
      if (frame(a, cols, rows).join('\n') !== frame(b, cols, rows).join('\n')) return false
    }
    return true
  } finally {
    a.dispose()
    b.dispose()
  }
}

export async function replay(events: CastEvent[], cols: number, rows: number): Promise<Replay> {
  const term = newTerm(cols, rows)
  let best = { time: 0, ink: 0 }
  let last: string[] = []
  let usedCols = 0
  let usedRows = 0
  for (const e of events) {
    await write(term, e.data)
    last = trimEnd(frame(term, cols, rows))
    const ink = last.join('').replace(/\s/g, '').length
    if (ink > best.ink) best = { time: e.time, ink }
    usedCols = Math.max(usedCols, ...last.map(displayWidth))
    usedRows = Math.max(usedRows, last.length)
  }
  term.dispose()

  // 裁切到實際用到的範圍（例如結尾換行可能需要多一列），驗證不會改變畫面；都不行就用完整大小
  let view = { cols, rows }
  const candidates = [
    { cols: usedCols, rows: usedRows },
    { cols: usedCols, rows: usedRows + 1 },
  ].filter((c) => c.cols > 0 && c.rows > 0 && c.cols <= cols && c.rows <= rows)
  for (const c of candidates) {
    if (await sameWhenCropped(events, { cols, rows }, c.cols, c.rows)) {
      view = c
      break
    }
  }

  const end = events.at(-1)?.time ?? 0
  const finalInk = last.join('').replace(/\s/g, '').length
  return {
    finalFrame: last.join('\n'),
    posterTime: finalInk ? end : best.time,
    hasInk: best.ink > 0,
    viewCols: view.cols,
    viewRows: view.rows,
  }
}

/** 組成 asciicast v2：第一行是 header，之後每行一個 [秒數, "o", 輸出] */
export function toAsciicast(events: CastEvent[], cols: number, rows: number): string {
  const header = JSON.stringify({ version: 2, width: cols, height: rows })
  return [header, ...events.map((e) => JSON.stringify([e.time, 'o', e.data]))].join('\n') + '\n'
}
