/**
 * What comes out of the printer, and whether the drive is still usable after.
 *
 * Two separate things are guarded here, both documented in the source and
 * neither previously tested.
 *
 * First, printing has to produce the resume rather than one page of dashboard.
 * The comment on the print block in drive.module.css records that the page once
 * had zero @media print rules and would have printed exactly that, so a
 * regression here is a silent loss of the only printable copy of the resume.
 *
 * Second, `beforeprint` releases the scroll lock so the document can paginate,
 * and `afterprint` must put back precisely what was there. The source calls out
 * two edge cases by name: Chrome re-fires `beforeprint` when a preview is
 * reopened, and `afterprint` can arrive alone when the scene remounts during a
 * preview. Both are exercised, because the failure they describe leaves the
 * drive permanently scrollable and nothing on screen says so.
 *
 * Needs a running dev server.
 *   node node_modules/next/dist/bin/next dev --port 3041
 *   bun run verify:print
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
await page.waitForTimeout(2600)

const overflow = () => page.evaluate(() => document.body.style.overflow)
const fire = (...events) =>
  page.evaluate((names) => names.forEach((n) => window.dispatchEvent(new Event(n))), events)

const locked = await overflow()

await fire('beforeprint')
const released = await overflow()
await fire('afterprint')
const restored = await overflow()

await fire('beforeprint', 'beforeprint')
await fire('afterprint')
const afterDouble = await overflow()

await fire('afterprint')
const afterLone = await overflow()

const pdf = await page.pdf({ format: 'A4', printBackground: true })
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length
await browser.close()

let ok = true
const check = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) ok = false
}

console.log(`  overflow: locked ${JSON.stringify(locked)}, released ${JSON.stringify(released)}, restored ${JSON.stringify(restored)}`)
console.log(`  after two beforeprints ${JSON.stringify(afterDouble)}, after a lone afterprint ${JSON.stringify(afterLone)}`)
console.log(`  printed ${pages} pages, ${pdf.length} bytes`)
console.log('')

check(locked === 'hidden', `the drive locks page scrolling while you drive (${JSON.stringify(locked)})`)
// The control. Without it, a handler that did nothing at all would pass the
// restore checks below, because the value would never have changed.
check(released === 'visible',
  `CONTROL beforeprint releases the lock so the document can paginate (${JSON.stringify(released)})`)
check(restored === locked, `afterprint puts back exactly what was there (${JSON.stringify(restored)})`)
check(afterDouble === locked,
  `two beforeprints in a row do not leak the released value back (${JSON.stringify(afterDouble)})`)
check(afterLone === locked,
  `an afterprint with no print in progress does not clear the lock (${JSON.stringify(afterLone)})`)
check(pages >= 3,
  `printing produces the resume, not one page of dashboard (${pages} pages)`)
check(errors.length === 0, `no page errors (${errors.length})`)

console.log(ok ? '\n  printing verified' : '\n  printing NOT verified')
process.exit(ok ? 0 : 1)
