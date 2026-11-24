// 網站 build 時的活動狀態。config.ts 一開始就把 EVENT_NOW 固定成 build 開始的時間，
// TIME 模式下 build 途中跨過截止時間，各頁面看到的狀態也會一致。

import { currentEvent, loadRules, type CurrentEvent } from '@gift/judge'

export async function siteEvent(): Promise<CurrentEvent> {
  return currentEvent((await loadRules()).schedule)
}
