// 網站介面文字（元件與 config 共用，不依賴 VitePress 的瀏覽器端 API）。
// 頁面內文在 docs/<locale>/ 底下各自一份；語言清單與導向規則在 ../locales.ts。

import type { EventState } from '@gift/judge'
import type { Locale } from '../locales.ts'

export interface Messages {
  /** 語言選單裡的名稱 */
  label: string
  status: Record<EventState, string>
  submissionCount: (n: number) => string
  exchanged: string
  noLicense: string
  customLicense: string
  licenseTitle: (license: string) => string
  giftTo: string
  filterByLanguage: string
  all: (n: number) => string
  noTrees: string
  gallery: string
  backToGallery: string
  animationSeconds: (s: number) => string
  /** 「收到 @x 的樹」拆成前後兩段，中間是連結 */
  receivedFrom: [string, string]
  authorNotes: string
  sourceCode: string
  entry: string
  licenseHeading: (license: string) => string
  licensedAs: string
  noLicenseNote: string
  /** 「著作權屬於作者 @x。詳見投稿授權條款。」拆成三段：前、連結文字、後 */
  copyright: (user: string) => [string, string, string]
  treeNotFound: string
  giftTitle: (user: string) => string
  giftFrom: string
  giftMore: string
  giftNotFound: string
  giftNotFoundNote: string
  entryFile: string
  language: string
  runTimeout: string
  seconds: (s: number) => string
  treePageTitle: (user: string) => string
  giftPageTitle: (user: string) => string
}

export const MESSAGES: Record<Locale, Messages> = {
  'zh-hant': {
    label: '繁體中文',
    status: {
      NOT_STARTED: '即將開始',
      PROGRESS: '收件中',
      PROGRESS_SYNC: '收件中',
      ENDED: '活動已結束',
      FATAL: '活動已結束',
    },
    submissionCount: (n) => `已有 ${n} 份投稿`,
    exchanged: '禮物已交換',
    noLicense: '保留所有權利',
    customLicense: '自訂授權',
    licenseTitle: (l) => `授權：${l}`,
    giftTo: '送給',
    filterByLanguage: '依語言篩選',
    all: (n) => `全部 ${n}`,
    noTrees: '還沒有作品，成為第一棵樹吧！',
    gallery: '作品牆',
    backToGallery: '回到作品牆',
    animationSeconds: (s) => `動畫 ${s} 秒`,
    receivedFrom: ['收到', '的樹'],
    authorNotes: '作者的話',
    sourceCode: '原始碼',
    entry: '進入點',
    licenseHeading: (l) => `授權：${l}`,
    licensedAs: '這份作品依作者附上的授權釋出：',
    noLicenseNote: '作者沒有附上授權檔：除了授權本活動展示與使用之外，作者保留所有權利。',
    copyright: (u) => [`著作權屬於作者 @${u}。詳見`, '投稿授權條款', '。'],
    treeNotFound: '找不到這份作品',
    giftTitle: (u) => `@${u}，你收到了一棵聖誕樹！`,
    giftFrom: '來自',
    giftMore: '看完整作品、原始碼與作者的話',
    giftNotFound: '找不到這份禮物',
    giftNotFoundNote: '可能還沒交換，或這份作品已經下架。',
    entryFile: '進入點檔名',
    language: '語言',
    runTimeout: '執行時間上限',
    seconds: (s) => `${s} 秒`,
    treePageTitle: (u) => `@${u} 的聖誕樹`,
    giftPageTitle: (u) => `@${u} 的聖誕禮物`,
  },
  en: {
    label: 'English',
    status: {
      NOT_STARTED: 'Coming soon',
      PROGRESS: 'Open for submissions',
      PROGRESS_SYNC: 'Open for submissions',
      ENDED: 'Event ended',
      FATAL: 'Event ended',
    },
    submissionCount: (n) => `${n} ${n === 1 ? 'submission' : 'submissions'} so far`,
    exchanged: 'Gifts exchanged',
    noLicense: 'All rights reserved',
    customLicense: 'Custom license',
    licenseTitle: (l) => `License: ${l}`,
    giftTo: 'Gift to',
    filterByLanguage: 'Filter by language',
    all: (n) => `All ${n}`,
    noTrees: 'No trees yet. Be the first!',
    gallery: 'Gallery',
    backToGallery: 'Back to the gallery',
    animationSeconds: (s) => `${s}s animation`,
    receivedFrom: ['Received a tree from', ''],
    authorNotes: 'From the author',
    sourceCode: 'Source code',
    entry: 'entry point',
    licenseHeading: (l) => `License: ${l}`,
    licensedAs: 'This work is released under the license the author included:',
    noLicenseNote:
      'The author did not include a license file: apart from the license granted to this event for display and use, all rights are reserved.',
    copyright: (u) => [`Copyright belongs to the author @${u}. See the`, 'submission license', '.'],
    treeNotFound: 'Tree not found',
    giftTitle: (u) => `@${u}, you received a Christmas tree!`,
    giftFrom: 'From',
    giftMore: 'See the full work, its source code and the author’s notes',
    giftNotFound: 'Gift not found',
    giftNotFoundNote: 'The exchange may not have happened yet, or this work has been taken down.',
    entryFile: 'Entry file',
    language: 'Language',
    runTimeout: 'Time limit',
    seconds: (s) => `${s} s`,
    treePageTitle: (u) => `@${u}’s Christmas tree`,
    giftPageTitle: (u) => `@${u}’s Christmas gift`,
  },
  ja: {
    label: '日本語',
    status: {
      NOT_STARTED: 'まもなく開始',
      PROGRESS: '受付中',
      PROGRESS_SYNC: '受付中',
      ENDED: 'イベント終了',
      FATAL: 'イベント終了',
    },
    submissionCount: (n) => `投稿 ${n} 件`,
    exchanged: 'プレゼント交換済み',
    noLicense: '全著作権所有',
    customLicense: '独自ライセンス',
    licenseTitle: (l) => `ライセンス：${l}`,
    giftTo: 'プレゼント先',
    filterByLanguage: '言語で絞り込む',
    all: (n) => `すべて ${n}`,
    noTrees: 'まだ作品がありません。最初のツリーになりましょう！',
    gallery: 'ギャラリー',
    backToGallery: 'ギャラリーに戻る',
    animationSeconds: (s) => `アニメーション ${s} 秒`,
    receivedFrom: ['', 'からツリーが届きました'],
    authorNotes: '作者より',
    sourceCode: 'ソースコード',
    entry: 'エントリーポイント',
    licenseHeading: (l) => `ライセンス：${l}`,
    licensedAs: 'この作品は作者が添付したライセンスで公開されています：',
    noLicenseNote:
      '作者はライセンスファイルを添付していません。本イベントでの展示・利用を許諾する以外、すべての権利は作者に留保されています。',
    copyright: (u) => [
      `著作権は作者 @${u} に帰属します。詳しくは`,
      '投稿ライセンス',
      'をご覧ください。',
    ],
    treeNotFound: '作品が見つかりません',
    giftTitle: (u) => `@${u} さん、クリスマスツリーが届きました！`,
    giftFrom: '贈り主',
    giftMore: '作品の全体・ソースコード・作者のコメントを見る',
    giftNotFound: 'プレゼントが見つかりません',
    giftNotFoundNote: 'まだ交換されていないか、この作品は取り下げられました。',
    entryFile: 'エントリーファイル名',
    language: '言語',
    runTimeout: '実行時間の上限',
    seconds: (s) => `${s} 秒`,
    treePageTitle: (u) => `@${u} のクリスマスツリー`,
    giftPageTitle: (u) => `@${u} へのクリスマスプレゼント`,
  },
  ko: {
    label: '한국어',
    status: {
      NOT_STARTED: '곧 시작',
      PROGRESS: '접수 중',
      PROGRESS_SYNC: '접수 중',
      ENDED: '이벤트 종료',
      FATAL: '이벤트 종료',
    },
    submissionCount: (n) => `지금까지 ${n}개 제출`,
    exchanged: '선물 교환 완료',
    noLicense: '모든 권리 보유',
    customLicense: '자체 라이선스',
    licenseTitle: (l) => `라이선스: ${l}`,
    giftTo: '받는 사람',
    filterByLanguage: '언어로 필터',
    all: (n) => `전체 ${n}`,
    noTrees: '아직 작품이 없어요. 첫 번째 트리가 되어 보세요!',
    gallery: '갤러리',
    backToGallery: '갤러리로 돌아가기',
    animationSeconds: (s) => `애니메이션 ${s}초`,
    receivedFrom: ['', '님에게서 트리를 받았어요'],
    authorNotes: '작가의 말',
    sourceCode: '소스 코드',
    entry: '진입점',
    licenseHeading: (l) => `라이선스: ${l}`,
    licensedAs: '이 작품은 작가가 첨부한 라이선스로 공개됩니다:',
    noLicenseNote:
      '작가가 라이선스 파일을 첨부하지 않았습니다. 이 이벤트에서의 전시와 사용을 허락한 것 외에는 모든 권리를 작가가 보유합니다.',
    copyright: (u) => [
      `저작권은 작가 @${u}에게 있습니다. 자세한 내용은`,
      '제출 라이선스',
      '를 참고하세요.',
    ],
    treeNotFound: '작품을 찾을 수 없어요',
    giftTitle: (u) => `@${u}님, 크리스마스 트리가 도착했어요!`,
    giftFrom: '보낸 사람',
    giftMore: '전체 작품, 소스 코드, 작가의 말 보기',
    giftNotFound: '선물을 찾을 수 없어요',
    giftNotFoundNote: '아직 교환 전이거나 작품이 내려갔을 수 있어요.',
    entryFile: '진입점 파일 이름',
    language: '언어',
    runTimeout: '실행 시간 제한',
    seconds: (s) => `${s}초`,
    treePageTitle: (u) => `@${u}의 크리스마스 트리`,
    giftPageTitle: (u) => `@${u}에게 온 크리스마스 선물`,
  },
}
