// 用法：
//   pnpm judge <github-id>        評測 submissions/<github-id>/
//   pnpm judge <資料夾路徑>        評測任意資料夾（例如 examples/python）
//   pnpm judge --all              評測 submissions/ 底下全部投稿，結果寫到 out/results/
// 選項：[--out result.json] [--user <id>] [--rules rules.ts]
// --all 時 --out 是結果資料夾，另可加 [--concurrency 1]

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { judge } from './judge.ts'
import { judgeAll } from './judge-all.ts'
import { loadRules, resolveDir } from './rules.ts'

const USAGE =
  '用法：pnpm judge <github-id 或資料夾路徑> [--out result.json] [--user id]\n' +
  '      pnpm judge --all [--out out/results] [--concurrency 1]'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    all: { type: 'boolean', default: false },
    out: { type: 'string' },
    user: { type: 'string' },
    rules: { type: 'string' },
    concurrency: { type: 'string', default: '1' },
  },
})

const rules = await loadRules(values.rules)

if (values.all) {
  if (positionals.length > 0 || values.user) {
    console.error(USAGE)
    process.exit(2)
  }
  const { passed, total } = await judgeAll(rules, {
    out: values.out,
    concurrency: Number.parseInt(values.concurrency, 10) || 1,
  })
  process.exit(passed === total ? 0 : 1)
}

if (positionals.length !== 1) {
  console.error(USAGE)
  process.exit(2)
}

const result = await judge(resolveDir(positionals[0]!), rules, values.user)
const json = JSON.stringify(result, null, 2)
if (values.out) {
  fs.mkdirSync(path.dirname(path.resolve(values.out)), { recursive: true })
  fs.writeFileSync(values.out, json + '\n')
} else {
  console.log(json)
}

if (result.stdout !== null && process.stderr.isTTY) process.stderr.write(result.stdout + '\n')
process.stderr.write(
  `${result.ok ? '✅ PASS' : '❌ FAIL'} ${result.user} (${result.languageName ?? '-'})\n`,
)
for (const e of result.errors) {
  process.stderr.write(`  - [${e.code}] ${e.message}\n      ${e.messageEn}\n`)
}
process.exit(result.ok ? 0 : 1)
