// 讀取 judge-all 的評測結果；data loader 與動畫檔（.cast）共用。
// 只有 EVENT_STATE 允許公開作品時才會讀取，避免作品內容進到網站裡。

import fs from 'node:fs'
import path from 'node:path'
import { currentEvent, LOGIN_RE, REPO_ROOT, type JudgeResult } from '@gift/judge'

export const RESULTS_DIR = process.env.GIFT_RESULTS_DIR ?? path.join(REPO_ROOT, 'out/results')

/** 通過評測的作品；不公開時回傳空陣列 */
export function publishedResults(): JudgeResult[] {
  if (!currentEvent().policy.publishTrees) return []
  if (!fs.existsSync(RESULTS_DIR)) {
    throw new Error(
      `EVENT_STATE 要求公開作品，但找不到評測結果 ${RESULTS_DIR}。` +
        '請先執行 node packages/tools/src/judge-all.ts（pnpm site 會自動執行）',
    )
  }
  return fs
    .readdirSync(RESULTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf8')) as JudgeResult)
    .filter((r) => r.ok && r.stdout !== null && r.language && LOGIN_RE.test(r.user))
    .toSorted((a, b) => a.user.localeCompare(b.user))
}
