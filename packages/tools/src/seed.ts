// TIME / TIME_SYNC 模式的配對 seed：截止時間（schedule.end）前，main 上最後一個 commit 的 sha。
// 只看 first-parent，也就是 main 本身的歷史；投稿由 bot 透過 GitHub 合併，commit 時間是 GitHub 記錄的。
// 任何人都能用同一個指令重算：git rev-list -1 --first-parent --before=<end> main

import { execFileSync } from 'node:child_process'

const git = (cwd: string, args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

export function deadlineSeed(end: string, cwd: string, ref = 'HEAD'): string {
  // shallow clone 少了舊的歷史，會算出錯的 commit
  if (git(cwd, ['rev-parse', '--is-shallow-repository']) === 'true') {
    throw new Error(
      '需要完整的 git 歷史才能找出截止前最後一個 commit（actions/checkout 請設 fetch-depth: 0）',
    )
  }
  const sha = git(cwd, ['rev-list', '-1', '--first-parent', `--before=${end}`, ref])
  if (!sha) throw new Error(`${end} 之前沒有任何 commit`)
  return sha
}

/** 公告與網站上給人重算用的指令 */
export const deadlineSeedCommand = (end: string) =>
  `git rev-list -1 --first-parent --before=${end} main`

// 交換用過的 seed 記錄在 tag 上，之後再交換一律沿用，不會因為重跑或換了輸入而改變配對：
//   seed 是 commit sha → tag `exchange` 指向那個 commit
//   其他自訂 seed      → tag `exchange-<seed>`（指向交換時的 commit）
export const EXCHANGE_TAG = 'exchange'
const CUSTOM_TAG_PREFIX = `${EXCHANGE_TAG}-`

const SHA_RE = /^[0-9a-f]{40}$/

/** seed 是不是這個 repo 裡某個 commit 的完整 sha */
export function isCommitSeed(seed: string, cwd: string): boolean {
  if (!SHA_RE.test(seed)) return false
  try {
    return git(cwd, ['cat-file', '-t', seed]) === 'commit'
  } catch {
    return false
  }
}

/** 已經記錄在 tag 上的 seed；還沒交換過時為 null，tag 不只一個時報錯 */
export function taggedSeed(cwd: string): string | null {
  const tags = git(cwd, ['tag', '--list', EXCHANGE_TAG, `${CUSTOM_TAG_PREFIX}*`])
    .split('\n')
    .filter(Boolean)
  if (tags.length > 1) {
    throw new Error(`找到多個交換 tag（${tags.join(', ')}），請只保留一個`)
  }
  const [tag] = tags
  if (!tag) return null
  if (tag === EXCHANGE_TAG) return git(cwd, ['rev-parse', `${EXCHANGE_TAG}^{commit}`])
  return tag.slice(CUSTOM_TAG_PREFIX.length)
}

/** 要為這個 seed 建立的 tag；target 為 null 代表指向交換時的 commit。自訂 seed 不能當 tag 名稱時報錯 */
export function seedTag(seed: string, cwd: string): { name: string; target: string | null } {
  if (isCommitSeed(seed, cwd)) return { name: EXCHANGE_TAG, target: seed }
  const name = `${CUSTOM_TAG_PREFIX}${seed}`
  try {
    git(cwd, ['check-ref-format', `refs/tags/${name}`])
  } catch {
    throw new Error(
      `seed ${JSON.stringify(seed)} 不能當作 tag 名稱（不能有空白、~^:?*[\\ 等字元），請換一個`,
    )
  }
  return { name, target: null }
}
