// 把不可信的文字（參加者的輸出、檔名）安全地放進 Markdown。

function longestRun(text: string, ch: string): number {
  let max = 0
  let cur = 0
  for (const c of text) {
    cur = c === ch ? cur + 1 : 0
    max = Math.max(max, cur)
  }
  return max
}

/** 程式碼區塊：fence 比內容中最長的連續反引號更長，內容無法跳出區塊。 */
export function codeBlock(text: string, lang = ''): string {
  const fence = '`'.repeat(Math.max(3, longestRun(text, '`') + 1))
  return `${fence}${lang}\n${text.replace(/\n$/, '')}\n${fence}`
}

/** 行內程式碼，同樣依內容調整反引號數量。 */
export function inlineCode(text: string): string {
  const oneLine = text.replace(/[\r\n]/g, ' ')
  const ticks = '`'.repeat(longestRun(oneLine, '`') + 1)
  return `${ticks} ${oneLine} ${ticks}`
}

/**
 * 一般文字：跳脫 Markdown/HTML 符號並壓成一行（可放進表格）。
 * 在 @ 後面插入零寬空格，避免檔名之類的內容 tag 到其他人。
 */
export function plain(text: string): string {
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\\`*_[\]<>|#!~]/g, (c) => `\\${c}`)
    .replaceAll('@', '@\u200b')
}

/** 截斷過長的文字，保留前 maxLines 行與 maxChars 字元。 */
export function truncate(text: string, maxLines: number, maxChars: number): string {
  let lines = text.split('\n')
  let cut = false
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
    cut = true
  }
  let out = lines.join('\n')
  if (out.length > maxChars) {
    out = out.slice(0, maxChars)
    cut = true
  }
  return cut ? `${out}\n…（已截斷）` : out
}
