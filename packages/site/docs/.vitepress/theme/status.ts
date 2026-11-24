import type { EventState } from '@gift/judge'

export interface StatusText {
  label: string
  /** 狀態徽章的語意色 */
  tone: 'soon' | 'open' | 'closed'
}

export const STATUS: Record<EventState, StatusText> = {
  NOT_STARTED: { label: '即將開始', tone: 'soon' },
  PROGRESS: { label: '收件中', tone: 'open' },
  PROGRESS_SYNC: { label: '收件中', tone: 'open' },
  ENDED: { label: '活動已結束', tone: 'closed' },
  FATAL: { label: '活動已結束', tone: 'closed' },
}
