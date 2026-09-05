/**
 * The reduced-motion path, which is a way of using this site and not a fallback.
 *
 * Two defects lived here and neither was visible in a normal browser, which is
 * the whole reason this suite exists.
 *
 * One: there is no media query on the server, so useReducedMotion answered false
 * there and true on a client that had asked for stillness. The motion toggle
 * renders a different glyph for each, so hydration failed and React threw away
 * that subtree and painted it again. 9 console errors, for that visitor only.
 * The codebase had already learned this lesson once, for ?renderer=2d, and the
 * comment there records 11 errors from the same cause.
 *
 * Two: in reduced motion the accelerator advances the car through goTo, and goTo
 * records a jump so the route map can tell a map jump from a drive. So a visitor
 * who pressed the same accelerator at every exit ended up with a route map of
 * dotted lines, as though they had never driven any of it.
 *
 * Needs a running dev server.
 *   node node_modules/next/dist/bin/next dev --port 3041
 *   bun run verify:motion
 */
const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ||
    'file:///C:/Users/htae/AppData/Roaming/npm/node_modules/playwright/index.mjs'
)

const URL = process.env.DRIVE_URL || 'http://localhost:3041/drive'
const KEY = 'htae.drive.progress.v2'

const browser = await chromium.launch()

async function run(mode) {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
    reducedMotion: mode,
  })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  const pressed = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((x) =>
      /reduce scene motion|allow scene motion/i.test(x.getAttribute('aria-label') || ''))
    return btn ? btn.getAttribute('aria-pressed') : 'not found'
  })

  await page.getByRole('button', { name: /start engine/i }).click()
  await page.waitForTimeout(1200)
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(1600)
  }
  const stored = await page.evaluate((k) => {
    try { return JSON.parse(localStorage.getItem(k) || '{}') } catch { return {} }
  }, KEY)
  await page.close()
  return { pressed, stored, errors }
}

const still = await run('reduce')
const moving = await run('no-preference')
await browser.close()

let ok = true
const check = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) ok = false
}

console.log(`  reduce:        ${JSON.stringify(still.stored)}`)
console.log(`  no-preference: ${JSON.stringify(moving.stored)}`)
console.log('')

check(still.errors.length === 0,
  `no console or page errors for a reduced-motion visitor (${still.errors.length})`)
still.errors.slice(0, 3).forEach((e) => console.log('    ', e.slice(0, 120)))

check(still.pressed === 'true',
  `the toggle reports stillness when the browser asks for it (${still.pressed})`)
// Without this control the check above would pass on a toggle stuck at true.
check(moving.pressed === 'false',
  `CONTROL and reports motion allowed when it does not (${moving.pressed})`)

const outcomes = Object.entries(still.stored)
  .filter(([id]) => id !== 'origin')
  .map(([, s]) => s)
check(outcomes.length >= 3,
  `the accelerator still advances the route in reduced motion (${outcomes.length} exits)`)
check(outcomes.every((s) => s === 'taken'),
  `and records them as driven, not jumped (${JSON.stringify(outcomes)})`)

console.log(ok ? '\n  reduced motion verified' : '\n  reduced motion NOT verified')
process.exit(ok ? 0 : 1)
