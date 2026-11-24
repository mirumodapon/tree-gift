// 由 schedule.yml 定時呼叫：EVENT_STATE 為 TIME / TIME_SYNC 時，依時間決定這次要做什麼。
//   deploy=true    部署出去的狀態（網站的 event.json）和現在不同，例如剛過開始或截止時間
//   exchange=true  已截止、還沒交換過，而且沒有排隊或執行中的 review（截止前送出的 PR 都處理完了）
// 交換完成後 exchange.yml 會自己重新部署網站，所以 exchange 時不另外 deploy。
// 其他模式什麼都不做，維持手動操作。
//
// 環境變數：GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_OUTPUT, EVENT_STATE, SITE_URL

import fs from 'node:fs'
import { currentEvent, loadRules, readExchange, type EventState } from '@gift/judge'
import { env, GitHub } from './github.ts'

interface Decision {
  deploy: boolean
  exchange: boolean
  reason: string
}

/** 部署出去的網站狀態；還沒部署或讀不到時為 null */
async function deployedState(site: string): Promise<EventState | null> {
  try {
    const res = await fetch(`${site.replace(/\/$/, '')}/event.json`, { cache: 'no-store' })
    if (!res.ok) return null
    return ((await res.json()) as { state?: EventState }).state ?? null
  } catch {
    return null
  }
}

/** review.yml 是否還有排隊或執行中的 run */
async function reviewsPending(gh: GitHub): Promise<boolean> {
  for (const status of ['queued', 'in_progress', 'waiting', 'pending']) {
    const res = await gh.request<{ total_count: number }>(
      'GET',
      `/actions/workflows/review.yml/runs?status=${status}&per_page=1`,
    )
    if (res.total_count > 0) return true
  }
  return false
}

async function decide(): Promise<Decision> {
  const event = currentEvent((await loadRules()).schedule)
  if (!event.timed) {
    return { deploy: false, exchange: false, reason: `EVENT_STATE=${event.mode}，不依時間自動處理` }
  }
  const gh = new GitHub(env('GITHUB_REPOSITORY'), env('GITHUB_TOKEN'))

  if (event.state === 'ENDED' && !readExchange()) {
    if (await reviewsPending(gh)) {
      return { deploy: false, exchange: false, reason: '已截止，等待還在評測的 PR 處理完再交換' }
    }
    return { deploy: false, exchange: true, reason: `已在 ${event.schedule!.end} 截止，開始交換` }
  }

  const deployed = await deployedState(env('SITE_URL'))
  if (deployed !== event.state) {
    return {
      deploy: true,
      exchange: false,
      reason: `網站狀態 ${deployed ?? '未知'} → ${event.state}`,
    }
  }
  return { deploy: false, exchange: false, reason: `狀態 ${event.state}，不需要處理` }
}

const d = await decide()
console.log(d.reason)
fs.appendFileSync(env('GITHUB_OUTPUT'), `deploy=${d.deploy}\nexchange=${d.exchange}\n`)
