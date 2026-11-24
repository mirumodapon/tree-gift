<script setup lang="ts">
import { data } from '../../.vitepress/gift.data.ts'
</script>

# 常見問題

## PR 被關閉了怎麼辦？

看機器人的留言，裡面會寫哪一項沒通過、你的輸出長怎樣，以及錯誤訊息。修正後**再開一個新的 PR** 就好（可以沿用同一個分支）。

建議先在本機用 `pnpm judge <你的 GitHub ID>` 測過再開 PR，評測環境和線上一模一樣。

## 合併之後還能修改作品嗎？

可以，在收件期間再開一個 PR 修改你自己的資料夾，一樣會重新評測，通過就會合併。

## 我改了 GitHub 帳號名稱怎麼辦？

投稿資料夾綁定的是你的 GitHub 帳號（數字 ID），不是名稱。改名之後，新的名稱和資料夾對不上，舊的名稱也不能再被別人拿來修改你的作品。請開 issue 聯絡主辦方，協助把資料夾改成新的名稱。

## 中文和 emoji 的寬度怎麼算？

依 Unicode 的 East Asian Width：中文、全形字和大部分 emoji 算 2 欄，其他字元算 1 欄，組合用的字元（例如變音符號）不佔寬度。

## 可以用亂數讓每次輸出不一樣嗎？

<template v-if="data.rules.deterministic">這次不行。評測會執行兩次並比對輸出，不同就不會通過。想要「看起來隨機」的效果，可以用固定的 seed。</template><template v-else>可以，這次允許每次輸出不同。</template>

## 什麼時候看得到大家的作品？

<template v-if="data.publishTrees">現在就可以，到<a href="../gallery.html">作品牆</a>看看！</template><template v-else>依活動安排，作品會在之後公開到作品牆。</template>

## 可以做動畫嗎？

<template v-if="data.rules.animation">

可以！用游標移動（例如 <code>\r</code> 或 <code>ESC[H</code>）重畫畫面就會被當成動畫，網站上會循環播放，最長錄 {{ data.rules.animationSeconds }} 秒。詳細規則見<a href="./rules.html#animation">規則</a>。

PR 留言裡只會顯示動畫的最後一格，完整的動畫要等作品公開後到網站上看。

</template>
<template v-else>

這次不開放動畫。

</template>

## 我的動畫在終端機裡正常，為什麼評測時畫面都擠在一起？

評測是在真的終端機（pty）裡執行，緩衝行為和你的終端機一樣。常見原因是畫面之間沒有 <code>sleep</code>，或是用 <code>print(..., end="")</code> 沒有換行也沒有 flush，輸出要等到換行才會送出。

## 交換怎麼配對？會抽到自己嗎？

截止後，主辦方用一個事先公告的公開 seed，把所有通過評測的參加者洗牌後排成一個環，每個人把樹送給下一位，所以**不會抽到自己**。

配對結果會公告在 repo 的 Issue，任何人都能用同一個 seed 重算驗證。記得 Watch repo 的 Issues 才收得到通知。

## 我的程式在本機可以跑，評測卻失敗？

常見原因：

- 用了標準函式庫以外的套件
- 嘗試連網路或寫入檔案
- 輸出含有 `\r`、`\t` 或游標控制碼
- 一行太寬（記得中文算 2 欄）
- 本機的語言版本和評測環境不同，版本請見[語言與多檔案](./languages)
