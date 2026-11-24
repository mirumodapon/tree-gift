# 🎄 Gift — 交換聖誕樹

寫一支程式，在 stdout 印出一棵聖誕樹，送給另一位參加者。
截止後系統會隨機配對，每個人都會收到別人寫的樹 🎁

## 參加方式

1. Fork 這個 repo
2. 建立資料夾 `submissions/<你的 GitHub ID>/`（大小寫要完全一致）
3. 放入程式，進入點檔名為 `tree.<副檔名>`；其他檔案（模組、標頭檔、資料檔、`README.md`）放在同一層
4. 開 Pull Request（即表示同意[投稿授權條款](SUBMISSION_LICENSE.md)），機器人會自動評測：通過就自動合併 🎁，沒通過會留言說明原因並關閉 PR（修正後再開一個新的 PR 即可）
5. 等待交換：截止後會在公告 Issue 留言 @ 你，附上你的禮物連結

```
submissions/
  your-github-id/
    tree.py      ← 進入點（必要）
    star.py      ← 其他檔案（選填）
    trunk.txt
    README.md
```

可以參考 [`examples/`](examples/) 裡各語言的範例。

### 支援的語言

| 檔名        | 語言           |
| ----------- | -------------- |
| `tree.py`   | Python 3.13    |
| `tree.js`   | Node.js 22     |
| `tree.rb`   | Ruby 3.3       |
| `tree.sh`   | Shell (Alpine) |
| `tree.c`    | C (GCC 14)     |
| `tree.cpp`  | C++17 (G++ 14) |
| `tree.go`   | Go 1.23        |
| `tree.rs`   | Rust           |
| `tree.java` | Java 25        |

多檔案時：

- C / C++：資料夾內所有 `*.c` / `*.cpp` 會一起編譯，`#include "xxx.h"` 可直接用
- Go：所有 `*.go` 一起編譯（都要是 `package main`）
- Rust：用 `mod xxx;` 引用同資料夾的 `xxx.rs`
- Java：其他 class 放在同資料夾的 `<Class>.java`
- Python / Node.js / Ruby / Shell：照一般方式 import / require 同資料夾的檔案
- 工作目錄就是你的資料夾，可以直接用相對路徑讀檔（例如 `open("trunk.txt")`），但不能寫入

想用其他語言？歡迎開 issue 討論。

### 規則

- 只能使用標準函式庫，執行時**沒有網路**
- 資料夾內只能平放一般檔案（不能有子資料夾或連結），最多 20 個檔案、總共 256 KB
- 5 秒內執行完畢（Java 10 秒），結束代碼要是 0
- 輸出最多 **80 欄 × 50 行**（中文、emoji 算 2 欄），64 KB 以內
- 可以用 ANSI 顏色（`ESC[...m`）
- 可以做 **ANSI 動畫**：用 `\r`、游標移動（`ESC[H` 等）、清畫面重畫。程式在 `maxCols × maxRows`（預設 80×50）的終端機裡執行，最長錄製秒數由 `rules.ts` 的 `animation.maxSeconds` 決定（預設 10 秒，可無限循環，時間到就截斷），網站上會循環播放；動畫須在該語言的執行時間上限內開始。範例見 `examples/animation`，實際數值以活動網站的規則頁為準
- 不能用 `\t`、響鈴、超連結／設定標題（OSC）等其他控制碼
- 每次執行的輸出必須相同（不能用亂數）
- 主辦方可以在 `rules.ts` 啟用投稿白名單，啟用時只有名單內的帳號可以投稿
- PR 只能新增或修改你自己的 `submissions/<你的 ID>/`（改到別人的投稿會被關閉；改到 `submissions/` 以外的檔案則視為一般 PR，等主辦方 review，不會評測）

### 在本機測試

需要 Node.js 24+、pnpm、Docker。

```sh
pnpm install
pnpm play <你的 ID>         # 在沙箱中執行，直接在終端機看到你的樹（動畫會即時播放，不評測）
pnpm judge <你的 ID>        # 評測 submissions/<你的 ID>/
```

## 主辦方

### 架構

```
packages/
  judge/   沙箱執行與輸出檢查（Docker）、評測全部投稿，以及 exchange.json 的格式
  tools/   PR 自動審查、配對
  site/    活動網站（VitePress）：首頁、參加方式、作品牆、禮物頁
rules.ts   所有規則與語言設定
```

| Workflow       | 觸發                | 做什麼                                                                                 |
| -------------- | ------------------- | -------------------------------------------------------------------------------------- |
| `review.yml`   | PR                  | 分類 PR；投稿 PR 在沙箱中評測，通過就 merge、否則關閉                                  |
| `pages.yml`    | push 到 main / 手動 | 建置並部署活動網站；依 `EVENT_STATE` 決定是否評測並公開作品（自動 merge 後也會觸發）   |
| `exchange.yml` | 手動 / 排程         | 重新評測 → 配對 → commit `exchange.json` → 開公告                                      |
| `schedule.yml` | 每天 12:00、23:00   | `EVENT_STATE` 為 `TIME` / `TIME_SYNC` 時：跨過開始或截止時間就重新部署，截止後自動交換 |
| `ci.yml`       | 改到 judge 或工具時 | lint、format、typecheck、測試                                                          |

### PR 怎麼處理

| PR 的變更                                    | 處理                                                  |
| -------------------------------------------- | ----------------------------------------------------- |
| 不收件時（見下方 `EVENT_STATE`）的投稿 PR    | 不評測，留言說明活動尚未開始或已結束，並關閉          |
| 白名單已啟用，但作者不在名單內               | 不評測，留言說明並關閉                                |
| 只改 `submissions/<作者>/`                   | 評測：通過 → 留言並 squash merge；未通過 → 留言並關閉 |
| 改到別人的 `submissions/<其他人>/`           | 不評測，留言並關閉                                    |
| 改到 `submissions/` 以外的任何檔案（含混合） | 一般功能性 PR：不評測、不留言，等 maintainer review   |
| draft、bot、目標不是預設分支                 | 不處理                                                |
| judge 本身出錯（例如 Docker 失敗）           | 留言，不 merge 也不關閉，等主辦方處理                 |

### 沙箱

每份投稿在獨立的 container 中執行：無網路、唯讀檔案系統、非 root、限制記憶體 / CPU / process 數量，
並在逾時或輸出過大時直接停掉 container。編譯與兩次執行都在同一個 container 內完成。

### 安全設計

`review.yml` 用 `pull_request_target` 觸發：workflow 與 judge 程式一律來自預設分支，PR 改不到；
也不需要維護者按「Approve and run」，第一次貢獻的參加者也能全自動處理。分成兩個 job：

- **judge**：token 唯讀。PR 的檔案用 `git archive` 當資料取出，只在無網路的 Docker 沙箱裡執行
- **act**：有寫入權限，但不執行任何 PR 的程式；只負責留言、merge、關閉。merge 前會再向 API 確認變更範圍，
  並指定 head sha，評測期間有新 commit 就不會 merge
- **投稿資料夾綁定 GitHub user ID**：bot merge 時在固定的 squash commit 內文寫入 `Gift-Author-Id: <id>`。
  之後修改 `submissions/<login>/` 時，main 上該資料夾的 commit 紀錄裡若有別的 ID 就拒絕，
  避免原作者改名後、名稱被別人註冊而接手作品；也會拒絕大小寫不同的同名資料夾（帳號不分大小寫，git 路徑分）。
  合法改名的參加者需要主辦方手動搬移資料夾
- **squash commit 內文固定**：不沿用 PR 裡任何 commit 的訊息，偽造的 `Co-authored-by` 不會進到 main

`pages.yml` 與 `exchange.yml` 都會在 main 上重新評測，不沿用 PR 當時的結果。

### 設定 repo

1. **Settings → Pages**：Source 選 GitHub Actions
2. **Settings → Branches**：保護 `main`，要求 `judge` check（Review workflow）通過才能 merge。
   - 一般功能性 PR 的 `judge` 會直接通過（不評測），由 maintainer review 後手動合併
   - **不要**開「Require approvals」：自動 merge 用的是 `GITHUB_TOKEN`，要求 review 會讓它無法合併
   - **不要**開「Require branches to be up to date」：投稿 PR 之間互不衝突，開了反而會卡住
3. **Settings → Secrets and variables → Actions → Variables**：
   - `EVENT_STATE`：活動狀態，見下方「活動狀態」
   - `SITE_URL`（選填）：自訂網域時設定，交換公告裡「打開禮物」的連結會用它；`schedule.yml` 也用它讀取網站目前的狀態
4. 如果 `main` 禁止直接 push，請允許 GitHub Actions 推送，或改用 PR 合併 `exchange.json`

### 投稿白名單

只想讓特定的人參加時，在 `rules.ts` 啟用白名單並列出 GitHub 帳號名稱（不分大小寫）：

```ts
allowlist: {
  enabled: true,
  users: ['octocat', 'monalisa'],
},
```

- 名單外的投稿 PR 不評測，留言說明並關閉；merge 前也會再檢查一次
- `judge-all` 會略過名單外已經在 `submissions/` 裡的資料夾，所以它們不會出現在作品牆，也不會參加交換
- 名單比對的是帳號名稱：參加者改名後要更新名單（資料夾也需要主辦方手動搬移）
- 改完 push 到 `main` 即生效；從名單移除的人已合併的作品，要重新部署網站後才會從作品牆消失

### 活動狀態

repo variable `EVENT_STATE` 決定是否收件、是否把聖誕樹公開到網站上：

| `EVENT_STATE`   | 意義                 | 收件   | 公開作品 |
| --------------- | -------------------- | ------ | -------- |
| `NOT_STARTED`   | 尚未開始             | ✗      | ✗        |
| `PROGRESS`      | 進行中，作品保密     | ✓      | ✗        |
| `PROGRESS_SYNC` | 進行中，作品即時公開 | ✓      | ✓        |
| `ENDED`         | 已結束，公開作品     | ✗      | ✓        |
| `FATAL`         | 已結束，不公開作品   | ✗      | ✗        |
| `TIME`          | 依時間，作品保密     | 時間內 | 截止後   |
| `TIME_SYNC`     | 依時間，作品即時公開 | 時間內 | 開始後   |

`TIME` / `TIME_SYNC` 依 `rules.ts` 的 `schedule`（`start`、`end`，要帶時區，例如 `2026-12-24T23:59:59+08:00`）自動切換：

| 時間             | `TIME`            | `TIME_SYNC`       |
| ---------------- | ----------------- | ----------------- |
| `start` 之前     | `NOT_STARTED`     | `NOT_STARTED`     |
| `start` ～ `end` | `PROGRESS`        | `PROGRESS_SYNC`   |
| `end` 之後       | `ENDED`，自動交換 | `ENDED`，自動交換 |

- PR 是否在收件時間內，看的是 **PR 開啟或更新的時間**，截止前送出、排隊到截止後才評測的 PR 一樣算數
- 網站由 `schedule.yml` 每天台灣時間 12:00 與 23:00 檢查，跨過開始或截止時間後自動重新部署、截止後自動交換，所以網站狀態與交換最多會晚約半天（GitHub 的排程本身也可能再延遲）；收件判斷看的是 PR 的時間，不受影響。需要立刻處理時，可以到 **Actions → Schedule → Run workflow** 手動執行
- 截止後等所有 review 都跑完，`schedule.yml` 會自動執行交換，seed 固定為**截止前 `main` 上最後一個 commit 的 sha**（見下方「交換」）
- 公開 repo 連續 60 天沒有活動時，GitHub 會停用排程 workflow，活動前請到 Actions 確認 **Schedule** 是啟用的
- 設成 `TIME` / `TIME_SYNC` 卻沒有設定 `schedule` 時視為 `FATAL`

- **未定義或打錯字一律視為 `FATAL`**（不收件、不公開），新建的 repo 要先設定才會開始收件
- 不公開時，網站 build 完全不讀取作品，產出的檔案裡不會有任何作品內容
- **修改 `EVENT_STATE` 不會自動更新網站**，改完請到 **Actions → Pages → Run workflow** 重新部署

典型流程：

- 手動：`NOT_STARTED` → 開放投稿 `PROGRESS`（或 `PROGRESS_SYNC`）→ 截止 `ENDED` → 執行 Exchange workflow（完成後會自動重新部署網站）
- 自動：在 `rules.ts` 設好 `schedule`，`EVENT_STATE` 設成 `TIME`（或 `TIME_SYNC`）後重新部署一次網站，之後開始、截止、交換都會自動進行

### 交換

**`TIME` / `TIME_SYNC`（自動）**：截止後由 `schedule.yml` 自動執行，不用手動操作。seed 固定為**截止時間前 `main` 上最後一個 commit 的 sha**，不能另外指定，公告與網站上都會說明。任何人都能重算驗證：

```sh
git rev-list -1 --first-parent --before=<schedule.end> main   # 找出 seed
pnpm judge --all
EVENT_STATE=TIME node packages/tools/src/exchange.ts --seed <seed>
```

**其他模式（手動）**：截止時先把 `EVENT_STATE` 改成 `ENDED`（或 `FATAL`）停止收件，再到 **Actions → Exchange → Run workflow**，輸入事先公告的 seed（例如截止後第一個比特幣區塊的 hash，或直播抽籤的結果；留空則用目前的 commit sha）。任何人都能用同一個 seed 重算驗證：

```sh
pnpm judge --all
node packages/tools/src/exchange.ts --seed <seed>
```

**交換完成後會停用 `ci` 以外的 workflow**（`review`、`pages`、`exchange`、`schedule`）：網站部署成功後，Exchange workflow 最後一步會把它們停用，之後不再評測 PR、不再部署網站或交換。檔案仍然留在 repo 裡；要恢復（例如重新交換或重新部署），到 **Actions** 頁面逐一按 **Enable workflow**。部署失敗時不會停用，修正後可以直接重跑。

還在收件中時，交換會被拒絕。配對方式是用 seed 洗牌後排成一個環，每個人送給下一位，保證不會抽到自己。通過評測的不到兩人時不會配對，只會公告無法交換。

### 開發

```sh
pnpm site:dev  # 本機開發活動網站（作品要公開才看得到：EVENT_STATE=ENDED pnpm site:dev）
pnpm site      # 評測所有投稿並 build 網站到 _site/
pnpm check   # oxlint + oxfmt + tsc
pnpm test    # 工具單元測試 + judge 沙箱測試（需要 Docker）
pnpm fmt     # 格式化
```

TypeScript 直接由 Node.js 執行（type stripping），不需要 build。

調整規則請改 `rules.ts`（包含是否允許動畫 `animation.enabled`、動畫長度上限 `animation.maxSeconds`、投稿白名單 `allowlist`）；新增語言只需加一筆 image 與指令，再到 `examples/` 加一個範例並確認能通過。

## 授權

- 本專案（`submissions/` 以外的所有檔案）以 [MIT 授權](LICENSE)釋出
- `submissions/` 底下的投稿，著作權屬於各自的作者，依作者附上的授權檔（`LICENSE`、`LICENSE.md`、`LICENSE.txt`、`COPYING`）釋出；沒有附授權檔時保留所有權利
- 開 PR 投稿即表示授權本專案為了舉辦、展示、紀錄與推廣活動使用該作品，詳見 [投稿授權條款](SUBMISSION_LICENSE.md)
