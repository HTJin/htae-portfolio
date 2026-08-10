import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RAMP_LENGTH, rampAt, rampDropAt } from './route'
import { LANE_DRIFT, clamp, curveAt } from './world'

const MAX_SPEED = 42 // m/s, about 94 mph
const ACCELERATION = 8
const BRAKING = 16
const ROLLING_DRAG = 1.1
const AIR_DRAG = 0.018
const CREEP_SPEED = 2.4
const ARRIVAL_WINDOW = 0.6
/** Stay-left threshold for option-lane PASS (≈1/3 of LANE_DRIFT). */
const PASS_LATERAL_MAX = 0.55

// Top gear ends at MAX_SPEED by construction. It used to be typed as `42`
// beside a `MAX_SPEED` of 42: raise one alone and the tachometer pegs for the
// whole of top gear, because `inGear` would run past 1 and clamp.
const GEAR_RATIOS = [0, 7, 13, 20, 28, 36, MAX_SPEED]

function gearFor(speed) {
  for (let gear = 1; gear < GEAR_RATIOS.length; gear += 1) {
    if (speed <= GEAR_RATIOS[gear]) return gear
  }
  return GEAR_RATIOS.length - 1
}

/**
 * Ego stays on mainline grade/lateral when PASS-committed for the current
 * interchange, or while still inside a previously passed stop's ramp band.
 */
function egoStayMainline(sim, all, passedSet) {
  if (sim.commit === 'pass') return true
  for (let i = 0; i < all.length; i += 1) {
    if (!passedSet.has(i)) continue
    if (Math.abs(all[i].s - sim.travel) < RAMP_LENGTH) return true
  }
  return false
}

function createSim() {
  return {
    travel: 0,
    speed: 0,
    x: 0,
    // Where the ramp has carried the road at `travel`. Seeded rather than left
    // at 0 because MILE 0 *is* an interchange: the car starts parked on the
    // entrance ramp, which is what "hold the accelerator to pull onto the
    // highway" has always said it does. The canvas paints before the first
    // `step()` runs (the ignition splash), so a 0 here would draw one frame of
    // the car sitting on the mainline before it snapped onto the ramp.
    ramp: rampAt(0),
    // Same reasoning for the ramp's vertical: MILE 0 sits at the bottom of the
    // entrance ramp, below the mainline grade.
    drop: rampDropAt(0),
    steer: 0,
    steerInput: 0,
    wheel: 0,
    throttle: 0,
    brake: 0,
    throttleLock: false,
    autopilot: false,
    target: 0,
    parked: true,
    // Option-lane disposition for the approach to `target` (st071).
    commit: 'open',
    gear: 1,
    rpm: 0,
    running: false,
  }
}

/**
 * Owns the driving simulation. React state is reserved for the handful of
 * things that change rarely (which stop we are at, whether we are parked);
 * everything that moves at 60fps lives on a ref and is pushed to subscribers
 * so gauges and the road can paint themselves without re-rendering the tree.
 */
export function useDrive(stops, { reducedMotion = false } = {}) {
  const simRef = useRef(createSim())
  const listeners = useRef(new Set())
  const stopsRef = useRef(stops)
  stopsRef.current = stops

  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [parked, setParked] = useState(true)
  const [visited, setVisited] = useState(() => new Set([0]))
  // Durable per-stop pass-through disposition for RouteMap chrome later (st011).
  const [passed, setPassed] = useState(() => new Set())
  const passedRef = useRef(passed)

  const subscribe = useCallback((listener) => {
    listeners.current.add(listener)
    listener(simRef.current)
    return () => listeners.current.delete(listener)
  }, [])

  const markVisited = useCallback((stopIndex) => {
    setVisited((previous) => {
      if (previous.has(stopIndex)) return previous
      const next = new Set(previous)
      next.add(stopIndex)
      return next
    })
  }, [])

  const markPassed = useCallback((stopIndex) => {
    if (passedRef.current.has(stopIndex)) return
    const next = new Set(passedRef.current)
    next.add(stopIndex)
    passedRef.current = next
    setPassed(next)
  }, [])

  /**
   * Restore the history behind a resumed position.
   *
   * Saved progress only ever advances **on arrival** and only **forwards**, so
   * a stored index is proof the visitor arrived at every exit before it. Used
   * by the resume path alone — a `?exit=` deep link must not claim its holder
   * drove the road, because they followed a link instead.
   */
  const markVisitedThrough = useCallback((stopIndex) => {
    setVisited((previous) => {
      const next = new Set(previous)
      for (let i = 0; i <= stopIndex; i += 1) next.add(i)
      return next
    })
  }, [])

  const arriveAt = useCallback(
    (stopIndex) => {
      setIndex(stopIndex)
      setParked(true)
      markVisited(stopIndex)
    },
    [markVisited]
  )

  const depart = useCallback((stopIndex) => {
    setIndex(stopIndex)
    setParked(false)
  }, [])

  const assignEgoRamp = useCallback((sim, all) => {
    if (egoStayMainline(sim, all, passedRef.current)) {
      sim.ramp = 0
      sim.drop = 0
      return
    }
    sim.ramp = rampAt(sim.travel)
    sim.drop = rampDropAt(sim.travel)
  }, [])

  const step = useCallback(
    (dt) => {
      const sim = simRef.current
      const all = stopsRef.current
      const target = all[sim.target]

      // Steering is mostly for feel: it slides the camera between the lanes
      // and turns the wheel, it cannot take you off the itinerary.
      sim.steer += (sim.steerInput - sim.steer) * Math.min(1, dt * 6)
      if (Math.abs(sim.steerInput) < 0.01) {
        sim.x += (0 - sim.x) * Math.min(1, dt * 1.2)
      }
      // Bounded by the lane, not by a typed number: the carriageway now has
      // two lanes, and a drift limit left at the old 2.3 would let the car
      // wander across the lane line the moment the lane got narrower.
      sim.x = clamp(
        sim.x + sim.steer * 5.5 * dt * (0.25 + Math.min(1, sim.speed / 26)),
        -LANE_DRIFT,
        LANE_DRIFT
      )

      const curveAhead = curveAt(sim.travel + 90) - curveAt(sim.travel)
      const wheelTarget = sim.steer * 130 + clamp(curveAhead * 5, -70, 70)
      sim.wheel += (wheelTarget - sim.wheel) * Math.min(1, dt * 4)

      if (!target) return

      // Pulling away from a stop advances the itinerary by one exit.
      if (
        sim.parked &&
        !sim.throttleLock &&
        sim.throttle > 0 &&
        sim.target < all.length - 1
      ) {
        sim.target += 1
        sim.parked = false
        sim.commit = 'open'
        depart(sim.target)
      }

      const current = all[sim.target]
      const remaining = current.s - sim.travel
      const isLast = sim.target >= all.length - 1

      if (sim.parked) {
        sim.speed = 0
        sim.rpm += (0.12 - sim.rpm) * Math.min(1, dt * 3)
        sim.gear = 0
        return
      }

      // Option-lane commit while approaching interchange N (st071 / Q041).
      const inCommitWindow = remaining > 0 && remaining <= RAMP_LENGTH
      if (inCommitWindow && sim.commit === 'open') {
        const autopilotTake = sim.autopilot
        if (sim.brake > 0 || sim.x > PASS_LATERAL_MAX || autopilotTake) {
          sim.commit = 'take'
        } else if (
          !isLast &&
          sim.throttle > 0 &&
          sim.brake === 0 &&
          sim.x <= PASS_LATERAL_MAX
        ) {
          sim.commit = 'pass'
        }
      }

      // Brake assist: rolls to a halt at the next exit unless PASS is locked.
      const stoppingDistance = (sim.speed * sim.speed) / (2 * BRAKING) + 8
      const assist =
        sim.commit !== 'pass' && remaining < stoppingDistance
          ? clamp((stoppingDistance - remaining) / stoppingDistance, 0, 1)
          : 0

      const throttle = sim.autopilot ? (assist > 0 ? 0 : 1) : sim.throttle
      const brake = Math.max(sim.brake, assist)

      if (brake > 0) {
        sim.speed -= BRAKING * brake * dt
      } else if (throttle > 0) {
        sim.speed +=
          ACCELERATION * throttle * dt * (1 - (sim.speed / MAX_SPEED) * 0.8)
      } else {
        sim.speed -= (ROLLING_DRAG + AIR_DRAG * sim.speed) * dt
      }
      sim.speed = clamp(sim.speed, 0, MAX_SPEED)

      // Creep the last few metres so brake assist can never stall us short.
      // Still useful on TAKE; on PASS it just keeps you rolling through the gore.
      if (sim.commit !== 'pass' && remaining < 14 && sim.speed < CREEP_SPEED) {
        sim.speed = Math.min(CREEP_SPEED, sim.speed + 6 * dt)
      }

      sim.travel += sim.speed * dt
      sim.gear = gearFor(sim.speed)
      const gearFloor = GEAR_RATIOS[sim.gear - 1] ?? 0
      const gearCeiling = GEAR_RATIOS[sim.gear] ?? MAX_SPEED
      const inGear =
        (sim.speed - gearFloor) / Math.max(1, gearCeiling - gearFloor)
      sim.rpm +=
        (clamp(0.15 + inGear * 0.75, 0, 1) - sim.rpm) * Math.min(1, dt * 6)

      // Gore resolve: open defaults to TAKE. Last stop cannot PASS.
      if (current.s - sim.travel <= ARRIVAL_WINDOW) {
        if (sim.commit === 'open') sim.commit = 'take'
        if (sim.commit === 'pass' && isLast) sim.commit = 'take'

        if (sim.commit === 'pass') {
          // Drive past without parking, visiting, or writing progress (index stays).
          markPassed(sim.target)
          sim.target = clamp(sim.target + 1, 0, all.length - 1)
          sim.commit = 'open'
        } else {
          sim.travel = current.s
          sim.speed = 0
          sim.parked = true
          sim.autopilot = false
          sim.throttleLock = sim.throttle > 0
          sim.commit = 'open'
          arriveAt(sim.target)
        }
      }

      // One assignment covers both places `travel` moves above — the metre-by-
      // metre integration and the snap onto the stop — so the ramp can never be
      // a frame behind the car sitting on it. The parked early-return skips it,
      // which is correct: `travel` did not move, so neither did the ramp.
      // st072: PASS keeps ego on mainline while exit ribbons stay painted.
      assignEgoRamp(sim, all)
    },
    [arriveAt, assignEgoRamp, depart, markPassed]
  )

  useEffect(() => {
    if (!started) return undefined

    let frame = 0
    let last = performance.now()

    const tick = (now) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      step(dt)
      listeners.current.forEach((listener) => listener(simRef.current))
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [started, step])

  const publish = useCallback(() => {
    listeners.current.forEach((listener) => listener(simRef.current))
  }, [])

  const goTo = useCallback(
    (stopIndex) => {
      const all = stopsRef.current
      const next = clamp(stopIndex, 0, all.length - 1)
      const sim = simRef.current
      sim.target = next
      sim.travel = all[next].s
      // Teleporting (Back, the route map, reduced motion) moves `travel`
      // without going through `step`, so the ramp has to follow here too.
      // Deep link / map goTo / ?exit= remain TAKE/arrive (not drive-past).
      sim.ramp = rampAt(sim.travel)
      sim.drop = rampDropAt(sim.travel)
      sim.speed = 0
      sim.parked = true
      sim.autopilot = false
      sim.throttleLock = sim.throttle > 0
      sim.commit = 'open'
      arriveAt(next)
      publish()
    },
    [arriveAt, publish]
  )

  const driveToNext = useCallback(() => {
    const sim = simRef.current
    const all = stopsRef.current
    if (sim.target >= all.length - 1 && sim.parked) return
    if (sim.parked) {
      sim.target = clamp(sim.target + 1, 0, all.length - 1)
      sim.parked = false
      sim.commit = 'open'
      depart(sim.target)
    }
    if (reducedMotion) {
      // Teleport-TAKE; never a PASS park-goTo.
      goTo(sim.target)
      return
    }
    // Autopilot / Drive-on arms TAKE for the approaching interchange.
    sim.autopilot = true
    if (sim.commit === 'open') sim.commit = 'take'
  }, [depart, goTo, reducedMotion])

  const goBack = useCallback(() => {
    goTo(simRef.current.target - 1)
  }, [goTo])

  const setThrottle = useCallback(
    (value) => {
      const sim = simRef.current
      sim.throttle = value
      if (value === 0) sim.throttleLock = false
      if (value > 0) sim.autopilot = false
      if (reducedMotion && value > 0 && sim.parked && !sim.throttleLock) {
        driveToNext()
      }
    },
    [driveToNext, reducedMotion]
  )

  const setBrake = useCallback((value) => {
    simRef.current.brake = value
    if (value > 0) simRef.current.autopilot = false
  }, [])

  const setSteer = useCallback((value) => {
    simRef.current.steerInput = clamp(value, -1, 1)
  }, [])

  const start = useCallback(() => {
    const sim = simRef.current
    sim.running = true
    setStarted(true)
    arriveAt(sim.target)
  }, [arriveAt])

  return useMemo(
    () => ({
      simRef,
      subscribe,
      started,
      start,
      index,
      parked,
      visited,
      passed,
      markVisitedThrough,
      stop: stops[index],
      goTo,
      goBack,
      driveToNext,
      setThrottle,
      setBrake,
      setSteer,
      maxSpeed: MAX_SPEED,
    }),
    [
      subscribe,
      started,
      start,
      index,
      parked,
      visited,
      passed,
      markVisitedThrough,
      stops,
      goTo,
      goBack,
      driveToNext,
      setThrottle,
      setBrake,
      setSteer,
    ]
  )
}
  )
}
