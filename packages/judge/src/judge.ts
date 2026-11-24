import fs from 'node:fs'
import path from 'node:path'
import * as ansi from './ansi.ts'
import { Sandbox, STDERR_CAP, type ExecResult } from './sandbox.ts'
import { replay, toAsciicast, type CastEvent } from './terminal.ts'
import type { ErrorCode, JudgeResult, Rules } from './types.ts'

export const LOGIN_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/
type Fail = (code: ErrorCode, message: string) => void

/**
 * 投稿格式：submissions/<user>/tree.<ext> 為進入點，其他檔案（模組、標頭檔、資料）放在同一層。
 * 回傳進入點檔名，格式不符時回傳 null。
 */
function findEntry(dir: string, rules: Rules, fail: Fail): string | null {
  const entries: string[] = []
  const bad: string[] = []
  let files = 0
  let bytes = 0
  for (const name of fs.readdirSync(dir).toSorted()) {
    const st = fs.lstatSync(path.join(dir, name))
    if (!st.isFile()) {
      bad.push(name)
      continue
    }
    files++
    bytes += st.size
    const m = /^tree\.([a-z]+)$/.exec(name)
    if (m && Object.hasOwn(rules.languages, m[1]!)) entries.push(name)
  }
  const { maxFiles, maxTotalBytes } = rules.sandbox
  if (bad.length) fail('unexpected_file', `只能放一般檔案，不能有子資料夾或連結：${bad.join(', ')}`)
  if (files > maxFiles) fail('too_many_files', `共 ${files} 個檔案，上限 ${maxFiles}`)
  if (bytes > maxTotalBytes) fail('too_large', `檔案總大小 ${bytes} bytes，上限 ${maxTotalBytes}`)
  if (!entries.length) {
    const names = Object.keys(rules.languages).map((e) => `tree.${e}`)
    fail('no_entry', `找不到進入點，檔名須為其中之一：${names.join(', ')}`)
    return null
  }
  if (entries.length > 1) {
    fail('multiple_entries', `只能有一個進入點，發現：${entries.join(', ')}`)
    return null
  }
  return entries[0]!
}

/**
 * 把收到的片段轉成動畫事件；用串流解碼，避免多位元組字元被切在兩個片段之間。
 * 錄製時關掉了 pty 的 onlcr（\n 不轉 \r\n，靜態作品才不會被當成動畫），
 * 這裡補回轉換，終端模擬器重播時 \n 才會回到行首。
 */
function toEvents(run: ExecResult): CastEvent[] {
  const decoder = new TextDecoder('utf-8')
  const events: CastEvent[] = []
  for (const c of run.chunks) {
    const data = decoder.decode(c.data, { stream: true }).replaceAll('\n', '\r\n')
    if (!data) continue
    const time = Math.round(c.ms) / 1000
    const last = events.at(-1)
    // 同一毫秒內的片段合併成一個事件
    if (last && last.time === time) last.data += data
    else events.push({ time, data })
  }
  return events
}

async function checkOutput(run: ExecResult, rules: Rules, res: JudgeResult, fail: Fail) {
  const o = rules.output
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(run.stdout)
  } catch {
    fail('invalid_utf8', '輸出不是合法的 UTF-8')
    return
  }

  const scan = ansi.scanControls(text, o.allowColor, rules.animation.enabled)
  if (scan.bad) {
    fail('bad_control', `輸出含有不允許的內容：${scan.bad}`)
    return
  }

  if (scan.motion) {
    // 動畫：在 maxCols × maxRows 的虛擬終端機重播，stdout 存最後一格畫面
    const events = toEvents(run)
    const { finalFrame, posterTime, hasInk, viewCols, viewRows } = await replay(
      events,
      o.maxCols,
      o.maxRows,
    )
    if (!hasInk) {
      fail('empty_output', '動畫裡沒有出現任何東西')
      return
    }
    res.stdout = finalFrame
    res.animation = {
      // header 用驗證過的裁切大小，播放器照它模擬即可
      cast: toAsciicast(events, viewCols, viewRows),
      duration: events.at(-1)?.time ?? 0,
      truncated: run.status === 'truncated',
      posterTime,
    }
    res.stats.cols = viewCols
    res.stats.rows = viewRows
    return
  }

  // 靜態
  res.stdout = text
  if (run.stdout.length > o.maxBytes) {
    fail('output_too_large', `輸出超過 ${o.maxBytes} bytes`)
    return
  }
  const lines = ansi.visibleLines(text)
  if (!lines.some((l) => ansi.stripSgr(l).trim())) {
    fail('empty_output', '沒有輸出任何東西')
    return
  }
  const widths = lines.map(ansi.displayWidth)
  const cols = Math.max(...widths)
  res.stats.cols = cols
  res.stats.rows = lines.length
  if (cols > o.maxCols) {
    const at = widths.indexOf(cols) + 1
    fail('too_wide', `最寬一行（第 ${at} 行）寬度 ${cols}，上限 ${o.maxCols}`)
  }
  if (lines.length > o.maxRows) fail('too_tall', `共 ${lines.length} 行，上限 ${o.maxRows}`)
}

/** 兩次執行是否一致；被截斷的動畫只比對共同的前段 */
function sameOutput(a: ExecResult, b: ExecResult): boolean {
  if (a.status !== 'truncated' && b.status !== 'truncated') return a.stdout.equals(b.stdout)
  const n = Math.min(a.stdout.length, b.stdout.length)
  return a.stdout.subarray(0, n).equals(b.stdout.subarray(0, n))
}

/** 在沙箱中執行 dir 裡的投稿並檢查輸出。user 預設為資料夾名稱。 */
export async function judge(
  dir: string,
  rules: Rules,
  user = path.basename(path.resolve(dir)),
): Promise<JudgeResult> {
  const res: JudgeResult = {
    user,
    ok: false,
    language: null,
    languageName: null,
    errors: [],
    stdout: null,
    stderr: '',
    stats: {},
  }
  const fail: Fail = (code, message) => res.errors.push({ code, message })
  const finish = () => {
    res.ok = res.errors.length === 0
    return res
  }

  if (!LOGIN_RE.test(user)) {
    fail('bad_folder', `資料夾名稱 ${JSON.stringify(user)} 不是合法的 GitHub ID`)
    return finish()
  }
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    fail('no_folder', `找不到資料夾 submissions/${user}/`)
    return finish()
  }

  const src = findEntry(dir, rules, fail)
  if (!src || res.errors.length) return finish()

  const ext = path.extname(src).slice(1)
  const lang = rules.languages[ext]!
  const sb = rules.sandbox
  res.language = ext
  res.languageName = lang.name

  let box: Sandbox
  try {
    box = new Sandbox(lang.image, dir, sb, lang.compile ? sb.compileMemory : sb.memory)
  } catch (e) {
    fail('internal_error', `無法啟動沙箱：${(e as Error).message}`)
    return finish()
  }
  try {
    if (lang.compile) {
      const r = await box.exec(lang.compile, sb.compileTimeout, STDERR_CAP)
      if (r.status === 'timeout') {
        fail('compile_timeout', `編譯超過 ${sb.compileTimeout} 秒`)
        return finish()
      }
      if (r.code !== 0) {
        res.stderr = Buffer.concat([r.stdout, r.stderr]).toString('utf8').slice(-STDERR_CAP)
        fail('compile_error', '編譯失敗')
        return finish()
      }
      try {
        box.limitMemory(sb.memory)
      } catch (e) {
        fail('internal_error', (e as Error).message)
        return finish()
      }
    }

    const runTimeout = lang.runTimeout ?? sb.runTimeout
    const anim = rules.animation
    const runs = rules.output.deterministic ? 2 : 1
    let first: ExecResult | null = null
    for (let i = 0; i < runs; i++) {
      // 在 pty 中執行；允許動畫時，到執行逾時若已出現游標移動，延長到 animation.maxSeconds
      const cap = anim.enabled ? anim.maxBytes : rules.output.maxBytes
      const r = await box.exec(lang.run, runTimeout, cap, {
        tty: { cols: rules.output.maxCols, rows: rules.output.maxRows },
        extend: anim.enabled
          ? {
              toSec: anim.maxSeconds,
              when: (out) => ansi.scanControls(out.toString('utf8'), true).motion,
            }
          : undefined,
      })
      if (r.status !== 'timeout' && r.status !== 'overflow') res.stderr = box.readStderr()
      res.stats.bytes = r.stdout.length
      res.stats.timeMs = Math.max(r.ms, res.stats.timeMs ?? 0)
      if (r.status === 'timeout') {
        fail('timeout', `執行超過 ${runTimeout} 秒`)
        break
      }
      if (r.status === 'overflow') {
        const hint = anim.enabled ? '（動畫請在畫面之間加上延遲）' : ''
        fail('output_too_large', `輸出超過 ${cap} bytes${hint}`)
        break
      }
      if (r.status !== 'truncated' && r.code !== 0) {
        // 137 = SIGKILL，通常是記憶體爆掉
        const hint = r.code === 137 ? '（可能超過記憶體限制）' : ''
        fail('nonzero_exit', `結束代碼 ${r.code}${hint}`)
        break
      }
      if (first === null) {
        first = r
        await checkOutput(r, rules, res, fail)
        if (res.errors.length) break
      } else if (!sameOutput(first, r)) {
        fail('nondeterministic', '兩次執行的輸出不同（本次規則要求每次輸出一致）')
      }
    }
  } finally {
    box.close()
  }
  return finish()
}
