<script setup lang="ts">
import { IconGift } from '@tabler/icons-vue'
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../../gift.data.ts'
import AnsiPlayer from './AnsiPlayer.vue'

const props = defineProps<{ user: string }>()
const gift = computed(() => data.trees.find((t) => t.giftTo === props.user) ?? null)
</script>

<template>
  <div class="gift">
    <template v-if="gift">
      <h1>
        <IconGift class="title-icon" :size="32" :stroke="1.75" />
        @{{ user }}，你收到了一棵聖誕樹！
      </h1>
      <p class="from">
        來自
        <img :src="`https://github.com/${gift.user}.png?size=64`" alt="" width="24" height="24" />
        <a :href="`https://github.com/${gift.user}`">@{{ gift.user }}</a>
        · {{ gift.languageName }}
      </p>
      <AnsiPlayer
        v-if="gift.animation"
        class="player"
        :src="withBase(`/casts/${gift.user}.cast`)"
        :cols="gift.cols || 80"
        :rows="gift.rows || 1"
        :poster-time="gift.animation.posterTime"
        :fallback-html="gift.html"
        auto-play
        font-size="16px"
      />
      <pre v-else class="gift-term large" v-html="gift.html" />
      <details>
        <summary>看看原始碼（{{ gift.sourceFile }}）</summary>
        <pre class="source"><code>{{ gift.source }}</code></pre>
        <p v-if="gift.folderUrl"><a :href="gift.folderUrl">在 GitHub 上看完整的投稿資料夾 →</a></p>
      </details>
    </template>
    <template v-else>
      <h1>找不到這份禮物</h1>
      <p>可能還沒交換，或這份作品已經下架。</p>
    </template>
  </div>
</template>

<style scoped>
.gift {
  max-width: 760px;
  margin: 0 auto;
}

.title-icon {
  display: inline-block;
  color: var(--gift-red);
  vertical-align: -4px;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 8px;
}

.from {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--vp-c-text-2);
  margin: 0 0 24px;
}

.from img {
  border-radius: 50%;
}

.large {
  font-size: 16px;
  padding: 24px;
}

.player {
  border-radius: 12px;
  overflow: hidden;
}

details {
  margin-top: 24px;
}

summary {
  cursor: pointer;
  color: var(--vp-c-text-2);
}

.source {
  margin-top: 12px;
  padding: 16px;
  overflow-x: auto;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
}
</style>
