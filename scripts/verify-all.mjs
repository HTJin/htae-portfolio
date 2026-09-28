/**
 * Run every drive suite, and start a dev server only if one is not already up.
 *
 *   bun run verify
 *
 * Six suites live in this repo and three of them drive a real browser, so
 * checking the drive by hand meant starting a server, remembering the port,
 * running six commands and reading six outputs. This does that, and nothing
 * else. It is a runner, not a test: every assertion still lives in the suite
 * that owns it.
 *
 * Two rules from the vault shape it. The server is started with a hidden
 * process and never a console window. And a server that was already listening
 * is left exactly as it was found, started by someone else and not this
 * script's to stop.
 */
import { spawn } from 'node:child_process'

const PORT = Number(process.env.DRIVE_PORT || 3041)
const URL = `http://localhost:${PORT}/drive`

const SUITES = [
  { name: 'stop status vocabulary', file: 'scripts/verify-stop-status.mjs', server: false },
  { name: 'per leg miles', file: 'scripts/verify-leg-miles.mjs', server: false },
  { name: 'ramp lateral offsets', file: 'scripts/assert-ramp-offsets.mjs', server: false },
  { name: 'ramp lengths', file: 'scripts/assert-ramp-lengths.mjs', server: false },
  { name: 'what each exit records', file: 'scripts/verify-visit-status.mjs', server: true },
  { name: 'the route map', file: 'scripts/verify-route-map.mjs', server: true },
  { name: 'reduced motion', file: 'scripts/verify-reduced-motion.mjs', server: true },
  { name: 'degraded browsers', file: 'scripts/verify-webgl-fallback.mjs', server: true },
  { name: 'the phone drive', file: 'scripts/verify-phone.mjs', server: true },
  { name: 'the keyboard drive', file: 'scripts/verify-keyboard.mjs', server: true },
  { name: 'what a screen reader hears', file: 'scripts/verify-announcements.mjs', server: true },
  { name: 'printing', file: 'scripts/verify-print.mjs', server: true },
]

async function serving() {
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(2000) })
    return res.status === 200
  } catch {
    return false
  }
}

/**
 * Ready means ready twice, then settled.
 *
 * Next answers 200 on the first route it has compiled while it is still
 * compiling the rest, so taking the first 200 as ready let a browser suite start
 * against a server that then stalled mid-run. One 200 is not evidence.
 */
async function waitForServer(seconds) {
  let consecutive = 0
  for (let i = 0; i < seconds; i += 1) {
    consecutive = (await serving()) ? consecutive + 1 : 0
    if (consecutive >= 2) {
      await new Promise((r) => setTimeout(r, 3000))
      return await serving()
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

function run(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [file], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    let out = ''
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { out += d })
    child.on('close', (code) => resolve({ code, out }))
  })
}

const needsServer = SUITES.some((s) => s.server)
let started = null

if (needsServer && !(await serving())) {
  console.log(`starting a dev server on ${PORT}, hidden`)
  // `node`, deliberately, not process.execPath. This script runs under bun, and
  // the vault's bun-first rule is explicit that a long running daemon starts on
  // node: bun only adds launch cost to a Next server that is a node program
  // either way, and a .cmd shim can surface a console window.
  started = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '--port', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  started.stdout.on('data', () => {})
  started.stderr.on('data', () => {})
  if (!(await waitForServer(90))) {
    console.log(`the dev server did not answer on ${PORT} within 90 seconds`)
    started.kill()
    process.exit(1)
  }
  console.log('dev server is up')
} else if (needsServer) {
  console.log(`a dev server is already answering on ${PORT}, using it and leaving it running`)
}

const results = []
for (const suite of SUITES) {
  const { code, out } = await run(suite.file)
  results.push({ ...suite, code, out })
  console.log(`  ${code === 0 ? 'PASS' : 'FAIL'}  ${suite.name}`)
  if (code !== 0) {
    // A failing browser suite prints Playwright's own stack, numbered source
    // lines and all, which buries the one line that says what went wrong. Keep
    // the suite's own FAIL lines and the error summary, drop the rest.
    const lines = out.split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('FAIL') || l.toLowerCase().startsWith('error:'))
      .slice(0, 8)
    console.log(lines.map((l) => `        ${l}`).join('\n'))
  }
}

if (started) {
  started.kill()
  // Say so rather than escalating. A stray dev server is the owner's to see.
  const stillUp = await serving()
  console.log(stillUp
    ? `NOTE the dev server on ${PORT} is still answering; stop it yourself if you do not want it`
    : 'dev server stopped')
}

const failed = results.filter((r) => r.code !== 0)
console.log(`\n${results.length - failed.length} of ${results.length} suites passed`)
process.exit(failed.length ? 1 : 0)
