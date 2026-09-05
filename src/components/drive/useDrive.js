import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { rampAt, rampDropAt } from './route'
import { CARRIAGEWAY, LANE_OFFSET, clamp, curveAt } from './world'

/** Keeps the wheels off the outer paint when steering to the edge lanes. */
const LANE_EDGE_MARGIN = 1.1

/**
 * Speed and gearing, rebuilt to behave like a car.
 *
 * Owner: "the car also accelerates at a very unrealistic way where gear is
 * shifting whenever it just reaches the end and the app is suggesting to break
 * the law by over speeding but it only goes up to 94."
 *
 * Both halves were true. ACCELERATION was a flat 8 m/s^2, which is 0-60mph in
 * 3.4 seconds, so the car slammed into the ceiling and every upshift happened in
 * the last moment before it got there. And the ceiling was 42 m/s, 94 mph, which
 * is not a speed to invite anyone to hold on a public road.
 *
 * SPEED_LIMIT is the posted limit the car cruises at. MAX_SPEED leaves a little
 * over it, because a car that physically cannot exceed the limit feels broken,
 * but nothing encourages going there.
 */
const SPEED_LIMIT = 31.3 // m/s, 70 mph
const MAX_SPEED = 35.8 // m/s, 80 mph, reachable but never suggested
/**
 * Peak acceleration, in m/s^2, near standstill. Real drive falls away with speed
 * as drag and gearing bite, which is what makes an upshift feel like an upshift
 * rather than a number changing at the top of the range.
 */
const ACCELERATION = 3.4
const BRAKING = 16
const ROLLING_DRAG = 1.1
const AIR_DRAG = 0.018
const CREEP_SPEED = 2.4
const ARRIVAL_WINDOW = 0.6
/**
 * How far past an exit the car must be before the pass is committed, in metres.
 * A margin rather than zero so a car creeping over the sign, or a frame that
 * overshoots at speed, cannot flicker the target back and forth.
 */
const PASS_MARGIN = 12

// Top gear ends at MAX_SPEED by construction. It used to be typed as `42`
// beside a `MAX_SPEED` of 42: raise one alone and the tachometer pegs for the
// whole of top gear, because `inGear` would run past 1 and clamp.
const GEAR_RATIOS = [0, 5.5, 10.5, 16, 22, 28.5, MAX_SPEED]

function gearFor(speed) {
  for (let gear = 1; gear < GEAR_RATIOS.length; gear += 1) {
    if (speed <= GEAR_RATIOS[gear]) return gear
  }
  return GEAR_RATIOS.length - 1
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
    // Latched by steering right beside a ramp; see the assignment in the tick.
    exiting: true,
    // Durable per-stop outcome, keyed by stop id. 'passed' is written by the
    // pass-through commit; visiting a stop is still recorded through arriveAt.
    dispositions: {},
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

  /**
   * Restore the history behind a resumed position.
   *
   * Saved progress only ever advances **on arrival** and only **forwards**, so
   * a stored index is proof the visitor arrived at every exit before it. Used
   * by the resume path alone - a `?exit=` deep link must not claim its holder
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
      // Steering now crosses the whole carriageway, not just one lane.
      //
      // Owner: "make sure we're also able to drive on the left lane of the road".
      // The clamp was +/- LANE_DRIFT, which is half a lane, so the car could wander
      // inside its own lane and nothing more. The bounds are the carriageway edges
      // measured from the lane the camera starts in, less a margin so the wheels
      // stay on tarmac rather than riding the paint.
      sim.x = clamp(
        sim.x + sim.steer * 5.5 * dt * (0.25 + Math.min(1, sim.speed / 26)),
        -(LANE_OFFSET - LANE_EDGE_MARGIN),
        CARRIAGEWAY - LANE_OFFSET - LANE_EDGE_MARGIN
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
        depart(sim.target)
      }

      let current = all[sim.target]
      let remaining = current.s - sim.travel

      // PASS: the driver declined this exit and drove by it.
      //
      // st071 M3 and M4. Suppressing brake assist and auto-park was only half the
      // leaf: without advancing the target, the nav kept pointing at an exit that
      // was already behind the car, which is why the banner still read NEXT EXIT for
      // a stop the driver had passed. `arriveAt` is deliberately NOT called, so the
      // stop is never recorded as visited.
      //
      // The disposition is durable and keyed by stop id, so a later route map can
      // draw passed differently from visited without re-deriving it from distance.
      if (
        !sim.parked &&
        !sim.exiting &&
        remaining < -PASS_MARGIN &&
        sim.target < all.length - 1
      ) {
        sim.dispositions[current.id ?? sim.target] = 'passed'
        sim.target += 1
        current = all[sim.target]
        remaining = current.s - sim.travel
        depart(sim.target)
      }

      if (sim.parked) {
        sim.speed = 0
        sim.rpm += (0.12 - sim.rpm) * Math.min(1, dt * 3)
        sim.gear = 0
        return
      }

      // Brake assist rolls the car to a halt at the next exit sign, but ONLY for a
      // driver who is actually taking that exit.
      //
      // Owner: "you still come to a stop at the resume item". Gating sim.ramp alone
      // was half a fix: the car stayed on the mainline laterally and then still
      // braked to a stop beside an exit it was driving past. Staying on the highway
      // has to mean not stopping either.
      const stoppingDistance = (sim.speed * sim.speed) / (2 * BRAKING) + 8
      const assist =
        sim.exiting && remaining < stoppingDistance
          ? clamp((stoppingDistance - remaining) / stoppingDistance, 0, 1)
          : 0

      const throttle = sim.autopilot ? (assist > 0 ? 0 : 1) : sim.throttle
      const brake = Math.max(sim.brake, assist)

      if (brake > 0) {
        sim.speed -= BRAKING * brake * dt
      } else if (throttle > 0) {
        sim.speed +=
          // Falloff is measured against SPEED_LIMIT, not MAX_SPEED, so the car
          // settles at the posted limit on its own and only creeps past it under
          // sustained throttle. Measured against MAX_SPEED it pinned to the
          // ceiling every time, which is what made 94mph feel like the intended
          // cruising speed.
          ACCELERATION * throttle * dt * Math.max(0.12, 1 - (sim.speed / SPEED_LIMIT) * 0.88)
      } else {
        sim.speed -= (ROLLING_DRAG + AIR_DRAG * sim.speed) * dt
      }
      sim.speed = clamp(sim.speed, 0, MAX_SPEED)

      // Creep the last few metres so brake assist can never stall us short.
      if (remaining < 14 && sim.speed < CREEP_SPEED) {
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

      // Arrival snaps the car onto the stop and parks it. Like brake assist, this
      // only applies to a driver who chose the exit. Without the gate a car that
      // stayed on the mainline was still teleported onto the stop and halted, which
      // is the third place the old unconditional behaviour was written down and the
      // reason gating sim.ramp alone did not deliver "keep driving".
      if (sim.exiting && current.s - sim.travel <= ARRIVAL_WINDOW) {
        sim.travel = current.s
        sim.speed = 0
        sim.parked = true
        sim.autopilot = false
        sim.throttleLock = sim.throttle > 0
        arriveAt(sim.target)
      }

      // One assignment covers both places `travel` moves above - the metre-by-
      // metre integration and the snap onto the stop - so the ramp can never be
      // a frame behind the car sitting on it. The parked early-return skips it,
      // which is correct: `travel` did not move, so neither did the ramp.
      // Taking the exit is now a CHOICE.
      //
      // Owner: "no way to just keep driving without not taking the exit". This
      // assignment used to be unconditional, so every exit dragged the car off the
      // mainline whatever the driver did. `sim.exiting` latches when the driver
      // steers right while a ramp is actually beside them, and clears once the ramp
      // has gone. Hold right to leave, do nothing to stay on the highway.
      const rampHere = rampAt(sim.travel)
      const nearRamp = rampHere > 0.5
      if (!nearRamp) sim.exiting = false
      else if (sim.steer > 0.25) sim.exiting = true
      sim.ramp = sim.exiting ? rampHere : 0
      sim.drop = sim.exiting ? rampDropAt(sim.travel) : 0
    },
    [arriveAt, depart]
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
      sim.ramp = rampAt(sim.travel)
      sim.drop = rampDropAt(sim.travel)
      sim.speed = 0
      sim.parked = true
      sim.autopilot = false
      sim.throttleLock = sim.throttle > 0
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
      depart(sim.target)
    }
    if (reducedMotion) {
      goTo(sim.target)
      return
    }
    sim.autopilot = true
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
