import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { LOGIN_RE } from './judge.ts'
import type { Rules } from './types.ts'

export const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')

/** CLI 參數是存在的資料夾就直接用，否則當成 GitHub ID 對應到 submissions/<id>/；都找不到就結束程式。 */
export function resolveDir(arg: string): string {
  if (fs.statSync(arg, { throwIfNoEntry: false })?.isDirectory()) return arg
  const sub = path.join(REPO_ROOT, 'submissions', arg)
  if (fs.statSync(sub, { throwIfNoEntry: false })?.isDirectory()) return sub
  console.error(`找不到資料夾：${path.resolve(arg)}`)
  console.error(`也找不到投稿：${path.relative(process.cwd(), sub) || sub}`)
  process.exit(2)
}

/** 載入規則設定，預設為 repo 根目錄的 rules.ts。 */
export async function loadRules(file = path.join(REPO_ROOT, 'rules.ts')): Promise<Rules> {
  const mod = (await import(pathToFileURL(path.resolve(file)).href)) as { default: Rules }
  validateRules(mod.default)
  return mod.default
}

/** login 能不能投稿：白名單未啟用時一律可以；啟用時須在名單內（不分大小寫）。 */
export function isAllowed(rules: Rules, login: string): boolean {
  const { enabled, users } = rules.allowlist
  return !enabled || users.some((u) => u.toLowerCase() === login.toLowerCase())
}

export function validateRules(rules: Rules): void {
  const seen = new Set<string>()
  for (const user of rules.allowlist.users) {
    if (!LOGIN_RE.test(user)) {
      throw new Error(`rules.ts：allowlist.users 的 ${JSON.stringify(user)} 不是合法的 GitHub 帳號`)
    }
    if (seen.has(user.toLowerCase())) {
      throw new Error(`rules.ts：allowlist.users 重複列出 ${user}（不分大小寫）`)
    }
    seen.add(user.toLowerCase())
  }
  if (!rules.animation.enabled) return
  for (const [ext, lang] of Object.entries(rules.languages)) {
    const timeout = lang.runTimeout ?? rules.sandbox.runTimeout
    if (rules.animation.maxSeconds < timeout) {
      throw new Error(
        `rules.ts：animation.maxSeconds（${rules.animation.maxSeconds}）必須 >= ${ext} 的執行逾時（${timeout}）`,
      )
    }
  }
  if (rules.animation.maxBytes < rules.output.maxBytes) {
    throw new Error('rules.ts：animation.maxBytes 必須 >= output.maxBytes')
  }
}
