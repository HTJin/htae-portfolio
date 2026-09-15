import { useCallback, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CarInterior } from './CarInterior'
import { Dashboard } from './Dashboard'
import { ExitSign } from './ExitSign'
import { RoadCanvas } from './RoadCanvas'
import { RouteMap } from './RouteMap'
import { Sky } from './Sky'
import { StopCard } from './StopCard'
import { clearProgress, readProgress, writeProgress } from './progress'
import { legsOf, route } from './route'
import { useDrive } from './useDrive'
import { meta } from '@/content'
import styles from '@/styles/drive.module.css'

const CONTROLS = [
  ['↑ / W', 'accelerate'],
  ['↓ / S', 'brake'],
  ['← / →', 'steer'],
  ['N', 'next stop'],
  ['⌫', 'previous'],
  ['M', 'route map'],
]

const LEGS = legsOf(route)

/**
 * What the browser tab says while you drive.
 *
 * Every exit used to share one title, so twenty-one different pages produced
 * one bookmark name and one history entry — and, less obviously, one *spoken*
 * string: Next's route announcer reads `document.title` aloud, assertively, on
 * every shallow URL change, which here is every departure. A screen-reader user
 * was therefore interrupted twenty times with the same sentence and never told
 * which exit it was. Putting the exit in the title fixes the tab and that
 * announcement at once.
 *
 * The `<title>` in `src/pages/drive.jsx` is deliberately left alone: that is
 * the one a crawler sees in the served HTML (guardrail 46).
 */
function titleFor(stop) {
  // MILE 0's own title *is* the name, so appending the brand would read
  // "MILE 0 · Hyun-Tae Jin | Hyun-Tae Jin" on the tab and in the bookmark.
  const brand = stop.title === meta.name ? '' : ` | ${meta.name}`
  return `${stop.exitLabel} · ${stop.title}${brand}`
}

/**
 * The one announcement channel that actually works.
 *
 * `StopCard` used to carry `aria-live="polite"` itself, but it is keyed by stop
 * inside `AnimatePresence`: the node is destroyed and rebuilt on every arrival,
 * and between exits there is no region on the page at all. A live region has to
 * exist *before* its content changes, so that one announced nothing. This one
 * is mounted for the life of the page and only its text changes.
 */
function ArrivalAnnouncer({ started, parked, stop }) {
  // MILE 0 is where you start, not somewhere you arrived (guardrail 48), and
  // nothing is announced while the car is still moving.
  const text = !(started && parked)
    ? ''
    : stop.index === 0
      ? `At the start line — ${stop.title}`
      : `Arrived at ${stop.exitLabel} — ${stop.title}`

  return (
    <p className="sr-only" role="status" aria-live="polite">
      {text}
    </p>
  )
}

/**
 * Everything readable on the page, for screen readers and crawlers.
 *
 * This is the only version of the résumé a crawler or a screen reader can
 * actually consume — the rest of the page is a canvas and a cockpit. So it
 * carries the full heading hierarchy (route -> leg -> stop) and the year of
 * every stop that has one in the content. Stops without a date get no year;
 * nothing here invents one.
 */
function Itinerary() {
  return (
    <div className="sr-only">
      <h1>Drive mode — the résumé of Hyun-Tae Jin as a road trip</h1>
      {LEGS.map((leg) => (
        <section key={leg.name} aria-label={leg.name}>
          <h2>{leg.name}</h2>
          {leg.stops.map((stop) => (
            <article
              key={stop.id}
              aria-label={`${stop.exitLabel}: ${stop.title}`}
            >
              <h3>
                {stop.exitLabel} — {stop.title}
                {stop.year ? (
                  <>
                    {' ('}
                    <time dateTime={String(stop.year)}>{stop.year}</time>
                    {')'}
                  </>
                ) : null}
              </h3>
              {stop.subtitle ? <p>{stop.subtitle}</p> : null}
              {stop.meta ? <p>{stop.meta}</p> : null}
              {stop.paragraphs?.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
              {stop.bullets?.length ? (
                <ul>
                  {stop.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 40)}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {stop.tags?.length ? (
                <p>Built with {stop.tags.join(', ')}.</p>
              ) : null}
              {stop.groups?.map((group) => (
                <p key={group.id}>
                  {group.title}: {group.items}
                </p>
              ))}
              {stop.links?.map((link, position) => (
                <p key={`${link.label}-${position}`}>
                  <a href={link.href}>{link.label}</a>
                </p>
              ))}
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}

function Ignition({ onStart, resume, onResume, onForget }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      // Scrolls when it has to. A returning visitor gets two extra controls
      // here, which on a short landscape phone pushed the whole splash past
      // the viewport — and the link out is the only way to leave drive mode
      // while this is up, since it sits over the scene's own exit link.
      // The centring lives on the inner wrapper rather than on this flex
      // container: a centred flex child that overflows cannot be scrolled
      // back to, so `justify-center` here would hide the heading for good.
      className="absolute inset-0 z-50 flex overflow-y-auto bg-[#03070e]/80 px-6 py-6 text-center backdrop-blur-[2px] [@media(max-height:430px)]:py-4"
    >
      <div className="m-auto flex w-full flex-col items-center">
        <p className="text-[0.6875rem] uppercase tracking-[0.3em] text-sky-300/70">
          Hyun-Tae Jin · drive mode
        </p>
        {/* An h2, not an h1: the itinerary's heading is the page's real title
          and this splash is transient. Two h1s would compete to describe the
          page for assistive tech and for crawlers. */}
        <h2 className="mt-3 max-w-xl font-display text-2xl font-light leading-tight text-white sm:text-4xl [@media(max-height:430px)]:mt-1.5 [@media(max-height:430px)]:text-xl">
          The résumé, from the driver&apos;s seat
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/50 [@media(max-height:430px)]:mt-1.5 [@media(max-height:430px)]:leading-5">
          Every exit on this road is a job, a build, or a chapter. Hold the
          accelerator, roll up to the sign, read, then drive on.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row [@media(max-height:430px)]:mt-4 [@media(max-height:430px)]:flex-row">
          <button
            type="button"
            onClick={onStart}
            className={`rounded-full border border-yellow-300/60 bg-yellow-300/10 px-8 py-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-yellow-200 transition hover:bg-yellow-300/20 ${styles.ignition}`}
          >
            Start engine
          </button>

          {/* Offered, never applied. Someone who read a few exits last time gets
            back to them in one click; everyone else sees nothing new. */}
          {resume ? (
            <button
              type="button"
              onClick={onResume}
              className="max-w-[18rem] rounded-full border border-sky-400/50 bg-sky-400/10 px-6 py-3 text-left text-sm text-sky-200 transition hover:bg-sky-400/20"
            >
              <span className="block text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-sky-300/70">
                Resume · {resume.label}
              </span>
              <span className="mt-0.5 block truncate font-display">
                {resume.title}
              </span>
            </button>
          ) : null}
        </div>

        {resume ? (
          <button
            type="button"
            onClick={onForget}
            className="text-white/35 mt-3 text-[0.6875rem] uppercase tracking-[0.18em] transition hover:text-sky-300"
          >
            Forget my progress
          </button>
        ) : null}

        {/* Three across on a short screen instead of two, which costs a row.
          It stays visible: these are the keys the drive actually responds to,
          and the on-screen controls repeat them on the dash anyway. */}
        <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-1.5 text-left text-[0.6875rem] sm:grid-cols-3 [@media(max-height:430px)]:mt-4 [@media(max-height:430px)]:grid-cols-3 [@media(max-height:430px)]:gap-y-1">
          {CONTROLS.map(([key, action]) => (
            <div key={key} className="flex items-baseline gap-2">
              <dt className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[0.625rem] text-white/70">
                {key}
              </dt>
              <dd className="text-white/40">{action}</dd>
            </div>
          ))}
        </dl>

        {/* The only way out of drive mode while this splash is up — it covers
          the scene's own exit link. It never gets tightened away. */}
        <Link
          href="/"
          className="text-white/35 mt-8 text-[0.6875rem] uppercase tracking-[0.18em] transition hover:text-sky-300 [@media(max-height:430px)]:mt-3"
        >
          ← back to the classic site
        </Link>
      </div>
    </motion.div>
  )
}

export function DriveScene() {
  const router = useRouter()
  const systemReducedMotion = useReducedMotion()
  /**
   * An in-page way to ask for stillness — S141.
   *
   * `prefers-reduced-motion` was already honoured in four places, but only the
   * *operating system* could ask. This is a first-person scene with continuous
   * forward motion, which is the canonical vestibular trigger, and a canvas
   * strips away the accessibility a browser would otherwise give for free. A
   * visitor on a locked-down work laptop, or anyone who has simply never set
   * the system flag, had no lever short of leaving for the classic site.
   *
   * `null` means "nobody has overridden anything", so the OS preference stays
   * the default and **today's behaviour is unchanged for everyone**.
   *
   * Deliberately **not persisted**, which is the mirror of the audio rule in
   * cycle 9: a stored "on" would start motion for someone who had asked for
   * stillness, before they could ask again. Sound may only ever be the result
   * of a gesture in this session; the same applies here.
   */
  const [motionOverride, setMotionOverride] = useState(null)
  const reducedMotion = motionOverride ?? Boolean(systemReducedMotion)
  const drive = useDrive(route, { reducedMotion })

  // Dev / tester harness (st011): tip may lack st071 skip physics. Expose
  // markSkipped without inventing brake-suppress. Production builds omit this.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return undefined
    window.__driveDisposition = {
      markSkipped: drive.markSkipped,
      stopStatus: () => drive.stopStatus,
    }
    return () => {
      delete window.__driveDisposition
    }
  }, [drive])

  const [mapOpen, setMapOpen] = useState(false)
  const deepLinked = useRef(false)
  // Starts null and is filled in after mount: the server has no storage, so
  // reading it during render would make the first client paint disagree with
  // the server markup.
  const [resume, setResume] = useState(null)

  // The label of whichever itinerary link currently has focus, or null. Drives
  // the chip below — see the comment beside it.
  const [outlineFocus, setOutlineFocus] = useState(null)

  const { started, start, index, parked, setThrottle, setBrake, setSteer } =
    drive
  const stop = route[index]
  const passedStop = index > 0 ? route[index - 1] : null

  const toggleMap = useCallback(() => setMapOpen((open) => !open), [])

  /**
   * Let go of the controls when the map opens. A key held down before opening
   * would otherwise stay latched: its keyup arrives while the map is up, and
   * the handler above ignores everything but Escape and M. Same reason the
   * window `blur` handler exists.
   */
  useEffect(() => {
    if (!mapOpen) return
    setThrottle(0)
    setBrake(0)
    setSteer(0)
  }, [mapOpen, setThrottle, setBrake, setSteer])

  const selectStop = useCallback(
    (stopIndex) => {
      drive.goTo(stopIndex)
      setMapOpen(false)
    },
    [drive]
  )

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  /**
   * `/drive?exit=11` drops you at that exit with the engine already running.
   * Someone following a shared link asked for the exit, not the ignition
   * screen. Junk and out-of-range values are ignored and you start at MILE 0.
   */
  useEffect(() => {
    if (!router.isReady || deepLinked.current) return
    deepLinked.current = true

    const raw = Array.isArray(router.query.exit)
      ? router.query.exit[0]
      : router.query.exit
    if (raw == null || raw === '') return

    const target = Number.parseInt(raw, 10)
    if (
      !Number.isInteger(target) ||
      target < 0 ||
      target > route.length - 1 ||
      String(target) !== String(raw).trim()
    ) {
      return
    }

    drive.goTo(target)
    drive.start()
  }, [router.isReady, router.query.exit, router, drive])

  /**
   * Offer to pick up where they left off — but only where an explicit link has
   * not already asked for an exit, and only once mounted (guardrail 28).
   */
  useEffect(() => {
    if (!router.isReady) return
    const asked = Array.isArray(router.query.exit)
      ? router.query.exit[0]
      : router.query.exit
    if (asked != null && asked !== '') return
    setResume(readProgress())
  }, [router.isReady, router.query.exit])

  /** Remember furthest exit + per-stop outcomes (Q053). Never from the frame loop. */
  useEffect(() => {
    if (!started) return
    writeProgress(index, drive.stopStatus)
  }, [started, index, drive.stopStatus])

  const resumeDrive = useCallback(() => {
    if (!resume) return
    drive.goTo(resume.index)
    drive.start()
    // Restore after start so arriveAt on the tip cannot leave a false arrived
    // over a saved skipped. Never fall back to mark-through (Q053).
    if (resume.outcomes) drive.restoreOutcomes(resume.outcomes)
  }, [drive, resume])

  const forgetProgress = useCallback(() => {
    clearProgress()
    setResume(null)
  }, [])

  /** Keep the URL on the exit you are parked at, so it can be copied. */
  useEffect(() => {
    if (!router.isReady || !started) return

    const current = Array.isArray(router.query.exit)
      ? router.query.exit[0]
      : router.query.exit
    const next = index === 0 ? undefined : String(index)
    if (current === next) return

    router.replace(
      { pathname: '/drive', query: next ? { exit: next } : {} },
      undefined,
      { shallow: true }
    )
  }, [router, index, started])

  useEffect(() => {
    if (!started) return undefined

    const isTyping = (target) =>
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

    const onKeyDown = (event) => {
      if (event.repeat || isTyping(event.target)) return

      // The route map says `aria-modal`, which promises everything behind it
      // is inert. It was not: with the map open, ArrowUp pulled the car out of
      // the stop — `parked` went false and the title advanced an exit — while
      // the dialog stayed up, so the drive happened invisibly behind it. Arrow
      // keys are also the obvious way to scroll a twenty-one row list, so the
      // natural gesture for using the map was the one that left the exit you
      // were reading.
      //
      // Only the two keys that get you *out* still act. Everything else falls
      // through without `preventDefault`, so the list scrolls normally.
      if (mapOpen) {
        if (event.key === 'Escape') setMapOpen(false)
        if (event.key === 'm' || event.key === 'M') toggleMap()
        return
      }

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          event.preventDefault()
          setThrottle(1)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault()
          setBrake(1)
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault()
          setSteer(-1)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault()
          setSteer(1)
          break
        case 'n':
        case 'N':
          drive.driveToNext()
          break
        case 'Backspace':
        case 'p':
        case 'P':
          event.preventDefault()
          drive.goBack()
          break
        case 'm':
        case 'M':
          toggleMap()
          break
        case 'Escape':
          setMapOpen(false)
          break
        default:
          break
      }
    }

    const onKeyUp = (event) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          setThrottle(0)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          setBrake(0)
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'ArrowRight':
        case 'd':
        case 'D':
          setSteer(0)
          break
        default:
          break
      }
    }

    const onBlur = () => {
      setThrottle(0)
      setBrake(0)
      setSteer(0)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [started, mapOpen, setThrottle, setBrake, setSteer, drive, toggleMap])

  // Printing. The scene sets `body.style.overflow = 'hidden'` so the drive
  // cannot be scrolled; on paper that clips the document to a single page and
  // throws the résumé away. The print sheet in `drive.module.css` cannot undo
  // it — it is an *inline* style, and CSS Modules refuses any selector there
  // with no local class in it, so a stylesheet cannot target `body` at all.
  // Released here instead, beside the code that set it, and put back after so
  // the drive still cannot be scrolled.
  useEffect(() => {
    // `null` means "no print in progress". Both guards below depend on it.
    let beforePrintOverflow = null
    const release = () => {
      // Capture **once**. Chrome re-fires `beforeprint` when a preview is
      // reopened, and `window.print()` during a preview does the same. An
      // unconditional capture would store `'visible'` on the second fire, and
      // the following `afterprint` would write that back — leaving the drive
      // permanently scrollable, which is the exact thing the mount effect sets
      // out to prevent.
      if (beforePrintOverflow === null) {
        beforePrintOverflow = document.body.style.overflow
      }
      document.body.style.overflow = 'visible'
    }
    const restore = () => {
      // Put back whatever was there, not a hardcoded `hidden`. The mount effect
      // above already saves and restores this way; writing the literal here
      // happens to be equivalent today only because nothing else touches
      // `body.style.overflow`. The moment something does — a modal, a scroll
      // lock — this would silently overwrite it. And a browser that fires
      // `beforeprint` without a matching `afterprint` leaves the value it
      // captured, rather than a guess.
      //
      // And bail if no print started. `afterprint` can arrive alone — the
      // scene can remount while a preview is open — in which case there is
      // nothing captured, and writing the initial value would *clear* the
      // scroll lock. Doing nothing is right; the mount effect already owns it.
      if (beforePrintOverflow === null) return
      document.body.style.overflow = beforePrintOverflow
      beforePrintOverflow = null
    }
    window.addEventListener('beforeprint', release)
    window.addEventListener('afterprint', restore)
    return () => {
      window.removeEventListener('beforeprint', release)
      window.removeEventListener('afterprint', restore)
    }
  }, [])

  return (
    <div
      // `printable` carries nothing on screen — it exists so the print rules
      // in `drive.module.css` have something to anchor to. See the `@media
      // print` block there for why this page needs one at all.
      className={`fixed inset-0 overflow-hidden bg-[#03060c] text-white ${styles.printable}`}
      // The dashboard's height, defined once and read by everything that has
      // to line up with it: the dash itself, the arrival panel's bottom edge,
      // and the bonnet / dash reflection in `CarInterior`. It used to
      // be written out three times, and the copies only agreed while `36%` was
      // the winning branch of the clamp — below ~528px tall the floor wins and
      // the car's own bonnet ended up behind the dashboard (guardrail 43).
      style={{ '--dash': 'clamp(190px, 36%, 48%)' }}
    >
      {/* Only once under way: before that the ignition splash is the page, and
          the crawler's title from `drive.jsx` is the honest one. */}
      {started ? (
        <Head>
          <title>{titleFor(stop)}</title>
        </Head>
      ) : null}

      {/* First in the tab order on purpose.

          The itinerary below is `sr-only` — clipped to nothing, but still in
          the tab order — and it carries a link for every stop. Measured, that
          is 25 of the 38 focusable elements on the page, so `Tab` from the top
          used to spend 25 presses with the focus ring painted on clipped-away
          content before reaching a control anyone could see. Taking those
          links out of the tab order would fix the sighted keyboard user by
          robbing the screen-reader one, for whom that block *is* the résumé.
          A skip link costs them nothing and gets everyone else to the cockpit
          in one press. */}
      <a
        href="#drive-controls"
        className="sr-only z-50 rounded-md border border-sky-300/70 bg-[#04121a] px-4 py-2 text-sm font-semibold text-sky-100 focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        Skip to the drive controls
      </a>

      {/* The itinerary is clipped to nothing but still tabbable, so a sighted
          keyboard user who declines the skip link walks 25 stops with the
          focus ring painted where nobody can see it. Revealing the focused
          link in place is not available: tested, a `position: fixed`
          descendant does not escape the container's `clip: rect(0,0,0,0)` —
          it keeps its layout box but `elementFromPoint` at its own centre
          returns the canvas. So instead of moving the link out, this reports
          where focus is, from outside the clip.

          `aria-hidden` and deliberately not a live region: a screen reader
          already announces the link, and saying it twice is worse than not
          saying it at all. */}
      <div
        // `printKeep` is what survives printing. The print sheet hides every
        // *other* direct child of the scene rather than naming the pieces to
        // hide — naming them is how the dashboard ended up printed over the
        // résumé, since its root carries no `aria-hidden` and matched none of
        // the rules. This wrapper holds the crawlable itinerary, so keeping
        // exactly one thing is both simpler and impossible to get wrong when
        // new cockpit chrome is added later.
        className={styles.printKeep}
        onFocus={(event) => {
          const link = event.target.closest?.('a[href]')
          setOutlineFocus(link ? link.textContent.trim() : null)
        }}
        onBlur={() => setOutlineFocus(null)}
      >
        {/* What is left if the JavaScript never runs.

          Measured from the served HTML: the whole résumé is already in this
          page — but inside `.sr-only`, which the stylesheet resolves to
          `clip: rect(0,0,0,0)`. The ignition splash renders too, so without
          scripting a visitor met "The résumé, from the driver's seat" and a
          "Start engine" button that does nothing, with every word of the
          résumé present and invisible. There was no `<noscript>` anywhere in
          the application.

          Unclipping `.sr-only` here would be the wrong fix: it would dump the
          résumé behind a `fixed` scene that still covers it, and unclip the
          arrival announcer too. The classic site renders its content
          server-side *and visibly*, so the honest answer is to point there.

          `dangerouslySetInnerHTML` because React treats `<noscript>` children
          differently on the server and the client; this keeps the markup
          identical on both sides. */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<div class="drive-print-hide" style="position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:24px;background:#03060c;color:#e0f2fe;font-family:system-ui,sans-serif;text-align:center">
  <div style="max-width:34rem">
    <p style="margin:0;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#7dd3fc">Hyun-Tae Jin &middot; drive mode</p>
    <h2 style="margin:12px 0 0;font-size:28px;font-weight:300;line-height:1.2">Drive mode needs JavaScript</h2>
    <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:rgba(224,242,254,.65)">This page is a small driving simulation, so it cannot run without it. The same r&eacute;sum&eacute; &mdash; every role, every build and the toolbox &mdash; is on the main site, and that one works fine without scripting.</p>
    <p style="margin:24px 0 0"><a href="/" style="display:inline-block;padding:12px 24px;border:1px solid rgba(125,211,252,.6);border-radius:999px;color:#e0f2fe;text-decoration:none;font-size:14px">Read the r&eacute;sum&eacute; on the main site</a></p>
  </div>
</div>`,
          }}
        />

        <Itinerary />
      </div>
      {outlineFocus ? (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 z-50 max-w-[min(92vw,26rem)] truncate rounded-md border border-sky-300/70 bg-[#04121a] px-3 py-1.5 text-sm text-sky-100 shadow-lg"
        >
          Résumé outline: <span className="font-semibold">{outlineFocus}</span>
        </p>
      ) : null}
      <ArrivalAnnouncer started={started} parked={parked} stop={stop} />

      <Sky drive={drive} />
      <RoadCanvas drive={drive} className="absolute inset-0 h-full w-full" />
      <ExitSign drive={drive} stop={stop} />
      <CarInterior passedStop={passedStop} />

      {/* Heads-up display floats on the glass: below the mirror, above the dash.
          "Below the mirror" was only true on a tall window. The mirror hangs
          from the headliner by a fixed drop — a 12px stalk and a 38px chip, 50px
          that does not shrink — while this band's top was a flat 14%. Percentage
          against pixels: they cross below 769px tall, and the panel then drew
          its bright top border straight through the chip, putting the HUD in
          front of a mirror bolted to the roof. Measured gap before this: +9px at
          1440x900, 0 at 1366x768, -3 at 1280x720, and -25 on a landscape phone.
          The mirror cannot move up (the headliner is right above it), so the
          floor keeps the band clear of it: 7.5% is the mirror's own offset, 58px
          is its 50px drop plus 8px of daylight. Above ~892px tall the 14% wins
          and nothing changes. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[var(--dash)] top-[max(14%,calc(7.5%+58px))] z-30 flex items-center justify-center px-4">
        <StopCard
          stop={stop}
          visible={started && parked && !mapOpen}
          position={index + 1}
          total={route.length}
        />
      </div>

      {/* Turn-signal style status while under way. */}
      <AnimatePresence>
        {started && !parked && !mapOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-[16%] z-30 flex justify-center"
          >
            <div className="flex items-center gap-2 rounded-full border border-emerald-300/30 bg-[#04121a]/70 px-4 py-1.5 text-[0.625rem] uppercase tracking-[0.22em] text-emerald-200/80 backdrop-blur-sm">
              <span className={styles.blink} aria-hidden="true">
                ▸
              </span>
              Next exit — {stop.signTitle}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Dashboard
        drive={drive}
        stop={stop}
        onOpenMap={toggleMap}
        mapOpen={mapOpen}
        reducedMotion={reducedMotion}
        // Flips the **effective** value, not the override. `!(was ?? false)`
        // looks equivalent and is not: for a visitor whose OS already asks for
        // reduced motion, the override starts `null`, so that form would set it
        // `true` and the first click would do nothing at all.
        onToggleMotion={() => setMotionOverride(!reducedMotion)}
      />

      <Link
        href="/"
        className="text-white/35 absolute left-3 top-2 z-40 rounded-md px-2 py-1 text-[0.625rem] uppercase tracking-[0.18em] transition hover:text-sky-300 sm:left-5 sm:top-3"
      >
        ← exit
      </Link>

      <RouteMap
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onSelect={selectStop}
        currentIndex={index}
        stopStatus={drive.stopStatus}
      />

      <AnimatePresence>
        {started ? null : (
          <Ignition
            onStart={start}
            resume={resume}
            onResume={resumeDrive}
            onForget={forgetProgress}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
