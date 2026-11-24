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

  sandbox: {
    runTimeout: 5, // 執行逾時（秒）
    compileTimeout: 60, // 編譯逾時（秒）
    memory: '256m',
    cpus: '1',
    pids: 128, // 防 fork bomb
    maxFiles: 20, // 投稿資料夾最多幾個檔案
    maxTotalBytes: 262144, // 投稿資料夾檔案總大小上限
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
      compile: 'cd /tmp && go build -o /tmp/tree /src/*.go',
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
