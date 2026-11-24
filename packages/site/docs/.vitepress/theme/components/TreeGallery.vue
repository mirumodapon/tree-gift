<script setup lang="ts">
import { IconPlant } from '@tabler/icons-vue'
import { computed, ref } from 'vue'
import { data } from '../../gift.data.ts'
import TreeCard from './TreeCard.vue'

const languages = [...new Set(data.trees.map((t) => t.languageName))].toSorted()
const selected = ref<string | null>(null)
const trees = computed(() =>
  selected.value ? data.trees.filter((t) => t.languageName === selected.value) : data.trees,
)
</script>

<template>
  <div class="gallery">
    <div v-if="languages.length > 1" class="filters" role="group" aria-label="依語言篩選">
      <button :class="{ active: selected === null }" @click="selected = null">
        全部 {{ data.trees.length }}
      </button>
      <button
        v-for="lang in languages"
        :key="lang"
        :class="{ active: selected === lang }"
        @click="selected = lang"
      >
        {{ lang }}
      </button>
    </div>

    <div v-if="trees.length" class="grid">
      <TreeCard v-for="tree in trees" :key="tree.user" :tree="tree" />
    </div>
    <div v-else class="notice">
      <IconPlant class="notice-icon" :size="48" :stroke="1.5" />
      <p>還沒有作品，成為第一棵樹吧！</p>
    </div>
  </div>
</template>

<style scoped>
.gallery {
  margin-top: 24px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.filters button {
  padding: 4px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  transition:
    color 0.2s,
    border-color 0.2s;
}

.filters button:hover {
  color: var(--vp-c-text-1);
}

.filters button.active {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  font-weight: 600;
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
}

.notice {
  padding: 64px 16px;
  text-align: center;
  color: var(--vp-c-text-2);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
}

.notice-icon {
  color: var(--vp-c-brand-1);
  margin-bottom: 8px;
}
</style>
