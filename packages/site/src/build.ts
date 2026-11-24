// 產生靜態展示頁（GitHub Pages）。
// 用法：node packages/site/src/build.ts [--results out/results] [--out _site]
//      （pnpm site 會先跑 judge-all 再執行這支）
//
// - index.html     所有通過 judge 的聖誕樹
// - u/<user>.html  交換後：「你收到了 @xxx 的聖誕樹」
// 交換前（沒有 exchange.json）只顯示作品牆。

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { ansi, loadRules, readExchange, REPO_ROOT, type JudgeResult } from '@gift/judge'

const { values } = parseArgs({
  options: {
    // 預設以 repo 根目錄為基準，從哪裡執行都一樣
    results: { type: 'string', default: path.join(REPO_ROOT, 'out/results') },
    out: { type: 'string', default: path.join(REPO_ROOT, '_site') },
  },
})

const esc = ansi.escapeHtml
const repo = process.env.GITHUB_REPOSITORY
const rules = await loadRules()

if (!fs.existsSync(values.results)) {
  console.error(`找不到評測結果：${values.results}`)
  console.error(
    '請先執行 node packages/tools/src/judge-all.ts，或直接用 pnpm site（會先評測再產生頁面）',
  )
  process.exit(1)
}

const results = fs
  .readdirSync(values.results)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(values.results, f), 'utf8')) as JudgeResult)
  .filter((r) => r.ok && r.stdout !== null)
  .toSorted((a, b) => a.user.localeCompare(b.user))
const byUser = new Map(results.map((r) => [r.user, r]))

const pairs = readExchange()?.pairs ?? []
const giftTo = new Map(pairs.map((p) => [p.from, p.to]))
const giftFrom = new Map(pairs.map((p) => [p.to, p.from]))

function source(r: JudgeResult): string {
  const file = path.join(REPO_ROOT, 'submissions', r.user, `tree.${r.language}`)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}

const avatar = (user: string) =>
  `<img class="avatar" src="https://github.com/${user}.png?size=64" alt="" width="32" height="32" loading="lazy">`

function card(r: JudgeResult, root: string): string {
  const to = giftTo.get(r.user)
  const srcUrl = repo
    ? `https://github.com/${repo}/blob/main/submissions/${r.user}/tree.${r.language}`
    : null
  return `
<article class="card" id="${r.user}">
  <header>
    ${avatar(r.user)}
    <a class="user" href="https://github.com/${r.user}">@${r.user}</a>
    <span class="lang">${esc(r.languageName ?? '')}</span>
  </header>
  <pre class="term">${ansi.toHtml(r.stdout!)}</pre>
  <footer>
    ${to ? `<a href="${root}u/${to}.html">🎁 送給 @${to}</a>` : '<span></span>'}
    ${srcUrl ? `<a href="${srcUrl}">原始碼</a>` : ''}
  </footer>
</article>`
}

function page(title: string, root: string, body: string): string {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
:root {
  --bg: #0b1320; --panel: #111c2e; --term: #05080f; --text: #e6edf3;
  --muted: #8b9bb4; --accent: #f5c542; --line: #22314a;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font: 15px/1.6 system-ui, -apple-system, "Noto Sans TC", sans-serif;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.wrap { max-width: 1200px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { margin: 0 0 4px; font-size: 28px; }
.sub { color: var(--muted); margin: 0 0 32px; }
.grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr)); }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
.card header, .card footer { display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
.card footer { justify-content: space-between; border-top: 1px solid var(--line); font-size: 14px; margin-top: auto; }
.avatar { border-radius: 50%; background: var(--line); }
.user { font-weight: 600; color: var(--text); }
.lang { margin-left: auto; color: var(--muted); font-size: 13px; }
.term {
  margin: 0; padding: 16px; background: var(--term); color: #e5e5e5; overflow-x: auto;
  font: 14px/1.25 ui-monospace, "SF Mono", Menlo, Consolas, "Noto Sans Mono CJK TC", monospace;
}
.gift { max-width: 760px; margin: 0 auto; }
.gift .term { border-radius: 12px; font-size: 16px; }
details { margin-top: 24px; }
summary { cursor: pointer; color: var(--muted); }
details pre { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; overflow-x: auto; }
</style>
</head>
<body>
<div class="wrap">
${body}
<p class="sub" style="margin-top:48px"><a href="${root}index.html">🎄 所有聖誕樹</a></p>
</div>
</body>
</html>
`
}

const out = values.out
fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(path.join(out, 'u'), { recursive: true })

const status = pairs.length
  ? `${pairs.length} 份聖誕樹已完成交換 🎁`
  : `目前 ${results.length} 份投稿 · 交換尚未開始`
fs.writeFileSync(
  path.join(out, 'index.html'),
  page(
    '交換聖誕樹',
    '',
    `<h1>🎄 交換聖誕樹</h1>
<p class="sub">${status} · 每棵樹不超過 ${rules.output.maxCols} × ${rules.output.maxRows}</p>
<div class="grid">${results.map((r) => card(r, '')).join('')}</div>`,
  ),
)

for (const [to, from] of giftFrom) {
  const r = byUser.get(from)
  if (!r) continue
  fs.writeFileSync(
    path.join(out, 'u', `${to}.html`),
    page(
      `@${to} 的聖誕禮物`,
      '../',
      `<div class="gift">
<h1>🎁 @${to}，你收到了一棵聖誕樹！</h1>
<p class="sub">來自 ${avatar(from)} <a href="https://github.com/${from}">@${from}</a> · ${esc(r.languageName ?? '')}</p>
<pre class="term">${ansi.toHtml(r.stdout!)}</pre>
<details><summary>看看原始碼</summary><pre><code>${esc(source(r))}</code></pre></details>
</div>`,
    ),
  )
}

console.log(`展示頁已產生：${out}（${results.length} 棵樹，${pairs.length} 組交換）`)
