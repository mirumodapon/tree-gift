import { IconCircleCheck, IconCircleX, IconGitPullRequest, IconLock } from '@tabler/icons-vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import EventStatus from './components/EventStatus.vue'
import GiftPage from './components/GiftPage.vue'
import LanguageTable from './components/LanguageTable.vue'
import TreeGallery from './components/TreeGallery.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  // 首頁 hero 下方顯示目前的活動狀態
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-info-after': () => h(EventStatus) }),
  enhanceApp({ app }) {
    app.component('TreeGallery', TreeGallery)
    app.component('GiftPage', GiftPage)
    app.component('LanguageTable', LanguageTable)
    // 讓 markdown 也能直接用的 Tabler icon
    app.component('IconCircleCheck', IconCircleCheck)
    app.component('IconCircleX', IconCircleX)
    app.component('IconGitPullRequest', IconGitPullRequest)
    app.component('IconLock', IconLock)
  },
} satisfies Theme
