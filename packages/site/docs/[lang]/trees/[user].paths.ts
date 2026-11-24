// 每位提交者、每種語言一頁：/<locale>/trees/<user>.html
// 原始碼與 README 透過 params 只放進該頁的資料，不會進到作品牆等其他頁面。
// 不公開作品（EVENT_STATE）時 publishedResults() 是空的，不會產生任何頁面。

import { LOCALES } from '../../.vitepress/locales.ts'
import { renderReadme } from '../../.vitepress/readme.ts'
import {
  publishedResults,
  submissionFiles,
  submissionLicense,
  submissionReadme,
} from '../../.vitepress/results.ts'

export default {
  paths() {
    const trees = publishedResults().map((r) => {
      const readme = submissionReadme(r.user)
      return {
        user: r.user,
        files: submissionFiles(r.user, r.language!),
        readmeHtml: readme ? renderReadme(readme) : null,
        license: submissionLicense(r.user),
      }
    })
    return LOCALES.flatMap((lang) => trees.map((t) => ({ params: { lang, ...t } })))
  },
}
