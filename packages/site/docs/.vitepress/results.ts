// 讀取 judge-all 的評測結果；data loader 與動畫檔（.cast）共用。
// 只有 EVENT_STATE 允許公開作品時才會讀取，避免作品內容進到網站裡。

import fs from 'node:fs'
import path from 'node:path'
import { LOGIN_RE, REPO_ROOT, type JudgeResult } from '@gift/judge'
import { siteEvent } from './event.ts'

export const RESULTS_DIR = process.env.GIFT_RESULTS_DIR ?? path.join(REPO_ROOT, 'out/results')

/** 投稿資料夾裡視為授權檔的檔名（見 SUBMISSION_LICENSE.md） */
const LICENSE_FILES = new Set(['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING'])

export interface SourceFile {
  name: string
  content: string
  /** 是否為進入點 tree.<ext> */
  entry: boolean
}

/** 投稿資料夾裡的文字檔（README.md 與授權檔另外處理；不是合法 UTF-8 的檔案略過） */
export function submissionFiles(user: string, language: string): SourceFile[] {
  const dir = path.join(REPO_ROOT, 'submissions', user)
  if (!fs.existsSync(dir)) return []
  const entry = `tree.${language}`
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name !== 'README.md' && !LICENSE_FILES.has(d.name))
    .flatMap((d) => {
      try {
        const content = new TextDecoder('utf-8', { fatal: true }).decode(
          fs.readFileSync(path.join(dir, d.name)),
        )
        return [{ name: d.name, content, entry: d.name === entry }]
      } catch {
        return []
      }
    })
    .toSorted((a, b) => Number(b.entry) - Number(a.entry) || a.name.localeCompare(b.name))
}

/** 作者附上的授權檔；沒有時為 null */
export function submissionLicense(user: string): { name: string; content: string } | null {
  for (const name of LICENSE_FILES) {
    const file = path.join(REPO_ROOT, 'submissions', user, name)
    if (fs.existsSync(file)) return { name, content: fs.readFileSync(file, 'utf8') }
  }
  return null
}

export function submissionReadme(user: string): string | null {
  const file = path.join(REPO_ROOT, 'submissions', user, 'README.md')
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
}

/** 通過評測的作品；不公開時回傳空陣列 */
export async function publishedResults(): Promise<JudgeResult[]> {
  if (!(await siteEvent()).policy.publishTrees) return []
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
