import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { JudgeResult } from '@gift/judge'
import { checkPaths } from '../src/check-paths.ts'
import { codeBlock, inlineCode, plain } from '../src/markdown.ts'
import { pair } from '../src/pair.ts'
import { COMMENT_MARKER, renderComment } from '../src/render-comment.ts'

describe('checkPaths', () => {
  it('允許作者自己的資料夾', () => {
    const files = [
      { filename: 'submissions/alice/tree.py', status: 'added' },
      { filename: 'submissions/alice/README.md', status: 'modified' },
    ]
    assert.deepEqual(checkPaths(files, 'alice'), [])
  })

  it('擋下別人的資料夾、repo 檔案與 rename 來源', () => {
    const files = [
      { filename: 'submissions/bob/tree.py', status: 'modified' },
      { filename: '.github/workflows/judge.yml', status: 'modified' },
      { filename: 'submissions/alice/tree.py', status: 'renamed', previous_filename: 'rules.ts' },
      { filename: 'submissions/alice2/tree.py', status: 'added' },
    ]
    assert.deepEqual(checkPaths(files, 'alice'), [
      'submissions/bob/tree.py',
      '.github/workflows/judge.yml',
      'rules.ts',
      'submissions/alice2/tree.py',
    ])
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

  it('通過時顯示去色的輸出預覽', () => {
    const md = renderComment({ author: 'alice', badPaths: [], result })
    assert.ok(md.startsWith(COMMENT_MARKER))
    assert.match(md, /✅ 通過/)
    assert.match(md, /````\n\*\n```\n````/)
    assert.ok(!md.includes('\x1b'))
  })

  it('改到別的檔案時判定未通過', () => {
    const md = renderComment({ author: 'alice', badPaths: ['rules.ts'], result })
    assert.match(md, /❌ 未通過/)
    assert.match(md, /rules\.ts/)
  })

  it('沒有結果時判定未通過', () => {
    assert.match(renderComment({ author: 'alice', badPaths: [], result: null }), /❌ 未通過/)
  })
})
