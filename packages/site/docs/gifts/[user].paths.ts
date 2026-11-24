// 每位收到禮物的人一頁：/gifts/<user>.html
// 不公開作品（EVENT_STATE）或尚未交換時不產生任何頁面。

import { currentEvent, readExchange } from '@gift/judge'

export default {
  paths() {
    if (!currentEvent().policy.publishTrees) return []
    return (readExchange()?.pairs ?? []).map((p) => ({ params: { user: p.to } }))
  },
}
