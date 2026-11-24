// 評測 submissions/ 底下所有投稿，每人一個 <out>/<user>.json。
// 啟用白名單時略過名單外的資料夾（不評測、不產生結果），作品牆與交換都不會有它們。
// 用法：node packages/tools/src/judge-all.ts [--out out/results] [--concurrency 1]
//
// 預設逐一執行：同時跑時，惡意投稿（fork bomb 等）會拖慢其他投稿造成誤判逾時，
// 而這份結果決定誰能參加交換。逾時的投稿會再重跑一次確認。

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { isAllowed, judge, loadRules, REPO_ROOT } from '@gift/judge'

const { values } = parseArgs({
  options: {
    out: { type: 'string', default: path.join(REPO_ROOT, 'out/results') },
    concurrency: { type: 'string', default: '1' },
  },
})

const rules = await loadRules()
const subRoot = path.join(REPO_ROOT, 'submissions')
const folders = fs
  .readdirSync(subRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .toSorted()
const users = folders.filter((u) => isAllowed(rules, u))
for (const skipped of folders.filter((u) => !users.includes(u))) {
  console.log(`⏭️  ${skipped} 不在白名單內，略過`)
}

fs.rmSync(values.out, { recursive: true, force: true })
fs.mkdirSync(values.out, { recursive: true })

const queue = [...users]
let passed = 0
async function worker(): Promise<void> {
  for (let user = queue.shift(); user; user = queue.shift()) {
    let res = await judge(path.join(subRoot, user), rules, user)
    if (res.errors.some((e) => e.code === 'timeout')) {
      res = await judge(path.join(subRoot, user), rules, user)
    }
    fs.writeFileSync(path.join(values.out, `${user}.json`), JSON.stringify(res, null, 2) + '\n')
    if (res.ok) passed++
    const why = res.errors.map((e) => e.code).join(', ')
    console.log(`${res.ok ? '✅' : '❌'} ${user} ${res.languageName ?? ''} ${why}`)
  }
}

const n = Math.max(1, Number.parseInt(values.concurrency, 10) || 1)
await Promise.all(Array.from({ length: n }, worker))
console.log(`\n${passed}/${users.length} 份投稿通過`)
