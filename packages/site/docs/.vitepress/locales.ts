// 網站的語言：每種語言都有網址前綴（/zh-hant/、/en/、/ja/、/ko/）。
// 沒有前綴的網址（首頁 / 與改版前的舊連結，例如交換公告裡的 /gifts/<user>.html）
// 會在瀏覽器端導向對應語言：先看上次選的語言，再看瀏覽器語言，都認不出來就用英文。
// 這個檔案不依賴 VitePress，config 與測試也會用到。

export const LOCALES = ['zh-hant', 'en', 'ja', 'ko'] as const
export type Locale = (typeof LOCALES)[number]
export const FALLBACK_LOCALE: Locale = 'en'
/** localStorage 裡記住上次看的語言 */
export const LOCALE_STORAGE_KEY = 'gift-locale'

export const isLocale = (s: unknown): s is Locale =>
  typeof s === 'string' && (LOCALES as readonly string[]).includes(s)

/** 依偏好順序的語言標籤（navigator.languages）挑出網站語言；中文不分繁簡都用繁中 */
export function detectLocale(tags: readonly string[]): Locale {
  for (const tag of tags) {
    const primary = tag.toLowerCase().split('-')[0]
    if (primary === 'zh') return 'zh-hant'
    if (primary === 'en' || primary === 'ja' || primary === 'ko') return primary
  }
  return FALLBACK_LOCALE
}

/** 沒有語言前綴的路徑（不含 base）加上前綴；已經有前綴則回傳 null */
export function localizedPath(path: string, locale: Locale): string | null {
  const first = path.split('/')[1]
  if (isLocale(first)) return null
  return `/${locale}${path}`
}
