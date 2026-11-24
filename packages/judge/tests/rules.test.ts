import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isAllowed, loadRules, validateRules } from '../src/rules.ts'
import type { Rules } from '../src/types.ts'

const rules = await loadRules()
const withList = (enabled: boolean, users: string[]): Rules => ({
  ...rules,
  allowlist: { enabled, users },
})

describe('allowlist', () => {
  it('未啟用時所有人都可以投稿', () => {
    assert.ok(isAllowed(withList(false, []), 'anyone'))
    assert.ok(isAllowed(withList(false, ['alice']), 'bob'))
  })

  it('啟用時只有名單內的帳號可以投稿，不分大小寫', () => {
    const r = withList(true, ['Alice', 'bob'])
    assert.ok(isAllowed(r, 'alice'))
    assert.ok(isAllowed(r, 'BOB'))
    assert.ok(!isAllowed(r, 'carol'))
    assert.ok(!isAllowed(withList(true, []), 'alice'))
  })

  it('名單裡有不合法或重複的帳號時報錯', () => {
    assert.throws(() => validateRules(withList(true, ['not a login'])), /不是合法/)
    assert.throws(() => validateRules(withList(true, ['alice', 'ALICE'])), /重複/)
    assert.doesNotThrow(() => validateRules(withList(true, ['alice', 'bob-2'])))
  })
})
