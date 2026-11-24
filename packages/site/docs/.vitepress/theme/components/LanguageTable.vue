<script setup lang="ts">
import { data } from '../../gift.data.ts'
import { useI18n } from '../i18n.ts'

const { t } = useI18n()
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>{{ t.entryFile }}</th>
        <th>{{ t.language }}</th>
        <th>{{ t.runTimeout }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="lang in data.languages" :key="lang.ext">
        <td>
          <code>tree.{{ lang.ext }}</code>
        </td>
        <td>{{ lang.name }}</td>
        <td>{{ t.seconds(lang.runTimeout) }}</td>
      </tr>
    </tbody>
  </table>
</template>
