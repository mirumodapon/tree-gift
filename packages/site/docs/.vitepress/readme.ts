// 把參加者的 README.md 轉成 HTML。內容不可信，所以：
// - 不允許原始 HTML（<script> 等會被跳脫成文字）
// - 連結只允許 http(s) / mailto 與站內相對路徑，並加上 nofollow；圖片只允許 https
// - 標題降兩級（h1 → h3），不會和頁面本身的標題搶層級
// 產出的 HTML 用 v-html 放進頁面，不會經過 Vue 模板編譯，{{ }} 不會被執行。

import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: false, linkify: true })

const SAFE_LINK = /^(https?:|mailto:|#|\.{0,2}\/|[^:]*$)/i
const SAFE_IMAGE = /^https:/i

md.validateLink = (url) => SAFE_LINK.test(url.trim())

md.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  const token = tokens[idx]!
  token.attrSet('rel', 'nofollow noopener noreferrer ugc')
  token.attrSet('target', '_blank')
  return self.renderToken(tokens, idx, options)
}

const renderImage = md.renderer.rules.image!
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]!
  if (!SAFE_IMAGE.test(token.attrGet('src') ?? '')) {
    // 不安全的圖片只留下替代文字
    return md.utils.escapeHtml(token.content)
  }
  token.attrSet('loading', 'lazy')
  token.attrSet('referrerpolicy', 'no-referrer')
  // 沿用預設的圖片渲染（會把 alt 文字放進去）
  return renderImage(tokens, idx, options, env, self)
}

const shiftHeading = (tag: string) => `h${Math.min(6, Number(tag.slice(1)) + 2)}`
md.core.ruler.push('shift_headings', (state) => {
  for (const token of state.tokens) {
    if (token.type === 'heading_open' || token.type === 'heading_close') {
      token.tag = shiftHeading(token.tag)
    }
  }
})

export function renderReadme(markdown: string): string {
  return md.render(markdown)
}
