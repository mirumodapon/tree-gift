import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import type { Rules } from './types.ts'

export const STDERR_CAP = 8192
/** 程序結束後，等待 pipe 收完剩餘輸出的時間 */
const DRAIN_MS = 300

export interface ExecOptions {
  /** 在 pty（虛擬終端機）中執行：輸出不會被整塊緩衝，stderr 另存到 /tmp/.stderr */
  tty?: { cols: number; rows: number }
  /**
   * 到 timeout 時若 when(目前的 stdout) 為 true，延長到 toSec 秒；
   * 到時仍未結束就停止程式並回傳 truncated（動畫用）
   */
  extend?: { toSec: number; when: (stdout: Buffer) => boolean }
}

export interface Chunk {
  /** 距離開始的毫秒數 */
  ms: number
  data: Buffer
}

export interface ExecResult {
  /** truncated：動畫到達延長時限後被截斷，不算失敗 */
  status: 'ok' | 'timeout' | 'overflow' | 'truncated'
  code: number | null
  stdout: Buffer
  /** stdout 依收到的時間切成的片段（錄製動畫用） */
  chunks: Chunk[]
  stderr: Buffer
  ms: number
}

/** image 不在本機時先 pull；大型 image（rust、golang）第一次可能要好幾分鐘。 */
function ensureImage(image: string): void {
  if (spawnSync('docker', ['image', 'inspect', image], { stdio: 'ignore' }).status === 0) return
  const r = spawnSync('docker', ['pull', '-q', image], { encoding: 'utf8', timeout: 600_000 })
  if (r.status !== 0) throw new Error(`docker pull ${image} 失敗：${r.stderr || r.error?.message}`)
}

/** 一份投稿一個 container：sleep 撐著，用 docker exec 編譯與執行。 */
export class Sandbox {
  readonly name = `santa-${randomBytes(6).toString('hex')}`

  /** memory：啟動時的記憶體上限，之後可用 limitMemory 調降 */
  constructor(image: string, srcDir: string, sb: Rules['sandbox'], memory = sb.memory) {
    ensureImage(image)
    const args = [
      'run',
      '-d',
      '--rm',
      '--name',
      this.name,
      '--network',
      'none',
      '--memory',
      memory,
      '--memory-swap',
      memory,
      '--cpus',
      sb.cpus,
      '--pids-limit',
      String(sb.pids),
      '--read-only',
      // Docker 的 tmpfs 預設 noexec，編譯語言需要 exec
      '--tmpfs',
      '/tmp:rw,exec,size=256m,mode=1777',
      '--user',
      '65534:65534',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges',
      '-e',
      'HOME=/tmp',
      '-e',
      'TMPDIR=/tmp',
      '-e',
      'PYTHONDONTWRITEBYTECODE=1',
      '-e',
      'GOCACHE=/tmp/gocache',
      '-e',
      'GOPATH=/tmp/go',
      '-e',
      'GOTOOLCHAIN=local',
      '-e',
      'GOTELEMETRY=off',
      '-v',
      `${path.resolve(srcDir)}:/src:ro`,
      '-w',
      '/src',
      image,
      'sleep',
      '3600',
    ]
    const r = spawnSync('docker', args, { encoding: 'utf8', timeout: 120_000 })
    if (r.status !== 0) throw new Error(`docker run 失敗：${r.stderr || r.error?.message}`)
  }

  exec(cmd: string, timeoutSec: number, cap: number, opts: ExecOptions = {}): Promise<ExecResult> {
    return new Promise((resolve) => {
      // 指令結束後 kill -9 -1 清掉所有殘留的背景程序（不含 PID 1 與 shell 本身），
      // 否則它們佔著 stdout，docker exec 會一直等到逾時
      let wrapped = `(${cmd}); ec=$?; kill -9 -1 2>/dev/null; exit $ec`
      if (opts.tty) {
        // pty 會把 stderr 併進輸出，另存檔案；-onlcr 避免 \n 被轉成 \r\n
        const { cols, rows } = opts.tty
        wrapped = `stty cols ${cols} rows ${rows} -onlcr 2>/dev/null; (${cmd}) 2>/tmp/.stderr; ec=$?; kill -9 -1 2>/dev/null; exit $ec`
      }
      const p = spawn(
        'docker',
        ['exec', ...(opts.tty ? ['-t'] : []), this.name, 'sh', '-c', wrapped],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      )
      const out: Buffer[] = []
      const chunks: Chunk[] = []
      const err: Buffer[] = []
      let outLen = 0
      let errLen = 0
      let status: ExecResult['status'] = 'ok'
      let exitCode: number | null = null
      let done = false
      const start = Date.now()
      let ms = 0

      const finish = () => {
        if (done) return
        done = true
        clearTimeout(timer)
        p.stdout.destroy()
        p.stderr.destroy()
        resolve({
          status,
          code: exitCode,
          ms,
          stdout: Buffer.concat(out),
          chunks,
          stderr: Buffer.concat(err),
        })
      }

      const abort = (why: 'timeout' | 'overflow') => {
        if (status !== 'ok' || done) return
        status = why
        ms = Date.now() - start
        // 殺掉 docker exec 不會停掉 container 裡的程式，直接 kill container
        this.kill()
        p.kill('SIGKILL')
      }

      // 動畫截斷：只停掉 container 裡的程式，container 留著給第二次執行
      const truncate = () => {
        if (status !== 'ok' || done) return
        status = 'truncated'
        ms = Date.now() - start
        this.stopProcesses()
        timer = setTimeout(() => p.kill('SIGKILL'), 2000)
      }

      p.stdout.on('data', (chunk: Buffer) => {
        if (status !== 'ok') return
        const part = chunk.subarray(0, Math.max(0, cap + 1 - outLen))
        if (part.length) {
          out.push(part)
          chunks.push({ ms: Date.now() - start, data: part })
        }
        outLen += chunk.length
        if (outLen > cap) abort('overflow')
      })
      p.stderr.on('data', (chunk: Buffer) => {
        if (errLen < STDERR_CAP) err.push(chunk.subarray(0, STDERR_CAP - errLen))
        errLen += chunk.length
      })

      let timer = setTimeout(() => {
        const { extend } = opts
        if (extend && extend.when(Buffer.concat(out))) {
          timer = setTimeout(truncate, Math.max(0, extend.toSec - timeoutSec) * 1000)
        } else {
          abort('timeout')
        }
      }, timeoutSec * 1000)
      // 保險：docker exec 結束後若 pipe 遲遲不關，最多再等 DRAIN_MS
      p.on('exit', (code) => {
        exitCode = code
        if (!ms) ms = Date.now() - start
        setTimeout(finish, DRAIN_MS)
      })
      p.on('close', finish)
    })
  }

  /**
   * 執行指令並把輸出直接接到目前的終端機（pnpm play 用，不檢查輸出）。
   * stdout 是終端機時在 cols × rows 的 pty 中執行，stderr 會一起顯示；
   * timeoutSec 秒後停止程式。
   */
  attach(
    cmd: string,
    timeoutSec: number,
    tty: { cols: number; rows: number },
  ): Promise<{ code: number | null; timedOut: boolean }> {
    const isTty = process.stdout.isTTY === true
    const wrapped = isTty
      ? `stty cols ${tty.cols} rows ${tty.rows} 2>/dev/null; (${cmd}); ec=$?; kill -9 -1 2>/dev/null; exit $ec`
      : `(${cmd}); ec=$?; kill -9 -1 2>/dev/null; exit $ec`
    return new Promise((resolve) => {
      const p = spawn(
        'docker',
        ['exec', ...(isTty ? ['-t'] : []), this.name, 'sh', '-c', wrapped],
        {
          stdio: ['ignore', 'inherit', 'inherit'],
        },
      )
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        this.stopProcesses()
      }, timeoutSec * 1000)
      p.on('close', (code) => {
        clearTimeout(timer)
        resolve({ code, timedOut })
      })
    })
  }

  /** 停止 container 裡除了 PID 1 以外的所有程序 */
  stopProcesses(): void {
    spawnSync('docker', ['exec', this.name, 'sh', '-c', 'kill -9 -1'], { stdio: 'ignore' })
  }

  /** 讀取 tty 模式下另存的 stderr */
  readStderr(): string {
    const r = spawnSync(
      'docker',
      ['exec', this.name, 'sh', '-c', `head -c ${STDERR_CAP} /tmp/.stderr 2>/dev/null`],
      { encoding: 'utf8' },
    )
    return r.status === 0 ? r.stdout : ''
  }

  /** 調整執行中 container 的記憶體上限（編譯完後降回執行用的限制） */
  limitMemory(memory: string): void {
    const r = spawnSync(
      'docker',
      ['update', '--memory', memory, '--memory-swap', memory, this.name],
      {
        encoding: 'utf8',
      },
    )
    if (r.status !== 0) throw new Error(`docker update 失敗：${r.stderr || r.error?.message}`)
  }

  kill(): void {
    spawnSync('docker', ['kill', this.name], { stdio: 'ignore' })
  }

  close(): void {
    spawnSync('docker', ['rm', '-f', this.name], { stdio: 'ignore' })
  }
}
