<script setup lang="ts">
import { data } from '../../.vitepress/gift.data.ts'

const r = data.rules
</script>

# 규칙

## 출력

- **stdout**에 크리스마스 트리를 출력해요. 형식은 자유: ASCII, Unicode, 이모지, 컬러 모두 좋아요
- 최대 **{{ r.maxCols }}칸 × {{ r.maxRows }}줄**, 전체 **{{ r.maxKB }} KB**까지
- 한글·한자 같은 전각 문자와 대부분의 이모지는 **2칸** 너비로 세요. 끝에 있는 빈 줄은 줄 수에 포함하지 않아요
- 출력은 올바른 UTF-8이어야 해요
- <template v-if="r.allowColor">ANSI 컬러(<code>ESC[...m</code>)를 쓸 수 있어요</template><template v-else>이번에는 ANSI 컬러를 <strong>쓸 수 없어요</strong></template>
- <code>\t</code>, 벨(<code>\a</code>), 하이퍼링크와 제목 설정(OSC) 등 다른 제어 코드는 쓸 수 없어요
- <template v-if="r.deterministic">실행할 때마다 출력이 <strong>완전히 같아야</strong> 해요(채점할 때 두 번 실행해 비교해요). 그래서 난수나 시간은 쓸 수 없어요</template><template v-else>난수를 써도 되고, 실행할 때마다 출력이 달라도 괜찮아요</template>

## 애니메이션 {#animation}

<template v-if="r.animation">

ANSI 제어 코드로 애니메이션을 만들 수 있어요! 출력에 커서 이동이 있으면 애니메이션 작품으로 취급해요:

- 쓸 수 있는 것: <code>\r</code>, <code>\b</code>, 커서 이동(<code>ESC[H</code>, <code>ESC[3A</code> 등), 화면이나 줄 지우기(<code>ESC[2J</code>, <code>ESC[K</code>), 커서 저장/복원, 커서 숨기기(<code>ESC[?25l</code>), 대체 화면(<code>ESC[?1049h</code>)
- 프로그램은 **{{ r.maxCols }} × {{ r.maxRows }}** 크기의 터미널에서 실행돼요. 범위를 벗어난 내용은 보이지 않아요
- 애니메이션은 최대 **{{ r.animationSeconds }}초**까지 녹화돼요. 무한 반복해도 되고, 시간이 되면 잘려요(실패가 아니에요). 사이트에서는 반복 재생돼요
- 애니메이션은 **{{ r.runTimeout }}초 안에 시작**해야 해요(첫 커서 이동이 나타나야 해요). 그렇지 않으면 실행 시간 초과로 처리돼요
- 프레임 사이에는 지연(예: <code>sleep</code>)을 넣어 주세요. 지연이 없는 애니메이션은 한꺼번에 너무 많이 출력해서 실패해요
- 애니메이션도 매번 같아야 해요. 채점할 때 두 번 실행해 출력을 비교해요

</template>
<template v-else>

이번에는 **애니메이션을 쓸 수 없어요**. 출력에 커서 이동, <code>\r</code>, 화면 지우기 같은 제어 코드가 있으면 안 돼요.

</template>

## 실행 환경

- **표준 라이브러리만** 쓸 수 있고 패키지는 설치할 수 없어요(`pip install`, `npm install` 불가)
- 실행할 때 **네트워크 없음**
- **{{ r.runTimeout }}초** 안에 끝나야 하고(Java 등의 제한은 [언어와 여러 파일](./languages) 참고), 종료 코드는 `0`이어야 해요
- 메모리 제한은 **{{ r.memory }}**
- 작업 디렉터리는 제출 폴더예요. 파일을 읽을 수는 있지만 **쓸 수는 없어요**

## 폴더

- 위치: `submissions/<내 GitHub ID>/`
- 진입점은 `tree.<확장자>`여야 하고, 하나만 있어야 해요
- 일반 파일만 평평하게 둘 수 있고, 하위 폴더나 링크는 안 돼요
- 최대 **{{ r.maxFiles }}개 파일**, 전체 **{{ r.maxTotalKB }} KB**

## Pull Request

<template v-if="r.allowlist">

- 이번 이벤트는 **허용 목록에 있는 계정**만 제출할 수 있어요. 목록에 없는 PR은 채점하지 않고 바로 닫아요

</template>

- PR 하나로는 **자기** 폴더만 추가하거나 수정할 수 있어요
- 다른 사람의 제출물을 수정한 PR은 닫혀요. `submissions/` 밖의 파일을 수정한 PR은 일반 PR로 취급해 채점하지 않아요

## 라이선스 {#license}

- 작품의 **저작권은 여러분에게 있어요**. 라이선스(예: MIT, CC BY 4.0)를 지정하고 싶다면 폴더에 `LICENSE`(또는 `LICENSE.md`, `LICENSE.txt`, `COPYING`)를 넣어 주세요. 사이트의 작품에 라이선스가 표시돼요
- 라이선스 파일에 `SPDX-License-Identifier: <라이선스 ID>` 한 줄을 쓰면 사이트가 그 이름을 그대로 써요
- 라이선스 파일이 없으면 사이트에 '모든 권리 보유'로 표시돼요

::: warning PR을 열어 제출하면 이 이벤트에 사용을 허락하는 거예요
Pull Request를 열어 제출하면, 이벤트의 개최·전시·기록·홍보를 위해 이 이벤트(크리스마스 트리 교환과 주최자)가 여러분의 작품을 **복제·실행·공개 전시·배포**하고 기술적으로 필요한 처리(예: 컴파일, 샌드박스에서 실행, 애니메이션 녹화, 화면 캡처)를 하도록 허락한 것으로 봐요.

이 허락은 비독점적·무상·영구적이며 철회할 수 없고, 여러분이 다른 라이선스로 작품을 공개하는 데에는 **영향을 주지 않아요**. 여러분의 GitHub 사용자 이름, 아바타, 작품도 사이트와 교환 발표에 공개돼요.
:::

전체 조항은 저장소 루트의 <a v-if="data.repo" :href="`https://github.com/${data.repo}/blob/main/SUBMISSION_LICENSE.md`">SUBMISSION_LICENSE.md</a><code v-else>SUBMISSION_LICENSE.md</code>(중국어)를 참고하세요.

## 행동 강령

친절하게 대해 주세요. 작품에 차별, 괴롭힘, 부적절한 내용이 있어서는 안 돼요. 이를 어긴 제출물은 삭제되고 교환 자격을 잃어요.
