<script setup lang="ts">
import { IconArrowRight, IconGift, IconLicense } from '@tabler/icons-vue'
import type { Tree } from '../../gift.data.ts'
import { useI18n } from '../i18n.ts'

defineProps<{ tree: Tree }>()
const { t, link, licenseName } = useI18n()
</script>

<template>
  <article :id="tree.user" class="tree-card">
    <img
      class="avatar"
      :src="`https://github.com/${tree.user}.png?size=80`"
      alt=""
      width="40"
      height="40"
      loading="lazy"
    />
    <div class="body">
      <!-- 整張卡片的點擊範圍由這個連結延伸（.card-link::after） -->
      <a class="user card-link" :href="link(`/trees/${tree.user}.html`)">@{{ tree.user }}</a>
      <span class="meta">
        <a v-if="tree.giftTo" class="above" :href="link(`/gifts/${tree.giftTo}.html`)">
          <IconGift :size="14" /> {{ t.giftTo }} @{{ tree.giftTo }}
        </a>
        <span class="license" :title="t.licenseTitle(licenseName(tree.license))">
          <IconLicense :size="13" /> {{ licenseName(tree.license) }}
        </span>
      </span>
    </div>
    <IconArrowRight class="more" :size="18" />
  </article>
</template>

<style scoped>
.tree-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s;
}

.tree-card:hover {
  border-color: var(--vp-c-brand-1);
}

.avatar {
  flex: none;
  border-radius: 50%;
  background: var(--vp-c-default-soft);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.meta a,
.license {
  display: inline-flex;
  align-items: center;
  gap: 3px;
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

/* 卡片內其他連結要蓋在延伸的點擊範圍之上 */
.above {
  position: relative;
  z-index: 1;
}

.more {
  flex: none;
  margin-left: auto;
  color: var(--vp-c-text-3);
  transition: color 0.2s;
}

.tree-card:hover .more {
  color: var(--vp-c-brand-1);
}

@media (prefers-reduced-motion: reduce) {
  .tree-card,
  .more {
    transition: none;
  }
}
</style>
