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
          <radialGradient id={`face-${label}`} cx="50%" cy="35%">
            <stop offset="0%" stopColor="#111821" />
            <stop offset="100%" stopColor="#05080d" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill={`url(#face-${label})`} />
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="rgba(148, 178, 210, 0.28)"
          strokeWidth="1.5"
        />
        {Array.from({ length: ticks + 1 }, (unused, i) => {
          const fraction = i / ticks
          const angle = START_ANGLE + fraction * SWEEP
          const [x1, y1] = polar(50, 50, 40, angle)
          const [x2, y2] = polar(50, 50, fraction >= redline ? 30 : 33, angle)
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={
                fraction >= redline
                  ? 'rgba(248, 113, 113, 0.9)'
                  : 'rgba(186, 214, 240, 0.6)'
              }
              strokeWidth={fraction >= redline ? 2.4 : 1.8}
              strokeLinecap="round"
            />
          )
        })}
        <circle cx="50" cy="50" r="4" fill="#7dd3fc" />
      </svg>

      <div
        ref={needleRef}
        className="absolute inset-0 origin-center"
        style={{
          transform: `rotate(${START_ANGLE}deg)`,
          willChange: 'transform',
        }}
      >
        <div className="absolute left-1/2 top-[12%] h-[38%] w-[2px] -translate-x-1/2 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.9)]" />
      </div>

      <div className="absolute inset-x-0 bottom-[16%] text-center">
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
    <svg
      ref={wheelRef}
      viewBox="0 0 200 200"
      className="pointer-events-none absolute left-1/2 top-[16%] aspect-square w-[155%] max-w-[300px] origin-center -translate-x-1/2"
      style={{ willChange: 'transform' }}
      aria-hidden="true"
    >
      <circle
        cx="100"
        cy="100"
        r="88"
        fill="none"
        stroke="#0b0e13"
        strokeWidth="17"
      />
      <circle
        cx="100"
        cy="100"
        r="88"
        fill="none"
        stroke="rgba(148, 178, 210, 0.22)"
        strokeWidth="1.5"
      />
      <path
        d="M22 108 H74 M126 108 H178 M100 132 V180"
        stroke="#0b0e13"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <circle cx="100" cy="118" r="26" fill="#0d1117" />
      <circle
        cx="100"
        cy="118"
        r="26"
        fill="none"
        stroke="rgba(125, 211, 252, 0.35)"
        strokeWidth="1.5"
      />
      <text
        x="100"
        y="123"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        letterSpacing="1"
        fill="rgba(125, 211, 252, 0.85)"
      >
        HT
      </text>
    </svg>
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
        'flex h-full w-full touch-none select-none flex-col items-center justify-center rounded-lg border text-[0.625rem] uppercase tracking-[0.16em] transition active:translate-y-[2px]',
        tone === 'go'
          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20'
          : 'border-rose-400/40 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20'
      )}
    >
      <span className="font-display text-sm font-semibold tracking-normal">
        {label}
      </span>
      <span className="text-white/35 mt-0.5 text-[0.5625rem]">{hint}</span>
    </button>
  )
}

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
    <div className="flex h-full flex-col justify-between rounded-lg border border-sky-400/20 bg-[#050b14]/80 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-white/35 truncate text-[0.5625rem] uppercase tracking-[0.2em]">
          {stop.exitLabel} · {stop.signTitle}
        </span>
        <span
          ref={nextRef}
          className="shrink-0 font-display text-[0.75rem] font-semibold tabular-nums text-sky-200"
        >
          —
        </span>
      </div>

      <div className="relative mt-2 h-1.5 rounded-full bg-white/10">
        <div
          ref={barRef}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-500 to-sky-300"
          style={{ width: '0%' }}
        />
        {route.map((entry) => (
          <span
            key={entry.id}
            className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-white/25"
            style={{ left: `${(entry.s / routeLength) * 100}%` }}
          />
        ))}
      </div>

      <div className="text-white/35 mt-2 flex items-baseline justify-between text-[0.5625rem] uppercase tracking-[0.2em]">
        <span>Odometer</span>
        <span className="font-display text-[0.8125rem] font-semibold tabular-nums text-white/70">
          <span ref={odoRef}>0.0</span> mi
        </span>
      </div>
    </div>
  )
}

const readSpeed = (sim) => sim.speed / 42
const readRpm = (sim) => sim.rpm
const formatSpeed = (sim) => String(Math.round(sim.speed * 2.23694))
const formatGear = (sim) => (sim.parked ? 'P' : String(Math.max(1, sim.gear)))

export function Dashboard({ drive, stop, onOpenMap, mapOpen }) {
  const gearRef = useRef(null)

  useEffect(
    () =>
      drive.subscribe((sim) => {
        if (gearRef.current) gearRef.current.textContent = formatGear(sim)
      }),
    [drive]
  )

  return (
    <div
      className={clsx(
        'absolute inset-x-0 bottom-0 z-30 h-[34%] min-h-[196px] overflow-hidden',
        styles.dash
      )}
    >
      <div className="mx-auto grid h-full max-w-6xl grid-cols-2 items-center gap-3 px-4 pb-3 pt-5 sm:gap-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.85fr)] lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)]">
        {/* The wheel, cropped by the bottom of the frame like the real thing. */}
        <div className="relative hidden h-full lg:block">
          <SteeringWheel drive={drive} />
        </div>

        {/* Instrument cluster. */}
        <div className="relative flex h-full items-center justify-center">
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            <Gauge
              drive={drive}
              read={readRpm}
              label="rpm"
              unit="x1000 rpm"
              ticks={8}
              redline={0.78}
              className="hidden sm:block sm:h-[74px] sm:w-[74px]"
            />
            <Gauge
              drive={drive}
              read={readSpeed}
              label="mph"
              unit="mph"
              format={formatSpeed}
              ticks={10}
              redline={1.1}
              className="h-[80px] w-[80px] sm:h-[96px] sm:w-[96px]"
            />
            <div className="flex flex-col items-center rounded-md border border-white/10 bg-black/40 px-2 py-1">
              <span
                ref={gearRef}
                className="font-display text-lg font-semibold leading-none text-sky-200"
              >
                P
              </span>
              <span className="mt-0.5 text-[0.5rem] uppercase tracking-[0.18em] text-white/30">
                gear
              </span>
            </div>
          </div>
        </div>

        {/* Centre console. */}
        <div className="col-span-2 flex h-full flex-col justify-center gap-2 md:col-span-1">
          <div className="h-[62px] sm:h-[70px]">
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

        {/* Pedals. */}
        <div className="flex h-full items-center justify-end gap-2">
          <div className="h-[74px] w-[62px] sm:h-[88px] sm:w-[72px]">
            <Pedal
              label="BRAKE"
              hint="↓ / S"
              tone="stop"
              onPress={() => drive.setBrake(1)}
              onRelease={() => drive.setBrake(0)}
            />
          </div>
          <div className="h-[92px] w-[62px] sm:h-[110px] sm:w-[72px]">
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
