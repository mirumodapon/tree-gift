// 由 review.yml 的 act job 呼叫（有寫入權限，不執行任何 PR 的程式）。
// 依 judge job 的 decision.json 留言，並自動 merge 或關閉 PR。
//
// 環境變數：GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, DECISION_DIR, DEFAULT_BRANCH

import fs from 'node:fs'
import path from 'node:path'
import { checkPaths, type ChangedFile } from './check-paths.ts'
import type { Decision } from './decide.ts'
import { env, GitHub, type PullRequest } from './github.ts'
import { COMMENT_MARKER } from './render-comment.ts'

interface DecisionFile extends Decision {
  pr: number
  headSha: string
  author: string
  body: string | null
}

const gh = new GitHub(env('GITHUB_REPOSITORY'), env('GITHUB_TOKEN'))
const prNumber = Number(env('PR_NUMBER'))
const d = JSON.parse(
  fs.readFileSync(path.join(env('DECISION_DIR'), 'decision.json'), 'utf8'),
) as DecisionFile

if (d.pr !== prNumber) throw new Error(`decision 的 PR 編號 ${d.pr} 與事件 ${prNumber} 不符`)
if (d.action === 'skip' || !d.body) {
  console.log(`略過：${d.reason}`)
  process.exit(0)
}

const pr = await gh.request<PullRequest>('GET', `/pulls/${prNumber}`)
if (pr.state !== 'open' || pr.head.sha !== d.headSha) {
  // 評測期間 PR 有新的 commit 或已關閉，交給之後的 run 處理
  console.log(`PR #${prNumber} 已變動（state=${pr.state}, head=${pr.head.sha}），略過`)
  process.exit(0)
}

const comments = await gh.paginate<{ id: number; body?: string; user: { login: string } }>(
  `/issues/${prNumber}/comments`,
)
const mine = comments.find(
  (c) => c.user.login === 'github-actions[bot]' && c.body?.startsWith(COMMENT_MARKER),
)
if (mine) await gh.request('PATCH', `/issues/comments/${mine.id}`, { body: d.body })
else await gh.request('POST', `/issues/${prNumber}/comments`, { body: d.body })

if (d.action === 'merge') {
  // merge 前再向 API 確認一次變更範圍，不只依賴 decision.json
  const files = await gh.paginate<ChangedFile>(`/pulls/${prNumber}/files`)
  const { outside, foreign } = checkPaths(files, pr.user.login)
  const bad = [...outside, ...foreign]
  if (bad.length) throw new Error(`拒絕 merge：變更超出投稿資料夾 ${bad.join(', ')}`)
  await gh.request('PUT', `/pulls/${prNumber}/merge`, {
    merge_method: 'squash',
    sha: d.headSha,
    commit_title: `🎄 @${pr.user.login} 的聖誕樹 (#${prNumber})`,
  })
  // GITHUB_TOKEN 的 merge 不會觸發 push 事件，主動更新展示頁
  await gh.request('POST', '/actions/workflows/pages.yml/dispatches', {
    ref: env('DEFAULT_BRANCH'),
  })
  console.log(`PR #${prNumber} 已 merge，並觸發展示頁更新`)
} else if (d.action === 'reject') {
  await gh.request('PATCH', `/pulls/${prNumber}`, { state: 'closed' })
  console.log(`PR #${prNumber} 已關閉：${d.reason}`)
} else {
  console.log(`PR #${prNumber} 已留言：${d.reason}`)
}
