// 動畫作品的 asciicast 檔：/casts/<user>.cast
// 動畫可能有上百 KB，不塞進頁面資料，而是另外輸出成檔案，播放時才下載。
// build 時寫進輸出資料夾；dev 時由 middleware 直接提供。不公開作品時兩者都不會有任何檔案。

import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { publishedResults } from './results.ts'

async function animatedCasts(): Promise<Map<string, string>> {
  return new Map(
    (await publishedResults()).flatMap((r) =>
      r.animation ? [[r.user, r.animation.cast] as const] : [],
    ),
  )
}

export async function writeCasts(outDir: string): Promise<void> {
  const casts = await animatedCasts()
  if (!casts.size) return
  const dir = path.join(outDir, 'casts')
  fs.mkdirSync(dir, { recursive: true })
  for (const [user, cast] of casts) fs.writeFileSync(path.join(dir, `${user}.cast`), cast)
}

export function castsDevServer(): Plugin {
  return {
    name: 'gift-casts',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /\/casts\/([A-Za-z0-9-]+)\.cast$/.exec(req.url?.split('?')[0] ?? '')
        if (!m) return next()
        animatedCasts()
          .then((casts) => {
            const cast = casts.get(m[1]!)
            if (!cast) return next()
            res.setHeader('content-type', 'text/plain; charset=utf-8')
            res.end(cast)
          })
          .catch(next)
      })
    },
  }
}
