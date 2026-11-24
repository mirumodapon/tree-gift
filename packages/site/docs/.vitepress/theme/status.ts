import type { EventState } from '@gift/judge'

/** 狀態徽章的語意色；文字在 i18n.ts */
export const STATUS_TONE: Record<EventState, 'soon' | 'open' | 'closed'> = {
  NOT_STARTED: 'soon',
  PROGRESS: 'open',
  PROGRESS_SYNC: 'open',
  ENDED: 'closed',
  FATAL: 'closed',
}
