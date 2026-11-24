<script setup lang="ts">
import { IconArrowRight, IconGift, IconLicense } from '@tabler/icons-vue'
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../../gift.data.ts'
import { useI18n } from '../i18n.ts'
import AnsiPlayer from './AnsiPlayer.vue'

const props = defineProps<{ user: string }>()
const { t, link, licenseName } = useI18n()
const gift = computed(() => data.trees.find((x) => x.giftTo === props.user) ?? null)
</script>

<template>
  <div class="gift">
    <template v-if="gift">
      <h1>
        <IconGift class="title-icon" :size="32" :stroke="1.75" />
        {{ t.giftTitle(user) }}
      </h1>
      <p class="from">
        {{ t.giftFrom }}
        <img :src="`https://github.com/${gift.user}.png?size=64`" alt="" width="24" height="24" />
        <a :href="`https://github.com/${gift.user}`">@{{ gift.user }}</a>
        · {{ gift.languageName }} · <IconLicense :size="14" /> {{ licenseName(gift.license) }}
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
      <p class="more">
        <a :href="link(`/trees/${gift.user}.html`)">
          {{ t.giftMore }} <IconArrowRight :size="16" />
        </a>
      </p>
    </template>
    <template v-else>
      <h1>{{ t.giftNotFound }}</h1>
      <p>{{ t.giftNotFoundNote }}</p>
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

.more {
  margin-top: 20px;
}

.more a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
