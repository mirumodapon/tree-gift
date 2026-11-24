// 從投稿附上的授權檔辨識授權名稱，用來在網站上標示。
// 優先採用 SPDX-License-Identifier；其次比對常見授權的特徵文字；都不符合就是「自訂授權」。

/** 沒有附授權檔時的標示 */
export const NO_LICENSE = '保留所有權利'
/** 有授權檔但認不出來時的標示 */
export const CUSTOM_LICENSE = '自訂授權'

const SPDX_RE = /SPDX-License-Identifier:\s*([\w.+-]+)/i

/** 依序比對，越具體的放越前面（例如 AGPL、LGPL 要在 GPL 之前） */
const PATTERNS: [string, RegExp][] = [
  ['AGPL-3.0', /GNU AFFERO GENERAL PUBLIC LICENSE/i],
  ['LGPL-3.0', /GNU LESSER GENERAL PUBLIC LICENSE\s+Version 3/i],
  ['LGPL-2.1', /GNU LESSER GENERAL PUBLIC LICENSE/i],
  ['GPL-3.0', /GNU GENERAL PUBLIC LICENSE\s+Version 3/i],
  ['GPL-2.0', /GNU GENERAL PUBLIC LICENSE\s+Version 2/i],
  ['Apache-2.0', /Apache License,?\s+Version 2\.0/i],
  ['MPL-2.0', /Mozilla Public License,?\s+(Version\s+)?2\.0/i],
  ['BSD-3-Clause', /Neither the name of|BSD 3-Clause/i],
  ['BSD-2-Clause', /BSD 2-Clause|Redistributions of source code must retain/i],
  ['ISC', /ISC License|Permission to use, copy, modify, and\/or distribute this software/i],
  ['MIT', /MIT License|Permission is hereby granted, free of charge/i],
  ['Unlicense', /This is free and unencumbered software released into the public domain/i],
  ['CC0-1.0', /CC0 1\.0|Creative Commons Zero/i],
  ['CC BY-NC-SA 4.0', /Attribution-NonCommercial-ShareAlike 4\.0/i],
  ['CC BY-NC 4.0', /Attribution-NonCommercial 4\.0/i],
  ['CC BY-SA 4.0', /Attribution-ShareAlike 4\.0/i],
  ['CC BY 4.0', /Attribution 4\.0 International/i],
  ['WTFPL', /DO WHAT THE FUCK YOU WANT/i],
]

/** 回傳授權的顯示名稱；content 為 null 代表沒有附授權檔 */
export function licenseLabel(content: string | null): string {
  if (content === null) return NO_LICENSE
  const spdx = SPDX_RE.exec(content)
  if (spdx) return spdx[1]!
  return PATTERNS.find(([, re]) => re.test(content))?.[0] ?? CUSTOM_LICENSE
}
