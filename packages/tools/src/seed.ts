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
