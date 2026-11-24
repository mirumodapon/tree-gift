<script setup lang="ts">
import { IconCode, IconGift, IconPlayerPlay } from '@tabler/icons-vue'
import { withBase } from 'vitepress'
import type { Tree } from '../../gift.data.ts'
import AnsiPlayer from './AnsiPlayer.vue'

defineProps<{ tree: Tree }>()
</script>

<template>
  <article :id="tree.user" class="tree-card">
    <header>
      <img
        class="avatar"
        :src="`https://github.com/${tree.user}.png?size=64`"
        alt=""
        width="28"
        height="28"
        loading="lazy"
      />
      <a class="user" :href="`https://github.com/${tree.user}`">@{{ tree.user }}</a>
      <span class="lang">
        <template v-if="tree.animation">
          <IconPlayerPlay :size="14" /> 動畫 {{ Math.round(tree.animation.duration) }}s ·
        </template>
        {{ tree.languageName }}
      </span>
    </header>
    <AnsiPlayer
      v-if="tree.animation"
      class="term-area"
      :src="withBase(`/casts/${tree.user}.cast`)"
      :cols="tree.cols || 80"
      :rows="tree.rows || 1"
      :poster-time="tree.animation.posterTime"
      :fallback-html="tree.html"
    />
    <pre v-else class="gift-term term-area" v-html="tree.html" />
    <footer>
      <a v-if="tree.giftTo" class="link" :href="withBase(`/gifts/${tree.giftTo}.html`)">
        <IconGift :size="16" /> 送給 @{{ tree.giftTo }}
      </a>
      <span v-else class="size">{{ tree.cols }} × {{ tree.rows }}</span>
      <a v-if="tree.folderUrl" class="link" :href="tree.folderUrl"
        ><IconCode :size="16" /> 原始碼</a
      >
    </footer>
  </article>
</template>

<style scoped>
.tree-card {
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
