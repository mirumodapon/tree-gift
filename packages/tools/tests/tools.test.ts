import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { EVENT_POLICIES, parseEventState, type ErrorCode, type JudgeResult } from '@gift/judge'
import { checkPaths } from '../src/check-paths.ts'
import { decide, precheck, type DecideInput } from '../src/decide.ts'
import { codeBlock, inlineCode, plain } from '../src/markdown.ts'
import { pair } from '../src/pair.ts'
import { COMMENT_MARKER, renderComment } from '../src/render-comment.ts'

describe('checkPaths', () => {
  it('只改自己的資料夾', () => {
    const files = [
      { filename: 'submissions/alice/tree.py', status: 'added' },
      { filename: 'submissions/alice/README.md', status: 'modified' },
    ]
    assert.deepEqual(checkPaths(files, 'alice'), { outside: [], foreign: [] })
  })

  it('區分其他人的投稿與 submissions/ 以外的檔案（含 rename 來源）', () => {
    const files = [
      { filename: 'submissions/bob/tree.py', status: 'modified' },
      { filename: '.github/workflows/review.yml', status: 'modified' },
      { filename: 'submissions/alice/tree.py', status: 'renamed', previous_filename: 'rules.ts' },
      { filename: 'submissions/alice2/tree.py', status: 'added' },
    ]
    assert.deepEqual(checkPaths(files, 'alice'), {
      outside: ['.github/workflows/review.yml', 'rules.ts'],
      foreign: ['submissions/bob/tree.py', 'submissions/alice2/tree.py'],
    })
  })
})

describe('markdown', () => {
  it('codeBlock 的 fence 比內容的反引號長', () => {
    const block = codeBlock('```\n````\nend')
    assert.ok(block.startsWith('`````\n'))
    assert.ok(block.endsWith('\n`````'))
  })

  it('inlineCode 無法被反引號跳出', () => {
    assert.equal(inlineCode('a`b'), '`` a`b ``')
  })

  it('plain 跳脫 HTML 與表格符號', () => {
    assert.equal(plain('<img>|x\ny'), '\\<img\\>\\|x y')
  })

  it('plain 讓 @mention 失效', () => {
    assert.equal(plain('@octocat'), '@\u200boctocat')
  })
})

describe('pair', () => {
  const users = ['alice', 'bob', 'carol', 'dave', 'erin']

  it('每人送出一次、收到一次、不會抽到自己', () => {
    const pairs = pair(users, 'seed')
    assert.equal(pairs.length, users.length)
    assert.deepEqual(pairs.map((p) => p.from).toSorted(), users)
    assert.deepEqual(pairs.map((p) => p.to).toSorted(), users)
    for (const p of pairs) assert.notEqual(p.from, p.to)
  })

  it('同 seed 結果相同、與輸入順序無關', () => {
    assert.deepEqual(pair(users, 'x'), pair(users.toReversed(), 'x'))
    const differs = ['a', 'b', 'c', 'd', 'e', 'f'].some(
      (s) => JSON.stringify(pair(users, s)) !== JSON.stringify(pair(users, 'x')),
    )
    assert.ok(differs)
  })

  it('人數不足時報錯', () => {
    assert.throws(() => pair(['alice'], 's'))
  })
})

describe('renderComment', () => {
  const result: JudgeResult = {
    user: 'alice',
    ok: true,
    language: 'py',
    languageName: 'Python 3.13',
    errors: [],
    stdout: '\x1b[32m*\x1b[0m\n```\n',
    stderr: '',
    stats: { cols: 3, rows: 2, bytes: 20, timeMs: 50 },
  }

  it('merge 時顯示去色的輸出預覽', () => {
    const md = renderComment({ action: 'merge', author: 'alice', foreign: [], result })
    assert.ok(md.startsWith(COMMENT_MARKER))
    assert.match(md, /已自動合併/)
    assert.match(md, /````\n\*\n```\n````/)
    assert.ok(!md.includes('\x1b'))
  })

  it('動畫顯示最後一格與長度', () => {
    const animation = { cast: '', duration: 9.9, truncated: true, posterTime: 9.9 }
    const md = renderComment({
      action: 'merge',
      author: 'alice',
      foreign: [],
      result: { ...result, stdout: '  *\n ***', animation },
    })
    assert.match(md, /動畫 9\.9 秒，已截斷/)
    assert.match(md, /```\n  \*\n \*\*\*\n```/)
  })

  it('改到別人的投稿時列出路徑與重新投稿方式', () => {
    const md = renderComment({
      action: 'reject',
      author: 'alice',
      foreign: ['submissions/bob/tree.py'],
      result: null,
    })
    assert.match(md, /PR 已關閉/)
    assert.match(md, /其他人的投稿/)
    assert.match(md, /submissions\/bob\/tree\.py/)
    assert.match(md, /新的 PR/)
    assert.doesNotMatch(md, /找不到 judge 結果/)
  })

  it('closed 時依活動狀態說明，不顯示找不到結果', () => {
    const input = { action: 'closed' as const, author: 'alice', foreign: [], result: null }
    const before = renderComment({ ...input, eventState: 'NOT_STARTED' })
    assert.match(before, /還沒開始/)
    assert.doesNotMatch(before, /找不到 judge 結果/)
    assert.match(renderComment({ ...input, eventState: 'ENDED' }), /停止收件/)
  })

  it('error 時說明不是參加者的問題', () => {
    const md = renderComment({ action: 'error', author: 'alice', foreign: [], result: null })
    assert.match(md, /judge 發生錯誤/)
    assert.match(md, /找不到 judge 結果/)
  })
})

describe('decide', () => {
  const ok: JudgeResult = {
    user: 'alice',
    ok: true,
    language: 'py',
    languageName: 'Python 3.13',
    errors: [],
    stdout: '*',
    stderr: '',
    stats: {},
  }
  const fail = (code: ErrorCode): JudgeResult => ({
    ...ok,
    ok: false,
    errors: [{ code, message: '' }],
  })
  const base: DecideInput = {
    eventState: 'PROGRESS',
    draft: false,
    targetsDefault: true,
    userType: 'User',
    paths: { outside: [], foreign: [] },
    result: ok,
  }

  it('只改自己的投稿且通過 → merge', () => {
    const d = decide(base)
    assert.equal(d.action, 'merge')
    assert.ok(d.pass)
  })

  it('只改自己的投稿但未通過 → reject', () => {
    const d = decide({ ...base, result: fail('timeout') })
    assert.equal(d.action, 'reject')
    assert.ok(!d.pass)
  })

  it('改到別人的投稿 → 不評測直接 reject', () => {
    const input = { ...base, paths: { outside: [], foreign: ['submissions/bob/tree.py'] } }
    assert.equal(precheck(input)?.action, 'reject')
    assert.equal(decide({ ...input, result: null }).action, 'reject')
  })

  it('改到 submissions/ 以外 → 一般 PR，不評測、check 綠燈、等 review', () => {
    for (const paths of [
      { outside: ['rules.ts'], foreign: [] },
      { outside: ['README.md'], foreign: ['submissions/bob/tree.py'] },
    ]) {
      const d = precheck({ ...base, paths, result: null })
      assert.equal(d?.action, 'skip')
      assert.ok(d?.pass)
    }
  })

  it('需要評測的投稿 PR，precheck 回傳 null', () => {
    assert.equal(precheck({ ...base, result: null }), null)
  })

  it('judge 內部錯誤或沒有結果 → error，不關閉 PR', () => {
    assert.equal(decide({ ...base, result: fail('internal_error') }).action, 'error')
    assert.equal(decide({ ...base, result: null }).action, 'error')
  })

  it('只有 PROGRESS / PROGRESS_SYNC 收件', () => {
    assert.equal(decide({ ...base, eventState: 'PROGRESS' }).action, 'merge')
    assert.equal(decide({ ...base, eventState: 'PROGRESS_SYNC' }).action, 'merge')
    for (const eventState of ['NOT_STARTED', 'ENDED', 'FATAL'] as const) {
      const d = precheck({ ...base, eventState, result: null })
      assert.equal(d?.action, 'closed')
      assert.ok(!d?.pass)
    }
  })

  it('不收件不影響一般功能性 PR', () => {
    const paths = { outside: ['rules.ts'], foreign: [] }
    assert.equal(decide({ ...base, eventState: 'FATAL', paths }).action, 'skip')
  })

  it('draft、bot、非預設分支 → skip', () => {
    assert.equal(decide({ ...base, draft: true }).action, 'skip')
    assert.equal(decide({ ...base, userType: 'Bot' }).action, 'skip')
    assert.equal(decide({ ...base, targetsDefault: false }).action, 'skip')
  })
})

describe('EVENT_STATE', () => {
  it('五種狀態對應收件與公開', () => {
    assert.deepEqual(EVENT_POLICIES.NOT_STARTED, { acceptSubmissions: false, publishTrees: false })
    assert.deepEqual(EVENT_POLICIES.PROGRESS, { acceptSubmissions: true, publishTrees: false })
    assert.deepEqual(EVENT_POLICIES.PROGRESS_SYNC, { acceptSubmissions: true, publishTrees: true })
    assert.deepEqual(EVENT_POLICIES.ENDED, { acceptSubmissions: false, publishTrees: true })
    assert.deepEqual(EVENT_POLICIES.FATAL, { acceptSubmissions: false, publishTrees: false })
  })

  it('未定義或不認得的值視為 FATAL，大小寫與空白不影響', () => {
    for (const v of [undefined, '', 'progress-sync', 'OPEN'])
      assert.equal(parseEventState(v), 'FATAL')
    assert.equal(parseEventState(' progress_sync '), 'PROGRESS_SYNC')
    assert.equal(parseEventState('ended'), 'ENDED')
  })
})
