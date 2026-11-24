// 用法：
//   pnpm judge submissions/<github-id> [--out result.json] [--user <id>] [--rules rules.ts]

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { judge } from './judge.ts'
import { loadRules } from './rules.ts'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string' },
    user: { type: 'string' },
    rules: { type: 'string' },
  },
})
if (positionals.length !== 1) {
  console.error('用法：pnpm judge <submission_dir> [--out result.json] [--user id]')
  process.exit(2)
}

const rules = await loadRules(values.rules)
const result = await judge(positionals[0]!, rules, values.user)
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
for (const e of result.errors) process.stderr.write(`  - [${e.code}] ${e.message}\n`)
process.exit(result.ok ? 0 : 1)
