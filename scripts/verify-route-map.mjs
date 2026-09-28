/**
 * st133: the route map draws four outcomes, and never names them in a badge.
 *
 * Q050, answered 2026-08-13, binding and verbatim: "could be more of a visual
 * roadmap of the experiences that went over in a dotted line node to node for
 * destinations and it will show which path I didn't take that way without
 * having to ponder about menial terminology such as passed or skipped".
 *
 * So there are two claims to prove and they pull against each other. The map
 * must SHOW the difference, and it must still say it to a screen reader. A test
 * that only counted rails would pass on twenty-one identical lines.
 *
 * Needs a running dev server.
 *   node node_modules/next/dist/bin/next dev --port 3041
 *   bun run verify:map
 */
const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ||
    'file:///C:/Users/htae/AppData/Roaming/npm/node_modules/playwright/index.mjs'
)

const URL = process.env.DRIVE_URL || 'http://localhost:3041/drive'
const KEY = 'htae.drive.progress.v2'

/** One stop of each kind, so every branch of the drawing is exercised. */
const SEEDED = {
  origin: 'taken',
  education: 'skipped',
  'experience-web-developer': 'taken',
  'experience-freelance-web-developer-3fgolf': 'jumped',
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 950 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

await page.goto(URL, { waitUntil: 'networkidle' })
await page.evaluate(([k, v]) => {
  localStorage.clear()
  localStorage.setItem(k, JSON.stringify(v))
}, [KEY, SEEDED])
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
await page.getByRole('button', { name: /start engine/i }).click()
await page.waitForTimeout(1500)
await page.getByRole('button', { name: /route map/i }).first().click()
await page.waitForSelector('[role="dialog"] button', { timeout: 10000 })
await page.waitForTimeout(1200)

const seen = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]')
  const rails = [...dialog.querySelectorAll('svg[role="img"]')]
  return {
    count: rails.length,
    rows: rails.map((svg) => {
      const line = svg.querySelector('line')
      const circle = svg.querySelector('circle')
      return {
        label: svg.getAttribute('aria-label'),
        dash: line ? line.getAttribute('stroke-dasharray') : null,
        width: line ? line.getAttribute('stroke-width') : null,
        nodeFilled: circle ? circle.getAttribute('fill') === 'currentColor' : null,
      }
    }),
    text: dialog.innerText.toUpperCase(),
    strayRoleImg: [...dialog.querySelectorAll('[role="img"]')]
      .filter((e) => e.tagName.toLowerCase() !== 'svg').length,
  }
})
/**
 * The map is a modal dialog, and st133 rewrote its DOM. Everything below was
 * already built and could have been broken silently by that rewrite, so it is
 * checked here rather than trusted.
 */
const focusOnOpen = await page.evaluate(() => {
  const d = document.querySelector('[role="dialog"]')
  return !!(d && d.contains(document.activeElement))
})

let focusEscaped = false
for (let i = 0; i < 40; i += 1) {
  await page.keyboard.press('Tab')
  const inside = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]')
    return !!(d && d.contains(document.activeElement))
  })
  if (!inside) { focusEscaped = true; break }
}

const currentMarkers = await page.evaluate(() =>
  document.querySelectorAll('[role="dialog"] [aria-current]').length)

await page.keyboard.press('Escape')
await page.waitForTimeout(700)
const closedOnEscape = await page.evaluate(() => !document.querySelector('[role="dialog"]'))
const focusRestored = await page.evaluate(() =>
  /route map/i.test(document.activeElement?.getAttribute('aria-label') || ''))

await browser.close()

let ok = true
const check = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) ok = false
}

const r = seen.rows
console.log(`  rails drawn: ${seen.count}`)
console.log(`  row 0 ${JSON.stringify(r[0])}`)
console.log(`  row 1 ${JSON.stringify(r[1])}`)
console.log(`  row 3 ${JSON.stringify(r[3])}`)
console.log('')

check(seen.count === 21, `one rail per stop (${seen.count})`)
check(errors.length === 0, `no console or page errors (${errors.length})`)

// Each seeded stop draws its own outcome, positionally.
check(r[0].label === 'visited' && r[0].dash === null && r[0].nodeFilled,
  'a taken stop draws a solid line and a filled node')
check(r[1].label === 'driven past' && r[1].dash === '7 5' && !r[1].nodeFilled,
  'a skipped stop draws a dashed line and a hollow node')
check(r[7].label === 'jumped to' && r[7].dash === '1.5 4.5' && !r[7].nodeFilled,
  'a jumped stop draws a dotted line and a hollow node')
check(r[3].label === 'not reached yet' && r[3].width === '1',
  'an unreached stop draws the faint rail')

// The four must actually differ. Colour alone would not survive this.
const shapes = new Set(r.map((x) => `${x.dash}|${x.width}|${x.nodeFilled}`))
check(shapes.size === 4, `the four states are four distinct looks (${shapes.size})`)

// CONTROL: jumped and unreached share a dash pattern on purpose, so the test
// must be able to tell them apart by something else, or it proves nothing.
check(r[7].width !== r[3].width || r[7].nodeFilled !== r[3].nodeFilled,
  'CONTROL jumped and unreached share a dash pattern and still differ')

check(seen.strayRoleImg === 0, `role="img" appears on the rail and nowhere else (${seen.strayRoleImg})`)

// Q050: no badge words.
for (const word of ['DRIVEN', 'PASSED', 'SKIPPED', 'JUMPED', 'UNREACHED']) {
  check(!seen.text.includes(word), `the map never prints "${word}" as visible text`)
}
// CONTROL: the reader still gets the words, through the rail's name.
const labels = new Set(r.map((x) => x.label))
check(labels.size === 4,
  `CONTROL a screen reader still hears all four outcomes (${[...labels].join(', ')})`)

check(focusOnOpen, 'opening the map moves focus into it')
check(!focusEscaped, 'Tab cycles inside the dialog for 40 presses and never escapes')
check(closedOnEscape, 'Escape closes the map')
check(focusRestored, 'focus returns to the button that opened it')
check(currentMarkers === 1,
  `exactly one row is marked as your current position (${currentMarkers})`)

console.log(ok ? '\n  st133 verified' : '\n  st133 NOT verified')
process.exit(ok ? 0 : 1)
