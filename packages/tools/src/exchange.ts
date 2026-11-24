// 交換！把通過 judge 的參加者配對，寫出 exchange.json 與公告內容。
// 用法：node packages/tools/src/exchange.ts [--seed <公開 seed>] [--fallback-seed <sha>]
//        [--results out/results] [--site-url https://owner.github.io/repo] [--out-dir out]
//
// seed：
//   EVENT_STATE 為 TIME / TIME_SYNC → 固定用截止前 main 上最後一個 commit 的 sha（見 seed.ts），不能另外指定
//   其他模式                        → --seed，沒有就用 --fallback-seed（workflow 傳入目前的 commit sha）
//
// 產出：
//   exchange.json            配對結果（commit 回 repo，展示頁會讀）
//   <out-dir>/issue.md       公告 issue 內文
//   <out-dir>/mentions-N.md  @ 通知（GitHub 單則內容 @ 太多人會不發通知，所以分批留言）

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { currentEvent, loadRules, REPO_ROOT, writeExchange, type JudgeResult } from '@gift/judge'
import { pair } from './pair.ts'
import { deadlineSeed, deadlineSeedCommand } from './seed.ts'

const MENTIONS_PER_COMMENT = 40

const { values } = parseArgs({
  options: {
    seed: { type: 'string' },
    'fallback-seed': { type: 'string' },
    results: { type: 'string', default: path.join(REPO_ROOT, 'out/results') },
    'site-url': { type: 'string', default: '' },
    'out-dir': { type: 'string', default: path.join(REPO_ROOT, 'out') },
  },
})
// 還在收件時交換，之後才 merge 的人就不會被配對
const event = currentEvent((await loadRules()).schedule)
if (event.policy.acceptSubmissions) {
  const hint = event.timed
    ? `，${event.schedule!.end} 截止後才能交換`
    : '，請先改成 ENDED 或 FATAL 再交換'
  console.error(`EVENT_STATE=${event.mode} 仍在收件中${hint}`)
  process.exit(1)
}

let seed: string
if (event.timed) {
  seed = deadlineSeed(event.schedule!.end, REPO_ROOT)
  if (values.seed && values.seed !== seed) {
    console.error(
      `EVENT_STATE=${event.mode} 的 seed 固定為截止前最後一個 commit（${seed}），不能另外指定`,
    )
    process.exit(2)
  }
} else if (values.seed || values['fallback-seed']) {
  seed = (values.seed || values['fallback-seed'])!
} else {
  console.error('請用 --seed 指定公開的 seed')
  process.exit(2)
}

const results = fs
  .readdirSync(values.results)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(values.results, f), 'utf8')) as JudgeResult)
const passed = results.filter((r) => r.ok).map((r) => r.user)
const failed = results.filter((r) => !r.ok).map((r) => r.user)

// 不到兩人無法交換：仍寫出 exchange.json（沒有配對），自動交換才不會每次排程都重試
const pairs = passed.length >= 2 ? pair(passed, seed) : []
writeExchange({ seed, createdAt: new Date().toISOString(), pairs })

const site = values['site-url'].replace(/\/$/, '')
const giftLink = (user: string) => (site ? `[打開禮物](${site}/gifts/${user}.html)` : '')
const rows = pairs
  .toSorted((a, b) => a.to.localeCompare(b.to))
  .map((p) => `| ${p.to} | ${p.from} | ${giftLink(p.to)} |`)

const seedNote = event.timed
  ? [
      `<sub>配對 seed：\`${seed}\`，也就是截止時間 ${event.schedule!.end} 前 main 上最後一個 commit。`,
      `可用 \`${deadlineSeedCommand(event.schedule!.end)}\` 確認 seed，再用 \`node packages/tools/src/exchange.ts --seed <seed>\` 重算驗證。</sub>`,
    ]
  : [
      `<sub>配對 seed：\`${seed}\`。洗牌後排成一個環，每人送給下一位；`,
      `可用 \`node packages/tools/src/exchange.ts --seed <seed>\` 重算驗證。</sub>`,
    ]

const issue = (
  pairs.length
    ? [
        `共有 **${pairs.length}** 份聖誕樹完成交換 🎁`,
        '',
        site ? `🎄 展示頁：${site}` : '',
        '',
        '| 收到的人 | 來自 | |',
        '| --- | --- | --- |',
        ...rows,
        '',
        failed.length ? `有 ${failed.length} 份投稿未通過 judge，這次沒有參加交換。` : '',
        '',
        ...seedNote,
      ]
    : [`通過評測的投稿只有 ${passed.length} 份，不到兩人，這次無法交換。`]
).join('\n')

const outDir = values['out-dir']
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'issue.md'), issue + '\n')
for (const old of fs.readdirSync(outDir).filter((f) => /^mentions-\d+\.md$/.test(f))) {
  fs.rmSync(path.join(outDir, old))
}
const receivers = pairs.map((p) => p.to).toSorted()
for (let i = 0; i < receivers.length; i += MENTIONS_PER_COMMENT) {
  const chunk = receivers.slice(i, i + MENTIONS_PER_COMMENT)
  const body = `🎅 禮物送到囉！${chunk.map((u) => `@${u}`).join(' ')}`
  fs.writeFileSync(path.join(outDir, `mentions-${i / MENTIONS_PER_COMMENT + 1}.md`), body + '\n')
}

console.log(`配對完成：${pairs.length} 人（未通過 ${failed.length} 人），seed=${seed}`)
