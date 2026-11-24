// 投稿資料夾的擁有者：用 GitHub 的數字 user ID 綁定，不會因為改名而變。
//
// bot 每次 squash merge 投稿時，會在 commit message 寫入 Gift-Author-Id 這行（見 act.ts）。
// main 只有 bot 與主辦方能寫入，所以 commit 紀錄就是可信的擁有者紀錄，不需要另外的狀態檔。

export const AUTHOR_ID_TRAILER = 'Gift-Author-Id'

/** squash commit 的內文：固定內容，不沿用 PR 中任何 commit 的訊息（偽造的 Co-authored-by 進不了 main） */
export function mergeCommitMessage(login: string, userId: number): string {
  return `Submitted by @${login}\n\n${AUTHOR_ID_TRAILER}: ${userId}`
}

export function parseAuthorIds(message: string): number[] {
  const re = new RegExp(`^${AUTHOR_ID_TRAILER}:\\s*(\\d+)\\s*$`, 'gm')
  return [...message.matchAll(re)].map((m) => Number(m[1]))
}

/** 只需要 GitHub client 的這兩個方法，測試時可以換成假的 */
export interface GitHubReader {
  request<T>(method: string, pathname: string): Promise<T>
  paginate<T>(pathname: string): Promise<T[]>
}

/**
 * 檢查 login（id 為 userId）能不能動 submissions/<login>/，不行時回傳原因。
 * - 已有大小寫不同的同名資料夾：GitHub 帳號不分大小寫，但 git 路徑分
 * - 這個資料夾先前是另一個 user ID 投稿的：原作者改名後，名稱被別人註冊
 */
export async function ownershipProblem(
  gh: GitHubReader,
  branch: string,
  login: string,
  userId: number,
): Promise<string | null> {
  let folders: { name: string; type: string }[] = []
  try {
    folders = await gh.request('GET', `/contents/submissions?ref=${encodeURIComponent(branch)}`)
  } catch (e) {
    // submissions/ 還不存在（第一份投稿）
    if (!String(e).includes('404')) throw e
  }
  const clash = folders.find(
    (f) => f.type === 'dir' && f.name !== login && f.name.toLowerCase() === login.toLowerCase(),
  )
  if (clash) {
    return `已經有大小寫不同的同名資料夾 submissions/${clash.name}/，請聯絡主辦方`
  }

  const commits = await gh.paginate<{ commit: { message: string } }>(
    `/commits?sha=${encodeURIComponent(branch)}&path=submissions/${login}`,
  )
  const owners = new Set(commits.flatMap((c) => parseAuthorIds(c.commit.message)))
  if ([...owners].some((id) => id !== userId)) {
    return `submissions/${login}/ 先前是由另一個 GitHub 帳號投稿的（可能是改名前使用這個名稱的人），請聯絡主辦方`
  }
  return null
}
