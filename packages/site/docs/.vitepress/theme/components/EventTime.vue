<script setup lang="ts">
// 顯示活動時間。build 時不知道讀者在哪個時區，先輸出 rules.ts 裡的原始時間，
// 在瀏覽器裡再換成讀者當地的時間與語言格式。
import { onMounted, ref } from 'vue'
import { useI18n } from '../i18n.ts'

const props = defineProps<{ iso: string }>()
const { t } = useI18n()
const text = ref(props.iso)

onMounted(() => {
  text.value = new Intl.DateTimeFormat(t.value.dateLocale, {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZoneName: 'short',
  }).format(new Date(props.iso))
})
</script>

<template>
  <time :datetime="iso">{{ text }}</time>
</template>
