// 用 headless 終端機重播動畫，取出最後一格畫面與預覽時間點。

import xterm from '@xterm/headless'

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
}

function snapshot(term: xterm.Terminal): { text: string; ink: number } {
  const buf = term.buffer.active
  const lines: string[] = []
  for (let y = 0; y < term.rows; y++) {
    lines.push(buf.getLine(buf.viewportY + y)?.translateToString(true) ?? '')
  }
  while (lines.length && !lines.at(-1)!.trim()) lines.pop()
  const text = lines.join('\n')
  return { text, ink: text.replace(/\s/g, '').length }
}

const write = (term: xterm.Terminal, data: string) =>
  new Promise<void>((resolve) => term.write(data, resolve))

export async function replay(events: CastEvent[], cols: number, rows: number): Promise<Replay> {
  const term = new xterm.Terminal({ cols, rows, allowProposedApi: true, scrollback: 0 })
  let best = { time: 0, ink: 0 }
  let last = { text: '', ink: 0 }
  for (const e of events) {
    await write(term, e.data)
    last = snapshot(term)
    if (last.ink > best.ink) best = { time: e.time, ink: last.ink }
  }
  term.dispose()
  const end = events.at(-1)?.time ?? 0
  return {
    finalFrame: last.text,
    posterTime: last.ink ? end : best.time,
    hasInk: best.ink > 0,
  }
}

/** 組成 asciicast v2：第一行是 header，之後每行一個 [秒數, "o", 輸出] */
export function toAsciicast(events: CastEvent[], cols: number, rows: number): string {
  const header = JSON.stringify({ version: 2, width: cols, height: rows })
  return [header, ...events.map((e) => JSON.stringify([e.time, 'o', e.data]))].join('\n') + '\n'
}
