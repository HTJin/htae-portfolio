import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ProjectShots } from './ProjectShots'
import { tripSummary } from './route'
import styles from '@/styles/drive.module.css'

function CornerBrackets() {
  const corner = 'pointer-events-none absolute h-4 w-4 border-sky-300/60'
  return (
    <>
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
    </>
  )
}

/** The green interstate shield, bolted to the top-left of the panel. */
function ExitShield({ stop }) {
  const [tag, number] = stop.exitLabel.split(' ')
  return (
    <div
      className={`flex shrink-0 flex-col items-center rounded-md px-2.5 py-1 ${styles.shield}`}
    >
      <span className="text-[0.5rem] uppercase leading-none tracking-[0.2em] text-emerald-100/70">
        {tag}
      </span>
      <span className="font-display text-base font-bold leading-none tracking-tight text-white">
        {number}
      </span>
    </div>
  )
}

/**
 * Actions carry weight in proportion to what they are for. At the destination
 * the point is to start a conversation, so the email is the loud one and the
 * way back out is quiet — otherwise the goal and the exit door look identical
 * and the eye has nothing to land on.
 */
function linkClass(link) {
  if (link.primary) {
    return 'rounded-md border border-sky-300/70 bg-sky-400/25 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(56,189,248,0.9)] transition hover:bg-sky-400/40'
  }
  if (link.quiet) {
    return 'rounded-md px-2 py-1.5 text-xs font-medium text-white/45 underline-offset-4 transition hover:text-sky-200 hover:underline'
  }
  return 'rounded-md border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-400/20'
}

function StopLinks({ links }) {
  if (!links?.length) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
      {links.map((link, position) =>
        link.external ? (
          <a
            key={`${link.label}-${position}`}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass(link)}
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={`${link.label}-${position}`}
            href={link.href}
            className={linkClass(link)}
          >
            {link.label}
          </Link>
        )
      )}
    </div>
  )
}

/**
 * The trip, in numbers, at the destination only. Every figure comes from
 * `route.js`, derived from the content itself — nothing here is written down.
 */
function TripSummary() {
  return (
    // Four across at every width. Stacked 2x2 on a phone this block cost 112px
    // and pushed the last row of actions 12px past the panel's scroll edge, so
    // the drive ended on a call to action sliced through the middle. Across, it
    // costs about half that. The labels are allowed to wrap onto two lines at
    // the narrow end rather than being abbreviated — these figures are derived
    // from the content and must stay legible and accurate (guardrail 72).
    <dl className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3 border-y border-sky-400/15 py-2.5 sm:mt-4 sm:gap-x-4 sm:py-3">
      {tripSummary.map((item) => (
        <div key={item.label}>
          <dt className="text-[0.5625rem] uppercase leading-tight tracking-[0.12em] text-sky-300/60 sm:text-[0.625rem] sm:tracking-[0.18em]">
            {item.label}
          </dt>
          <dd className="mt-0.5 font-display text-lg font-semibold leading-none text-white sm:text-xl">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * A URL written inside a sentence, turned into something you can actually
 * click.
 *
 * One paragraph on the route ends with a bare URL — EXIT 12 cites the Colab
 * product page — and it rendered as dead text, so the only way to follow it was
 * to select 43 characters by hand, which on a phone is not a reasonable ask.
 *
 * The copy itself is not ours to edit (`src/lib/projects.js` is read-only), so
 * the words are passed through exactly as written and only the link is added.
 * Split into React elements rather than built as HTML: turning content text
 * into markup is how a linkifier becomes an injection.
 *
 * The trailing-punctuation class is deliberate. `https://x.dev/a.` at the end
 * of a sentence must not put the full stop inside the href, and a URL in
 * brackets must not keep the closing one.
 */
const URL_PATTERN = /(https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)\]}])/g

function linkify(text) {
  const pieces = text.split(URL_PATTERN)
  if (pieces.length === 1) return text
  return pieces.map((piece, position) =>
    position % 2 === 1 ? (
      <a
        key={`${piece}-${position}`}
        href={piece}
        target="_blank"
        rel="noopener noreferrer"
        className="break-words text-sky-300 underline decoration-sky-300/40 underline-offset-2 transition hover:text-sky-200 hover:decoration-sky-200"
      >
        {piece}
      </a>
    ) : (
      piece
    )
  )
}

/** Everything except the media — the column that always has something in it. */
function StopProse({ stop }) {
  return (
    <>
      {stop.paragraphs?.map((paragraph) => (
        <p
          key={paragraph.slice(0, 40)}
          className="mt-3 text-[0.8125rem] leading-6 text-sky-100/80"
        >
          {linkify(paragraph)}
        </p>
      ))}

      {stop.bullets?.length ? (
        <ul className="mt-3 space-y-1.5">
          {stop.bullets.map((bullet) => (
            <li
              key={bullet.slice(0, 40)}
              className="flex gap-2 text-[0.8125rem] leading-6 text-sky-100/80"
            >
              <span
                aria-hidden="true"
                className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-sky-300/70"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {stop.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {stop.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[0.6875rem] text-sky-100/70"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {stop.groups?.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {stop.groups.map((group) => (
            <div
              key={group.id}
              className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2"
            >
              <div className="text-[0.6875rem] uppercase tracking-[0.16em] text-sky-300/80">
                {group.title}
              </div>
              <div className="mt-1 text-[0.75rem] leading-5 text-sky-100/70">
                {group.items}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {stop.kind === 'destination' ? <TripSummary /> : null}

      <StopLinks links={stop.links} />

      {stop.hint ? (
        <p className="mt-4 text-[0.6875rem] uppercase tracking-[0.16em] text-sky-300/60">
          {stop.hint}
        </p>
      ) : null}
    </>
  )
}

/**
 * The windshield heads-up display: shown whenever the car is parked. It
 * projects up from the dash, so it animates from its bottom edge.
 */
export function StopCard({ stop, visible, position, total }) {
  const reducedMotion = useReducedMotion()
  const shots = stop.images?.length ? stop.images : null

  /**
   * The stops that are only prose get the same width the picture stops get,
   * and flow in two columns on a big screen.
   *
   * Measured at 1440x900: a stop with screenshots widened to 925px while a
   * text-only one stayed at 704px, so the sabbatical hid 40.9% of itself, the
   * toolbox 20.5% and the senior role 15.1% — with 736px of the band unused
   * either side. Widening alone would have fixed the fold and pushed the lines
   * to ~135 characters; widening *and* columning fixes the fold and brings the
   * measure down to ~63 characters instead.
   *
   * Deliberately not the project stops (they already split media from prose —
   * a second column context inside that would be a layout nobody designed) and
   * deliberately not the destination, whose summary band and primary call to
   * action were composed on purpose and already fit.
   */
  const roomy = !shots && stop.kind !== 'destination'

  /**
   * Is this stop a continuous piece of writing, rather than a list?
   *
   * Columns suit bullets, tags and the toolbox grid: each item is short and
   * self-contained, so the eye starts fresh every time and a narrow measure is
   * pure gain. They suit *prose* far less. A paragraph split across three short
   * columns makes the reader track to the bottom and back to the top for every
   * few lines, and the taller the passage the worse it gets.
   *
   * The sabbatical is the case that exposed it — the longest entry on the
   * résumé, all `drawer` paragraphs and no bullets, and the owner: "the passage
   * describing my time unemployed is not friendly to read with like 3 column
   * layout." It is also the most personal thing on the page, which is the worst
   * possible thing to make someone fight to read.
   */
  const proseOnly =
    (stop.paragraphs?.length ?? 0) > 0 &&
    (stop.bullets?.length ?? 0) === 0 &&
    (stop.groups?.length ?? 0) === 0

  return (
    <AnimatePresence mode="wait">
      {visible ? (
        <motion.section
          key={stop.id}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 26, rotateX: 10, scale: 0.97 }
          }
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -14, rotateX: -6, scale: 0.98 }
          }
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'bottom center', perspective: 1200 }}
          // Deliberately not a live region: this node is keyed by stop inside
          // AnimatePresence, so it is destroyed and rebuilt on every arrival and
          // could never announce anything. `ArrivalAnnouncer` in DriveScene is
          // mounted for the life of the page and does the announcing.
          // A text-only stop keeps widening past `lg`, where a picture stop
          // stops at 58rem. The card used to cap there at every width, so a
          // 1920-wide monitor left 992px of the band — more than half — empty
          // while the longest entry on the résumé was still cut off. The extra
          // width buys a third column rather than longer lines; see below.
          //
          // Two separate interpolations on purpose: writing them as one
          // comma-separated expression makes it the comma operator, which
          // evaluates the first and throws it away. That silently dropped the
          // picture stops back to 44rem, and only the measurements caught it.
          className={`pointer-events-auto relative flex max-h-full w-[min(94vw,44rem)] flex-col rounded-xl px-4 py-3 sm:px-7 sm:py-5 ${
            shots
              ? 'lg:w-[min(94vw,58rem)] [@media(min-width:1536px)_and_(min-height:1120px)]:w-[min(94vw,76rem)]'
              : ''
          } ${roomy ? 'lg:w-[min(94vw,52rem)] xl:w-[min(94vw,60rem)]' : ''} ${
            styles.hud
          }`}
        >
          <CornerBrackets />

          {/* Sign rail: the shield, the leg you are on, and how far along. */}
          <header className="flex items-center gap-3">
            <ExitShield stop={stop} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.625rem] uppercase tracking-[0.24em] text-emerald-300/70">
                {stop.leg}
              </p>
              <h2 className="mt-0.5 line-clamp-2 font-display text-lg font-semibold leading-tight text-white sm:text-2xl lg:truncate">
                {stop.title}
              </h2>
            </div>
            <span className="shrink-0 self-start font-mono text-[0.625rem] tabular-nums text-sky-300/60">
              {position}/{total}
            </span>
          </header>

          {(stop.subtitle || stop.meta) && (
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t border-white/10 pt-1.5">
              {stop.subtitle ? (
                <p className="text-sky-200/85 text-sm">{stop.subtitle}</p>
              ) : null}
              {stop.meta ? (
                <p className="text-white/45 text-[0.75rem]">{stop.meta}</p>
              ) : null}
            </div>
          )}

          <div
            className={`min-h-0 flex-1 overflow-y-auto pr-1 ${styles.hudScroll}`}
          >
            {shots ? (
              // The screenshot is the point of a project stop, so on a screen
              // with room it takes more of the split. Measured: 451x225 from a
              // 1899x970 source is 23.7% of native at every width, because the
              // card used to cap at 58rem — a whole page rendered at a quarter
              // size, where the layout reads and nothing else does.
              //
              // Gated on height as well as width, and that is not caution but
              // arithmetic: the frame is a fixed 2:1, so widening grows the
              // height too, and the band's height belongs to the cockpit.
              // Trialled at 1216px — 1920x900 hid 83px and 1920x1000 hid 33px,
              // while 1080 and above hid nothing. Below the gate the layout is
              // untouched, because the room genuinely is not there.
              <div className="gap-x-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] [@media(min-width:1536px)_and_(min-height:1120px)]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <ProjectShots
                  images={shots}
                  title={stop.title}
                  site={stop.site}
                />
                <div className="lg:pt-3">
                  <StopProse stop={stop} />
                </div>
              </div>
            ) : roomy ? (
              // Balanced columns, and only from `lg` up — a phone stays one
              // column. The columns live on an inner wrapper rather than on
              // the scroll container itself, so the multi-column context is
              // never the thing that owns the scrollbar.
              // `break-inside-avoid` is scoped to list items and group cards
              // on purpose. Putting it on every direct child — which the first
              // build did — stops the big blocks (the whole bullet list, the
              // toolbox grid) from splitting at all, so the columns cannot
              // balance and the content gets *taller*: measured, the toolbox
              // went from 84px hidden to 261px. Only the small items are
              // protected from breaking mid-item.
              // Three columns once there is room for them. Measured at
              // 1920x900 on the sabbatical, the longest entry: widening alone
              // to 1088px left 22px hidden and pushed the measure to 492px
              // (~76 characters), while 1216px with a third column hides
              // nothing and *narrows* the measure to 363px (~56). Better on
              // both axes, which is the same trade that chose two columns
              // over a plain widening in the first place.
              //
              // Both this and the card width sat at `2xl` (1536px), which left
              // 1280-1535 — an ordinary laptop — on the narrow layout. The
              // sabbatical hid 94px (22% of itself) at 1440x900 and 144px
              // (34%) at 1280x800, and it is the longest entry on the résumé,
              // so it was the one stop you could not read without scrolling.
              // At `xl` it hides nothing at 1440 and 24px at 1280. Width and
              // columns move together on purpose: widening alone would stretch
              // the measure to ~590px per column, which is worse than the
              // problem being fixed.
              // Continuous prose does not go in columns — see `proseOnly`. It
              // gets one column with the measure bounded in `ch`, so the line
              // length is set by the type rather than by however wide the panel
              // happens to be. The panel still scrolls, which is the right
              // trade: a few lines below the fold costs a scroll, while three
              // columns cost you the thread of what you are reading.
              proseOnly ? (
                <div className="mx-auto max-w-[70ch]">
                  <StopProse stop={stop} />
                </div>
              ) : (
                // Two columns, never three. Cycle 49 added a third at xl and
                // measured it as a win on both axes — nothing hidden, and a
                // narrower measure. It was measuring the wrong thing: a 1216px
                // panel three columns wide is a broadsheet, and the owner reads
                // it as "too wide and hard to read". The card is narrower now
                // (60rem at xl, was 76rem) and stops at two columns, which puts
                // the measure around 55-60 characters instead of ~56 spread
                // across a metre of screen.
                <div className="lg:columns-2 lg:gap-x-8 [&_li]:break-inside-avoid">
                  <StopProse stop={stop} />
                </div>
              )
            ) : (
              <StopProse stop={stop} />
            )}
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}
