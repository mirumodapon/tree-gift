// 最小的 GitHub REST client（只用到 fetch）。

export class GitHub {
  readonly repo: string
  readonly token: string

  constructor(repo: string, token: string) {
    this.repo = repo
    this.token = token
  }

  async request<T>(method: string, pathname: string, body?: unknown): Promise<T> {
    const res = await fetch(`https://api.github.com/repos/${this.repo}${pathname}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${this.token}`,
        'x-github-api-version': '2022-11-28',
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`${method} ${pathname} → ${res.status} ${await res.text()}`)
    return (await res.json()) as T
  }

  /** 依序取完所有分頁 */
  async paginate<T>(pathname: string): Promise<T[]> {
    const all: T[] = []
    const sep = pathname.includes('?') ? '&' : '?'
    for (let page = 1; ; page++) {
      const items = await this.request<T[]>('GET', `${pathname}${sep}per_page=100&page=${page}`)
      all.push(...items)
      if (items.length < 100) return all
    }
  }
}
