// 由 review.yml 的 judge job 呼叫（pull_request_target，token 唯讀）。
// 這裡的程式碼來自預設分支；PR 的檔案只當資料抓下來，在 Docker 沙箱裡執行。
//   只改 submissions/<author>/        → 評測，決定 merge 或 reject
//   改到別人的 submissions/<other>/   → reject
//   ACCEPT_SUBMISSIONS 不是 true 時   → 投稿 PR 一律不評測，留言「投稿已截止」並關閉
//   改到 submissions/ 以外的任何檔案  → 一般 PR，不評測，等 maintainer review
// 產出 <OUT_DIR>/decision.json 交給 act job，exit code 決定 PR check 的紅綠燈。
//
// 環境變數：GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, OUT_DIR,
//           RUN_URL（選填）, ACCEPT_SUBMISSIONS（true 才收件，未設定視為停止收件）

import fs from 'node:fs'
import path from 'node:path'
import { judge, loadRules, REPO_ROOT } from '@gift/judge'
import { checkPaths, type ChangedFile } from './check-paths.ts'
import { decide, parseAcceptSubmissions, precheck, type DecideInput } from './decide.ts'
import { fetchSubmission } from './fetch-submission.ts'
import { env, GitHub, type PullRequest } from './github.ts'
import { renderComment } from './render-comment.ts'

const token = env('GITHUB_TOKEN')
const gh = new GitHub(env('GITHUB_REPOSITORY'), token)
const prNumber = Number(env('PR_NUMBER'))

const [pr, repo] = await Promise.all([
  gh.request<PullRequest>('GET', `/pulls/${prNumber}`),
  gh.request<{ default_branch: string }>('GET', ''),
])
const author = pr.user.login
const files = await gh.paginate<ChangedFile>(`/pulls/${prNumber}/files`)
const paths = checkPaths(files, author)
const input: DecideInput = {
  acceptSubmissions: parseAcceptSubmissions(process.env.ACCEPT_SUBMISSIONS),
  draft: pr.draft,
  targetsDefault: pr.base.ref === repo.default_branch,
  userType: pr.user.type,
  paths,
  result: null,
}

// 只有「只改自己投稿資料夾」的 PR 才抓檔案進沙箱評測；
// 動到 submissions/ 以外的 PR 視為一般 PR，不觸發 judge
if (!precheck(input)) {
  try {
    const dir = fetchSubmission(REPO_ROOT, pr.head.sha, author, token)
    input.result = await judge(dir, await loadRules(), author)
  } catch (e) {
    console.error(e)
  }
}

const decision = decide(input)
const body =
  decision.action === 'skip'
    ? null
    : renderComment({
        action: decision.action,
        author,
        foreign: paths.foreign,
        result: input.result,
        runUrl: process.env.RUN_URL,
      })

const outDir = env('OUT_DIR')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(
  path.join(outDir, 'decision.json'),
  JSON.stringify({ pr: prNumber, headSha: pr.head.sha, author, ...decision, body }, null, 2) + '\n',
)
console.log(`PR #${prNumber} (@${author})：${decision.action} — ${decision.reason}`)
for (const e of input.result?.errors ?? []) console.log(`  - [${e.code}] ${e.message}`)
process.exitCode = decision.pass ? 0 : 1
