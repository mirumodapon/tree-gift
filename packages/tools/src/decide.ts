import type { JudgeResult } from '@gift/judge'
import type { PathCheck } from './check-paths.ts'

export type Action =
  /** 通過：留言並自動 merge */
  | 'merge'
  /** 未通過：留言並關閉 PR */
  | 'reject'
  /** judge 本身出錯：留言，不 merge 也不關閉，等主辦方處理 */
  | 'error'
  /** 不自動處理，等 maintainer review（一般功能性 PR、draft、bot） */
  | 'skip'

export interface DecideInput {
  draft: boolean
  /** PR 是否以預設分支為目標 */
  targetsDefault: boolean
  /** GitHub user.type，例如 'User' | 'Bot' */
  userType: string
  paths: PathCheck
  /** 沒有評測時為 null */
  result: JudgeResult | null
}

export interface Decision {
  action: Action
  /** PR check 是否為綠燈 */
  pass: boolean
  reason: string
}

/** 不需要評測就能決定的情況；回傳 null 代表這是要評測的投稿 PR。 */
export function precheck({ draft, targetsDefault, userType, paths }: DecideInput): Decision | null {
  if (paths.outside.length) {
    return {
      action: 'skip',
      pass: true,
      reason: '修改了 submissions/ 以外的檔案，視為一般 PR，等待 maintainer review',
    }
  }
  if (!targetsDefault) return { action: 'skip', pass: true, reason: '不是以預設分支為目標' }
  if (draft) return { action: 'skip', pass: true, reason: 'draft PR' }
  if (userType === 'Bot') return { action: 'skip', pass: true, reason: 'bot PR' }
  if (paths.foreign.length) return { action: 'reject', pass: false, reason: '修改了其他人的投稿' }
  return null
}

export function decide(input: DecideInput): Decision {
  const pre = precheck(input)
  if (pre) return pre
  const { result } = input
  if (!result) return { action: 'error', pass: false, reason: '沒有 judge 結果' }
  if (result.errors.some((e) => e.code === 'internal_error')) {
    return { action: 'error', pass: false, reason: 'judge 內部錯誤' }
  }
  if (!result.ok) return { action: 'reject', pass: false, reason: '未通過 judge' }
  return { action: 'merge', pass: true, reason: '通過 judge' }
}
