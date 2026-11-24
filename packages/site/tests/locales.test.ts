import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { detectLocale, localizedPath } from '../docs/.vitepress/locales.ts'

describe('detectLocale', () => {
  it('依偏好順序挑第一個支援的語言', () => {
    assert.equal(detectLocale(['fr-FR', 'ja-JP', 'en']), 'ja')
    assert.equal(detectLocale(['ko']), 'ko')
    assert.equal(detectLocale(['en-GB']), 'en')
  })

  it('中文不分繁簡都用繁中', () => {
    for (const tag of ['zh-TW', 'zh-Hant-HK', 'zh-CN', 'zh']) {
      assert.equal(detectLocale([tag]), 'zh-hant', tag)
    }
  })

  it('認不出來就用英文', () => {
    assert.equal(detectLocale(['fr', 'de']), 'en')
    assert.equal(detectLocale([]), 'en')
  })
})

describe('localizedPath', () => {
  it('沒有前綴的路徑加上語言', () => {
    assert.equal(localizedPath('/', 'ja'), '/ja/')
    assert.equal(localizedPath('/gifts/alice.html', 'en'), '/en/gifts/alice.html')
    assert.equal(localizedPath('/guide/', 'ko'), '/ko/guide/')
  })

  it('已有前綴就不導向，避免迴圈', () => {
    assert.equal(localizedPath('/en/', 'ja'), null)
    assert.equal(localizedPath('/zh-hant/nope.html', 'en'), null)
  })
})
