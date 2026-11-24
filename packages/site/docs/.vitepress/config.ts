import path from 'node:path'
import { currentEvent, REPO_ROOT } from '@gift/judge'
import { defineConfig } from 'vitepress'
import { castsDevServer, writeCasts } from './casts.ts'

const repo = process.env.GITHUB_REPOSITORY

// GitHub Pages 的專案網站在 /<repo>/ 底下，由 pages.yml 傳入
const base = process.env.SITE_BASE ?? '/'

// 不公開作品（EVENT_STATE）時整個作品牆都不出現：不產生頁面、導覽列與首頁也不放連結
const { publishTrees } = currentEvent().policy
const GALLERY = '/gallery'

export default defineConfig({
  lang: 'zh-Hant',
  title: '交換聖誕樹',
  description: '寫一支程式在終端機印出聖誕樹，和另一位參加者交換禮物。',
  base,
  outDir: path.join(REPO_ROOT, '_site'),
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }]],
  lastUpdated: false,
  srcExclude: publishTrees ? [] : ['gallery.md'],

  // 動畫作品的 /casts/<user>.cast（不公開作品時不會產生）
  vite: { plugins: [castsDevServer()] },
  buildEnd: (site) => writeCasts(site.outDir),
  // 動態路由的頁面標題；不公開作品時拿掉首頁的作品牆按鈕
  transformPageData(page) {
    const hero = page.frontmatter.hero
    if (!publishTrees && hero?.actions) {
      hero.actions = hero.actions.filter((a: { link?: string }) => a.link !== GALLERY)
    }
    const user = page.params?.user
    if (typeof user !== 'string') return
    if (page.relativePath.startsWith('trees/')) page.title = `@${user} 的聖誕樹`
    if (page.relativePath.startsWith('gifts/')) page.title = `@${user} 的聖誕禮物`
  },

  themeConfig: {
    logo: { src: '/favicon.svg', alt: '' },
    nav: [
      { text: '參加方式', link: '/guide/', activeMatch: '/guide/' },
      ...(publishTrees ? [{ text: '作品牆', link: GALLERY }] : []),
    ],
    sidebar: {
      '/guide/': [
        {
          text: '參加方式',
          items: [
            { text: '開始投稿', link: '/guide/' },
            { text: '規則', link: '/guide/rules' },
            { text: '語言與多檔案', link: '/guide/languages' },
            { text: '常見問題', link: '/guide/faq' },
          ],
        },
      ],
    },
    socialLinks: repo ? [{ icon: 'github', link: `https://github.com/${repo}` }] : [],
    footer: {
      message: '活動程式碼以 MIT 授權釋出 · 投稿作品的著作權屬於各自的作者',
      copyright: 'Merry Christmas & Happy Coding',
    },
    outline: { label: '本頁內容' },
    docFooter: { prev: '上一頁', next: '下一頁' },
    darkModeSwitchLabel: '外觀',
    lightModeSwitchTitle: '切換到淺色模式',
    darkModeSwitchTitle: '切換到深色模式',
    sidebarMenuLabel: '選單',
    returnToTopLabel: '回到頂端',
    notFound: { title: '找不到這個頁面', quote: '也許聖誕老人把它帶走了。', linkText: '回首頁' },
  },
})
