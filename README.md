# 🎄 Gift — 交換聖誕樹

寫一支程式，在 stdout 印出一棵聖誕樹，送給另一位參加者。
截止後系統會隨機配對，每個人都會收到別人寫的樹 🎁

## 參加方式

1. Fork 這個 repo
2. 建立資料夾 `submissions/<你的 GitHub ID>/`（大小寫要完全一致）
3. 放入程式，進入點檔名為 `tree.<副檔名>`；其他檔案（模組、標頭檔、資料檔、`README.md`）放在同一層
4. 開 Pull Request，等機器人留言回報 judge 結果 ✅
5. Watch 這個 repo（Custom → 勾選 Issues），交換結果公告時才會收到通知

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
- 可以用 ANSI 顏色（`ESC[...m`），但不能用游標移動、清畫面、`\r`、`\t` 等控制字元
- 每次執行的輸出必須相同（不能用亂數）
- PR 只能新增或修改你自己的 `submissions/<你的 ID>/`

### 在本機測試

需要 Node.js 24+、pnpm、Docker。

```sh
pnpm install
pnpm judge submissions/<你的 ID>
```

## 主辦方

### 架構

```
packages/
  judge/   沙箱執行與輸出檢查（Docker）
  tools/   PR 留言、配對、展示頁
rules.ts   所有規則與語言設定
```

| Workflow       | 觸發                | 做什麼                                            |
| -------------- | ------------------- | ------------------------------------------------- |
| `judge.yml`    | PR                  | 在沙箱中評測 PR 作者的資料夾                      |
| `comment.yml`  | judge 完成          | 檢查 PR 變更範圍並留言結果                        |
| `pages.yml`    | push 到 main        | 重新評測所有投稿，部署展示頁                      |
| `exchange.yml` | 手動                | 重新評測 → 配對 → commit `exchange.json` → 開公告 |
| `ci.yml`       | 改到 judge 或工具時 | lint、format、typecheck、測試                     |

### 沙箱

每份投稿在獨立的 container 中執行：無網路、唯讀檔案系統、非 root、限制記憶體 / CPU / process 數量，
並在逾時或輸出過大時直接停掉 container。編譯與兩次執行都在同一個 container 內完成。

### 安全設計

- `judge.yml` 用 `pull_request` 觸發，token 唯讀、拿不到 secrets
- `comment.yml` 跑預設分支的程式碼；artifact 視為不可信，PR 作者與變更檔案一律向 GitHub API 重新查詢
- 有人在 PR 中改了 workflow，也只能偽造自己 PR 上的留言內容，而留言會標出 `submissions/` 以外的變更
- `pages.yml` 與 `exchange.yml` 都會在 main 上重新評測，不採用 PR 時的結果

### 設定 repo

1. **Settings → Pages**：Source 選 GitHub Actions
2. **Settings → Branches**：保護 `main`，要求 `Judge` check 通過才能 merge
3. （選填）**Settings → Variables**：設定 `SITE_URL` 覆寫展示頁網址
4. 如果 `main` 禁止直接 push，請允許 GitHub Actions 推送，或改用 PR 合併 `exchange.json`

### 交換

截止後到 **Actions → Exchange → Run workflow**，輸入事先公告的 seed（例如截止後第一個比特幣區塊的 hash，或直播抽籤的結果）。
配對方式是用 seed 洗牌後排成一個環，每個人送給下一位，保證不會抽到自己。任何人都能用同一個 seed 重算驗證：

```sh
node packages/tools/src/judge-all.ts
node packages/tools/src/exchange.ts --seed <seed>
```

### 開發

```sh
pnpm check   # oxlint + oxfmt + tsc
pnpm test    # 工具單元測試 + judge 沙箱測試（需要 Docker）
pnpm fmt     # 格式化
```

TypeScript 直接由 Node.js 執行（type stripping），不需要 build。

調整規則請改 `rules.ts`；新增語言只需加一筆 image 與指令，再到 `examples/` 加一個範例並確認能通過。
