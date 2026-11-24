// 交換！把通過 judge 的參加者配對，寫出 exchange.json 與公告內容。
// 用法：node packages/tools/src/exchange.ts --seed <公開 seed> [--results out/results]
//        [--site-url https://owner.github.io/repo] [--out-dir out]
//
// 產出：
//   exchange.json            配對結果（commit 回 repo，展示頁會讀）
//   <out-dir>/issue.md       公告 issue 內文
//   <out-dir>/mentions-N.md  @ 通知（GitHub 單則內容 @ 太多人會不發通知，所以分批留言）

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { currentEvent, REPO_ROOT, writeExchange, type JudgeResult } from '@gift/judge'
import { pair } from './pair.ts'

const MENTIONS_PER_COMMENT = 40

const { values } = parseArgs({
  options: {
    seed: { type: 'string' },
    results: { type: 'string', default: path.join(REPO_ROOT, 'out/results') },
    'site-url': { type: 'string', default: '' },
    'out-dir': { type: 'string', default: path.join(REPO_ROOT, 'out') },
  },
})
if (!values.seed) {
  console.error('請用 --seed 指定公開的 seed（例如截止時的 commit sha）')
  process.exit(2)
}

// 還在收件時交換，之後才 merge 的人就不會被配對
const event = currentEvent()
if (event.policy.acceptSubmissions) {
  console.error(`EVENT_STATE=${event.state} 仍在收件中，請先改成 ENDED 或 FATAL 再交換`)
  process.exit(1)
}

const results = fs
  .readdirSync(values.results)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(values.results, f), 'utf8')) as JudgeResult)
const passed = results.filter((r) => r.ok).map((r) => r.user)
const failed = results.filter((r) => !r.ok).map((r) => r.user)

const pairs = pair(passed, values.seed)
writeExchange({ seed: values.seed, createdAt: new Date().toISOString(), pairs })

const site = values['site-url'].replace(/\/$/, '')
const giftLink = (user: string) => (site ? `[打開禮物](${site}/gifts/${user}.html)` : '')
const rows = pairs
  .toSorted((a, b) => a.to.localeCompare(b.to))
  .map((p) => `| ${p.to} | ${p.from} | ${giftLink(p.to)} |`)

const issue = [
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
  `<sub>配對 seed：\`${values.seed}\`。洗牌後排成一個環，每人送給下一位；`,
  `可用 \`node packages/tools/src/exchange.ts --seed <seed>\` 重算驗證。</sub>`,
].join('\n')

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

console.log(`配對完成：${pairs.length} 人（未通過 ${failed.length} 人），seed=${values.seed}`)
