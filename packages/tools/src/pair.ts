import { createHash } from 'node:crypto'
import type { Pair } from '@gift/judge'

/** 由 seed 決定的亂數：sha256(seed:counter) 取前 48 bits。同一個 seed 永遠得到同一組結果。 */
function seededRandom(seed: string): () => number {
  let counter = 0
  return () => {
    const h = createHash('sha256').update(`${seed}:${counter++}`).digest()
    return h.readUIntBE(0, 6) / 2 ** 48
  }
}

/**
 * 用公開的 seed 洗牌後排成一個環：每個人把樹送給下一位。
 * 單一環保證沒有人抽到自己，任何人都能用同樣的 seed 重算驗證。
 */
export function pair(users: string[], seed: string): Pair[] {
  if (users.length < 2) throw new Error('至少需要兩位參加者才能交換')
  if (new Set(users).size !== users.length) throw new Error('參加者名單有重複')
  const order = users.toSorted()
  const rand = seededRandom(seed)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j]!, order[i]!]
  }
  return order.map((from, i) => ({ from, to: order[(i + 1) % order.length]! }))
}
