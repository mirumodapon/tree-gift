<script setup lang="ts">
import { data } from '../../.vitepress/gift.data.ts'

const repoUrl = data.repo ? `https://github.com/${data.repo}` : null
</script>

# 제출 시작하기

stdout에 크리스마스 트리를 출력하는 프로그램을 작성해 Pull Request로 제출하세요. 마감 후 무작위로 짝이 정해져, 내 트리는 다른 참가자에게 선물되고 나도 다른 사람의 트리를 받게 됩니다.

::: tip 현재 상태
<template v-if="data.acceptSubmissions">지금 <strong>접수 중</strong>이에요. 많이 참여해 주세요!</template>
<template v-else-if="data.state === 'NOT_STARTED'">이벤트가 <strong>아직 시작되지 않았어요</strong>. 규칙을 읽고 로컬에서 프로그램을 작성해 두었다가, 접수가 시작되면 PR을 열어 주세요.</template>
<template v-else>이벤트가 <strong>종료되었어요</strong>. 참여해 주셔서 감사합니다!</template>
<template v-if="data.schedule"><br>접수 기간: <EventTime :iso="data.schedule.start" /> ~ <EventTime :iso="data.schedule.end" />. 마감 후 자동으로 교환돼요.</template>
:::

## 단계

1. <a v-if="repoUrl" :href="repoUrl">이벤트 저장소</a><span v-else>이벤트 저장소</span>를 **Fork**하기
2. `submissions/<내 GitHub ID>/` 폴더 만들기 (대소문자까지 정확히 일치해야 해요)
3. 폴더에 프로그램 넣기. 진입점 파일 이름은 `tree.<확장자>`이고, 다른 파일(모듈, 헤더, 데이터 파일, `README.md`)은 같은 폴더에 둬요
4. 로컬에서 테스트하기 (선택이지만 강력히 추천해요)
5. **Pull Request**를 열면 봇이 자동으로 채점해요 (PR을 열면 [제출 라이선스](#license)에 동의한 것으로 봐요)
6. 교환 기다리기: 마감 후 공지 Issue에 여러분을 @ 멘션한 댓글이 선물 링크와 함께 올라와요 (공지 자체를 보고 싶다면 저장소의 Issues를 Watch하세요)

```
submissions/
  your-github-id/
    tree.py      ← 진입점 (필수)
    star.py      ← 다른 파일 (선택)
    trunk.txt
    README.md    ← 작품 소개 (선택), 사이트의 작품 페이지에 표시돼요
```

작품이 공개되면 사이트에 사람마다 작품 페이지가 생기고, 전체 작품과 모든 소스 코드, 그리고 `README.md`가 표시돼요 (Markdown은 지원하지만 HTML은 지원하지 않아요. 이미지는 https 주소를 써야 해요).

저장소의 `examples/` 폴더에 언어별 예제가 있어요. 지원 언어는 [언어와 여러 파일](./languages)을 참고하세요.

## PR을 연 다음

봇이 몇 분 안에 PR을 처리하고 결과를 댓글로 알려 줘요:

| 상황                              | 결과                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| 채점 통과                         | <IconCircleCheck class="i ok" /> 자동으로 병합되고 제출이 완료돼요                            |
| 채점 실패                         | <IconCircleX class="i bad" /> 이유를 댓글로 남기고 PR을 닫아요. 고친 뒤 **새 PR을 열면** 돼요 |
| 다른 사람의 제출물을 수정함       | <IconCircleX class="i bad" /> PR을 닫아요. 제출 PR은 자기 폴더만 수정할 수 있어요             |
| `submissions/` 밖의 파일을 수정함 | <IconGitPullRequest class="i" /> 일반 PR로 취급해 채점하지 않고 주최자의 리뷰를 기다려요      |
| 접수 기간이 아님                  | <IconLock class="i" /> PR을 닫고, 이벤트가 아직 시작 전이거나 이미 끝났다고 댓글로 알려요     |

병합된 뒤에 작품을 고치고 싶다면, 자기 폴더를 수정하는 PR을 다시 열면 돼요. 똑같이 다시 채점해요.

봇의 댓글은 중국어지만, 지적하는 문제마다 영어 설명도 함께 붙어 있어요.

## 라이선스 {#license}

- 작품의 **저작권은 여러분에게 있어요**. 라이선스(예: MIT, CC BY 4.0)를 지정하고 싶다면 폴더에 `LICENSE`(또는 `LICENSE.md`, `LICENSE.txt`, `COPYING`)를 넣어 주세요. 작품 페이지에 표시돼요
- 라이선스 파일이 없으면, 이 이벤트에 허락한 것 외의 모든 권리는 여러분이 보유해요
- PR을 열어 제출하면, 이벤트의 개최·전시·기록·홍보를 위해 작품을 복제·실행·공개 전시·배포하고 기술적으로 필요한 처리(예: 컴파일, 애니메이션 녹화)를 하도록 **이 이벤트에 허락**한 것으로 봐요. 이 허락은 여러분이 다른 방식으로 작품을 공개하는 데 영향을 주지 않아요
- 여러분의 GitHub 사용자 이름, 아바타, 작품은 사이트와 교환 발표에 공개돼요

전체 조항은 저장소 루트의 `SUBMISSION_LICENSE.md`(중국어)를 참고하세요.

## 로컬에서 테스트하기

[Node.js](https://nodejs.org/) 24 이상, [pnpm](https://pnpm.io/), [Docker](https://www.docker.com/)가 필요해요. 채점 환경은 온라인과 완전히 같아요:

```sh
pnpm install
pnpm play <내 GitHub ID>   # 샌드박스에서 실행해 트리를 바로 보기 (애니메이션은 실시간 재생)
pnpm judge <내 GitHub ID>  # 채점, 결과는 온라인과 같아요
```

트리와 채점 결과가 출력되고, 통과하면 `✅ PASS`가 표시돼요.
