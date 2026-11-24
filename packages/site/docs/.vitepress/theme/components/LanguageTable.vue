<script setup lang="ts">
import { data } from '../../gift.data.ts'
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>進入點檔名</th>
        <th>語言</th>
        <th>執行時間上限</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="lang in data.languages" :key="lang.ext">
        <td>
          <code>tree.{{ lang.ext }}</code>
        </td>
        <td>{{ lang.name }}</td>
        <td>{{ lang.runTimeout }} 秒</td>
      </tr>
    </tbody>
  </table>
</template>
