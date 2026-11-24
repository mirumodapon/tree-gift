// 每位收到禮物的人、每種語言一頁：/<locale>/gifts/<user>.html
// 不公開作品（EVENT_STATE）或尚未交換時不產生任何頁面。
// 交換公告裡的 /gifts/<user>.html 沒有語言前綴，瀏覽器端會導向這裡（見 locales.ts）。

import { readExchange } from '@gift/judge'
import { siteEvent } from '../../.vitepress/event.ts'
import { LOCALES } from '../../.vitepress/locales.ts'

export default {
  async paths() {
    if (!(await siteEvent()).policy.publishTrees) return []
    const users = (readExchange()?.pairs ?? []).map((p) => p.to)
    return LOCALES.flatMap((lang) => users.map((user) => ({ params: { lang, user } })))
  },
}
