// 交換聖誕樹 — Judge 規則設定
// 所有可調整的規則都集中在這裡，改完 push 即生效。

import type { Rules } from '@gift/judge'

export default {
  output: {
    maxCols: 80, // 每行最大顯示寬度（中文/emoji 算 2 格）
    maxRows: 50, // 最大行數（尾端空行不計）
    maxBytes: 65536, // stdout 上限，超過直接判失敗
    allowColor: true, // 是否允許 ANSI 顏色（只允許 SGR: ESC[...m）
    deterministic: true, // 是否要求兩次執行輸出相同（false 即允許隨機）
  },

  animation: {
    enabled: true, // 是否允許 ANSI 動畫
    maxSeconds: 10, // 動畫最長錄製秒數，到時間就截斷，網站上循環播放（須 >= 各語言的執行逾時）
    maxBytes: 1048576, // 動畫輸出上限；超過通常是畫面之間沒有延遲
  },

  sandbox: {
    runTimeout: 5, // 執行逾時（秒）
    compileTimeout: 60, // 編譯逾時（秒）
    memory: '256m', // 執行時的記憶體上限
    compileMemory: '1g', // 編譯階段的記憶體上限，編譯完降回 memory
    cpus: '1',
    pids: 128, // 防 fork bomb
    maxFiles: 20, // 投稿資料夾最多幾個檔案
    maxTotalBytes: 262144, // 投稿資料夾檔案總大小上限
  },

  // 投稿白名單：enabled 為 true 時，只有 users 裡的 GitHub 帳號可以投稿（不分大小寫）
  // 名單外的投稿 PR 不評測直接關閉，judge-all 也會略過，不會出現在作品牆與交換中
  allowlist: {
    enabled: false,
    users: [], // 例如 ['octocat', 'monalisa']
  },

  // 副檔名 -> image / 編譯指令 / 執行指令
  // 進入點必須是 tree.<副檔名>，同資料夾可放其他檔案（模組、標頭檔、資料）。
  // 投稿資料夾掛載在 /src（唯讀，也是工作目錄），/tmp 可寫可執行。
  languages: {
    py: { name: 'Python 3.13', image: 'python:3.13-slim', run: 'python3 /src/tree.py' },
    js: { name: 'Node.js 22', image: 'node:22-slim', run: 'node /src/tree.js' },
    rb: { name: 'Ruby 3.3', image: 'ruby:3.3-slim', run: 'ruby /src/tree.rb' },
    sh: { name: 'Shell (Alpine)', image: 'alpine:3.20', run: 'sh /src/tree.sh' },
    c: {
      name: 'C (GCC 14)',
      image: 'gcc:14',
      compile: 'gcc -O2 -I/src -o /tmp/tree /src/*.c -lm',
      run: '/tmp/tree',
    },
    cpp: {
      name: 'C++17 (G++ 14)',
      image: 'gcc:14',
      compile: 'g++ -O2 -std=c++17 -I/src -o /tmp/tree /src/*.cpp',
      run: '/tmp/tree',
    },
    go: {
      name: 'Go 1.23',
      image: 'golang:1.23',
      // -p 1：Go 1.23 不認 container 的 CPU 配額，預設會依主機核心數平行編譯而吃光記憶體
      // 編完刪掉 build cache：/tmp 是 tmpfs，會佔用執行階段的記憶體額度
      compile: 'cd /tmp && go build -p 1 -o /tmp/tree /src/*.go && rm -rf /tmp/gocache',
      run: '/tmp/tree',
    },
    rs: {
      name: 'Rust',
      image: 'rust:1-slim',
      compile: 'rustc -O -o /tmp/tree /src/tree.rs',
      run: '/tmp/tree',
    },
    java: {
      // source launcher：第一個 top-level class 需含 main；其他 class 放在同資料夾的 <Class>.java
      // JVM 啟動 + 即時編譯較慢，給較長的執行時間
      name: 'Java 25',
      image: 'eclipse-temurin:25-jdk',
      run: 'java /src/tree.java',
      runTimeout: 10,
    },
  },
} satisfies Rules
