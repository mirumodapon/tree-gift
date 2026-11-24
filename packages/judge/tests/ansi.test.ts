import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { scanControls } from '../src/ansi.ts'

describe('scanControls', () => {
  it('靜態：換行與顏色', () => {
    assert.deepEqual(scanControls('\x1b[32m*\x1b[0m\n', true), { bad: null, motion: false })
    assert.match(scanControls('\x1b[32m*', false).bad ?? '', /顏色/)
  })

  it('動畫：游標移動、清除、\\r、隱藏游標', () => {
    for (const s of ['\r*', '\x1b[H*', '\x1b[2J', '\x1b[3A', '\x1b[?25l', '\x1b7*\x1b8', '\b']) {
      assert.deepEqual(scanControls(s, true), { bad: null, motion: true }, JSON.stringify(s))
    }
  })

  it('關閉動畫時，動畫用的序列判為不允許', () => {
    for (const s of ['\r*', '\x1b[H*', '\x1b[?25l', '\x1b7']) {
      assert.match(scanControls(s, true, false).bad ?? '', /不允許動畫/, JSON.stringify(s))
    }
    assert.equal(scanControls('\x1b[32m*\n', true, false).bad, null)
  })

  it('一律禁止 OSC、DCS、查詢、中間字元、\\t、BEL', () => {
    for (const s of [
      '\x1b]8;;https://x\x1b\\',
      '\x1bP1$r\x1b\\',
      '\x1b[6n',
      '\x1b[1 q',
      '\t',
      '\x07',
      '\x1bc',
      '\x9b',
    ]) {
      assert.notEqual(scanControls(s, true).bad, null, JSON.stringify(s))
    }
  })
})
