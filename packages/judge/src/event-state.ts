// 活動狀態：由 repo variable EVENT_STATE 設定，決定是否收件、是否把作品公開到網站。

export const EVENT_STATES = ['NOT_STARTED', 'PROGRESS', 'PROGRESS_SYNC', 'ENDED', 'FATAL'] as const

export type EventState = (typeof EVENT_STATES)[number]

export interface EventPolicy {
  /** 是否接受投稿 PR */
  acceptSubmissions: boolean
  /** 是否把聖誕樹（與交換結果）生成到網站上 */
  publishTrees: boolean
}

export const EVENT_POLICIES: Record<EventState, EventPolicy> = {
  /** 尚未開始：不收件、不公開 */
  NOT_STARTED: { acceptSubmissions: false, publishTrees: false },
  /** 進行中：收件、不公開 */
  PROGRESS: { acceptSubmissions: true, publishTrees: false },
  /** 進行中：收件、即時公開 */
  PROGRESS_SYNC: { acceptSubmissions: true, publishTrees: true },
  /** 已結束：不收件、公開 */
  ENDED: { acceptSubmissions: false, publishTrees: true },
  /** 已結束：不收件、不公開 */
  FATAL: { acceptSubmissions: false, publishTrees: false },
}

/** 解析 EVENT_STATE；未定義或不認得的值一律視為 FATAL（最保守：不收件、不公開）。 */
export function parseEventState(value: string | undefined): EventState {
  const v = (value ?? '').trim().toUpperCase()
  return (EVENT_STATES as readonly string[]).includes(v) ? (v as EventState) : 'FATAL'
}

/** 讀取目前的活動狀態（預設讀 process.env.EVENT_STATE） */
export function currentEvent(value = process.env.EVENT_STATE): {
  state: EventState
  policy: EventPolicy
} {
  const state = parseEventState(value)
  return { state, policy: EVENT_POLICIES[state] }
}

/** 不收件時給投稿者的說明 */
export function closedMessage(state: EventState): string {
  return state === 'NOT_STARTED'
    ? '活動還沒開始，開始收件後再開 PR 喔！'
    : '這次活動已經停止收件，謝謝你的參與！🎄'
}
