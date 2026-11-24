// 由 comment.yml（workflow_run，跑在預設分支、有寫入權限）呼叫。
// judge.yml 跑的是 PR 裡的 workflow，產出的 artifact 不可信，所以這裡：
//   1. PR 編號必須是整數，且該 PR 的 head sha 必須等於觸發的 run
//   2. 作者與變更檔案一律向 GitHub API 重新查詢，不採用 artifact 的說法
//   3. result.json 的 user 必須等於 PR 作者，否則視為沒有結果
//
// 環境變數：GITHUB_TOKEN, GITHUB_REPOSITORY, ARTIFACT_DIR, HEAD_SHA, RUN_URL

import fs from 'node:fs'
import path from 'node:path'
import type { JudgeResult } from '@gift/judge'
import { checkPaths, type ChangedFile } from './check-paths.ts'
import { GitHub } from './github.ts'
import { COMMENT_MARKER, renderComment } from './render-comment.ts'

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`缺少環境變數 ${name}`)
  return v
}

function readResult(dir: string, author: string): JudgeResult | null {
  try {
    const r = JSON.parse(fs.readFileSync(path.join(dir, 'result.json'), 'utf8')) as JudgeResult
    const valid =
      r.user === author &&
      typeof r.ok === 'boolean' &&
      Array.isArray(r.errors) &&
      r.errors.every((e) => typeof e?.code === 'string' && typeof e.message === 'string') &&
      (r.stdout === null || typeof r.stdout === 'string') &&
      typeof r.stderr === 'string' &&
      typeof r.stats === 'object' &&
      r.stats !== null
    return valid ? r : null
  } catch {
    return null
  }
}

const gh = new GitHub(env('GITHUB_REPOSITORY'), env('GITHUB_TOKEN'))
const dir = env('ARTIFACT_DIR')
const headSha = env('HEAD_SHA')

const prText = fs.readFileSync(path.join(dir, 'pr_number'), 'utf8').trim()
if (!/^\d{1,9}$/.test(prText)) throw new Error(`PR 編號不合法：${JSON.stringify(prText)}`)
const pr = await gh.request<{ head: { sha: string }; user: { login: string } }>(
  'GET',
  `/pulls/${prText}`,
)
if (pr.head.sha !== headSha) {
  console.log(`PR #${prText} 的 head (${pr.head.sha}) 與 run (${headSha}) 不符，略過`)
  process.exit(0)
}

const author = pr.user.login
const files = await gh.paginate<ChangedFile>(`/pulls/${prText}/files`)
const body = renderComment({
  author,
  badPaths: checkPaths(files, author),
  result: readResult(dir, author),
  runUrl: process.env.RUN_URL,
})

const comments = await gh.paginate<{ id: number; body?: string; user: { login: string } }>(
  `/issues/${prText}/comments`,
)
const mine = comments.find(
  (c) => c.user.login === 'github-actions[bot]' && c.body?.startsWith(COMMENT_MARKER),
)
if (mine) await gh.request('PATCH', `/issues/comments/${mine.id}`, { body })
else await gh.request('POST', `/issues/${prText}/comments`, { body })
console.log(`已${mine ? '更新' : '發佈'} PR #${prText} 的 judge 留言`)
