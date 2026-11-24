// 在沙箱中執行投稿，把輸出直接顯示在終端機上（動畫會即時播放）。只執行，不評測。
// 用法：
//   pnpm play <github-id>        執行 submissions/<github-id>/
//   pnpm play <資料夾路徑>        執行任意資料夾（例如 examples/animation）
// 選項：[--rules rules.ts]

import path from 'node:path'
import { parseArgs } from 'node:util'
import { findEntry } from './judge.ts'
import { loadRules, resolveDir } from './rules.ts'
import { Sandbox, STDERR_CAP } from './sandbox.ts'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { rules: { type: 'string' } },
})
if (positionals.length !== 1) {
  console.error('用法：pnpm play <github-id 或資料夾路徑> [--rules rules.ts]')
  process.exit(2)
}

const rules = await loadRules(values.rules)
const dir = resolveDir(positionals[0]!)
const errors: string[] = []
const src = findEntry(dir, rules, (code, message, messageEn) =>
  errors.push(`[${code}] ${message}\n  ${messageEn}`),
)
if (!src || errors.length) {
  for (const e of errors) console.error(`❌ ${e}`)
  process.exit(1)
}

const lang = rules.languages[path.extname(src).slice(1)]!
const sb = rules.sandbox
// 和評測相同：動畫最多跑到 animation.maxSeconds，否則是該語言的執行逾時
const runTimeout = lang.runTimeout ?? sb.runTimeout
const timeout = rules.animation.enabled ? rules.animation.maxSeconds : runTimeout

const box = new Sandbox(lang.image, dir, sb, lang.compile ? sb.compileMemory : sb.memory)
const cleanup = () => {
  box.close()
  // 動畫可能藏了游標或留下顏色
  if (process.stdout.isTTY) process.stdout.write('\x1b[0m\x1b[?25h')
}
process.on('SIGINT', () => {
  cleanup()
  process.exit(130)
})

let exitCode = 0
try {
  if (lang.compile) {
    process.stderr.write(`🔨 編譯中（${lang.name}）…\n`)
    const r = await box.exec(lang.compile, sb.compileTimeout, STDERR_CAP)
    if (r.status === 'timeout' || r.code !== 0) {
      process.stderr.write(Buffer.concat([r.stdout, r.stderr]))
      console.error(r.status === 'timeout' ? `❌ 編譯超過 ${sb.compileTimeout} 秒` : '❌ 編譯失敗')
      exitCode = 1
    } else {
      box.limitMemory(sb.memory)
    }
  }
  if (exitCode === 0) {
    const r = await box.attach(lang.run, timeout, {
      cols: rules.output.maxCols,
      rows: rules.output.maxRows,
    })
    if (r.timedOut) {
      console.error(`\n⏱️  已執行 ${timeout} 秒，停止程式`)
    } else if (r.code !== 0) {
      console.error(`\n❌ 結束代碼 ${r.code}`)
      exitCode = r.code ?? 1
    }
  }
} finally {
  cleanup()
}
process.exit(exitCode)
