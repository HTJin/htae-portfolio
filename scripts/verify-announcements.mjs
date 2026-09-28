/**
 * What a screen reader is actually told while you drive.
 *
 * Most of this run's work was justified by being honest to a screen reader: the
 * route map draws four outcomes and puts the words in the rail's accessible
 * name, the drive stopped claiming exits nobody visited. None of that is worth
 * anything if the announcements themselves are wrong, and nothing checked them.
 *
 * The interesting assertion is the one that expects SILENCE. The live region has
 * to be empty while the car is moving, or a reader would be interrupted every
 * few seconds by a stop it has not reached. A suite that only checked for text
 * on arrival would pass just as happily against a region that never shut up.
 *
 * The landmark check is here for a related reason. /drive carried no landmark of
 * any kind while the home page carried a main and a nav, so the one readable
 * copy of the resume, ten kilobytes of it, could not be jumped to at all.
 *
 * Needs a running dev server.
 *   node node_modules/next/dist/bin/next dev --port 3041
 *   bun run verify:announcements
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

const announced = () =>
  page.evaluate(() => {
    const el = document.querySelector('[role="status"][aria-live]')
    return el ? { text: el.textContent.trim(), live: el.getAttribute('aria-live') } : null
  })

const structure = await page.evaluate(() => ({
  main: document.querySelectorAll('main, [role=main]').length,
  h1: document.querySelectorAll('h1').length,
  legHeadings: document.querySelectorAll('main h2').length,
  stopArticles: document.querySelectorAll('main article').length,
}))

const before = await announced()
await page.getByRole('button', { name: /start engine/i }).click()
await page.waitForTimeout(1600)
const atStart = await announced()

await page.keyboard.down('ArrowUp')
await page.waitForTimeout(13000)
const moving = await announced()
await page.keyboard.down('ArrowRight')
await page.waitForTimeout(9000)
await page.keyboard.up('ArrowRight')
await page.keyboard.up('ArrowUp')
await page.waitForTimeout(2500)
const arrived = await announced()
await browser.close()

let ok = true
const check = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) ok = false
}

console.log(`  structure: ${JSON.stringify(structure)}`)
console.log(`  before ${JSON.stringify(before?.text)}, at the start ${JSON.stringify(atStart?.text)}`)
console.log(`  moving ${JSON.stringify(moving?.text)}, arrived ${JSON.stringify(arrived?.text)}`)
console.log('')

check(before?.live === 'polite',
  `the announcer is a polite live region (${before?.live})`)
check(before?.text === '', 'it says nothing before the drive starts')
check(/^At the start line,/.test(atStart?.text || ''),
  `MILE 0 is announced as the start line, not as an arrival (${JSON.stringify(atStart?.text)})`)
// The control. Text on arrival proves nothing unless silence is proved too.
check(moving?.text === '',
  `CONTROL it falls silent while the car is moving (${JSON.stringify(moving?.text)})`)
check(/^Arrived at EXIT \d+,/.test(arrived?.text || ''),
  `settling at an exit announces it (${JSON.stringify(arrived?.text)})`)

check(structure.main === 1, `/drive has one main landmark (${structure.main})`)
check(structure.h1 === 1, `and one h1 (${structure.h1})`)
check(structure.legHeadings >= 3 && structure.stopArticles >= 20,
  `and the readable resume is inside it, ${structure.legHeadings} leg headings and ${structure.stopArticles} stops`)
check(errors.length === 0, `no page errors (${errors.length})`)

console.log(ok ? '\n  what a screen reader hears verified' : '\n  what a screen reader hears NOT verified')
process.exit(ok ? 0 : 1)
