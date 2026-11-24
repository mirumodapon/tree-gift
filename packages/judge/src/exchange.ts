// exchange.json 的格式：由 tools 的 exchange.ts 寫入（commit 回 repo），site 讀取。

import fs from 'node:fs'
import path from 'node:path'
import { LOGIN_RE } from './judge.ts'
import { REPO_ROOT } from './rules.ts'

export interface Pair {
  /** 送出樹的人（作者） */
  from: string
  /** 收到樹的人 */
  to: string
}

export interface Exchange {
  /** 配對用的公開 seed，任何人都能用它重算驗證 */
  seed: string
  createdAt: string
  pairs: Pair[]
}

export const EXCHANGE_FILE = path.join(REPO_ROOT, 'exchange.json')

export function writeExchange(exchange: Exchange, file = EXCHANGE_FILE): void {
  fs.writeFileSync(file, JSON.stringify(exchange, null, 2) + '\n')
}

/**
 * 讀取交換結果，尚未交換時回傳 null。
 * 帳號會拿來組檔案路徑與網址，不符合 GitHub ID 格式的配對一律濾掉。
 */
export function readExchange(file = EXCHANGE_FILE): Exchange | null {
  if (!fs.existsSync(file)) return null
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Exchange
  return {
    ...raw,
    pairs: (raw.pairs ?? []).filter((p) => LOGIN_RE.test(p.from) && LOGIN_RE.test(p.to)),
  }
}
