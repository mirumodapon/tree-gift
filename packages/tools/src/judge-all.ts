// 評測全部投稿，等同 pnpm judge --all；CI 直接呼叫這支。
// 用法：node packages/tools/src/judge-all.ts [--out out/results] [--concurrency 1]

import { parseArgs } from 'node:util'
import { judgeAll, loadRules } from '@gift/judge'

const { values } = parseArgs({
  options: {
    out: { type: 'string' },
    concurrency: { type: 'string', default: '1' },
  },
})

await judgeAll(await loadRules(), {
  out: values.out,
  concurrency: Number.parseInt(values.concurrency, 10) || 1,
})
