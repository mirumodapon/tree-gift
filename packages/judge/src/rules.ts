import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Rules } from './types.ts'

export const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')

/** 載入規則設定，預設為 repo 根目錄的 rules.ts。 */
export async function loadRules(file = path.join(REPO_ROOT, 'rules.ts')): Promise<Rules> {
  const mod = (await import(pathToFileURL(path.resolve(file)).href)) as { default: Rules }
  return mod.default
}
