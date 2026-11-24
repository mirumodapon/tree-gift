// 跑 tests/cases 下所有案例（比對 expect 檔："ok" 或預期的 error code），
// 案例可另外放 min-events（動畫至少錄到幾個事件）、max-seconds（最多花幾秒）、
// final-frame-starts（最後一格畫面的開頭）做額外檢查，
// 以及 repo 根目錄 examples/ 下的各語言範例（一律預期通過）。
// 用法：pnpm test [案例名稱...]
//
// 逐一執行：fork bomb 等案例會拖慢同時在跑的其他案例，造成誤判逾時。

import fs from 'node:fs'
import path from 'node:path'
import { judge } from '../src/judge.ts'
import { loadRules, REPO_ROOT } from '../src/rules.ts'
import type { JudgeResult } from '../src/types.ts'

interface Case {
  name: string
  dir: string
  expect: string
}

const CHECK_FILES = ['expect', 'min-events', 'max-seconds', 'final-frame-starts']

function readNumber(dir: string, file: string): number | null {
  const p = path.join(dir, file)
  return fs.existsSync(p) ? Number(fs.readFileSync(p, 'utf8').trim()) : null
}

/** expect 以外的額外檢查，回傳失敗原因 */
function extraChecks(dir: string, res: JudgeResult, secs: number): string[] {
  const problems: string[] = []
  const minEvents = readNumber(dir, 'min-events')
  if (minEvents !== null) {
    // asciicast 第一行是 header，之後每行一個事件
    const events = res.animation ? res.animation.cast.trim().split('\n').length - 1 : 0
    if (events < minEvents) problems.push(`動畫只錄到 ${events} 個事件，預期至少 ${minEvents}`)
  }
  const maxSeconds = readNumber(dir, 'max-seconds')
  if (maxSeconds !== null && secs > maxSeconds) {
    problems.push(`花了 ${secs.toFixed(1)} 秒，預期不超過 ${maxSeconds}`)
  }
  const framePath = path.join(dir, 'final-frame-starts')
  if (fs.existsSync(framePath)) {
    const want = fs.readFileSync(framePath, 'utf8')
    if (!res.stdout?.startsWith(want)) {
      problems.push(
        `最後一格畫面開頭應為 ${JSON.stringify(want)}，實際為 ${JSON.stringify(res.stdout?.slice(0, 40))}`,
      )
    }
  }
  // 動畫作品的 stdout 必須是最後一格畫面（純文字），不能是原始串流
  if (res.animation && res.stdout?.includes('\x1b')) problems.push('動畫的 stdout 含有控制碼')
  return problems
}

const CASES = path.join(import.meta.dirname, 'cases')
const EXAMPLES = path.join(REPO_ROOT, 'examples')

const cases: Case[] = [
  ...fs.readdirSync(CASES).map((name) => ({
    name,
    dir: path.join(CASES, name),
    expect: fs.readFileSync(path.join(CASES, name, 'expect'), 'utf8').trim(),
  })),
  ...fs.readdirSync(EXAMPLES).map((lang) => ({
    name: `example-${lang}`,
    dir: path.join(EXAMPLES, lang),
    expect: 'ok',
  })),
]
const only = process.argv.slice(2)
const selected = cases
  .filter((c) => !only.length || only.includes(c.name))
  .toSorted((a, b) => a.name.localeCompare(b.name))

const rules = await loadRules()
let failed = 0

for (const { name, dir, expect } of selected) {
  // expect 檔不屬於投稿，複製到暫存資料夾再跑
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR ?? '/tmp'), 'case-'))
  const sub = path.join(tmp, name)
  fs.cpSync(dir, sub, {
    recursive: true,
    filter: (src) => !CHECK_FILES.some((f) => src === path.join(dir, f)),
  })
  fs.chmodSync(tmp, 0o755)
  fs.chmodSync(sub, 0o755)

  const started = Date.now()
  let res: JudgeResult
  try {
    res = await judge(sub, rules)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
  const got = res.ok ? 'ok' : res.errors.map((e) => e.code).join(',')
  const secs = (Date.now() - started) / 1000
  const problems = extraChecks(dir, res, secs)
  const pass =
    (expect === 'ok' ? res.ok : res.errors.some((e) => e.code === expect)) && !problems.length
  if (!pass) failed++
  const anim = res.animation
    ? ` 🎞 ${res.animation.duration}s${res.animation.truncated ? ' (截斷)' : ''}`
    : ''
  console.log(
    `${pass ? '✅' : '❌'} ${name.padEnd(22)} expect=${expect.padEnd(18)} got=${got}${anim} (${secs.toFixed(1)}s)`,
  )
  if (!pass) {
    for (const p of problems) console.log(`     ! ${p}`)
    for (const e of res.errors) console.log(`     [${e.code}] ${e.message} / ${e.messageEn}`)
    if (res.stderr) console.log(res.stderr.replace(/^/gm, '     | '))
  }
}

console.log(`\n${selected.length - failed}/${selected.length} passed`)
process.exit(failed ? 1 : 0)
