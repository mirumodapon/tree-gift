<script setup lang="ts">
import { data } from '../../.vitepress/gift.data.ts'

const r = data.rules
</script>

# Rules

## Output

- Print a Christmas tree to **stdout**, in any style: ASCII, Unicode, emoji and colors are all fine
- At most **{{ r.maxCols }} columns × {{ r.maxRows }} lines**, and no more than **{{ r.maxKB }} KB** in total
- CJK characters and most emoji are **2 columns** wide; trailing blank lines don't count toward the line limit
- The output must be valid UTF-8
- <template v-if="r.allowColor">ANSI colors (<code>ESC[...m</code>) are allowed</template><template v-else>ANSI colors are <strong>not</strong> allowed this time</template>
- <code>\t</code>, bell (<code>\a</code>), hyperlinks, setting the title (OSC) and other control codes are not allowed
- <template v-if="r.deterministic">The output must be <strong>exactly the same</strong> on every run (judging runs it twice and compares), so no randomness or time</template><template v-else>Randomness is allowed; the output may differ between runs</template>

## Animation {#animation}

<template v-if="r.animation">

You can animate with ANSI control codes! Any output with cursor movement is treated as an animation:

- Allowed: <code>\r</code>, <code>\b</code>, cursor movement (<code>ESC[H</code>, <code>ESC[3A</code>, etc.), clearing the screen or a line (<code>ESC[2J</code>, <code>ESC[K</code>), saving/restoring the cursor, hiding the cursor (<code>ESC[?25l</code>) and the alternate screen (<code>ESC[?1049h</code>)
- Your program runs in a **{{ r.maxCols }} × {{ r.maxRows }}** terminal; anything outside it isn't visible
- Animations are recorded for at most **{{ r.animationSeconds }} seconds**. They may loop forever and are cut off when time is up (that's not a failure), then loop on the site
- The animation must **start within {{ r.runTimeout }} seconds** (the first cursor movement must appear), or it counts as a timeout
- Put a delay between frames (e.g. <code>sleep</code>); an animation without delays outputs too much at once and fails
- Animations must also be the same on every run: judging runs them twice and compares

</template>
<template v-else>

Animations are **not allowed** this time: the output may not contain cursor movement, <code>\r</code>, screen clearing or similar control codes.

</template>

## Environment

- **Standard library only**; packages can't be installed (no `pip install`, no `npm install`)
- **No network** at run time
- Must finish within **{{ r.runTimeout }} seconds** (see [Languages & multiple files](./languages) for languages like Java) with exit code `0`
- Memory limit: **{{ r.memory }}**
- The working directory is your submission folder; you can read files but **can't write**

## Folder

- Location: `submissions/<your GitHub ID>/`
- The entry point must be `tree.<extension>`, and there can be only one
- Only plain files; no subfolders or links
- At most **{{ r.maxFiles }} files**, **{{ r.maxTotalKB }} KB** in total

## Pull Request

<template v-if="r.allowlist">

- This event is limited to **allowlisted accounts**; PRs from other accounts are closed without judging

</template>

- A PR may only add or change **your own** folder
- PRs that touch someone else's submission are closed; PRs that touch files outside `submissions/` are treated as regular PRs and aren't judged

## License {#license}

- **You own the copyright** to your work. To choose a license (e.g. MIT, CC BY 4.0), put a `LICENSE` (or `LICENSE.md`, `LICENSE.txt`, `COPYING`) in your folder; the site shows the license on your work
- You can also write a line `SPDX-License-Identifier: <license ID>` in the license file, and the site uses that name as is
- Without a license file, the site shows "All rights reserved"

::: warning Opening a PR grants this event a license
By opening a Pull Request to submit, you agree to license your work to this event (Christmas Tree Exchange and its organizers) to **reproduce, run, publicly display and distribute** it for running, showcasing, documenting and promoting the event, and to process it as technically necessary (e.g. compiling, running it in a sandbox, recording the animation, taking screenshots).

This license is non-exclusive, royalty-free, perpetual and irrevocable, and it **does not affect** your right to release your work under any other license. Your GitHub username, avatar and work are also shown publicly on the site and in the exchange announcement.
:::

The full terms are in <a v-if="data.repo" :href="`https://github.com/${data.repo}/blob/main/SUBMISSION_LICENSE.md`">SUBMISSION_LICENSE.md</a><code v-else>SUBMISSION_LICENSE.md</code> at the root of the repo (written in Chinese).

## Code of conduct

Please be kind. Works must not contain discrimination, harassment or inappropriate content. Submissions that break this rule are removed and lose their place in the exchange.
