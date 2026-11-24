import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { deadlineSeed, isCommitSeed, seedTag, taggedSeed } from '../src/seed.ts'

/** 依序在指定時間建立 commit，回傳各 commit 的 sha */
function repoWithCommits(dates: string[]): { dir: string; shas: string[] } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gift-seed-'))
  const git = (args: string[], date?: string) =>
    execFileSync('git', args, {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 't',
        GIT_AUTHOR_EMAIL: 't@example.com',
        GIT_COMMITTER_NAME: 't',
        GIT_COMMITTER_EMAIL: 't@example.com',
        ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}),
      },
    }).trim()
  git(['init', '-q'])
  const shas = dates.map((date, i) => {
    git(['commit', '-q', '--allow-empty', '--no-gpg-sign', '-m', `c${i}`], date)
    return git(['rev-parse', 'HEAD'])
  })
  return { dir, shas }
}

describe('deadlineSeed', () => {
  const { dir, shas } = repoWithCommits([
    '2026-12-24T20:00:00+08:00',
    '2026-12-24T23:59:59+08:00',
    '2026-12-25T00:00:01+08:00',
  ])

  it('取截止時間（含）之前的最後一個 commit', () => {
    assert.equal(deadlineSeed('2026-12-24T23:59:59+08:00', dir), shas[1])
    assert.equal(deadlineSeed('2026-12-24T15:59:59Z', dir), shas[1])
    assert.equal(deadlineSeed('2026-12-24T22:00:00+08:00', dir), shas[0])
  })

  it('截止前沒有 commit 時報錯', () => {
    assert.throws(() => deadlineSeed('2026-01-01T00:00:00Z', dir), /沒有任何 commit/)
  })
})

describe('交換 tag', () => {
  const tag = (dir: string, ...args: string[]) =>
    execFileSync('git', ['tag', ...args], { cwd: dir, encoding: 'utf8' })

  it('commit sha 的 seed → tag exchange 指向那個 commit', () => {
    const { dir, shas } = repoWithCommits(['2026-12-24T20:00:00Z', '2026-12-25T20:00:00Z'])
    assert.equal(isCommitSeed(shas[0]!, dir), true)
    assert.deepEqual(seedTag(shas[0]!, dir), { name: 'exchange', target: shas[0] })
    assert.equal(taggedSeed(dir), null)
    tag(dir, 'exchange', shas[0]!)
    assert.equal(taggedSeed(dir), shas[0])
  })

  it('自訂 seed → tag exchange-<seed>，之後從 tag 名稱讀回 seed', () => {
    const { dir } = repoWithCommits(['2026-12-24T20:00:00Z'])
    const seed = '00000000000000000002a7c4c1e48d76c9a20e5ca5f0a7d1e9b8f3c2a1d4e5f6'
    assert.equal(isCommitSeed(seed, dir), false)
    assert.deepEqual(seedTag(seed, dir), { name: `exchange-${seed}`, target: null })
    assert.deepEqual(seedTag('7-23-41', dir), { name: 'exchange-7-23-41', target: null })
    tag(dir, 'exchange-7-23-41')
    assert.equal(taggedSeed(dir), '7-23-41')
  })

  it('不能當 tag 名稱的 seed 報錯', () => {
    const { dir } = repoWithCommits(['2026-12-24T20:00:00Z'])
    for (const seed of ['has space', 'a..b', 'x~1', 'end.lock']) {
      assert.throws(() => seedTag(seed, dir), /不能當作 tag/, seed)
    }
  })

  it('交換 tag 不只一個時報錯', () => {
    const { dir } = repoWithCommits(['2026-12-24T20:00:00Z'])
    tag(dir, 'exchange')
    tag(dir, 'exchange-abc')
    assert.throws(() => taggedSeed(dir), /多個交換 tag/)
  })
})
