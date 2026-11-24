<script setup lang="ts">
// 播放 ANSI 動畫（asciicast）。播放器只能在瀏覽器執行，所以在 onMounted 才載入；
// 載入前（以及沒有 JS 時）顯示最後一格畫面。
import 'asciinema-player/dist/bundle/asciinema-player.css'
import type { Player } from 'asciinema-player'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  src: string
  cols: number
  rows: number
  /** 預覽畫面的時間點（秒） */
  posterTime: number
  /** 載入前顯示的最後一格畫面（已跳脫的 HTML） */
  fallbackHtml: string
  autoPlay?: boolean
  /** 字級，與靜態作品一致 */
  fontSize?: string
  /** 預覽模式（作品牆卡片）：不顯示控制列、不攔截點擊，由外部呼叫 play / pause */
  preview?: boolean
}>()

const el = ref<HTMLElement>()
const ready = ref(false)
let player: Player | null = null

onMounted(async () => {
  const { create } = await import('asciinema-player')
  if (!el.value) return
  player = create(props.src, el.value, {
    cols: props.cols,
    rows: props.rows,
    autoPlay: props.autoPlay ?? false,
    loop: true,
    poster: `npt:${props.posterTime}`,
    // 固定字級、不縮放，和靜態作品的終端機一樣大小；太寬時可橫向捲動
    fit: false,
    terminalFontSize: props.fontSize ?? '14px',
    controls: props.preview ? false : 'auto',
    terminalFontFamily: 'var(--vp-font-family-mono)',
  })
  ready.value = true
})

onBeforeUnmount(() => player?.dispose())

defineExpose({
  play: () => void player?.play(),
  pause: () => void player?.pause(),
})
</script>

<template>
  <div class="ansi-player" :class="{ preview }">
    <pre v-if="!ready" class="gift-term" v-html="fallbackHtml" />
    <div ref="el" />
  </div>
</template>

<style scoped>
.ansi-player {
  background: var(--gift-term-bg);
  overflow-x: auto;
}

.ansi-player > div {
  padding: 16px;
}

/* 預覽模式：點擊穿透到卡片連結，也不顯示播放按鈕 */
.preview {
  pointer-events: none;
}

.preview :deep(.ap-overlay-start) {
  display: none;
}

/* 播放器配色與靜態作品的終端機一致 */
.ansi-player :deep(.ap-player) {
  --term-color-background: var(--gift-term-bg);
  --term-color-foreground: var(--gift-term-fg);
}

.ansi-player :deep(.ap-wrapper) {
  background: var(--gift-term-bg);
}
</style>
