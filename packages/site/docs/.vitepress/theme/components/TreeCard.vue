<script setup lang="ts">
import { IconArrowRight, IconGift, IconPlayerPlay } from '@tabler/icons-vue'
import { withBase } from 'vitepress'
import { ref } from 'vue'
import type { Tree } from '../../gift.data.ts'
import AnsiPlayer from './AnsiPlayer.vue'

defineProps<{ tree: Tree }>()

// 動畫卡片：滑鼠移上去時預覽播放，移開暫停；點擊整張卡片進入作品頁
const player = ref<InstanceType<typeof AnsiPlayer>>()
</script>

<template>
  <article
    :id="tree.user"
    class="tree-card"
    @mouseenter="player?.play()"
    @mouseleave="player?.pause()"
  >
    <header>
      <img
        class="avatar"
        :src="`https://github.com/${tree.user}.png?size=64`"
        alt=""
        width="28"
        height="28"
        loading="lazy"
      />
      <!-- 整張卡片的點擊範圍由這個連結延伸（.card-link::after） -->
      <a class="user card-link" :href="withBase(`/trees/${tree.user}.html`)">@{{ tree.user }}</a>
      <span class="lang">
        <template v-if="tree.animation">
          <IconPlayerPlay :size="14" /> 動畫 {{ Math.round(tree.animation.duration) }}s ·
        </template>
        {{ tree.languageName }}
      </span>
    </header>
    <AnsiPlayer
      v-if="tree.animation"
      ref="player"
      class="term-area"
      :src="withBase(`/casts/${tree.user}.cast`)"
      :cols="tree.cols || 80"
      :rows="tree.rows || 1"
      :poster-time="tree.animation.posterTime"
      :fallback-html="tree.html"
      preview
    />
    <pre v-else class="gift-term term-area" v-html="tree.html" />
    <footer>
      <a v-if="tree.giftTo" class="link above" :href="withBase(`/gifts/${tree.giftTo}.html`)">
        <IconGift :size="16" /> 送給 @{{ tree.giftTo }}
      </a>
      <span v-else class="size">{{ tree.cols }} × {{ tree.rows }}</span>
      <span class="more">看作品 <IconArrowRight :size="16" /></span>
    </footer>
  </article>
</template>

<style scoped>
.tree-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

header,
footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 14px;
}

footer {
  justify-content: space-between;
  margin-top: auto;
  border-top: 1px solid var(--vp-c-divider);
}

.avatar {
  border-radius: 50%;
  background: var(--vp-c-default-soft);
}

.user {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

/* 讓整張卡片都可點擊 */
.card-link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.card-link:focus-visible {
  outline: none;
}

.tree-card:has(.card-link:focus-visible) {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.tree-card {
  transition:
    border-color 0.2s,
    transform 0.2s;
}

.tree-card:hover {
  border-color: var(--vp-c-brand-1);
}

/* 卡片內其他連結要蓋在延伸的點擊範圍之上 */
.above {
  position: relative;
  z-index: 1;
}

.more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--vp-c-text-3);
  transition: color 0.2s;
}

.tree-card:hover .more {
  color: var(--vp-c-brand-1);
}

@media (prefers-reduced-motion: reduce) {
  .tree-card {
    transition: none;
  }
}

.lang {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  color: var(--vp-c-text-3);
  font-size: 13px;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.size {
  color: var(--vp-c-text-3);
  font-variant-numeric: tabular-nums;
}

.term-area {
  flex: 1;
}

.gift-term {
  border-radius: 0;
}
</style>
