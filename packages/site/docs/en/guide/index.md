<script setup lang="ts">
import { data } from '../../.vitepress/gift.data.ts'

const repoUrl = data.repo ? `https://github.com/${data.repo}` : null
</script>

# Getting started

Write a program that prints a Christmas tree to stdout, and submit it through a Pull Request. After the deadline, participants are paired at random: your tree goes to someone else, and you receive someone else's tree.

::: tip Current status
<template v-if="data.acceptSubmissions">Submissions are <strong>open</strong>. Come join us!</template>
<template v-else-if="data.state === 'NOT_STARTED'">The event <strong>hasn't started yet</strong>. Read the rules and write your program locally, then open a PR once submissions open.</template>
<template v-else>The event <strong>has ended</strong>. Thank you all for taking part!</template>
:::

## Steps

1. **Fork** the <a v-if="repoUrl" :href="repoUrl">event repo</a><span v-else>event repo</span>
2. Create the folder `submissions/<your GitHub ID>/` (the case must match exactly)
3. Put your program in the folder. The entry point must be named `tree.<extension>`; other files (modules, headers, data files, `README.md`) go in the same folder
4. Test locally (optional, but highly recommended)
5. Open a **Pull Request**, and the bot judges it automatically (opening a PR means you agree to the [submission license](#license))
6. **Watch** this repo (Custom → check Issues) so you get notified when the exchange results are announced

```
submissions/
  your-github-id/
    tree.py      ← entry point (required)
    star.py      ← other files (optional)
    trunk.txt
    README.md    ← introduce your work (optional), shown on your page on the site
```

Once trees are published, everyone gets their own page on the site showing the full work, all of its source code, and your `README.md` (Markdown is supported, HTML is not; images must use https URLs).

The repo's `examples/` folder has examples in every language. See [Languages & multiple files](./languages) for the supported languages.

## After you open a PR

The bot handles your PR within a few minutes and leaves a comment with the result:

| Situation                            | Result                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Passes judging                       | <IconCircleCheck class="i ok" /> Merged automatically, and your submission is done                    |
| Fails judging                        | <IconCircleX class="i bad" /> The bot explains why and closes the PR; fix it and **open a new PR**    |
| Touches someone else's submission    | <IconCircleX class="i bad" /> PR closed: a submission PR may only touch your own folder               |
| Touches files outside `submissions/` | <IconGitPullRequest class="i" /> Treated as a regular PR: not judged, waits for an organizer's review |
| Submissions are closed               | <IconLock class="i" /> PR closed, with a comment saying the event hasn't started or has ended         |

Want to change your work after it's merged? Open another PR that edits your own folder. It gets judged again.

The bot comments in Chinese, but each problem it lists also has an English description.

## License {#license}

- **You own the copyright** to your work. To choose a license (e.g. MIT, CC BY 4.0), put a `LICENSE` (or `LICENSE.md`, `LICENSE.txt`, `COPYING`) in your folder. It is shown on your page
- Without a license file, you reserve all rights apart from the license granted to this event
- By opening a PR you **grant this event** the right to reproduce, run, publicly display and distribute your work for running, showcasing, documenting and promoting the event, and to process it as technically necessary (e.g. compiling, recording the animation). This does not affect your right to release your work in any other way
- Your GitHub username, avatar and work are shown publicly on the site and in the exchange announcement

The full terms are in `SUBMISSION_LICENSE.md` at the root of the repo (written in Chinese).

## Test locally

You need [Node.js](https://nodejs.org/) 24+, [pnpm](https://pnpm.io/) and [Docker](https://www.docker.com/). The judging environment is exactly the same as online:

```sh
pnpm install
pnpm play <your GitHub ID>   # run in the sandbox and see your tree (animations play live)
pnpm judge <your GitHub ID>  # judge it, same result as online
```

It prints your tree and the result. A pass shows `✅ PASS`.
