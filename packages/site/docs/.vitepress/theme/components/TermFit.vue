<script setup lang="ts">
// 讓終端機畫面整個縮進可用寬度：作品最寬 80 欄，在手機上會比螢幕寬，只能看到一部分。
// 只縮小、不放大，所以桌機上維持原本大小。
// 用 transform 縮放（offsetWidth 等量測值不受 transform 影響，各瀏覽器一致），
// 再把外框高度設成縮放後的高度，下方內容才不會留下原本高度的空白。
// 沒有 JS 時退回橫向捲動。
import { onBeforeUnmount, onMounted, ref } from 'vue'

const outer = ref<HTMLElement>()
const inner = ref<HTMLElement>()
const scale = ref(1)
const height = ref<number | null>(null)
let observer: ResizeObserver | null = null

function fit() {
  if (!outer.value || !inner.value) return
  const natural = inner.value.offsetWidth
  const s = natural > 0 ? Math.min(1, outer.value.clientWidth / natural) : 1
  scale.value = s
  height.value = s < 1 ? inner.value.offsetHeight * s : null
}

onMounted(() => {
  fit()
  // 外框寬度改變（旋轉螢幕）或內容改變（動畫播放器載入完成）時重新計算
  observer = new ResizeObserver(fit)
  observer.observe(outer.value!)
  observer.observe(inner.value!)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    ref="outer"
    class="term-fit"
    :class="{ scaled: scale < 1 }"
    :style="height === null ? undefined : { height: `${height}px` }"
  >
    <div
      ref="inner"
      class="term-fit-inner"
      :style="scale < 1 ? { transform: `scale(${scale})` } : undefined"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.term-fit {
  overflow-x: auto;
}

.term-fit.scaled {
  overflow: hidden;
}

.term-fit-inner {
  /* 量到的是內容本身的寬度；桌機上內容較窄時仍撐滿外框 */
  width: max-content;
  min-width: 100%;
  transform-origin: top left;
}
</style>
