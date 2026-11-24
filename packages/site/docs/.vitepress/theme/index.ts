import { IconCircleCheck, IconCircleX, IconGitPullRequest, IconLock } from '@tabler/icons-vue'
import { useData, type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { defineComponent, h, onMounted, watch } from 'vue'
import { detectLocale, isLocale, LOCALE_STORAGE_KEY, localizedPath } from '../locales.ts'
import EventStatus from './components/EventStatus.vue'
import GiftPage from './components/GiftPage.vue'
import LanguageTable from './components/LanguageTable.vue'
import TreeGallery from './components/TreeGallery.vue'
import TreePage from './components/TreePage.vue'
import './style.css'

/** 沒有語言前綴的網址導向對應語言（見 locales.ts） */
function redirectToLocale(base: string): void {
  const { pathname, search, hash } = location
  if (!pathname.startsWith(base)) return
  let saved: string | null = null
  try {
    saved = localStorage.getItem(LOCALE_STORAGE_KEY)
  } catch {
    // 停用 storage 時就只看瀏覽器語言
  }
  const locale = isLocale(saved) ? saved : detectLocale(navigator.languages ?? [navigator.language])
  const target = localizedPath(`/${pathname.slice(base.length)}`, locale)
  if (target) location.replace(`${base}${target.slice(1)}${search}${hash}`)
}

const Layout = defineComponent({
  setup() {
    const { localeIndex, site } = useData()
    onMounted(() => redirectToLocale(site.value.base))
    // 記住看過的語言，下次從沒有前綴的網址進來時沿用
    watch(
      localeIndex,
      (locale) => {
        if (typeof window === 'undefined' || !isLocale(locale)) return
        try {
          localStorage.setItem(LOCALE_STORAGE_KEY, locale)
        } catch {
          // 停用 storage 時不記
        }
      },
      { immediate: true },
    )
    // 首頁 hero 下方顯示目前的活動狀態
    return () => h(DefaultTheme.Layout, null, { 'home-hero-info-after': () => h(EventStatus) })
  },
})

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('TreeGallery', TreeGallery)
    app.component('TreePage', TreePage)
    app.component('GiftPage', GiftPage)
    app.component('LanguageTable', LanguageTable)
    // 讓 markdown 也能直接用的 Tabler icon
    app.component('IconCircleCheck', IconCircleCheck)
    app.component('IconCircleX', IconCircleX)
    app.component('IconGitPullRequest', IconGitPullRequest)
    app.component('IconLock', IconLock)
  },
} satisfies Theme
