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

<template v-if="r.allowlist">

- 這次活動只開放**白名單內的帳號**投稿，名單外的 PR 不會評測，會直接關閉

</template>

- 一個 PR 只能新增或修改**你自己的**資料夾
- 改到別人的投稿會被關閉；改到 `submissions/` 以外的檔案會被當成一般 PR，不會評測

## 授權

- 作品的**著作權屬於你**。想指定授權（例如 MIT、CC BY 4.0），在資料夾裡放一個 `LICENSE`（或 `LICENSE.md`、`LICENSE.txt`、`COPYING`）；網站會在你的作品上標示授權
- 也可以在授權檔裡寫一行 `SPDX-License-Identifier: <授權代號>`，網站會直接採用這個名稱
- 沒有附授權檔時，網站會標示「保留所有權利」

::: warning 開 PR 投稿，就是授權給本活動使用
只要開 Pull Request 投稿，就表示你同意授權本活動（交換聖誕樹及其主辦方），為了舉辦、展示、紀錄與推廣活動，**重製、執行、公開展示與散布**你的作品，並進行技術上必要的處理（例如編譯、在沙箱中執行、錄製動畫、擷取畫面）。

這項授權是非專屬、免權利金、永久且不可撤銷的，**不影響**你以任何其他授權方式釋出自己的作品。你的 GitHub 帳號名稱、頭像與作品也會公開顯示在網站與交換公告中。
:::

完整條款見 repo 根目錄的 <a v-if="data.repo" :href="`https://github.com/${data.repo}/blob/main/SUBMISSION_LICENSE.md`">SUBMISSION_LICENSE.md</a><code v-else>SUBMISSION_LICENSE.md</code>。

## 行為準則

請保持友善，作品內容不得包含歧視、騷擾或不當內容。違反者的投稿會被移除，並取消交換資格。
