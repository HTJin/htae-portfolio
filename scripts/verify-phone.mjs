/**
 * The drive on a phone: can you tap the controls, and do the pedals take touch?
 *
 * This exists because of a defect that nothing else would have caught. On a
 * phone the cockpit stacks and `.footwell` wraps the WHOLE control row, not just
 * the pedals, and its shadow is an absolutely positioned ::before. It painted
 * over Back, Next, Map, audio and motion and, being an ordinary element as far
 * as hit testing goes, took their taps across the lower two thirds. Every one of
 * those buttons was dead on every phone, and the page looked perfect.
 *
 * So the first check here is not about behaviour at all. It asks the browser
 * which element is actually on top at the centre of each control. A shadow must
 * never take a tap.
 *
 * The rest drives the accelerator with real touch events rather than a mouse,
 * because a pedal you hold is the one control where mouse and touch differ most:
 * the press has to survive a finger sliding off the pad, and it has to end when
 * the finger lifts.
 *
 * Needs a running dev server.
 *   node node_modules/next/dist/bin/next dev --port 3041
 *   bun run verify:phone
 */
const { chromium, devices } = await import(
  process.env.PLAYWRIGHT_PATH ||
    'file:///C:/Users/htae/AppData/Roaming/npm/node_modules/playwright/index.mjs'
)

const URL = process.env.DRIVE_URL || 'http://localhost:3041/drive'
const mph = (text) => Number((text.match(/(\d+)\s*MPH/i) || [])[1] ?? -1)

const browser = await chromium.launch()
let ok = true
const check = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) ok = false
}

/* Every control in the phone row must be the top element at its own centre. */
for (const size of [
  { name: 'landscape phone', width: 844, height: 390 },
  { name: 'portrait phone', width: 390, height: 844 },
  // WCAG 1.4.10 reflow. 320x256 is a 1280x1024 screen at 400 percent zoom, and
  // 320 CSS pixels wide is the width the guideline names, so this is the
  // narrowest the drive has to survive rather than an arbitrary small number.
  { name: '320 CSS px, 400 percent zoom', width: 320, height: 256 },
]) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height } })
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: /start engine/i }).click()
  await page.waitForTimeout(1500)

  const blocked = await page.evaluate(() => {
    const wanted = [
      'previous exit', 'next exit', 'route map', 'engine sound', 'scene motion',
    ]
    const out = []
    for (const btn of document.querySelectorAll('button')) {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase()
      if (!wanted.some((w) => label.includes(w))) continue
      const box = btn.getBoundingClientRect()
      if (box.width === 0) continue
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      if (!(top === btn || btn.contains(top))) {
        out.push(`${label} is covered by ${String(top && top.className).slice(0, 40)}`)
      }
    }
    return out
  })
  check(blocked.length === 0,
    `${size.name}: every control is tappable at its own centre${blocked.length ? ' :: ' + blocked.join('; ') : ''}`)

  const scrolls = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  check(!scrolls, `${size.name}: the page does not scroll sideways`)

  /*
   * There is deliberately no "text over text" check here, and it is worth
   * saying why, because it looks like an obvious thing to add.
   *
   * A box intersection test cannot tell a collision from a layered panel or
   * from text an `overflow: hidden` ancestor has cropped away: both keep their
   * full layout box. Written twice, it accused the drive twice, once at every
   * viewport including a roomy desktop because `sr-only` keeps a box while
   * clipped to nothing, and once on a landscape phone where a screenshot then
   * showed the layout to be perfectly clean.
   *
   * `elementFromPoint` above is the sound primitive, because it hit tests what
   * is actually painted. That is what caught the footwell shadow. Anything
   * weaker than that belongs in a screenshot a person looks at, not in a suite.
   */

  await page.close()
}

/* The accelerator, driven with real touch. */
const ctx = await browser.newContext({ ...devices['Pixel 5'] })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
await page.getByRole('button', { name: /start engine/i }).tap()
await page.waitForTimeout(1500)

const cdp = await ctx.newCDPSession(page)
const box = await page.getByRole('button', { name: /^Go, hold to accelerate$/i }).last().boundingBox()
const x = box.x + box.width / 2
const y = box.y + box.height / 2
const scrollBefore = await page.evaluate(() => window.scrollY)

await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
await page.waitForTimeout(6000)
const held = mph(await page.evaluate(() => document.body.innerText))
const scrollDuring = await page.evaluate(() => window.scrollY)

await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 120, y: y - 160, id: 1 }] })
await page.waitForTimeout(3000)
const slid = mph(await page.evaluate(() => document.body.innerText))

await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await page.waitForTimeout(5000)
const released = mph(await page.evaluate(() => document.body.innerText))
await browser.close()

console.log(`  held ${held} mph, after sliding off ${slid} mph, 5 s after lifting ${released} mph`)
console.log('')
check(held > 5, `a touch hold on the accelerator moves the car (${held} mph)`)
check(slid >= held, `pointer capture keeps the press alive when the finger slides off the pad (${slid} mph)`)
// Without this, a pedal that could never be released would pass the two above.
check(released < slid, `CONTROL lifting the finger really does release it (${slid} to ${released})`)
check(scrollDuring === scrollBefore, `holding the pedal does not scroll the page (${scrollBefore} to ${scrollDuring})`)
check(errors.length === 0, `no page errors (${errors.length})`)

console.log(ok ? '\n  the phone drive verified' : '\n  the phone drive NOT verified')
process.exit(ok ? 0 : 1)
