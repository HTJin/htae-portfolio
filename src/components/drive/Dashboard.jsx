import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { createEngineAudio } from './engineAudio'
import { formatMiles, route, routeLength, yearAt } from './route'
import { clamp } from './world'
import styles from '@/styles/drive.module.css'

const SWEEP = 250 // degrees of needle travel
const START_ANGLE = -125

// Rounded so server and client render byte-identical tick marks.
function polar(cx, cy, radius, degrees) {
  const radians = ((degrees - 90) * Math.PI) / 180
  return [
    Number((cx + radius * Math.cos(radians)).toFixed(3)),
    Number((cy + radius * Math.sin(radians)).toFixed(3)),
  ]
}

function Gauge({
  drive,
  read,
  label,
  unit,
  format,
  ticks,
  redline = 1,
  className,
}) {
  const needleRef = useRef(null)
  const valueRef = useRef(null)

  useEffect(() => {
    const paint = (sim) => {
      const fraction = clamp(read(sim), 0, 1)
      if (needleRef.current) {
        needleRef.current.style.transform = `rotate(${
          START_ANGLE + fraction * SWEEP
        }deg)`
      }
      if (valueRef.current && format) {
        valueRef.current.textContent = format(sim)
      }
    }
    return drive.subscribe(paint)
  }, [drive, read, format])

  return (
    // Decorative: a non-visual user cannot see the road, so a speedometer
    // tells them nothing. The itinerary and the arrival panel carry the
    // content instead.
    <div
      className={clsx('relative aspect-square', className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <defs>
          <radialGradient id={`face-${label}`} cx="50%" cy="30%">
            <stop offset="0%" stopColor="#141b25" />
            <stop offset="65%" stopColor="#080c12" />
            <stop offset="100%" stopColor="#04070b" />
          </radialGradient>
          <linearGradient id={`bezel-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(203, 225, 245, 0.55)" />
            <stop offset="50%" stopColor="rgba(120, 145, 170, 0.18)" />
            <stop offset="100%" stopColor="rgba(180, 205, 230, 0.35)" />
          </linearGradient>
        </defs>

        {/* Chrome bezel, then the sunken face. */}
        <circle cx="50" cy="50" r="49" fill={`url(#bezel-${label})`} />
        <circle cx="50" cy="50" r="45.5" fill={`url(#face-${label})`} />

        {Array.from({ length: ticks + 1 }, (unused, i) => {
          const fraction = i / ticks
          const angle = START_ANGLE + fraction * SWEEP
          const major = i % 2 === 0
          const [x1, y1] = polar(50, 50, 39, angle)
          const [x2, y2] = polar(50, 50, major ? 30 : 34, angle)
          const hot = fraction >= redline
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={
                hot
                  ? 'rgba(248, 113, 113, 0.95)'
                  : major
                  ? 'rgba(226, 240, 252, 0.8)'
                  : 'rgba(160, 190, 216, 0.45)'
              }
              strokeWidth={hot ? 2.6 : major ? 2 : 1.2}
              strokeLinecap="round"
            />
          )
        })}

        {/* Redline arc on the dial edge, the way a real instrument marks it. */}
        {redline < 1 ? (
          <path
            d={(() => {
              const [sx, sy] = polar(50, 50, 42, START_ANGLE + redline * SWEEP)
              const [ex, ey] = polar(50, 50, 42, START_ANGLE + SWEEP)
              return `M ${sx} ${sy} A 42 42 0 0 1 ${ex} ${ey}`
            })()}
            fill="none"
            stroke="rgba(248, 113, 113, 0.75)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ) : null}

        <circle cx="50" cy="50" r="5" fill="#0b1017" />
        <circle
          cx="50"
          cy="50"
          r="5"
          fill="none"
          stroke="rgba(125, 211, 252, 0.55)"
          strokeWidth="1"
        />
      </svg>

      <div
        ref={needleRef}
        className="absolute inset-0 origin-center"
        style={{
          transform: `rotate(${START_ANGLE}deg)`,
          willChange: 'transform',
        }}
      >
        <div className="absolute left-1/2 top-[13%] h-[37%] w-[2.5px] -translate-x-1/2 rounded-full bg-gradient-to-b from-rose-300 to-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.95)]" />
      </div>

      <div className="absolute inset-x-0 bottom-[15%] text-center">
        {format ? (
          <div
            ref={valueRef}
            className="font-display text-[1.05rem] font-semibold tabular-nums leading-none text-sky-100"
          >
            0
          </div>
        ) : null}
        <div className="text-white/35 mt-0.5 text-[0.5rem] uppercase tracking-[0.2em]">
          {unit ?? label}
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- */
/* Tell-tales — the little lamps along the bottom of the cluster. They all
   mean something real here: the turn arrows follow steering input, CRUISE
   follows autopilot, BRAKE follows the brake. The amber braces are the one
   lamp that is not from a car: it is the driver's signature, and it stays
   lit as long as the engine is running.                                   */

function TellTale({ children, title, tone, lit, blink }) {
  return (
    <span
      title={title}
      className={clsx(
        'flex h-4 items-center justify-center px-1 transition-opacity duration-150',
        blink && styles.blink,
        lit ? 'opacity-100' : 'opacity-15',
        tone === 'green' && 'text-emerald-300',
        tone === 'amber' && 'text-amber-300',
        tone === 'red' && 'text-rose-400',
        tone === 'blue' && 'text-sky-300'
      )}
    >
      {children}
    </span>
  )
}

function TellTales({ drive }) {
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const brakeRef = useRef(null)
  const cruiseRef = useRef(null)

  useEffect(
    () =>
      drive.subscribe((sim) => {
        const set = (node, on) => {
          if (node) node.style.opacity = on ? '1' : '0.15'
        }
        set(leftRef.current, sim.steerInput < -0.1)
        set(rightRef.current, sim.steerInput > 0.1)
        set(brakeRef.current, sim.brake > 0 || sim.parked)
        set(cruiseRef.current, sim.autopilot)
      }),
    [drive]
  )

  return (
    <div
      className="flex items-center justify-center gap-1 text-[0.5rem] font-semibold uppercase tracking-[0.12em]"
      aria-hidden="true"
    >
      <span ref={leftRef} style={{ opacity: 0.15 }}>
        <TellTale tone="green" title="Left" lit blink>
          ◀
        </TellTale>
      </span>
      <TellTale tone="blue" title="High beam" lit>
        ≡D
      </TellTale>
      <span ref={cruiseRef} style={{ opacity: 0.15 }}>
        <TellTale tone="green" title="Autopilot engaged" lit>
          CRUISE
        </TellTale>
      </span>
      <TellTale tone="amber" title="Always shipping" lit>
        {'{ }'}
      </TellTale>
      <span ref={brakeRef} style={{ opacity: 0.15 }}>
        <TellTale tone="red" title="Brake" lit>
          BRAKE
        </TellTale>
      </span>
      <span ref={rightRef} style={{ opacity: 0.15 }}>
        <TellTale tone="green" title="Right" lit blink>
          ▶
        </TellTale>
      </span>
    </div>
  )
}

/* --------------------------------------------------------------------- */

const PRND = ['P', 'R', 'N', 'D']

function GearSelector({ drive }) {
  const refs = useRef({})
  const numberRef = useRef(null)

  useEffect(
    () =>
      drive.subscribe((sim) => {
        const active = sim.parked ? 'P' : 'D'
        PRND.forEach((letter) => {
          const node = refs.current[letter]
          if (!node) return
          node.className =
            letter === active
              ? 'font-display text-[0.8125rem] font-bold leading-none text-sky-200'
              : 'font-display text-[0.8125rem] font-bold leading-none text-white/20'
        })
        if (numberRef.current) {
          numberRef.current.textContent = sim.parked
            ? ''
            : String(Math.max(1, sim.gear))
        }
      }),
    [drive]
  )

  return (
    <div className="flex flex-col items-center gap-1" aria-hidden="true">
      <div className="flex items-baseline gap-1.5">
        {PRND.map((letter) => (
          <span
            key={letter}
            ref={(node) => {
              refs.current[letter] = node
            }}
            className="font-display text-[0.8125rem] font-bold leading-none text-white/20"
          >
            {letter}
          </span>
        ))}
        <span
          ref={numberRef}
          className="w-2 font-display text-[0.8125rem] font-bold leading-none text-sky-200/70"
        />
      </div>
      <span className="text-[0.4375rem] uppercase tracking-[0.2em] text-white/25">
        gear
      </span>
    </div>
  )
}

/* --------------------------------------------------------------------- */

const readSpeed = (sim) => sim.speed / 42
const readRpm = (sim) => sim.rpm
const formatSpeed = (sim) => String(Math.round(sim.speed * 2.23694))

/** The hooded pod the driver actually looks through the wheel at. */
function Binnacle({ drive }) {
  return (
    <div className={`absolute inset-x-0 top-[1%] h-[54%] ${styles.binnacle}`}>
      <div className="flex h-full flex-col items-center justify-center gap-0.5 px-[6%] pt-[3%]">
        <TellTales drive={drive} />
        <div className="flex items-end justify-center gap-[4%]">
          <Gauge
            drive={drive}
            read={readRpm}
            label="rpm"
            unit="x1000"
            ticks={8}
            redline={0.78}
            className="h-[clamp(44px,7vh,68px)] w-[clamp(44px,7vh,68px)]"
          />
          <Gauge
            drive={drive}
            read={readSpeed}
            label="mph"
            unit="mph"
            format={formatSpeed}
            ticks={10}
            redline={1.1}
            className="h-[clamp(58px,9.5vh,92px)] w-[clamp(58px,9.5vh,92px)]"
          />
          <div className="pb-[8%]">
            <GearSelector drive={drive} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The same instruments on a phone, where there is no room for a wheel and the
 * cluster has to lie down across the top of the dash instead of standing in a
 * pod behind it.
 */
function ClusterStrip({ drive }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-between gap-2 px-3 py-1.5 ${styles.binnacleStrip}`}
    >
      <Gauge
        drive={drive}
        read={readSpeed}
        label="mph-s"
        unit="mph"
        format={formatSpeed}
        ticks={10}
        redline={1.1}
        className="h-[62px] w-[62px] shrink-0"
      />
      <div className="flex min-w-0 flex-1 justify-center">
        <TellTales drive={drive} />
      </div>
      <div className="shrink-0">
        <GearSelector drive={drive} />
      </div>
    </div>
  )
}

function SteeringWheel({ drive }) {
  const wheelRef = useRef(null)

  useEffect(
    () =>
      drive.subscribe((sim) => {
        if (wheelRef.current) {
          wheelRef.current.style.transform = `rotate(${sim.wheel.toFixed(
            2
          )}deg)`
        }
      }),
    [drive]
  )

  return (
    // The wrapper owns the centring; the SVG owns the rotation. Keep them on
    // separate elements — the per-frame `style.transform` would otherwise
    // overwrite the translate that centres the wheel on the driver's axis.
    <div className="pointer-events-none absolute left-1/2 top-[40%] aspect-square h-full -translate-x-1/2">
      <svg
        ref={wheelRef}
        viewBox="0 0 200 200"
        className="h-full w-full origin-center"
        style={{ willChange: 'transform' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#252b34" />
            <stop offset="45%" stopColor="#12161d" />
            <stop offset="100%" stopColor="#080a0e" />
          </linearGradient>
          <linearGradient id="spoke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c222b" />
            <stop offset="100%" stopColor="#0a0d12" />
          </linearGradient>
        </defs>

        {/* Rim: a solid moulded ring, lit from above like the rest of the dash. */}
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="url(#rim)"
          strokeWidth="20"
        />
        <circle
          cx="100"
          cy="100"
          r="95.5"
          fill="none"
          stroke="rgba(0,0,0,0.85)"
          strokeWidth="2"
        />
        <circle
          cx="100"
          cy="100"
          r="76.5"
          fill="none"
          stroke="rgba(0,0,0,0.6)"
          strokeWidth="2"
        />
        {/* Highlight along the top of the rim. */}
        <path
          d="M 36 58 A 80 80 0 0 1 164 58"
          fill="none"
          stroke="rgba(190, 215, 240, 0.22)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Three spokes: two at nine and three o'clock, one down to the column. */}
        <path
          d="M28 112 H80 M120 112 H172 M100 128 V182"
          stroke="url(#spoke)"
          strokeWidth="19"
          strokeLinecap="round"
        />
        <path
          d="M30 105 H78 M122 105 H170"
          stroke="rgba(190, 215, 240, 0.12)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Thumb grips at ten and two. */}
        <path
          d="M42 66 A 86 86 0 0 1 62 46"
          fill="none"
          stroke="rgba(200, 224, 246, 0.14)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M138 46 A 86 86 0 0 1 158 66"
          fill="none"
          stroke="rgba(200, 224, 246, 0.14)"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* Horn boss — the maker's mark. */}
        <circle cx="100" cy="112" r="27" fill="#0d1117" />
        <circle
          cx="100"
          cy="112"
          r="27"
          fill="none"
          stroke="rgba(125, 211, 252, 0.4)"
          strokeWidth="1.5"
        />
        <circle
          cx="100"
          cy="112"
          r="22"
          fill="none"
          stroke="rgba(125, 211, 252, 0.14)"
          strokeWidth="1"
        />
        <text
          x="100"
          y="118"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          letterSpacing="1.5"
          fill="rgba(125, 211, 252, 0.9)"
        >
          HT
        </text>
      </svg>
    </div>
  )
}

function ConsoleButton({ children, onClick, disabled, title, label, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      // The visible text is symbols ("◂ Back"), which announces as
      // "left-pointing small triangle Back". The label keeps the visible word
      // so voice control still works, and drops the glyph.
      aria-label={label}
      className={clsx(
        // Tighter padding and letter-spacing below `sm` only: on a 390px phone
        // the four console controls overflowed their row by ~11px and the audio
        // toggle wrapped onto a line of its own in the corner. Nothing here
        // changes the visible words (guardrail 22) or drops a target below the
        // 24px floor — the room comes from spacing.
        'rounded-md border px-2 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.1em] transition sm:px-3 sm:tracking-[0.14em]',
        'disabled:cursor-not-allowed disabled:opacity-30',
        accent
          ? 'border-sky-400/50 bg-sky-400/10 text-sky-200 hover:bg-sky-400/20'
          : 'border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'
      )}
    >
      {children}
    </button>
  )
}

function Pedal({ label, hint, name, onPress, onRelease, tone }) {
  const handlers = {
    onPointerDown: (event) => {
      event.currentTarget.setPointerCapture?.(event.pointerId)
      onPress()
    },
    onPointerUp: onRelease,
    onPointerCancel: onRelease,
    onPointerLeave: onRelease,
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onPress()
      }
    },
    onKeyUp: (event) => {
      if (event.key === 'Enter' || event.key === ' ') onRelease()
    },
    onBlur: onRelease,
  }

  return (
    <button
      type="button"
      {...handlers}
      aria-label={name}
      className={clsx(
        'flex h-full w-full touch-none select-none flex-col items-center justify-center rounded-md text-[0.5625rem] uppercase tracking-[0.16em] transition active:translate-y-[3px]',
        styles.pedal,
        tone === 'go'
          ? 'text-emerald-200 hover:brightness-125'
          : 'text-rose-200 hover:brightness-125'
      )}
    >
      <span className="font-display text-sm font-semibold tracking-normal drop-shadow">
        {label}
      </span>
      <span className="mt-0.5 text-white/40">{hint}</span>
    </button>
  )
}

/** The centre screen. It is the one part of the car that admits what it is. */
function TripComputer({ drive, stop }) {
  const odoRef = useRef(null)
  const nextRef = useRef(null)
  const barRef = useRef(null)
  const yearRef = useRef(null)

  useEffect(
    () =>
      drive.subscribe((sim) => {
        if (odoRef.current) odoRef.current.textContent = formatMiles(sim.travel)
        if (barRef.current) {
          barRef.current.style.width = `${clamp(
            (sim.travel / routeLength) * 100,
            0,
            100
          ).toFixed(2)}%`
        }
        if (nextRef.current) {
          const remaining = Math.max(0, stop.s - sim.travel)
          nextRef.current.textContent =
            remaining < 1 ? 'ARRIVED' : `${formatMiles(remaining)} MI`
        }
        if (yearRef.current) {
          // Only the stops with a real date in the content have a year. Past
          // the last of them this reads NOW — it never invents one.
          const year = yearAt(sim.travel)
          yearRef.current.textContent = year === null ? 'NOW' : String(year)
        }
      }),
    [drive, stop]
  )

  return (
    // Decorative too: every value on this screen — the exit, the distance, the
    // year — is already announced by the arrival panel and the itinerary, and
    // the terminal chrome around it is pure styling.
    <div
      className={`flex h-full flex-col justify-between ${styles.screen}`}
      aria-hidden="true"
    >
      <div className="flex items-baseline justify-between gap-2 font-mono text-[0.5625rem]">
        <span className="truncate text-emerald-300/50">
          <span className="text-emerald-300/80">~/route</span> $ drive --to
        </span>
        <span
          ref={nextRef}
          className="shrink-0 font-semibold tabular-nums text-emerald-200"
        >
          —
        </span>
      </div>

      <div className="mt-1 truncate font-mono text-[0.6875rem] text-sky-100/90">
        {stop.exitLabel} · {stop.signTitle}
      </div>

      <div className="relative mt-1.5 h-1.5 rounded-full bg-emerald-950/80">
        <div
          ref={barRef}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
          style={{ width: '0%' }}
        />
        {route.map((entry) => (
          <span
            key={entry.id}
            className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-emerald-200/25"
            style={{ left: `${((entry.s / routeLength) * 100).toFixed(3)}%` }}
          />
        ))}
      </div>

      {/* The road is the résumé, so the hero number is the year — not the
          mileage. It counts the career out and then simply says NOW. */}
      <div className="mt-1.5 flex items-baseline justify-between gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-emerald-300/40">
        <span className="flex items-baseline gap-1.5">
          <span>yr</span>
          <span
            ref={yearRef}
            className="font-display text-[0.9375rem] font-semibold leading-none tracking-normal text-emerald-100"
          >
            {route[1]?.year ?? 'NOW'}
          </span>
        </span>
        <span className="font-semibold tabular-nums text-emerald-200/80">
          odo <span ref={odoRef}>0.0</span> mi
        </span>
      </div>
    </div>
  )
}

/**
 * The one control that makes noise, so it is the one control that is off until
 * you press it. The AudioContext is built *inside this handler* — never on
 * mount, never from a stored preference — so sound can only ever be the result
 * of a deliberate gesture.
 */
function AudioToggle({ drive }) {
  const engineRef = useRef(null)
  const [on, setOn] = useState(false)

  // Tear the graph down with the component; browsers cap live contexts.
  useEffect(
    () => () => {
      engineRef.current?.close()
      engineRef.current = null
    },
    []
  )

  useEffect(() => {
    if (!on) return undefined
    return drive.subscribe((sim) => engineRef.current?.update(sim))
  }, [on, drive])

  const toggle = useCallback(async () => {
    if (!engineRef.current) {
      engineRef.current = createEngineAudio()
      if (!engineRef.current) return // No Web Audio here; stay silent.
    }
    if (on) {
      engineRef.current.disable()
      setOn(false)
      return
    }
    // Only claim it is on if the context really started — the browser can
    // refuse, and a lit toggle over silence is a lie.
    setOn(await engineRef.current.enable())
  }, [on])

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Turn engine sound off' : 'Turn engine sound on'}
      title={on ? 'Engine sound on' : 'Engine sound off'}
      className={clsx(
        'rounded-md border px-2 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] transition',
        on
          ? 'border-amber-300/50 bg-amber-300/10 text-amber-200 hover:bg-amber-300/20'
          : 'border-white/15 bg-white/5 text-white/50 hover:border-white/30 hover:text-white'
      )}
    >
      <span aria-hidden="true">{on ? '♪' : '♪̸'}</span>
    </button>
  )
}

/** Slatted air vents — the cheapest, most convincing "this is a car" cue. */
function Vent({ className }) {
  // Display lives in the utility classes, not the module — a module rule of
  // `display: flex` would out-order Tailwind's `hidden` and leak the vent onto
  // breakpoints that meant to hide it.
  return (
    <div
      className={clsx('flex-col justify-between', styles.vent, className)}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

export function Dashboard({ drive, stop, onOpenMap, mapOpen }) {
  return (
    <div
      className={clsx(
        'absolute inset-x-0 bottom-0 z-30 h-[clamp(190px,36%,48%)]',
        styles.dash
      )}
    >
      {/* The cowl lip catching light off the glass. */}
      <div className={styles.cowl} aria-hidden="true" />

      {/* Outboard vents, out past the instruments where the door cards are. */}
      <Vent className="absolute left-[3%] top-[26%] hidden w-[9%] max-w-[110px] xl:flex" />
      <Vent className="absolute right-[3%] top-[26%] hidden w-[9%] max-w-[110px] xl:flex" />
      {/* (both outboard vents are xl-only: below that the console vents read) */}

      {/* Phone: no room for a wheel, so the cockpit stacks instead of sitting
          side by side. Cluster on the cowl, screen under it, controls in reach
          of a thumb at the bottom. */}
      <div className="flex h-full flex-col gap-2 px-2.5 pb-2 pt-2.5 lg:hidden">
        <ClusterStrip drive={drive} />
        <div className="min-h-0 flex-1">
          <TripComputer drive={drive} stop={stop} />
        </div>
        <div className={`flex items-end gap-1.5 ${styles.footwell}`}>
          {/* `flex-wrap` stays as the safety net for anything narrower than a
              phone, but at 360px and up these four now fit on one row. */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            <ConsoleButton
              onClick={drive.goBack}
              disabled={drive.index === 0}
              title="Previous stop"
              label="Back to the previous exit"
            >
              ◂ Back
            </ConsoleButton>
            <ConsoleButton
              onClick={drive.driveToNext}
              disabled={drive.index === route.length - 1 && drive.parked}
              accent
              title="Autopilot to the next stop"
              label="Drive on to the next exit"
            >
              Next ▸
            </ConsoleButton>
            <ConsoleButton
              onClick={onOpenMap}
              title="Route map"
              label={mapOpen ? 'Close the route map' : 'Open the route map'}
            >
              {mapOpen ? 'Close' : 'Map'}
            </ConsoleButton>
            <AudioToggle drive={drive} />
          </div>
          <div className="h-[52px] w-[54px] shrink-0">
            <Pedal
              label="BRAKE"
              name="Brake"
              hint="↓"
              tone="stop"
              onPress={() => drive.setBrake(1)}
              onRelease={() => drive.setBrake(0)}
            />
          </div>
          <div className="h-[62px] w-[54px] shrink-0">
            <Pedal
              label="GO"
              name="Go — hold to accelerate"
              hint="↑"
              tone="go"
              onPress={() => drive.setThrottle(1)}
              onRelease={() => drive.setThrottle(0)}
            />
          </div>
        </div>
      </div>

      {/* Desktop: the real driver's seat.

          The middle grid column is the steering column, and it is a fixed
          width between two `1fr` columns — so the wheel is centred on the
          viewport by construction, at every width. That is not decoration:
          `project()` puts the camera (the driver's eye) at the middle of the
          image, so the middle of the viewport *is* the driver's eyeline, and
          the wheel is the one thing that must sit directly in front of it.
          The road was previously drawn from an eye at 50% while the cockpit
          was laid out around one at 32% — a 345px disagreement at 1920.
          To the driver's left is the door; the console lives to their right. */}
      <div className="hidden h-full grid-cols-[0.42fr_clamp(260px,24vw,400px)_1fr] items-stretch gap-5 px-6 pb-2 pt-3 lg:grid xl:grid-cols-[1fr_clamp(260px,24vw,400px)_1fr]">
        {/* The door side. Only from xl up does it take a full column, and the
            threshold is measured rather than chosen: centring the wheel means
            the door column must equal the console column, and the console
            needs ~310px for its button row on one line (measured at 1100px:
            Back 78 + Next 77 + Route map 105 + the audio toggle and gaps).
            Working back through the flex shares that is a ~461px column, so
            2 x 461 + the 260px wheel column + 40px of gaps + 48px of padding
            = ~1270px before it fits — which is xl. Below that the door column
            narrows to 0.42fr instead, which brings the wheel most of the way
            to the eyeline (measured: 153px short at 1100) while keeping the
            console on one row. Verified at 1100x800 in a sized iframe. */}
        <div className={`h-full ${styles.doorCard}`} aria-hidden="true" />

        {/* Driver's side: binnacle behind, wheel in front, one locked unit. */}
        <div className="relative h-full">
          <Binnacle drive={drive} />
          <SteeringWheel drive={drive} />
        </div>

        {/* Centre stack and footwell, both to the driver's right. */}
        <div className="flex h-full min-w-0 items-stretch gap-4">
          <div className="flex h-full min-w-0 flex-[1.15] flex-col justify-center gap-2 py-1">
            <div className="flex justify-between gap-3">
              <Vent className="flex w-[26%]" />
              <Vent className="flex w-[26%]" />
            </div>
            <div className="h-[clamp(84px,13vh,116px)]">
              <TripComputer drive={drive} stop={stop} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <ConsoleButton
                onClick={drive.goBack}
                disabled={drive.index === 0}
                title="Previous stop (Backspace)"
                label="Back to the previous exit"
              >
                ◂ Back
              </ConsoleButton>
              <ConsoleButton
                onClick={drive.driveToNext}
                disabled={drive.index === route.length - 1 && drive.parked}
                accent
                title="Autopilot to the next stop (N)"
                label="Drive on to the next exit"
              >
                Next ▸
              </ConsoleButton>
              <ConsoleButton
                onClick={onOpenMap}
                title="Route map (M)"
                label={mapOpen ? 'Close the route map' : 'Open the route map'}
              >
                {mapOpen ? 'Close map' : 'Route map'}
              </ConsoleButton>
              <AudioToggle drive={drive} />
            </div>
          </div>

          {/* Pedals, tucked where the footwell would be. */}
          <div
            className={`flex h-full flex-[0.5] shrink-0 items-end gap-2 pb-2 ${styles.footwell}`}
          >
            <div className="h-[clamp(52px,8vh,74px)] w-[46%] max-w-[62px]">
              <Pedal
                label="BRAKE"
                name="Brake"
                hint="↓ / S"
                tone="stop"
                onPress={() => drive.setBrake(1)}
                onRelease={() => drive.setBrake(0)}
              />
            </div>
            <div className="h-[clamp(62px,9.5vh,88px)] w-[46%] max-w-[62px]">
              <Pedal
                label="GO"
                name="Go — hold to accelerate"
                hint="↑ / W"
                tone="go"
                onPress={() => drive.setThrottle(1)}
                onRelease={() => drive.setThrottle(0)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
