/**
 * What a visitor sees when their browser cannot do WebGL, and when storage throws.
 *
 * Neither is hypothetical. With getContext returning null for every webgl type,
 * three.js throws "Error creating WebGL context." from its own constructor,
 * inside a layout effect, and React unwinds the whole tree: the visitor gets a
 * blank page rather than a degraded one. That is the state of a machine with
 * hardware acceleration switched off, a locked down corporate build, or an older
 * device. The fallback already existed, because RoadCanvas was kept behind
 * ?renderer=2d so the two renderers could be compared, so the fix was to reach
 * for it automatically rather than to build anything.
 *
 * progress.js says localStorage "throws outright in Safari private mode, with
 * cookies blocked, and in some embedded webviews". That claim is checked here
 * rather than trusted.
 *
 * Needs a running dev server.
 *   node node_modules/next/dist/bin/next dev --port 3041
 *   bun run verify:fallback
 */
const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ||
    'file:///C:/Users/htae/AppData/Roaming/npm/node_modules/playwright/index.mjs'
)

const URL = process.env.DRIVE_URL || 'http://localhost:3041/drive'
const browser = await chromium.launch()

async function drive({ blockWebgl = false, breakStorage = false }) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.addInitScript(([block, breakIt]) => {
    window.__ctx = []
    const real = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      window.__ctx.push(String(type))
      if (block && String(type).toLowerCase().includes('webgl')) return null
      return real.call(this, type, ...rest)
    }
    if (breakIt) {
      const boom = () => {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      }
      Object.defineProperty(window, 'localStorage', { get: boom, configurable: true })
    }
  }, [blockWebgl, breakStorage])

  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  const ignition = await page.evaluate(() => /start engine/i.test(document.body.innerText))
  let mph = -1
  let contexts = []
  if (ignition) {
    await page.getByRole('button', { name: /start engine/i }).click()
    await page.waitForTimeout(1200)
    await page.keyboard.down('ArrowUp')
    await page.waitForTimeout(7000)
    await page.keyboard.up('ArrowUp')
    const read = await page.evaluate(() => ({
      mph: Number((document.body.innerText.match(/(\d+)\s*MPH/i) || [])[1] ?? -1),
      contexts: [...new Set(window.__ctx)],
    }))
    mph = read.mph
    contexts = read.contexts
  }
  await page.close()
  return { ignition, mph, contexts, errors }
}

const normal = await drive({})
const noGl = await drive({ blockWebgl: true })
const noStore = await drive({ breakStorage: true })
await browser.close()

let ok = true
const check = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) ok = false
}

console.log(`  normal browser  : ${JSON.stringify(normal.contexts)} ${normal.mph} mph, ${normal.errors.length} errors`)
console.log(`  no WebGL        : ${JSON.stringify(noGl.contexts)} ${noGl.mph} mph, ${noGl.errors.length} errors`)
console.log(`  storage throws  : ${noStore.mph} mph, ${noStore.errors.length} errors`)
console.log('')

// The control. Without it, a change that sent EVERY visitor to the 2D renderer
// would pass every check below.
check(normal.contexts.some((c) => c.toLowerCase().includes('webgl')) &&
      !normal.contexts.includes('2d'),
  `CONTROL a normal browser still takes the 3D path (${JSON.stringify(normal.contexts)})`)

check(noGl.ignition, 'a browser without WebGL still renders the page rather than a blank one')
check(noGl.contexts.includes('2d'), 'and falls back to the 2D canvas renderer')
check(noGl.errors.length === 0, `and raises no page errors (${noGl.errors.length})`)
check(noGl.mph > 5, `and the car still drives (${noGl.mph} mph)`)

check(noStore.ignition && noStore.mph > 5 && noStore.errors.length === 0,
  `a localStorage that throws on every access breaks nothing (${noStore.mph} mph, ${noStore.errors.length} errors)`)

console.log(ok ? '\n  degraded browsers verified' : '\n  degraded browsers NOT verified')
process.exit(ok ? 0 : 1)
