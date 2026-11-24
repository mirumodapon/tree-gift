// 元件用：目前頁面語言的介面文字，與加上語言前綴的站內連結。

import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import { CUSTOM_LICENSE, NO_LICENSE } from '../license.ts'
import { FALLBACK_LOCALE, isLocale, type Locale } from '../locales.ts'
import { MESSAGES } from './messages.ts'

/** 目前頁面的介面文字，與加上語言前綴的站內連結 */
export function useI18n() {
  const { localeIndex } = useData()
  const locale = computed<Locale>(() =>
    isLocale(localeIndex.value) ? localeIndex.value : FALLBACK_LOCALE,
  )
  const t = computed(() => MESSAGES[locale.value])
  /** path 以 / 開頭，例如 /gallery.html */
  const link = (path: string) => withBase(`/${locale.value}${path}`)
  /** data loader 給的授權名稱；沒有授權檔與自訂授權要翻譯 */
  const licenseName = (license: string) =>
    license === NO_LICENSE
      ? t.value.noLicense
      : license === CUSTOM_LICENSE
        ? t.value.customLicense
        : license
  return { locale, t, link, licenseName }
}
