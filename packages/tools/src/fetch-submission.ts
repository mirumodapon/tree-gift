import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function git(cwd: string, ...args: string[]) {
  return spawnSync('git', args, { cwd, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })
}

/**
 * 從 origin 抓下 sha，把其中的 submissions/<author>/ 解到暫存資料夾並回傳路徑。
 * 只把檔案當資料取出，不會 checkout 或執行任何東西。
 * 資料夾不存在時回傳的路徑也不存在，交給 judge 回報 no_folder。
 */
export function fetchSubmission(
  repoDir: string,
  sha: string,
  author: string,
  token?: string,
): string {
  const auth = token
    ? [
        '-c',
        `http.https://github.com/.extraheader=AUTHORIZATION: basic ${btoa(`x-access-token:${token}`)}`,
      ]
    : []
  const fetched = git(repoDir, ...auth, 'fetch', '--no-tags', '--depth=1', 'origin', sha)
  if (fetched.status !== 0) throw new Error(`git fetch 失敗：${fetched.stderr.toString()}`)

  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'pr-'))
  fs.chmodSync(tmp, 0o755)
  const archive = git(repoDir, 'archive', '--format=tar', sha, `submissions/${author}`)
  if (archive.status === 0) {
    const untar = spawnSync('tar', ['-x', '-C', tmp], { input: archive.stdout })
    if (untar.status !== 0) throw new Error(`解壓縮失敗：${untar.stderr.toString()}`)
  }
  return path.join(tmp, 'submissions', author)
}
