import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { formatMiles, route, routeLength } from './route'
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
    <div className={clsx('relative aspect-square', className)}>
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
    <div className="flex flex-col items-center gap-1">
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

function ConsoleButton({ children, onClick, disabled, title, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'rounded-md border px-3 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] transition',
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

function Pedal({ label, hint, onPress, onRelease, tone }) {
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
      }),
    [drive, stop]
  )

  return (
    <div className={`flex h-full flex-col justify-between ${styles.screen}`}>
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

      <div className="mt-1.5 flex items-baseline justify-between font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-emerald-300/40">
        <span>odo</span>
        <span className="font-semibold tabular-nums text-emerald-200/80">
          <span ref={odoRef}>0.0</span> mi
        </span>
      </div>
    </div>
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
        'absolute inset-x-0 bottom-0 z-30 h-[36%] min-h-[210px]',
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
      <div className="flex h-full flex-col gap-2 px-3 pb-2 pt-2.5 lg:hidden">
        <ClusterStrip drive={drive} />
        <div className="min-h-0 flex-1">
          <TripComputer drive={drive} stop={stop} />
        </div>
        <div className={`flex items-end gap-2 ${styles.footwell}`}>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <ConsoleButton
              onClick={drive.goBack}
              disabled={drive.index === 0}
              title="Previous stop"
            >
              ◂ Back
            </ConsoleButton>
            <ConsoleButton
              onClick={drive.driveToNext}
              disabled={drive.index === route.length - 1 && drive.parked}
              accent
              title="Autopilot to the next stop"
            >
              Next ▸
            </ConsoleButton>
            <ConsoleButton onClick={onOpenMap} title="Route map">
              {mapOpen ? 'Close' : 'Map'}
            </ConsoleButton>
          </div>
          <div className="h-[52px] w-[54px] shrink-0">
            <Pedal
              label="BRAKE"
              hint="↓"
              tone="stop"
              onPress={() => drive.setBrake(1)}
              onRelease={() => drive.setBrake(0)}
            />
          </div>
          <div className="h-[62px] w-[54px] shrink-0">
            <Pedal
              label="GO"
              hint="↑"
              tone="go"
              onPress={() => drive.setThrottle(1)}
              onRelease={() => drive.setThrottle(0)}
            />
          </div>
        </div>
      </div>

      {/* Desktop: the real driver's seat. */}
      <div className="mx-auto hidden h-full max-w-6xl items-stretch gap-5 px-6 pb-2 pt-3 lg:flex">
        {/* Driver's side: binnacle behind, wheel in front, one locked unit. */}
        <div className="relative h-full flex-[1.05]">
          <Binnacle drive={drive} />
          <SteeringWheel drive={drive} />
        </div>

        {/* Centre stack. */}
        <div className="flex h-full flex-[1.15] flex-col justify-center gap-2 py-1">
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
            >
              ◂ Back
            </ConsoleButton>
            <ConsoleButton
              onClick={drive.driveToNext}
              disabled={drive.index === route.length - 1 && drive.parked}
              accent
              title="Autopilot to the next stop (N)"
            >
              Next ▸
            </ConsoleButton>
            <ConsoleButton onClick={onOpenMap} title="Route map (M)">
              {mapOpen ? 'Close map' : 'Route map'}
            </ConsoleButton>
          </div>
        </div>

        {/* Pedals, tucked where the footwell would be. */}
        <div
          className={`flex h-full flex-[0.5] items-end gap-2 pb-2 ${styles.footwell}`}
        >
          <div className="h-[clamp(52px,8vh,74px)] w-[46%] max-w-[62px]">
            <Pedal
              label="BRAKE"
              hint="↓ / S"
              tone="stop"
              onPress={() => drive.setBrake(1)}
              onRelease={() => drive.setBrake(0)}
            />
          </div>
          <div className="h-[clamp(62px,9.5vh,88px)] w-[46%] max-w-[62px]">
            <Pedal
              label="GO"
              hint="↑ / W"
              tone="go"
              onPress={() => drive.setThrottle(1)}
              onRelease={() => drive.setThrottle(0)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
