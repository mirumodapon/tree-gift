import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CUSTOM_LICENSE, licenseLabel, NO_LICENSE } from '../docs/.vitepress/license.ts'

describe('licenseLabel', () => {
  it('沒有授權檔 → 保留所有權利', () => {
    assert.equal(licenseLabel(null), NO_LICENSE)
  })

  it('SPDX 標示優先', () => {
    assert.equal(licenseLabel('SPDX-License-Identifier: CC-BY-4.0\nMIT License'), 'CC-BY-4.0')
  })

  it('辨識常見授權全文', () => {
    const cases: [string, string][] = [
      [
        'MIT License\n\nCopyright (c) 2026 alice\n\nPermission is hereby granted, free of charge',
        'MIT',
      ],
      ['Apache License\n                           Version 2.0, January 2004', 'Apache-2.0'],
      ['GNU GENERAL PUBLIC LICENSE\n                       Version 3, 29 June 2007', 'GPL-3.0'],
      ['GNU AFFERO GENERAL PUBLIC LICENSE\n Version 3, 19 November 2007', 'AGPL-3.0'],
      ['GNU LESSER GENERAL PUBLIC LICENSE\n Version 3, 29 June 2007', 'LGPL-3.0'],
      [
        'Redistributions of source code must retain ... Neither the name of the copyright holder',
        'BSD-3-Clause',
      ],
      ['Redistributions of source code must retain the above copyright notice', 'BSD-2-Clause'],
      ['This is free and unencumbered software released into the public domain.', 'Unlicense'],
      ['Creative Commons Attribution-ShareAlike 4.0 International Public License', 'CC BY-SA 4.0'],
      ['Creative Commons Attribution 4.0 International Public License', 'CC BY 4.0'],
    ]
    for (const [text, want] of cases) assert.equal(licenseLabel(text), want, want)
  })

  it('認不出來 → 自訂授權', () => {
    assert.equal(licenseLabel('隨便你用，但請告訴我一聲'), CUSTOM_LICENSE)
  })
})
