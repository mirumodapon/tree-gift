<script setup lang="ts">
import { data } from '../.vitepress/gift.data.ts'

const r = data.rules
</script>

# 規則

## 輸出

- 在 **stdout** 印出一棵聖誕樹，形式不拘：ASCII、Unicode、emoji、彩色都可以
- 最多 **{{ r.maxCols }} 欄 × {{ r.maxRows }} 行**，總共不超過 **{{ r.maxKB }} KB**
- 中文與大部分 emoji 算 **2 欄**寬，結尾的空白行不計入行數
- 輸出必須是合法的 UTF-8
- <template v-if="r.allowColor">可以用 ANSI 顏色（<code>ESC[...m</code>）</template><template v-else>這次<strong>不能</strong>使用 ANSI 顏色</template>
- 不能使用 <code>\t</code>、響鈴（<code>\a</code>）、超連結與設定標題（OSC）等其他控制碼
- <template v-if="r.deterministic">每次執行的輸出必須<strong>完全相同</strong>（評測會跑兩次比對），所以不能用亂數或時間</template><template v-else>可以使用亂數，每次輸出不同也沒關係</template>

## 動畫

<template v-if="r.animation">

可以用 ANSI 控制碼做出動畫！只要輸出裡有游標移動，就會被當成動畫作品：

- 可以使用：<code>\r</code>、<code>\b</code>、游標移動（<code>ESC[H</code>、<code>ESC[3A</code> 等）、清除畫面或整行（<code>ESC[2J</code>、<code>ESC[K</code>）、儲存／還原游標、隱藏游標（<code>ESC[?25l</code>）、替代畫面（<code>ESC[?1049h</code>）
- 程式在 **{{ r.maxCols }} × {{ r.maxRows }}** 的終端機裡執行，超出範圍的內容看不到
- 動畫最多錄 **{{ r.animationSeconds }} 秒**，可以無限循環，時間到就截斷（不算失敗），網站上會循環播放
- 動畫必須在 **{{ r.runTimeout }} 秒內開始**（出現第一個游標移動），否則會被當成執行逾時
- 畫面之間要有延遲（例如 <code>sleep</code>），沒有延遲的動畫會一下子輸出太多而失敗
- 動畫一樣要每次都相同：評測會跑兩次比對輸出

</template>
<template v-else>

這次**不開放動畫**，輸出裡不能有游標移動、<code>\r</code>、清畫面等控制碼。

</template>

## 執行環境

- 只能使用**標準函式庫**，不能安裝套件（不能 `pip install`、`npm install`）
- 執行時**沒有網路**
- **{{ r.runTimeout }} 秒**內執行完畢（Java 等語言的上限見[語言與多檔案](./languages)），結束代碼要是 `0`
- 記憶體上限 **{{ r.memory }}**
- 工作目錄就是你的投稿資料夾，可以讀檔，但**不能寫入**

## 資料夾

- 位置：`submissions/<你的 GitHub ID>/`
- 進入點必須是 `tree.<副檔名>`，而且只能有一個
- 只能平放一般檔案，不能有子資料夾或連結
- 最多 **{{ r.maxFiles }} 個檔案**，總共 **{{ r.maxTotalKB }} KB**

## Pull Request

- 一個 PR 只能新增或修改**你自己的**資料夾
- 改到別人的投稿會被關閉；改到 `submissions/` 以外的檔案會被當成一般 PR，不會評測

## 行為準則

請保持友善，作品內容不得包含歧視、騷擾或不當內容。違反者的投稿會被移除，並取消交換資格。
