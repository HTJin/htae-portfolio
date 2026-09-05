/**
 * Can you drive this with a keyboard and nothing else?
 *
 * The answer used to be almost no, and the page gave no sign of it. Start engine
 * was the THIRTY FOURTH thing in the tab order: tab 1 is the skip link, and tabs
 * 2 to 33 are links inside the stop cards behind the ignition overlay, LinkedIn,
 * GitHub, certificates, and a Live site and Source pair for every project. So a
 * keyboard visitor met a screen saying "Start engine", pressed Tab, and spent
 * thirty three presses inside content they could not see and could not use yet.
 *
 * A note on how that was nearly missed. The first version of this checked focus
 * with `/start engine/i.test(document.activeElement.innerText)`, which is true
 * when the BODY is focused, because the whole page contains those words. It
 * reported the ignition as focused when nothing was, twice, and sent me looking
 * for a fault in the pedals. Focus is checked by element identity here, never by
 * text.
 *
 * Needs a running dev server.
 *   node node_modules/next/dist/bin/next dev --port 3041
 *   bun run verify:keyboard
 */
const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ||
    'file:///C:/Users/htae/AppData/Roaming/npm/node_modules/playwright/index.mjs'
)

const URL = process.env.DRIVE_URL || 'http://localhost:3041/drive'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const ignitionFocused = () =>
  page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((x) =>
      /start engine/i.test(x.innerText))
    return Boolean(btn) && document.activeElement === btn
  })

const focusedOnLoad = await ignitionFocused()

// How far away is it if you do start tabbing? This is the number that was 34.
let distance = 0
if (!focusedOnLoad) {
  for (distance = 1; distance <= 60; distance += 1) {
    await page.keyboard.press('Tab')
    if (await ignitionFocused()) break
  }
}

await page.keyboard.press('Enter')
await page.waitForTimeout(1800)
const started = await page.evaluate(() => !/start engine/i.test(document.body.innerText))

let pedalFound = false
for (let i = 0; i < 45; i += 1) {
  pedalFound = await page.evaluate(() =>
    /^Go, hold to accelerate$/i.test(document.activeElement?.getAttribute('aria-label') || ''))
  if (pedalFound) break
  await page.keyboard.press('Tab')
}

const mph = () => page.evaluate(() =>
  Number((document.body.innerText.match(/(\d+)\s*MPH/i) || [])[1] ?? -1))

await page.keyboard.down('Space')
await page.waitForTimeout(6000)
const held = await mph()
await page.keyboard.up('Space')
await page.waitForTimeout(5000)
const after = await mph()
const scrolled = await page.evaluate(() => window.scrollY)
await browser.close()

let ok = true
const check = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) ok = false
}

console.log(`  ignition focused on load: ${focusedOnLoad}, held ${held} mph, released to ${after} mph`)
console.log('')
check(focusedOnLoad,
  `the ignition holds focus when the page loads, so Enter is the first thing that works${focusedOnLoad ? '' : ` (it is ${distance} tabs away)`}`)
check(started, 'Enter on the ignition starts the drive')
check(pedalFound, 'the accelerator is reachable with Tab')
check(held > 5, `holding Space on the accelerator drives the car (${held} mph)`)
// Without this, a pedal that could never be released would pass the check above.
check(after < held, `CONTROL releasing Space really lets off (${held} to ${after})`)
check(scrolled === 0, `Space drives the car rather than scrolling the page (scrollY ${scrolled})`)
check(errors.length === 0, `no page errors (${errors.length})`)

console.log(ok ? '\n  the keyboard drive verified' : '\n  the keyboard drive NOT verified')
process.exit(ok ? 0 : 1)
