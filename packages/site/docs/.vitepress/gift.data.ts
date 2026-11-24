// 網站的所有資料都從這裡來（VitePress data loader，build 時在 Node 執行）。
//
// 是否公開聖誕樹由 EVENT_STATE 決定：不公開時完全不讀取作品，
// 產出的網站裡就不會有任何作品內容，而不只是畫面上隱藏。

import fs from 'node:fs'
import path from 'node:path'
import {
  ansi,
  currentEvent,
  loadRules,
  readExchange,
  REPO_ROOT,
  type EventState,
  type JudgeResult,
} from '@gift/judge'
import { defineLoader } from 'vitepress'

export interface Tree {
  user: string
  languageName: string
  /** 輸出轉成的 HTML（已跳脫，只含顏色 span） */
  html: string
  cols: number
  rows: number
  /** 進入點 tree.<ext> 的原始碼 */
  source: string
  sourceFile: string
  /** GitHub 上的投稿資料夾（設定了 GITHUB_REPOSITORY 才有） */
  folderUrl: string | null
  /** 交換後：送給誰 */
  giftTo: string | null
  /** 交換後：收到誰的 */
  giftFrom: string | null
}

export interface LanguageInfo {
  ext: string
  name: string
  runTimeout: number
  compiled: boolean
}

export interface GiftData {
  state: EventState
  acceptSubmissions: boolean
  publishTrees: boolean
  repo: string | null
  /** 已合併的投稿數（submissions/ 底下的資料夾數），不公開作品時也會顯示 */
  submissionCount: number
  rules: {
    maxCols: number
    maxRows: number
    maxKB: number
    allowColor: boolean
    deterministic: boolean
    runTimeout: number
    memory: string
    maxFiles: number
    maxTotalKB: number
  }
  languages: LanguageInfo[]
  /** 公開時才有內容 */
  trees: Tree[]
  exchanged: boolean
}

declare const data: GiftData
export { data }

const SUBMISSIONS = path.join(REPO_ROOT, 'submissions')
const RESULTS = process.env.GIFT_RESULTS_DIR ?? path.join(REPO_ROOT, 'out/results')

function submissionUsers(): string[] {
  if (!fs.existsSync(SUBMISSIONS)) return []
  return fs
    .readdirSync(SUBMISSIONS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
}

function loadTrees(repo: string | null): { trees: Tree[]; exchanged: boolean } {
  if (!fs.existsSync(RESULTS)) {
    throw new Error(
      `EVENT_STATE 要求公開作品，但找不到評測結果 ${RESULTS}。` +
        '請先執行 node packages/tools/src/judge-all.ts（pnpm site 會自動執行）',
    )
  }
  const pairs = readExchange()?.pairs ?? []
  const giftTo = new Map(pairs.map((p) => [p.from, p.to]))
  const giftFrom = new Map(pairs.map((p) => [p.to, p.from]))

  const trees = fs
    .readdirSync(RESULTS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(RESULTS, f), 'utf8')) as JudgeResult)
    .filter((r) => r.ok && r.stdout !== null && r.language)
    .toSorted((a, b) => a.user.localeCompare(b.user))
    .map((r): Tree => {
      const sourceFile = `tree.${r.language}`
      const file = path.join(SUBMISSIONS, r.user, sourceFile)
      return {
        user: r.user,
        languageName: r.languageName ?? '',
        html: ansi.toHtml(r.stdout!),
        cols: r.stats.cols ?? 0,
        rows: r.stats.rows ?? 0,
        source: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '',
        sourceFile,
        folderUrl: repo ? `https://github.com/${repo}/tree/main/submissions/${r.user}` : null,
        giftTo: giftTo.get(r.user) ?? null,
        giftFrom: giftFrom.get(r.user) ?? null,
      }
    })
  return { trees, exchanged: pairs.length > 0 }
}

export default defineLoader({
  watch: [`${RESULTS}/*.json`, `${REPO_ROOT}/exchange.json`, `${REPO_ROOT}/rules.ts`],
  async load(): Promise<GiftData> {
    const { state, policy } = currentEvent()
    const rules = await loadRules()
    const repo = process.env.GITHUB_REPOSITORY ?? null
    const { trees, exchanged } = policy.publishTrees
      ? loadTrees(repo)
      : { trees: [], exchanged: false }

    return {
      state,
      acceptSubmissions: policy.acceptSubmissions,
      publishTrees: policy.publishTrees,
      repo,
      submissionCount: submissionUsers().length,
      rules: {
        maxCols: rules.output.maxCols,
        maxRows: rules.output.maxRows,
        maxKB: Math.round(rules.output.maxBytes / 1024),
        allowColor: rules.output.allowColor,
        deterministic: rules.output.deterministic,
        runTimeout: rules.sandbox.runTimeout,
        memory: rules.sandbox.memory,
        maxFiles: rules.sandbox.maxFiles,
        maxTotalKB: Math.round(rules.sandbox.maxTotalBytes / 1024),
      },
      languages: Object.entries(rules.languages).map(([ext, lang]) => ({
        ext,
        name: lang.name,
        runTimeout: lang.runTimeout ?? rules.sandbox.runTimeout,
        compiled: Boolean(lang.compile),
      })),
      trees,
      exchanged,
    }
  },
})
