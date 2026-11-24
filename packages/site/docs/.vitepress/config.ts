import path from 'node:path'
import { currentEvent, REPO_ROOT } from '@gift/judge'
import { defineConfig, type DefaultTheme, type LocaleSpecificConfig } from 'vitepress'
import { castsDevServer, writeCasts } from './casts.ts'
import { FALLBACK_LOCALE, isLocale, LOCALES, type Locale } from './locales.ts'
import { MESSAGES } from './theme/messages.ts'

const repo = process.env.GITHUB_REPOSITORY

// GitHub Pages 的專案網站在 /<repo>/ 底下，由 pages.yml 傳入
const base = process.env.SITE_BASE ?? '/'

// 不公開作品（EVENT_STATE）時整個作品牆都不出現：不產生頁面、導覽列與首頁也不放連結
const { publishTrees } = currentEvent().policy

/** config 才用到的介面文字（導覽列、側邊欄與 VitePress 內建介面） */
interface SiteText {
  lang: string
  title: string
  description: string
  guide: string
  guidePages: { index: string; rules: string; languages: string; faq: string }
  footer: string
  outline: string
  prev: string
  next: string
  appearance: string
  toLight: string
  toDark: string
  menu: string
  toTop: string
  langMenu: string
  notFound: { title: string; quote: string; linkText: string }
}

const TEXT: Record<Locale, SiteText> = {
  'zh-hant': {
    lang: 'zh-Hant',
    title: '交換聖誕樹',
    description: '寫一支程式在終端機印出聖誕樹，和另一位參加者交換禮物。',
    guide: '參加方式',
    guidePages: { index: '開始投稿', rules: '規則', languages: '語言與多檔案', faq: '常見問題' },
    footer: '活動程式碼以 MIT 授權釋出 · 投稿作品的著作權屬於各自的作者',
    outline: '本頁內容',
    prev: '上一頁',
    next: '下一頁',
    appearance: '外觀',
    toLight: '切換到淺色模式',
    toDark: '切換到深色模式',
    menu: '選單',
    toTop: '回到頂端',
    langMenu: '切換語言',
    notFound: { title: '找不到這個頁面', quote: '也許聖誕老人把它帶走了。', linkText: '回首頁' },
  },
  en: {
    lang: 'en',
    title: 'Christmas Tree Exchange',
    description:
      'Write a program that prints a Christmas tree in the terminal, then swap trees with another participant.',
    guide: 'How to join',
    guidePages: {
      index: 'Getting started',
      rules: 'Rules',
      languages: 'Languages & multiple files',
      faq: 'FAQ',
    },
    footer:
      'Event code released under the MIT License · Submissions are copyrighted by their authors',
    outline: 'On this page',
    prev: 'Previous page',
    next: 'Next page',
    appearance: 'Appearance',
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
    menu: 'Menu',
    toTop: 'Return to top',
    langMenu: 'Change language',
    notFound: {
      title: 'Page not found',
      quote: 'Maybe Santa took it with him.',
      linkText: 'Back to home',
    },
  },
  ja: {
    lang: 'ja',
    title: 'クリスマスツリー交換',
    description: 'ターミナルにクリスマスツリーを描くプログラムを書いて、ほかの参加者と交換しよう。',
    guide: '参加方法',
    guidePages: {
      index: '投稿をはじめる',
      rules: 'ルール',
      languages: '言語と複数ファイル',
      faq: 'よくある質問',
    },
    footer: 'イベントのコードは MIT ライセンスで公開 · 投稿作品の著作権は各作者に帰属します',
    outline: 'このページの内容',
    prev: '前のページ',
    next: '次のページ',
    appearance: '外観',
    toLight: 'ライトモードに切り替え',
    toDark: 'ダークモードに切り替え',
    menu: 'メニュー',
    toTop: 'トップに戻る',
    langMenu: '言語を切り替え',
    notFound: {
      title: 'ページが見つかりません',
      quote: 'サンタさんが持っていってしまったのかも。',
      linkText: 'ホームに戻る',
    },
  },
  ko: {
    lang: 'ko',
    title: '크리스마스 트리 교환',
    description:
      '터미널에 크리스마스 트리를 그리는 프로그램을 작성하고, 다른 참가자와 트리를 교환해요.',
    guide: '참가 방법',
    guidePages: {
      index: '제출 시작하기',
      rules: '규칙',
      languages: '언어와 여러 파일',
      faq: '자주 묻는 질문',
    },
    footer: '이벤트 코드는 MIT 라이선스로 공개 · 제출 작품의 저작권은 각 작가에게 있습니다',
    outline: '이 페이지의 내용',
    prev: '이전 페이지',
    next: '다음 페이지',
    appearance: '테마',
    toLight: '라이트 모드로 전환',
    toDark: '다크 모드로 전환',
    menu: '메뉴',
    toTop: '맨 위로',
    langMenu: '언어 변경',
    notFound: {
      title: '페이지를 찾을 수 없어요',
      quote: '산타 할아버지가 가져가 버렸나 봐요.',
      linkText: '홈으로',
    },
  },
}

function themeConfig(locale: Locale): DefaultTheme.Config {
  const t = TEXT[locale]
  const p = `/${locale}`
  return {
    nav: [
      { text: t.guide, link: `${p}/guide/`, activeMatch: `${p}/guide/` },
      ...(publishTrees ? [{ text: MESSAGES[locale].gallery, link: `${p}/gallery` }] : []),
    ],
    sidebar: {
      [`${p}/guide/`]: [
        {
          text: t.guide,
          items: [
            { text: t.guidePages.index, link: `${p}/guide/` },
            { text: t.guidePages.rules, link: `${p}/guide/rules` },
            { text: t.guidePages.languages, link: `${p}/guide/languages` },
            { text: t.guidePages.faq, link: `${p}/guide/faq` },
          ],
        },
      ],
    },
    footer: { message: t.footer, copyright: 'Merry Christmas & Happy Coding' },
    outline: { label: t.outline },
    docFooter: { prev: t.prev, next: t.next },
    darkModeSwitchLabel: t.appearance,
    lightModeSwitchTitle: t.toLight,
    darkModeSwitchTitle: t.toDark,
    sidebarMenuLabel: t.menu,
    returnToTopLabel: t.toTop,
    langMenuLabel: t.langMenu,
    notFound: t.notFound,
  }
}

const locales = Object.fromEntries(
  LOCALES.map((locale): [Locale, LocaleSpecificConfig<DefaultTheme.Config> & { label: string }] => [
    locale,
    {
      label: MESSAGES[locale].label,
      lang: TEXT[locale].lang,
      title: TEXT[locale].title,
      description: TEXT[locale].description,
      themeConfig: themeConfig(locale),
    },
  ]),
)

export default defineConfig({
  // 沒有語言前綴的頁面（只有選擇語言的首頁與 404）用英文；瀏覽器端會再導向對應語言
  lang: TEXT[FALLBACK_LOCALE].lang,
  title: TEXT[FALLBACK_LOCALE].title,
  description: TEXT[FALLBACK_LOCALE].description,
  base,
  outDir: path.join(REPO_ROOT, '_site'),
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }]],
  lastUpdated: false,
  srcExclude: publishTrees ? [] : ['*/gallery.md'],
  locales,

  // 動畫作品的 /casts/<user>.cast（不公開作品時不會產生）
  vite: { plugins: [castsDevServer()] },
  buildEnd: (site) => writeCasts(site.outDir),
  // 動態路由的頁面標題；不公開作品時拿掉首頁的作品牆按鈕
  transformPageData(page) {
    const hero = page.frontmatter.hero
    if (!publishTrees && hero?.actions) {
      hero.actions = hero.actions.filter((a: { link?: string }) => !a.link?.endsWith('/gallery'))
    }
    const { user, lang } = page.params ?? {}
    if (typeof user !== 'string' || !isLocale(lang)) return
    const m = MESSAGES[lang]
    if (page.relativePath.includes('/trees/')) page.title = m.treePageTitle(user)
    if (page.relativePath.includes('/gifts/')) page.title = m.giftPageTitle(user)
  },

  themeConfig: {
    logo: { src: '/favicon.svg', alt: '' },
    socialLinks: repo ? [{ icon: 'github', link: `https://github.com/${repo}` }] : [],
    ...themeConfig(FALLBACK_LOCALE),
    // 根目錄只有選擇語言的頁面，不放導覽與側邊欄
    nav: [],
    sidebar: {},
  },
})
