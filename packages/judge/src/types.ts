export interface Language {
  /** 顯示名稱 */
  name: string
  /** Docker image */
  image: string
  /** 編譯指令（選填），在 container 內以 sh -c 執行 */
  compile?: string
  /** 執行指令，在 container 內以 sh -c 執行 */
  run: string
  /** 覆寫預設執行逾時（秒） */
  runTimeout?: number
}

export interface Rules {
  output: {
    /** 每行最大顯示寬度（中文/emoji 算 2 格） */
    maxCols: number
    /** 最大行數（尾端空行不計） */
    maxRows: number
    /** stdout 上限（bytes） */
    maxBytes: number
    /** 是否允許 ANSI 顏色（只允許 SGR: ESC[...m） */
    allowColor: boolean
    /** 是否要求兩次執行輸出相同 */
    deterministic: boolean
  }
  /**
   * ANSI 動畫：輸出含游標移動（\r、ESC[H 等）就視為動畫。
   * 程式在 80×50（maxCols × maxRows）的虛擬終端機裡執行，錄下時間軸，網站上循環播放。
   */
  animation: {
    /** 是否允許動畫；false 時游標移動等控制碼一律判 bad_control */
    enabled: boolean
    /** 動畫最長錄製秒數，到時間就截斷（不算失敗）；必須 >= 各語言的執行逾時 */
    maxSeconds: number
    /** 動畫的輸出上限（bytes）；超過代表畫面之間沒有延遲 */
    maxBytes: number
  }
  sandbox: {
    runTimeout: number
    compileTimeout: number
    /** 執行參加者程式時的記憶體上限 */
    memory: string
    /** 編譯階段的記憶體上限（編譯器比程式本身吃記憶體，編譯完會降回 memory） */
    compileMemory: string
    cpus: string
    pids: number
    /** 投稿資料夾最多幾個檔案 */
    maxFiles: number
    /** 投稿資料夾檔案總大小上限（bytes） */
    maxTotalBytes: number
  }
  /**
   * 投稿白名單：enabled 為 true 時，只有 users 裡的 GitHub 帳號可以投稿（不分大小寫）。
   * 名單外的投稿 PR 不評測直接關閉，也不會出現在作品牆與交換中。
   */
  allowlist: {
    enabled: boolean
    /** GitHub 帳號名稱（login） */
    users: string[]
  }
  /** 副檔名 -> 語言設定；參加者的檔名必須是 tree.<副檔名> */
  languages: Record<string, Language>
}

export type ErrorCode =
  | 'bad_folder'
  | 'no_folder'
  | 'unexpected_file'
  | 'no_entry'
  | 'multiple_entries'
  | 'too_many_files'
  | 'too_large'
  | 'compile_timeout'
  | 'compile_error'
  | 'timeout'
  | 'output_too_large'
  | 'nonzero_exit'
  | 'invalid_utf8'
  | 'bad_control'
  | 'empty_output'
  | 'too_wide'
  | 'too_tall'
  | 'nondeterministic'
  | 'internal_error'

export interface JudgeError {
  code: ErrorCode
  message: string
}

export interface Animation {
  /** asciicast v2（asciinema 的錄影格式），一行一個 JSON */
  cast: string
  /** 錄製長度（秒） */
  duration: number
  /** 是否因達到 maxSeconds 而截斷 */
  truncated: boolean
  /** 預覽用的畫面時間點（秒）：最後一格，若最後一格是空的則取內容最多的一格 */
  posterTime: number
}

export interface JudgeResult {
  user: string
  ok: boolean
  language: string | null
  languageName: string | null
  errors: JudgeError[]
  /**
   * 第一次執行的輸出，只含文字與顏色（SGR）。
   * 靜態作品是原始 stdout；動畫作品是虛擬終端機上的最後一格畫面（純文字）。
   */
  stdout: string | null
  /** 動畫作品才有 */
  animation?: Animation | null
  stderr: string
  stats: { cols?: number; rows?: number; bytes?: number; timeMs?: number }
}
