/** GitHub「List pull request files」API 回傳的欄位子集 */
export interface ChangedFile {
  filename: string
  status: string
  previous_filename?: string
}

export interface PathCheck {
  /** submissions/ 以外的路徑；有任何一個就是一般功能性 PR，不進 judge */
  outside: string[]
  /** 其他人的 submissions/<other>/ 路徑；投稿 PR 不能動別人的作品 */
  foreign: string[]
}

/** 依變更的路徑（含 rename 的來源）分類 PR。 */
export function checkPaths(files: ChangedFile[], author: string): PathCheck {
  const own = `submissions/${author}/`
  const paths = files
    .flatMap((f) => [f.filename, f.previous_filename])
    .filter((p): p is string => p !== undefined)
  return {
    outside: paths.filter((p) => !p.startsWith('submissions/')),
    foreign: paths.filter((p) => p.startsWith('submissions/') && !p.startsWith(own)),
  }
}
