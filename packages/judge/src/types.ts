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
  sandbox: {
    runTimeout: number
    compileTimeout: number
    memory: string
    cpus: string
    pids: number
    /** 投稿資料夾最多幾個檔案 */
    maxFiles: number
    /** 投稿資料夾檔案總大小上限（bytes） */
    maxTotalBytes: number
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

export interface JudgeResult {
  user: string
  ok: boolean
  language: string | null
  languageName: string | null
  errors: JudgeError[]
  /** 第一次執行的 stdout（UTF-8 合法時才有） */
  stdout: string | null
  stderr: string
  stats: { cols?: number; rows?: number; bytes?: number; timeMs?: number }
}
