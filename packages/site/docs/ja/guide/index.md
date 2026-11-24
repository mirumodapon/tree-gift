<script setup lang="ts">
import { data } from '../../.vitepress/gift.data.ts'

const repoUrl = data.repo ? `https://github.com/${data.repo}` : null
</script>

# 投稿をはじめる

stdout にクリスマスツリーを出力するプログラムを書いて、Pull Request で投稿しましょう。締め切り後にランダムでペアが決まり、あなたのツリーはほかの参加者に贈られ、あなたもほかの誰かのツリーを受け取ります。

::: tip 現在の状況
<template v-if="data.acceptSubmissions">ただいま<strong>受付中</strong>です。ぜひ投稿してください！</template>
<template v-else-if="data.state === 'NOT_STARTED'">イベントは<strong>まだ始まっていません</strong>。ルールを読んでローカルでプログラムを書いておき、受付が始まったら PR を開きましょう。</template>
<template v-else>イベントは<strong>終了しました</strong>。ご参加ありがとうございました！</template>
<template v-if="data.schedule"><br>受付期間：<EventTime :iso="data.schedule.start" /> ～ <EventTime :iso="data.schedule.end" />。締め切り後に自動で交換されます。</template>
:::

## 手順

1. <a v-if="repoUrl" :href="repoUrl">イベントのリポジトリ</a><span v-else>イベントのリポジトリ</span>を **Fork** する
2. `submissions/<あなたの GitHub ID>/` フォルダを作る（大文字・小文字まで完全に一致させてください）
3. フォルダにプログラムを入れる。エントリーポイントのファイル名は `tree.<拡張子>` で、ほかのファイル（モジュール、ヘッダー、データファイル、`README.md`）は同じ階層に置く
4. ローカルでテストする（任意ですが、強くおすすめします）
5. **Pull Request** を開くと、ボットが自動でジャッジします（PR を開くと[投稿ライセンス](#license)に同意したことになります）
6. このリポジトリを **Watch** する（Custom → Issues にチェック）。交換結果が発表されたときに通知が届きます

```
submissions/
  your-github-id/
    tree.py      ← エントリーポイント（必須）
    star.py      ← ほかのファイル（任意）
    trunk.txt
    README.md    ← 作品の紹介（任意）。サイトの作品ページに表示されます
```

作品が公開されると、サイト上に一人ひとりの作品ページができ、作品全体、すべてのソースコード、そして `README.md` が表示されます（Markdown に対応、HTML は非対応。画像は https の URL が必要です）。

リポジトリの `examples/` フォルダに各言語のサンプルがあります。対応言語は[言語と複数ファイル](./languages)をご覧ください。

## PR を開いたあと

ボットが数分以内に PR を処理し、結果をコメントします：

| 状況                                    | 結果                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ジャッジに合格                          | <IconCircleCheck class="i ok" /> 自動でマージされ、投稿完了です                                   |
| ジャッジに不合格                        | <IconCircleX class="i bad" /> 理由をコメントして PR をクローズ。修正して**新しい PR を開けば** OK |
| ほかの人の投稿を変更した                | <IconCircleX class="i bad" /> PR をクローズ。投稿 PR では自分のフォルダしか変更できません         |
| `submissions/` 以外のファイルを変更した | <IconGitPullRequest class="i" /> 通常の PR として扱い、ジャッジせず主催者のレビューを待ちます     |
| 受付期間外                              | <IconLock class="i" /> PR をクローズし、イベント開始前か終了後であることをコメントします          |

マージ後に作品を直したいときは、自分のフォルダを変更する PR をもう一度開くだけです。同じようにジャッジされます。

ボットのコメントは中国語ですが、指摘される問題にはそれぞれ英語の説明も付いています。

## ライセンス {#license}

- 作品の**著作権はあなたに帰属します**。ライセンスを指定したい場合（MIT、CC BY 4.0 など）は、フォルダに `LICENSE`（または `LICENSE.md`、`LICENSE.txt`、`COPYING`）を置いてください。作品ページに表示されます
- ライセンスファイルがない場合、本イベントへの許諾を除き、すべての権利はあなたに留保されます
- PR を開いて投稿することで、イベントの開催・展示・記録・宣伝のために、あなたの作品を複製・実行・公開展示・頒布し、技術的に必要な処理（コンパイル、アニメーションの録画など）を行うことを**本イベントに許諾**したものとみなします。この許諾は、あなたがほかの方法で作品を公開することに影響しません
- あなたの GitHub ユーザー名、アバター、作品はサイトと交換の発表で公開されます

全文はリポジトリ直下の `SUBMISSION_LICENSE.md`（中国語）をご覧ください。

## ローカルでテストする

[Node.js](https://nodejs.org/) 24 以上、[pnpm](https://pnpm.io/)、[Docker](https://www.docker.com/) が必要です。ジャッジ環境はオンラインとまったく同じです：

```sh
pnpm install
pnpm play <あなたの GitHub ID>   # サンドボックスで実行してツリーを表示（アニメーションはその場で再生）
pnpm judge <あなたの GitHub ID>  # ジャッジ。結果はオンラインと同じ
```

ツリーとジャッジ結果が表示され、合格すると `✅ PASS` と出ます。
