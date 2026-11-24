import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { deadlineSeed } from '../src/seed.ts'

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
