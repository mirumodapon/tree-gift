<script setup lang="ts">
import { data } from '../../.vitepress/gift.data.ts'
</script>

# FAQ

## My PR was closed. What now?

Read the bot's comment: it says which check failed, what your output looked like, and the error message. Once fixed, **open a new PR** (you can reuse the same branch).

We recommend testing locally with `pnpm judge <your GitHub ID>` before opening a PR. The judging environment is identical to the one online.

## Can I change my work after it's merged?

Yes. While submissions are open, open another PR that changes your own folder. It's judged again and merged if it passes.

## I renamed my GitHub account. What should I do?

Your submission folder is tied to your GitHub account (its numeric ID), not its name. After a rename, the new name no longer matches the folder, and nobody else can take the old name to change your work. Open an issue to contact the organizers, and they'll help rename the folder.

## How wide are CJK characters and emoji?

It follows Unicode East Asian Width: CJK characters, full-width characters and most emoji are 2 columns, other characters are 1 column, and combining characters (e.g. accents) take no width.

## Can I use randomness so the output differs each time?

<template v-if="data.rules.deterministic">Not this time. Judging runs your program twice and compares the output; if they differ, it fails. To make something that "looks random", use a fixed seed.</template><template v-else>Yes, the output may differ between runs this time.</template>

## When can I see everyone's trees?

<template v-if="data.publishTrees">Right now! Have a look at the <a href="../gallery.html">gallery</a>.</template><template v-else>Trees will be published to the gallery later, according to the event schedule.</template>

## Can I make an animation?

<template v-if="data.rules.animation">

Yes! Redrawing the screen with cursor movement (e.g. <code>\r</code> or <code>ESC[H</code>) is treated as an animation. It loops on the site and is recorded for at most {{ data.rules.animationSeconds }} seconds. See the <a href="./rules.html#animation">rules</a> for details.

The PR comment only shows the last frame; the full animation can be seen on the site once trees are published.

</template>
<template v-else>

Animations are not allowed this time.

</template>

## My animation looks fine in my terminal, so why are the frames squashed together when judged?

Judging runs in a real terminal (pty), so buffering behaves just like in your terminal. Common causes: no <code>sleep</code> between frames, or using <code>print(..., end="")</code> without a newline or a flush, so the output isn't sent until a newline.

## How does the exchange pair people? Can I get my own tree?

After the deadline, the organizers take a public seed announced in advance, shuffle everyone who passed judging, and arrange them in a ring. Each person gives their tree to the next one, so **you never get your own tree**.

The pairing is announced in an Issue in the repo, and anyone can recompute it with the same seed. Remember to Watch the repo's Issues to get notified.

## My program works locally, so why does judging fail?

Common causes:

- Using packages outside the standard library
- Trying to access the network or write files
- Output containing `\r`, `\t` or cursor control codes
- A line that is too wide (remember CJK characters are 2 columns)
- Your local language version differs from the judging environment; see [Languages & multiple files](./languages) for versions
