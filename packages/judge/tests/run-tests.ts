// 跑 tests/cases 下所有案例，比對 expect 檔（"ok" 或預期的 error code）。
// 用法：pnpm test [案例名稱...]

import fs from 'node:fs'
import path from 'node:path'
import { judge } from '../src/judge.ts'
import { loadRules } from '../src/rules.ts'
import type { JudgeResult } from '../src/types.ts'

const CASES = path.join(import.meta.dirname, 'cases')
// 逐一執行：fork bomb 等案例會拖慢同時在跑的其他案例，造成誤判逾時
const CONCURRENCY = 1

const rules = await loadRules()
const only = process.argv.slice(2)
const names = fs
  .readdirSync(CASES)
  .filter((n) => !only.length || only.includes(n))
  .toSorted()

let failed = 0
const queue = [...names]

async function worker(): Promise<void> {
  for (let name = queue.shift(); name; name = queue.shift()) {
    const dir = path.join(CASES, name)
    const expect = fs.readFileSync(path.join(dir, 'expect'), 'utf8').trim()
    // expect 檔不屬於投稿，複製到暫存資料夾再跑
    const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR ?? '/tmp'), 'case-'))
    const sub = path.join(tmp, name)
    fs.cpSync(dir, sub, { recursive: true, filter: (src) => path.basename(src) !== 'expect' })
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
    if (!pass) for (const e of res.errors) console.log(`     [${e.code}] ${e.message}`)
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))
console.log(`\n${names.length - failed}/${names.length} passed`)
process.exit(failed ? 1 : 0)
