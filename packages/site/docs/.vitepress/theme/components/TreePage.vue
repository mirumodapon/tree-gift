<script setup lang="ts">
import {
  IconArrowLeft,
  IconBrandGithub,
  IconFileCode,
  IconGift,
  IconLicense,
  IconNotes,
  IconPlayerPlay,
} from '@tabler/icons-vue'
import { withBase } from 'vitepress'
import { computed } from 'vue'
import { data } from '../../gift.data.ts'
import type { SourceFile } from '../../results.ts'
import { useI18n } from '../i18n.ts'
import AnsiPlayer from './AnsiPlayer.vue'

const props = defineProps<{
  user: string
  files: SourceFile[]
  /** 已在 build 時安全轉換過的 README HTML */
  readmeHtml: string | null
  /** 作者附上的授權檔 */
  license: { name: string; content: string } | null
}>()

const { t, link, licenseName } = useI18n()
const repoUrl = data.repo ? `https://github.com/${data.repo}` : null

const tree = computed(() => data.trees.find((x) => x.user === props.user) ?? null)
const copyright = computed(() => t.value.copyright(props.user))
</script>

<template>
  <article v-if="tree" class="tree-page">
    <a v-if="data.publishTrees" class="back" :href="link('/gallery.html')">
      <IconArrowLeft :size="16" /> {{ t.gallery }}
    </a>

    <header>
      <img
        class="avatar"
        :src="`https://github.com/${tree.user}.png?size=112`"
        alt=""
        width="56"
        height="56"
      />
      <div class="who">
        <h1>@{{ tree.user }}</h1>
        <p class="meta">
          {{ tree.languageName }}
          <template v-if="tree.animation">
            · <IconPlayerPlay :size="14" />
            {{ t.animationSeconds(Math.round(tree.animation.duration)) }}
          </template>
          · {{ tree.cols }} × {{ tree.rows }} ·
          <a class="license-link" href="#license"
            ><IconLicense :size="14" /> {{ licenseName(tree.license) }}</a
          >
        </p>
      </div>
      <a class="github" :href="tree.folderUrl ?? `https://github.com/${tree.user}`">
        <IconBrandGithub :size="18" /> GitHub
      </a>
    </header>

    <AnsiPlayer
      v-if="tree.animation"
      class="stage"
      :src="withBase(`/casts/${tree.user}.cast`)"
      :cols="tree.cols || 80"
      :rows="tree.rows || 1"
      :poster-time="tree.animation.posterTime"
      :fallback-html="tree.html"
      font-size="16px"
      auto-play
    />
    <pre v-else class="gift-term stage large" v-html="tree.html" />

    <p v-if="tree.giftTo || tree.giftFrom" class="exchange">
      <IconGift :size="18" />
      <span v-if="tree.giftTo">
        {{ t.giftTo }} <a :href="link(`/gifts/${tree.giftTo}.html`)">@{{ tree.giftTo }}</a>
      </span>
      <span v-if="tree.giftTo && tree.giftFrom" class="sep">·</span>
      <span v-if="tree.giftFrom">
        {{ t.receivedFrom[0] }}
        <a :href="link(`/trees/${tree.giftFrom}.html`)">@{{ tree.giftFrom }}</a>
        {{ t.receivedFrom[1] }}
      </span>
    </p>

    <section v-if="readmeHtml">
      <h2><IconNotes :size="20" /> {{ t.authorNotes }}</h2>
      <div class="vp-doc readme" v-html="readmeHtml" />
    </section>

    <section v-if="files.length">
      <h2><IconFileCode :size="20" /> {{ t.sourceCode }}</h2>
      <details v-for="f in files" :key="f.name" class="file" :open="f.entry">
        <summary>
          <code>{{ f.name }}</code>
          <span v-if="f.entry" class="tag">{{ t.entry }}</span>
        </summary>
        <pre class="source"><code>{{ f.content }}</code></pre>
      </details>
    </section>

    <section id="license">
      <h2><IconLicense :size="20" /> {{ t.licenseHeading(licenseName(tree.license)) }}</h2>
      <template v-if="license">
        <p class="license-note">{{ t.licensedAs }}</p>
        <details class="file">
          <summary>
            <code>{{ license.name }}</code>
          </summary>
          <pre class="source"><code>{{ license.content }}</code></pre>
        </details>
      </template>
      <p v-else class="license-note">{{ t.noLicenseNote }}</p>
      <p class="license-note">
        {{ copyright[0] }}
        <a v-if="repoUrl" :href="`${repoUrl}/blob/main/SUBMISSION_LICENSE.md`">{{ copyright[1] }}</a
        ><span v-else>{{ copyright[1] }}</span
        >{{ copyright[2] }}
      </p>
    </section>
  </article>

  <div v-else class="tree-page">
    <h1>{{ t.treeNotFound }}</h1>
    <p v-if="data.publishTrees">
      <a :href="link('/gallery.html')">{{ t.backToGallery }}</a>
    </p>
  </div>
</template>

<style scoped>
.tree-page {
  max-width: 880px;
  margin: 0 auto;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.back:hover {
  color: var(--vp-c-brand-1);
}

header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 20px 0 24px;
}

.avatar {
  border-radius: 50%;
  background: var(--vp-c-default-soft);
}

.who {
  flex: 1;
  min-width: 0;
}

h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 2px 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.github {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

.github:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.stage {
  border-radius: 12px;
  overflow: hidden;
}

.large {
  font-size: 16px;
  padding: 24px;
}

.exchange {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 16px 0 0;
  color: var(--vp-c-text-2);
}

.exchange svg {
  color: var(--gift-red);
}

.exchange a {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.exchange a:hover {
  text-decoration: underline;
}

.sep {
  color: var(--vp-c-text-3);
}

section {
  margin-top: 48px;
}

h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 20px;
  font-weight: 600;
}

h2 svg {
  color: var(--vp-c-brand-1);
}

.readme :deep(img) {
  max-width: 100%;
}

/* README 的程式碼區塊不是 VitePress 產生的，補上樣式 */
.readme :deep(pre) {
  margin: 16px 0;
  padding: 16px;
  overflow-x: auto;
  background: var(--vp-code-block-bg);
  border-radius: 8px;
}

.readme :deep(pre code) {
  padding: 0;
  background: none;
  font-size: 14px;
  line-height: 1.6;
}

.file {
  margin-bottom: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  background: var(--vp-c-bg-soft);
  font-size: 14px;
}

.tag {
  padding: 0 8px;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 12px;
}

.license-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: inherit;
}

.license-link:hover {
  color: var(--vp-c-brand-1);
}

.license-note {
  margin: 0 0 12px;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.license-note a {
  color: var(--vp-c-brand-1);
}

.source {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
}
</style>
