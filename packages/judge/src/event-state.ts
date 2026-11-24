// 活動狀態：由 repo variable EVENT_STATE 設定，決定是否收件、是否把作品公開到網站。
//
// EVENT_STATE 可以直接指定狀態（NOT_STARTED、PROGRESS …），也可以設成 TIME / TIME_SYNC，
// 改由 rules.ts 的 schedule 依時間決定：
//   start 之前        → NOT_STARTED
//   start ～ end      → PROGRESS（TIME）或 PROGRESS_SYNC（TIME_SYNC）
//   end 之後          → ENDED，並由 schedule.yml 自動交換

export const EVENT_STATES = ['NOT_STARTED', 'PROGRESS', 'PROGRESS_SYNC', 'ENDED', 'FATAL'] as const

/** 實際生效的狀態 */
export type EventState = (typeof EVENT_STATES)[number]

/** 依時間自動切換的模式 */
export const TIMED_MODES = ['TIME', 'TIME_SYNC'] as const

/** EVENT_STATE 可以設定的值：直接指定狀態，或依時間切換 */
export type EventMode = EventState | (typeof TIMED_MODES)[number]

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

/** 收件時間區間（rules.ts 的 schedule）；時間要帶時區，例如 2026-12-24T23:59:59+08:00 */
export interface EventSchedule {
  start: string
  end: string
}

export interface CurrentEvent {
  /** 實際生效的狀態 */
  state: EventState
  /** EVENT_STATE 設定的值 */
  mode: EventMode
  /** 是否依 schedule 自動切換（TIME / TIME_SYNC） */
  timed: boolean
  /** 依時間切換時的收件區間，其他模式為 null */
  schedule: EventSchedule | null
  policy: EventPolicy
}

const MODES: readonly string[] = [...EVENT_STATES, ...TIMED_MODES]

/** 解析 EVENT_STATE；未定義或不認得的值一律視為 FATAL（最保守：不收件、不公開）。 */
export function parseEventMode(value: string | undefined): EventMode {
  const v = (value ?? '').trim().toUpperCase()
  return MODES.includes(v) ? (v as EventMode) : 'FATAL'
}

export const isTimed = (mode: EventMode): mode is (typeof TIMED_MODES)[number] =>
  (TIMED_MODES as readonly string[]).includes(mode)

/**
 * 目前的活動狀態。
 * schedule 來自 rules.ts；EVENT_STATE 是 TIME / TIME_SYNC 卻沒有設定 schedule 時視為 FATAL。
 * now 預設讀 EVENT_NOW（ISO 時間；review 用 PR 的時間、網站 build 固定同一個時間點），沒有就用現在。
 */
export function currentEvent(
  schedule: EventSchedule | null,
  value = process.env.EVENT_STATE,
  now = eventNow(),
): CurrentEvent {
  const mode = parseEventMode(value)
  const timed = isTimed(mode)
  let state: EventState
  if (!timed) state = mode
  else if (!schedule) state = 'FATAL'
  else if (now < Date.parse(schedule.start)) state = 'NOT_STARTED'
  else if (now < Date.parse(schedule.end)) state = mode === 'TIME' ? 'PROGRESS' : 'PROGRESS_SYNC'
  else state = 'ENDED'
  return {
    state,
    mode,
    timed,
    schedule: timed ? schedule : null,
    policy: EVENT_POLICIES[state],
  }
}

/** EVENT_NOW（ISO 時間）或現在，毫秒 */
export function eventNow(): number {
  const raw = process.env.EVENT_NOW
  if (!raw) return Date.now()
  const t = Date.parse(raw)
  if (Number.isNaN(t)) throw new Error(`EVENT_NOW 不是合法的時間：${raw}`)
  return t
}

/** 不收件時給投稿者的說明 */
export function closedMessage(state: EventState): string {
  return state === 'NOT_STARTED'
    ? '活動還沒開始，開始收件後再開 PR 喔！'
    : '這次活動已經停止收件，謝謝你的參與！🎄'
}
