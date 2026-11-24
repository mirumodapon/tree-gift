<script setup lang="ts">
import { data } from '../../.vitepress/gift.data.ts'

const r = data.rules
</script>

# ルール

## 出力

- **stdout** にクリスマスツリーを出力します。形式は自由：ASCII、Unicode、絵文字、カラー、どれでも OK
- 最大 **{{ r.maxCols }} 桁 × {{ r.maxRows }} 行**、合計 **{{ r.maxKB }} KB** まで
- 日本語などの全角文字とほとんどの絵文字は **2 桁**分の幅として数えます。末尾の空行は行数に含みません
- 出力は正しい UTF-8 でなければなりません
- <template v-if="r.allowColor">ANSI カラー（<code>ESC[...m</code>）が使えます</template><template v-else>今回は ANSI カラーは<strong>使えません</strong></template>
- <code>\t</code>、ベル（<code>\a</code>）、ハイパーリンクやタイトル設定（OSC）などのほかの制御コードは使えません
- <template v-if="r.deterministic">毎回の出力は<strong>完全に同じ</strong>でなければなりません（ジャッジは 2 回実行して比較します）。そのため乱数や時刻は使えません</template><template v-else>乱数を使ってもかまいません。毎回出力が違っても大丈夫です</template>

## アニメーション {#animation}

<template v-if="r.animation">

ANSI 制御コードでアニメーションが作れます！出力にカーソル移動が含まれていれば、アニメーション作品として扱われます：

- 使えるもの：<code>\r</code>、<code>\b</code>、カーソル移動（<code>ESC[H</code>、<code>ESC[3A</code> など）、画面や行の消去（<code>ESC[2J</code>、<code>ESC[K</code>）、カーソルの保存／復元、カーソルの非表示（<code>ESC[?25l</code>）、代替画面（<code>ESC[?1049h</code>）
- プログラムは **{{ r.maxCols }} × {{ r.maxRows }}** のターミナルで実行されます。範囲外の内容は見えません
- アニメーションは最大 **{{ r.animationSeconds }} 秒**録画されます。無限ループでもよく、時間切れで打ち切られます（失敗にはなりません）。サイトではループ再生されます
- アニメーションは **{{ r.runTimeout }} 秒以内に始まる**（最初のカーソル移動が現れる）必要があります。そうでないと実行タイムアウトになります
- フレームの間には遅延（<code>sleep</code> など）を入れてください。遅延のないアニメーションは一度に出力しすぎて失敗します
- アニメーションも毎回同じでなければなりません。ジャッジは 2 回実行して出力を比較します

</template>
<template v-else>

今回は**アニメーションは使えません**。出力にカーソル移動、<code>\r</code>、画面消去などの制御コードを含めることはできません。

</template>

## 実行環境

- 使えるのは**標準ライブラリだけ**で、パッケージはインストールできません（`pip install`、`npm install` は不可）
- 実行時は**ネットワークなし**
- **{{ r.runTimeout }} 秒**以内に終了し（Java などの上限は[言語と複数ファイル](./languages)を参照）、終了コードは `0` であること
- メモリの上限は **{{ r.memory }}**
- 作業ディレクトリは投稿フォルダです。ファイルの読み込みはできますが、**書き込みはできません**

## フォルダ

- 場所：`submissions/<あなたの GitHub ID>/`
- エントリーポイントは `tree.<拡張子>` で、1 つだけ
- 通常のファイルを平置きするだけで、サブフォルダやリンクは不可
- 最大 **{{ r.maxFiles }} ファイル**、合計 **{{ r.maxTotalKB }} KB**

## Pull Request

<template v-if="r.allowlist">

- 今回のイベントは**許可リストに載っているアカウント**だけが投稿できます。リスト外の PR はジャッジせずにクローズされます

</template>

- 1 つの PR で追加・変更できるのは**自分の**フォルダだけです
- ほかの人の投稿を変更した PR はクローズされます。`submissions/` 以外のファイルを変更した PR は通常の PR として扱われ、ジャッジされません

## ライセンス {#license}

- 作品の**著作権はあなたに帰属します**。ライセンスを指定したい場合（MIT、CC BY 4.0 など）は、フォルダに `LICENSE`（または `LICENSE.md`、`LICENSE.txt`、`COPYING`）を置いてください。サイトの作品にライセンスが表示されます
- ライセンスファイルに `SPDX-License-Identifier: <ライセンス ID>` の行を書くと、サイトはその名前をそのまま使います
- ライセンスファイルがない場合、サイトには「全著作権所有」と表示されます

::: warning PR を開いて投稿すると、本イベントに利用を許諾したことになります
Pull Request を開いて投稿すると、イベントの開催・展示・記録・宣伝のために、本イベント（クリスマスツリー交換とその主催者）があなたの作品を**複製・実行・公開展示・頒布**し、技術的に必要な処理（コンパイル、サンドボックスでの実行、アニメーションの録画、スクリーンショットの撮影など）を行うことを許諾したものとみなします。

この許諾は非独占的・無償・永続的かつ撤回不能であり、あなたがほかのライセンスで作品を公開することには**影響しません**。あなたの GitHub ユーザー名、アバター、作品もサイトと交換の発表で公開されます。
:::

全文はリポジトリ直下の <a v-if="data.repo" :href="`https://github.com/${data.repo}/blob/main/SUBMISSION_LICENSE.md`">SUBMISSION_LICENSE.md</a><code v-else>SUBMISSION_LICENSE.md</code>（中国語）をご覧ください。

## 行動規範

親切にお願いします。作品に差別、ハラスメント、不適切な内容を含めてはいけません。違反した投稿は削除され、交換の資格を失います。
