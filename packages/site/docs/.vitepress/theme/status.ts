import type { EventState } from '@gift/judge'

export interface StatusText {
  label: string
  /** 狀態徽章的語意色 */
  tone: 'soon' | 'open' | 'closed'
  /** 作品牆不公開時的說明 */
  hidden: string
}

export const STATUS: Record<EventState, StatusText> = {
  NOT_STARTED: {
    label: '即將開始',
    tone: 'soon',
    hidden: '活動還沒開始，開始收件後就能投稿囉！',
  },
  PROGRESS: {
    label: '收件中',
    tone: 'open',
    hidden: '作品會在活動結束後公開，現在先保密。',
  },
  PROGRESS_SYNC: { label: '收件中', tone: 'open', hidden: '' },
  ENDED: { label: '活動已結束', tone: 'closed', hidden: '' },
  FATAL: { label: '活動已結束', tone: 'closed', hidden: '這次活動的作品不公開。' },
}
