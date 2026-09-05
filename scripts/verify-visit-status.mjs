/**
 * st135: an exit counts as visited only once the car settles there.
 *
 * This one needs a running dev server, unlike verify:stops and verify:miles.
 * The thing under test is not a pure function - it is WHICH caller records an
 * outcome - so a unit test of `statusFromDrive` would pass while the wiring was
 * wrong, which is exactly the defect this exists to catch. So it drives the real
 * page with a real browser and reads the real durable record from localStorage.
 *
 * Two arms, and they must disagree. Arm A holds the throttle straight past the
 * first exit. Arm B steers onto the ramp and lets the car come to rest. Same
 * stop, same road, one difference in input. If both arms agreed, the test would
 * be proving nothing.
 *
 *   node node_modules/next/dist/bin/next dev --port 3031
 *   bun run verify:visits
 */
// Playwright is a global install here, not a project dependency, so the path is
// resolved at run time. `import ... from` needs a literal, hence the dynamic form.
const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ||
    'file:///C:/Users/htae/AppData/Roaming/npm/node_modules/playwright/index.mjs'
)

const URL = process.env.DRIVE_URL || 'http://localhost:3031/drive'
const KEY = 'htae.drive.progress.v2'
/** MILE 0. You begin parked on it, so it is not an exit anyone can decline. */
const START = 'origin'

async function run({ steerRight, label }) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(URL, { waitUntil: 'networkidle' })
  // A previous arm must not colour this one: writeStopStatus never downgrades,
  // so a leftover 'taken' would make arm A pass for the wrong reason.
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  await page.getByRole('button', { name: /start engine/i }).click()
  await page.waitForTimeout(1200)

  await page.keyboard.down('ArrowUp')
  if (steerRight) {
    await page.waitForTimeout(14000)
    await page.keyboard.down('ArrowRight')
    await page.waitForTimeout(8000)
    await page.keyboard.up('ArrowRight')
  } else {
    await page.waitForTimeout(24000)
  }
  await page.keyboard.up('ArrowUp')
  await page.waitForTimeout(1200)

  const stored = await page.evaluate((k) => {
    try { return JSON.parse(localStorage.getItem(k) || '{}') } catch { return {} }
  }, KEY)
  await browser.close()
  console.log(`  ${label}: ${JSON.stringify(stored)}`)
  return stored
}

/**
 * Arm C: land on a stop WITHOUT driving there.
 *
 * The route map teleports the car. That is a legitimate way to read an exit,
 * but it is not a claim to have driven the road, so it must record 'jumped'.
 * Before st135 every arrival went through one code path and this read 'taken',
 * which is the half of the defect a pass/stop test alone would never see.
 */
async function jump() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  await page.getByRole('button', { name: /start engine/i }).click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: /route map/i }).first().click()
  await page.waitForTimeout(800)

  const dialog = page.getByRole('dialog', { name: /route map/i })
  const buttons = dialog.getByRole('button')
  const count = await buttons.count()
  // Pick a stop well down the route, so it cannot be one the car drove to.
  await buttons.nth(Math.min(count - 1, 8)).click()
  await page.waitForTimeout(1500)

  const stored = await page.evaluate((k) => {
    try { return JSON.parse(localStorage.getItem(k) || '{}') } catch { return {} }
  }, KEY)
  await browser.close()
  console.log(`  ARM C, jumped from the route map: ${JSON.stringify(stored)}`)
  return stored
}

const passed = await run({ steerRight: false, label: 'ARM A, held the throttle past exit 1' })
const taken = await run({ steerRight: true, label: 'ARM B, steered onto the ramp' })
const jumped = await jump()

let ok = true
const check = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) ok = false
}

console.log('')
const drivenPast = Object.entries(passed).filter(([id]) => id !== START)

// The start line reads taken in BOTH arms. That is not a bug and it is worth
// asserting: it is the evidence that the value came from turning the key, not
// from the drive, so its presence in arm A does not weaken the arm A result.
check(passed[START] === 'taken' && taken[START] === 'taken',
  'the start line reads "taken" in both arms, so it is not a drive claim')
check(drivenPast.length === 1,
  `arm A touched exactly one real exit (${drivenPast.map(([i, s]) => `${i}: ${s}`).join(', ') || 'none'})`)
check(drivenPast.every(([, s]) => s === 'skipped'), 'driving past an exit records "skipped"')
check(drivenPast.every(([, s]) => s !== 'taken'), 'driving past never records "taken"')
check(Object.entries(taken).some(([id, s]) => id !== START && s === 'taken'),
  'settling on the exit records "taken"')

const jumpedStops = Object.entries(jumped).filter(([id]) => id !== START)
check(jumpedStops.some(([, s]) => s === 'jumped'), 'a route map jump records "jumped"')
check(jumpedStops.every(([, s]) => s !== 'taken'), 'a route map jump never records "taken"')

const shared = Object.keys(passed).filter((id) => taken[id] && passed[id] !== taken[id])
check(shared.length > 0,
  `CONTROL the same stop reads differently between the arms (${shared.map((i) => `${i}: ${passed[i]} vs ${taken[i]}`).join('; ') || 'none, the arms agree'})`)

console.log(ok ? '\n  st135 verified' : '\n  st135 NOT verified')
process.exit(ok ? 0 : 1)
