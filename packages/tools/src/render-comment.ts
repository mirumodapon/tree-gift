import { ansi, closedMessage, type EventState, type JudgeResult } from '@gift/judge'
import type { Action } from './decide.ts'
import { codeBlock, inlineCode, plain, truncate } from './markdown.ts'

/** 用來找到並更新同一則留言 */
export const COMMENT_MARKER = '<!-- gift-judge -->'

export interface CommentInput {
  action: Exclude<Action, 'skip'>
  author: string
  /** 改到的其他人投稿路徑 */
  foreign: string[]
  /** 作者不在投稿白名單內 */
  notAllowed?: boolean
  /** 投稿資料夾擁有者的問題 */
  ownerProblem?: string | null
  /** 沒有評測時為 null */
  result: JudgeResult | null
  /** action 為 closed 時，用來說明是「還沒開始」還是「已結束」 */
  eventState?: EventState
  runUrl?: string
}

const TITLES: Record<CommentInput['action'], string> = {
  merge: '✅ 通過，已自動合併 🎁',
  reject: '❌ 未通過，PR 已關閉',
  closed: '🔒 目前不開放投稿，PR 已關閉',
  error: '⚠️ judge 發生錯誤',
}

const FOOTERS: Record<Exclude<CommentInput['action'], 'closed'>, string> = {
  merge: '感謝參加！截止後會隨機配對交換，記得 Watch 這個 repo 的 Issues 才收得到通知。',
  reject: '請依上面的說明修正後，再開一個新的 PR（可以沿用同一個分支）。',
  error: '這不是你的問題，主辦方會盡快處理。',
}

const num = (n: unknown) => (typeof n === 'number' ? String(n) : '-')

export function renderComment(input: CommentInput): string {
  const {
    action,
    author,
    foreign,
    notAllowed,
    ownerProblem,
    result,
    eventState = 'FATAL',
    runUrl,
  } = input
  const out: string[] = [COMMENT_MARKER, `## 🎄 Judge 結果：${TITLES[action]}`, '']

  if (notAllowed) {
    out.push(
      '> [!WARNING]',
      '> 這次活動只開放白名單內的帳號投稿，你的帳號不在名單中。如果你應該在名單內，請聯絡主辦方。',
      '',
    )
  }

  if (foreign.length) {
    out.push(
      `> [!WARNING]`,
      `> 這個 PR 改到了其他人的投稿。投稿 PR 只能新增或修改 ${inlineCode(`submissions/${author}/`)}，請移除這些變更：`,
      ...foreign.map((p) => `> - ${inlineCode(p)}`),
      '',
    )
  }

  if (ownerProblem) out.push('> [!WARNING]', `> ${plain(ownerProblem)}`, '')

  if (result) {
    const s = result.stats
    out.push(
      '| 語言 | 尺寸 | 執行時間 |',
      '| --- | --- | --- |',
      `| ${plain(result.languageName ?? '-')} | ${num(s.cols)} × ${num(s.rows)} | ${num(s.timeMs)} ms |`,
      '',
    )
    if (result.errors.length) {
      out.push(
        '### 問題',
        ...result.errors.map(
          (e) => `- **${plain(e.code)}**：${plain(e.message)}<br>${plain(e.messageEn)}`,
        ),
        '',
      )
    }
    if (result.stdout) {
      const anim = result.animation
      if (anim) {
        const cut = anim.truncated ? '，已截斷' : ''
        out.push(
          `### 輸出預覽（動畫 ${num(anim.duration)} 秒${cut}，這裡顯示最後一格）`,
          '動畫會在作品公開後於活動網站上播放。',
          '',
        )
      } else {
        out.push('### 輸出預覽')
      }
      out.push(codeBlock(truncate(ansi.stripSgr(result.stdout), 80, 12_000)), '')
    }
    if (result.stderr.trim()) {
      out.push(
        '<details><summary>stderr</summary>',
        '',
        codeBlock(truncate(result.stderr, 80, 8_000)),
        '',
        '</details>',
        '',
      )
    }
  } else if (!foreign.length && !notAllowed && !ownerProblem && action !== 'closed') {
    out.push('找不到 judge 結果。', '')
  }

  if (action === 'closed') out.push(closedMessage(eventState))
  else if (!notAllowed) out.push(FOOTERS[action])
  if (runUrl) out.push('', `<sub>[workflow 紀錄](${runUrl})</sub>`)
  return out.join('\n')
}
