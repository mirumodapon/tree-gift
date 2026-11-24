// 跑 tests/cases 下所有案例（比對 expect 檔："ok" 或預期的 error code），
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
  fs.cpSync(dir, sub, { recursive: true, filter: (src) => src !== path.join(dir, 'expect') })
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
  const pass = expect === 'ok' ? res.ok : res.errors.some((e) => e.code === expect)
  if (!pass) failed++
  const secs = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `${pass ? '✅' : '❌'} ${name.padEnd(20)} expect=${expect.padEnd(18)} got=${got} (${secs}s)`,
  )
  if (!pass) {
    for (const e of res.errors) console.log(`     [${e.code}] ${e.message}`)
    if (res.stderr) console.log(res.stderr.replace(/^/gm, '     | '))
  }
}

console.log(`\n${selected.length - failed}/${selected.length} passed`)
process.exit(failed ? 1 : 0)
