/** GitHub「List pull request files」API 回傳的欄位子集 */
export interface ChangedFile {
  filename: string
  status: string
  previous_filename?: string
}

/** PR 只能動 submissions/<author>/ 底下的檔案；回傳違規的路徑（空陣列代表沒問題）。 */
export function checkPaths(files: ChangedFile[], author: string): string[] {
  const prefix = `submissions/${author}/`
  return files
    .flatMap((f) => [f.filename, f.previous_filename])
    .filter((p): p is string => p !== undefined && !p.startsWith(prefix))
}
