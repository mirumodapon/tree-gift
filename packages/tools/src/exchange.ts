// 交換！把通過 judge 的參加者配對，寫出 exchange.json 與公告內容。
// 用法：node packages/tools/src/exchange.ts [--seed <公開 seed>] [--fallback-seed <sha>]
//        [--results out/results] [--site-url https://owner.github.io/repo] [--out-dir out]
//
// seed（依序）：
//   已經交換過（有 exchange 或 exchange-<seed> tag）→ 沿用 tag 上的 seed，不能另外指定（見 seed.ts）
//   EVENT_STATE 為 TIME / TIME_SYNC                 → 截止前 main 上最後一個 commit 的 sha，不能另外指定
//   其他模式                                         → --seed，沒有就用 --fallback-seed（workflow 傳入目前的 commit sha）
// 也會寫出 <out-dir>/seed-tag.json，workflow 據此建立記錄 seed 的 tag。
//
// 產出：
//   exchange.json          配對結果（commit 回 repo，展示頁會讀）
//   <out-dir>/issue.md     公告 issue 內文：交換通知與相關資訊，不列出誰送給誰
//   <out-dir>/gift-N.md    每份禮物一則留言：@ 收到禮物的人並附上禮物頁連結（不透露送禮的人，打開才知道）

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { currentEvent, loadRules, REPO_ROOT, writeExchange, type JudgeResult } from '@gift/judge'
import { pair } from './pair.ts'
import { deadlineSeed, deadlineSeedCommand, seedTag, taggedSeed } from './seed.ts'

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

const tagged = taggedSeed(REPO_ROOT)
let seed: string
if (tagged) {
  if (values.seed && values.seed !== tagged) {
    console.error(`已經交換過，seed 固定為 tag 上記錄的 ${tagged}，不能另外指定`)
    process.exit(2)
  }
  seed = tagged
} else if (event.timed) {
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

// 自訂 seed 要能當 tag 名稱；在配對與寫檔之前檢查，失敗時什麼都不會留下
let tag: ReturnType<typeof seedTag>
try {
  tag = seedTag(seed, REPO_ROOT)
} catch (e) {
  console.error((e as Error).message)
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

const seedNote = event.timed
  ? [
      `配對 seed 是截止時間 ${event.schedule!.end} 前 \`main\` 上最後一個 commit：\`${seed}\``,
      '',
      '任何人都能重算驗證：',
      '',
      '```sh',
      deadlineSeedCommand(event.schedule!.end) + '   # 找出 seed',
      'pnpm judge --all',
      `EVENT_STATE=TIME node packages/tools/src/exchange.ts --seed ${seed}`,
      '```',
    ]
  : [
      `配對 seed：\`${seed}\``,
      '',
      '任何人都能用同一個 seed 重算驗證：',
      '',
      '```sh',
      'pnpm judge --all',
      `node packages/tools/src/exchange.ts --seed ${seed}`,
      '```',
    ]

const issue = (
  pairs.length
    ? [
        `🎄 聖誕樹交換開始囉！這次共有 **${pairs.length}** 位參加者完成交換。`,
        '',
        '接下來每一份送出的禮物，都會在這個 issue 底下發一則留言 @ 收到的人，GitHub 會通知你；點留言裡的連結就能打開你的禮物。',
        '',
        site ? `🎁 活動網站：${site}` : '',
        '',
        failed.length ? `有 ${failed.length} 份投稿未通過評測，這次沒有參加交換。` : '',
        '',
        '### 怎麼配對的',
        '',
        '用公開的 seed 把所有通過評測的參加者洗牌後排成一個環，每個人把樹送給下一位，所以不會抽到自己。',
        `這次的 seed 記錄在 tag \`${tag.name}\`，之後重新交換也會沿用同一個 seed。`,
        '',
        ...seedNote,
      ]
    : [`通過評測的投稿只有 ${passed.length} 份，不到兩人，這次無法交換。`]
)
  .join('\n')
  // 沒有的段落（例如沒有人未通過）會留下連續空行
  .replace(/\n{3,}/g, '\n\n')

const giftComment = (to: string) =>
  site
    ? `🎅 @${to} 你收到了一棵聖誕樹！\n\n👉 [打開禮物](${site}/gifts/${to}.html)`
    : `🎅 @${to} 你收到了一棵聖誕樹！到活動網站的禮物頁打開它吧。`

const outDir = values['out-dir']
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'issue.md'), issue + '\n')
fs.writeFileSync(path.join(outDir, 'seed-tag.json'), JSON.stringify(tag) + '\n')
for (const old of fs.readdirSync(outDir).filter((f) => /^gift-\d+\.md$/.test(f))) {
  fs.rmSync(path.join(outDir, old))
}
// 檔名補零，workflow 用 glob 依序發送
const receivers = pairs.map((p) => p.to).toSorted()
const width = String(receivers.length).length
receivers.forEach((to, i) => {
  const name = `gift-${String(i + 1).padStart(width, '0')}.md`
  fs.writeFileSync(path.join(outDir, name), giftComment(to) + '\n')
})

console.log(`配對完成：${pairs.length} 人（未通過 ${failed.length} 人），seed=${seed}`)
