import { ansi, type JudgeResult } from '@gift/judge'
import { codeBlock, inlineCode, plain, truncate } from './markdown.ts'

/** 用來找到並更新同一則留言 */
export const COMMENT_MARKER = '<!-- gift-judge -->'

export interface CommentInput {
  author: string
  /** 超出 submissions/<author>/ 的路徑 */
  badPaths: string[]
  /** judge 結果；artifact 遺失或不可信時為 null */
  result: JudgeResult | null
  runUrl?: string
}

const num = (n: unknown) => (typeof n === 'number' ? String(n) : '-')

export function renderComment({ author, badPaths, result, runUrl }: CommentInput): string {
  const ok = badPaths.length === 0 && result?.ok === true
  const out: string[] = [COMMENT_MARKER, `## 🎄 Judge 結果：${ok ? '✅ 通過' : '❌ 未通過'}`, '']

  if (badPaths.length) {
    out.push(
      `> [!WARNING]`,
      `> 這個 PR 修改了 ${inlineCode(`submissions/${author}/`)} 以外的檔案，請移除這些變更：`,
      ...badPaths.map((p) => `> - ${inlineCode(p)}`),
      '',
    )
  }

  if (!result) {
    out.push('找不到 judge 結果，請查看 workflow 紀錄。', '')
  } else {
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
        ...result.errors.map((e) => `- **${plain(e.code)}**：${plain(e.message)}`),
        '',
      )
    }
    if (result.stdout) {
      out.push('### 輸出預覽', codeBlock(truncate(ansi.stripSgr(result.stdout), 80, 12_000)), '')
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
  }

  if (runUrl) out.push(`<sub>[workflow 紀錄](${runUrl})</sub>`)
  return out.join('\n')
}
