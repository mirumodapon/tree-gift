<script setup lang="ts">
import { data } from '../.vitepress/gift.data.ts'

const repoUrl = data.repo ? `https://github.com/${data.repo}` : null
</script>

# 開始投稿

寫一支程式，在 stdout 印出一棵聖誕樹，透過 Pull Request 投稿。截止後系統會隨機配對，你的樹會送給另一位參加者，你也會收到別人的樹。

::: tip 目前狀態
<template v-if="data.acceptSubmissions">現在<strong>收件中</strong>，歡迎投稿！</template>
<template v-else-if="data.state === 'NOT_STARTED'">活動<strong>還沒開始</strong>，可以先看看規則、在本機寫好程式，開始收件後再開 PR。</template>
<template v-else>活動<strong>已經結束</strong>，謝謝大家的參與！</template>
:::

## 步驟

1. **Fork** <a v-if="repoUrl" :href="repoUrl">活動 repo</a><span v-else>活動 repo</span>
2. 建立資料夾 `submissions/<你的 GitHub ID>/`（大小寫要完全一致）
3. 在資料夾裡放入程式，進入點檔名為 `tree.<副檔名>`，其他檔案（模組、標頭檔、資料檔、`README.md`）放在同一層
4. 在本機測試（選擇性，但很推薦）
5. 開 **Pull Request**，機器人會自動評測
6. **Watch** 這個 repo（Custom → 勾選 Issues），交換結果公告時才會收到通知

```
submissions/
  your-github-id/
    tree.py      ← 進入點（必要）
    star.py      ← 其他檔案（選填）
    trunk.txt
    README.md    ← 介紹你的作品（選填）
```

可以參考 repo 裡 `examples/` 資料夾的各語言範例，支援的語言請見[語言與多檔案](./languages)。

## 開 PR 之後

機器人會在幾分鐘內處理你的 PR，並留言告訴你結果：

| 情況                           | 結果                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| 通過評測                       | <IconCircleCheck class="i ok" /> 自動合併，你的投稿就完成了                         |
| 沒通過評測                     | <IconCircleX class="i bad" /> 留言說明原因並關閉 PR，修正後**再開一個新的 PR** 即可 |
| 改到別人的投稿                 | <IconCircleX class="i bad" /> 關閉 PR，投稿 PR 只能動自己的資料夾                   |
| 改到 `submissions/` 以外的檔案 | <IconGitPullRequest class="i" /> 視為一般 PR，不評測，等主辦方 review               |
| 目前不收件                     | <IconLock class="i" /> 關閉 PR，留言說明活動還沒開始或已經結束                      |

合併後想修改作品？再開一個 PR 修改自己的資料夾就好，一樣會重新評測。

## 在本機測試

需要 [Node.js](https://nodejs.org/) 24+、[pnpm](https://pnpm.io/)、[Docker](https://www.docker.com/)，評測環境和線上完全相同：

```sh
pnpm install
pnpm judge <你的 GitHub ID>
```

會印出你的樹和評測結果，通過會顯示 `✅ PASS`。
