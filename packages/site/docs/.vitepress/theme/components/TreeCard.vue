<script setup lang="ts">
import { IconCode, IconGift } from '@tabler/icons-vue'
import { withBase } from 'vitepress'
import type { Tree } from '../../gift.data.ts'

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
      <span class="lang">{{ tree.languageName }}</span>
    </header>
    <pre class="gift-term" v-html="tree.html" />
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

.gift-term {
  border-radius: 0;
  flex: 1;
}
</style>
