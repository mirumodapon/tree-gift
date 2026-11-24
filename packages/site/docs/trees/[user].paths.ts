// 每位提交者一頁：/trees/<user>.html
// 原始碼與 README 透過 params 只放進該頁的資料，不會進到作品牆等其他頁面。
// 不公開作品（EVENT_STATE）時 publishedResults() 是空的，不會產生任何頁面。

import { publishedResults, submissionFiles, submissionReadme } from '../.vitepress/results.ts'
import { renderReadme } from '../.vitepress/readme.ts'

export default {
  paths() {
    return publishedResults().map((r) => {
      const readme = submissionReadme(r.user)
      return {
        params: {
          user: r.user,
          files: submissionFiles(r.user, r.language!),
          readmeHtml: readme ? renderReadme(readme) : null,
        },
      }
    })
  },
}
