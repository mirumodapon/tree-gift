import { EVENT_POLICIES, type EventState, type JudgeResult } from '@gift/judge'
import type { PathCheck } from './check-paths.ts'

export type Action =
  /** 通過：留言並自動 merge */
  | 'merge'
  /** 未通過：留言並關閉 PR */
  | 'reject'
  /** 目前不收件（活動未開始或已結束）：不評測，留言並關閉 PR */
  | 'closed'
  /** judge 本身出錯：留言，不 merge 也不關閉，等主辦方處理 */
  | 'error'
  /** 不自動處理，等 maintainer review（一般功能性 PR、draft、bot） */
  | 'skip'

export interface DecideInput {
  /** 目前的活動狀態（EVENT_STATE），決定是否收件 */
  eventState: EventState
  draft: boolean
  /** PR 是否以預設分支為目標 */
  targetsDefault: boolean
  /** GitHub user.type，例如 'User' | 'Bot' */
  userType: string
  paths: PathCheck
  /** PR 作者是否在投稿白名單內（白名單未啟用時為 true） */
  allowed: boolean
  /** 投稿資料夾擁有者的問題（見 ownership.ts）；沒有問題為 null */
  ownerProblem: string | null
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
export function precheck(input: DecideInput): Decision | null {
  const { eventState, draft, targetsDefault, userType, paths, allowed, ownerProblem } = input
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
  if (!EVENT_POLICIES[eventState].acceptSubmissions) {
    const reason = eventState === 'NOT_STARTED' ? '活動尚未開始' : '投稿已截止'
    return { action: 'closed', pass: false, reason }
  }
  if (!allowed) return { action: 'reject', pass: false, reason: '不在投稿白名單內' }
  if (paths.foreign.length) return { action: 'reject', pass: false, reason: '修改了其他人的投稿' }
  if (ownerProblem) return { action: 'reject', pass: false, reason: ownerProblem }
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
