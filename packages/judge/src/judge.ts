import fs from 'node:fs'
import path from 'node:path'
import * as ansi from './ansi.ts'
import { Sandbox, STDERR_CAP } from './sandbox.ts'
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

function checkOutput(raw: Buffer, rules: Rules, res: JudgeResult, fail: Fail): void {
  const o = rules.output
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(raw)
  } catch {
    fail('invalid_utf8', '輸出不是合法的 UTF-8')
    return
  }
  res.stdout = text

  const bad = ansi.findBadControl(text, o.allowColor)
  if (bad) fail('bad_control', `輸出含有不允許的內容：${bad}`)

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
    fail('no_folder', `找不到資料夾 ${dir}`)
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
    box = new Sandbox(lang.image, dir, sb)
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
    }

    const runTimeout = lang.runTimeout ?? sb.runTimeout
    const cap = rules.output.maxBytes
    const runs = rules.output.deterministic ? 2 : 1
    let first: Buffer | null = null
    for (let i = 0; i < runs; i++) {
      const r = await box.exec(lang.run, runTimeout, cap)
      res.stderr = r.stderr.toString('utf8')
      res.stats.bytes = r.stdout.length
      res.stats.timeMs = Math.max(r.ms, res.stats.timeMs ?? 0)
      if (r.status === 'timeout') {
        fail('timeout', `執行超過 ${runTimeout} 秒`)
        break
      }
      if (r.status === 'overflow') {
        fail('output_too_large', `輸出超過 ${cap} bytes`)
        break
      }
      if (r.code !== 0) {
        // 137 = SIGKILL，通常是記憶體爆掉
        const hint = r.code === 137 ? '（可能超過記憶體限制）' : ''
        fail('nonzero_exit', `結束代碼 ${r.code}${hint}`)
        break
      }
      if (first === null) {
        first = r.stdout
        checkOutput(r.stdout, rules, res, fail)
        if (res.errors.length) break
      } else if (!r.stdout.equals(first)) {
        fail('nondeterministic', '兩次執行的輸出不同（本次規則要求每次輸出一致）')
      }
    }
  } finally {
    box.close()
  }
  return finish()
}
