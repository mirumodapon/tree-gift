import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import type { Rules } from './types.ts'

export const STDERR_CAP = 8192
/** 程序結束後，等待 pipe 收完剩餘輸出的時間 */
const DRAIN_MS = 300

export interface ExecResult {
  status: 'ok' | 'timeout' | 'overflow'
  code: number | null
  stdout: Buffer
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

  exec(cmd: string, timeoutSec: number, cap: number): Promise<ExecResult> {
    return new Promise((resolve) => {
      // 指令結束後 kill -9 -1 清掉所有殘留的背景程序（不含 PID 1 與 shell 本身），
      // 否則它們佔著 stdout，docker exec 會一直等到逾時
      const wrapped = `(${cmd}); ec=$?; kill -9 -1 2>/dev/null; exit $ec`
      const p = spawn('docker', ['exec', this.name, 'sh', '-c', wrapped], {
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      const out: Buffer[] = []
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
          stderr: Buffer.concat(err),
        })
      }

      const abort = (why: ExecResult['status']) => {
        if (status !== 'ok' || done) return
        status = why
        ms = Date.now() - start
        // 殺掉 docker exec 不會停掉 container 裡的程式，直接 kill container
        this.kill()
        p.kill('SIGKILL')
      }

      p.stdout.on('data', (chunk: Buffer) => {
        if (outLen <= cap) out.push(chunk.subarray(0, cap + 1 - outLen))
        outLen += chunk.length
        if (outLen > cap) abort('overflow')
      })
      p.stderr.on('data', (chunk: Buffer) => {
        if (errLen < STDERR_CAP) err.push(chunk.subarray(0, STDERR_CAP - errLen))
        errLen += chunk.length
      })

      const timer = setTimeout(() => abort('timeout'), timeoutSec * 1000)
      // 保險：docker exec 結束後若 pipe 遲遲不關，最多再等 DRAIN_MS
      p.on('exit', (code) => {
        exitCode = code
        if (!ms) ms = Date.now() - start
        setTimeout(finish, DRAIN_MS)
      })
      p.on('close', finish)
    })
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
