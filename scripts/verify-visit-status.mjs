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
 *   node node_modules/next/dist/bin/next dev --port 3041
 *   bun run verify:visits
 */
// Playwright is a global install here, not a project dependency, so the path is
// resolved at run time. `import ... from` needs a literal, hence the dynamic form.
const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ||
    'file:///C:/Users/htae/AppData/Roaming/npm/node_modules/playwright/index.mjs'
)

const URL = process.env.DRIVE_URL || 'http://localhost:3041/drive'
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

/**
 * Arm D, st134: an `?exit=` deep link writes no outcome.
 *
 * Someone handed a URL has not driven anywhere and has not navigated anywhere.
 * Before st134 this path recorded the stop, so a link in a message could make
 * the map claim the recipient had read that job.
 */
async function deepLink(index) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await page.goto(`${URL}?exit=${index}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)
  const stored = await page.evaluate((k) => {
    try { return JSON.parse(localStorage.getItem(k) || '{}') } catch { return {} }
  }, KEY)
  await browser.close()
  console.log(`  ARM D, opened ?exit=${index} and touched nothing: ${JSON.stringify(stored)}`)
  return stored
}

/**
 * Arm E, st134: resuming must not invent the exits you drove past.
 *
 * Drive past exit 1, stop at exit 2, come back and press Resume. The old
 * markVisitedThrough marked every index up to the resumed one, so the exit that
 * was deliberately skipped came back marked "driven". The control is inside the
 * arm: the SAME map must mark the taken stop and not the skipped one.
 */
async function resumeAfterSkipping() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: /start engine/i }).click()
  await page.waitForTimeout(1200)

  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(26000)          // straight past exit 1
  await page.keyboard.down('ArrowRight')    // then take exit 2
  await page.waitForTimeout(10000)
  await page.keyboard.up('ArrowRight')
  await page.keyboard.up('ArrowUp')
  await page.waitForTimeout(1500)

  const before = await page.evaluate((k) => {
    try { return JSON.parse(localStorage.getItem(k) || '{}') } catch { return {} }
  }, KEY)

  // Come back cold and take the offer. The waits here are settling time, not
  // padding: the scene mounts, restores the recorded history and re-renders, and
  // a shorter wait read the map before that landed - which failed as though the
  // restore were broken when it was not.
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  const resumeButton = page.getByRole('button', { name: /^Resume/i }).first()
  const offered = await resumeButton.count() > 0
  if (offered) {
    await resumeButton.click()
    await page.waitForTimeout(2500)
  }
  await page.getByRole('button', { name: /route map/i }).first().click()
  await page.waitForSelector('[role="dialog"] button', { timeout: 10000 })
  await page.waitForTimeout(1500)

  // st133 replaced the "driven" badge with the rail, so the outcome is read
  // from the rail's accessible name now. Same question, different surface.
  const rows = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return []
    return [...dialog.querySelectorAll('button')].map((b) => {
      const rail = b.querySelector('svg[role="img"]')
      const label = rail ? rail.getAttribute('aria-label') : null
      return {
        text: b.innerText.replace(/\s+/g, ' ').trim().slice(0, 60),
        label,
        driven: label === 'visited' || label === 'jumped to',
      }
    })
  })
  const after = await page.evaluate((k) => {
    try { return JSON.parse(localStorage.getItem(k) || '{}') } catch { return {} }
  }, KEY)
  await browser.close()
  console.log(`  ARM E, drove past 1 and stopped at 2: ${JSON.stringify(before)}`)
  console.log(`  ARM E, after pressing Resume:          ${JSON.stringify(after)}`)
  console.log(`  ARM E, resume offered: ${offered}, map rows marked driven: ${rows.filter((r) => r.driven).length} of ${rows.length}`)
  console.log('  ARM E, first rows:', JSON.stringify(rows.slice(0, 4).map((r) => `${r.text} [${r.label}]`)))
  return { before, after, rows, offered }
}

const passed = await run({ steerRight: false, label: 'ARM A, held the throttle past exit 1' })
const taken = await run({ steerRight: true, label: 'ARM B, steered onto the ramp' })
const jumped = await jump()
const linked = await deepLink(5)
const resumed = await resumeAfterSkipping()

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

// st134
check(Object.keys(linked).length === 0,
  `an ?exit= deep link records nothing at all (${JSON.stringify(linked)})`)

const skippedIds = Object.entries(resumed.before).filter(([, s]) => s === 'skipped').map(([id]) => id)
const takenIds = Object.entries(resumed.before).filter(([, s]) => s === 'taken').map(([id]) => id)
check(skippedIds.length >= 1 && takenIds.length >= 2,
  `arm E really did skip one exit and take another (skipped ${skippedIds.length}, taken ${takenIds.length})`)
check(JSON.stringify(resumed.before) === JSON.stringify(resumed.after),
  'pressing Resume records no new outcome')
const drivenMarks = resumed.rows.filter((r) => r.driven).length
check(resumed.rows.length > 0 && drivenMarks === takenIds.length,
  `the map marks exactly the stops with a real outcome (${drivenMarks} marked, ${takenIds.length} taken)`)
check(drivenMarks < resumed.rows.length,
  `CONTROL the map does NOT mark every row, which is what the prefix bug did (${drivenMarks} of ${resumed.rows.length})`)

const shared = Object.keys(passed).filter((id) => taken[id] && passed[id] !== taken[id])
check(shared.length > 0,
  `CONTROL the same stop reads differently between the arms (${shared.map((i) => `${i}: ${passed[i]} vs ${taken[i]}`).join('; ') || 'none, the arms agree'})`)

console.log(ok ? '\n  st135 and st134 verified' : '\n  st135 / st134 NOT verified')
process.exit(ok ? 0 : 1)
