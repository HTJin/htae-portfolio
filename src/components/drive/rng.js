/**
 * Seeded PRNG for drive geometry / itinerary (st025 / st023 / st024).
 * Zero-dep Mulberry32. Never use Math.random for route geometry: same seed
 * must replay the same sequence.
 *
 * Algorithm: tommyettinger mulberry32 (public domain / widely MIT-copied).
 */

/** @param {number} seed uint32-ish integer */
export function mulberry32(seed) {
  let t = seed >>> 0
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Uniform integer in [1, 99] inclusive from a [0,1) draw (itinerary miles). */
export function legMilesFromU01(u01) {
  return Math.floor(u01 * 99) + 1
}

/**
 * Stable uint32 seed from ordered stop ids (content-derived, no browser entropy).
 * @param {string[]} ids
 */
export function seedFromStopIds(ids) {
  let h = 0x811c9dc5
  const raw = ids.join('\0')
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Draw one integer mile per consecutive pair.
 * @param {number} seed
 * @param {number} legCount
 * @returns {number[]}
 */
export function drawLegMiles(seed, legCount) {
  const next = mulberry32(seed)
  const miles = []
  for (let i = 0; i < legCount; i += 1) {
    miles.push(legMilesFromU01(next()))
  }
  return miles
}

/** Length fraction band (Q023 / band-at-current-scale). */
export const RAMP_FRAC_MIN = 0.25
export const RAMP_FRAC_MAX = 0.4

/** Lateral extras past carriageway (metres). */
export const RAMP_EXTRA_MIN = 12
export const RAMP_EXTRA_MAX = 35

/** Separate axis streams so length and offset never share one draw. */
const LENGTH_SALT = 0x4c454e47
const OFFSET_SALT = 0x4f464653

/**
 * Along-s length from a fraction draw, clamped under half a leg.
 * @param {number} u01
 * @param {number} legLength
 */
export function rampLengthFromU01(u01, legLength) {
  const fraction = RAMP_FRAC_MIN + u01 * (RAMP_FRAC_MAX - RAMP_FRAC_MIN)
  const raw = fraction * legLength
  const hardMax = legLength / 2 - 0.05
  return Math.min(raw, hardMax)
}

/**
 * Peak lateral offset from carriageway extras.
 * @param {number} u01
 * @param {number} carriageway
 */
export function rampOffsetFromU01(u01, carriageway) {
  const extra = RAMP_EXTRA_MIN + u01 * (RAMP_EXTRA_MAX - RAMP_EXTRA_MIN)
  return carriageway + extra
}

/**
 * Per-stop ramp geometry as one `{ length, offset, dropHold }` struct.
 * Safer than parallel arrays or decorating stop content objects: one table,
 * two salted streams, pairwise mainline-gap repair.
 *
 * @param {number} seed
 * @param {number} stopCount
 * @param {number|((index: number) => number)} legLengthOrAt
 * @param {{ carriageway: number, laneOffset: number, rampWidth: number, bankTopOffset: number }} dims
 * @returns {{ length: number, offset: number, dropHold: number }[]}
 */
export function drawRampGeometry(seed, stopCount, legLengthOrAt, dims) {
  const legAt =
    typeof legLengthOrAt === 'function' ? legLengthOrAt : () => legLengthOrAt

  const lengthNext = mulberry32((seed ^ LENGTH_SALT) >>> 0)
  const offsetNext = mulberry32((seed ^ OFFSET_SALT) >>> 0)
  const holdNum =
    dims.bankTopOffset - dims.laneOffset + dims.rampWidth / 2 + 1.2

  const table = []
  for (let i = 0; i < stopCount; i += 1) {
    const legLength = legAt(i)
    const length = rampLengthFromU01(lengthNext(), legLength)
    const offset = rampOffsetFromU01(offsetNext(), dims.carriageway)
    const dropHold = Math.min(0.9, holdNum / offset)
    table.push({ length, offset, dropHold })
  }

  // Pairwise: entrance out of i + exit into i+1 must leave open mainline.
  for (let i = 0; i < stopCount - 1; i += 1) {
    const leg = legAt(i + 1)
    const pair = table[i].length + table[i + 1].length
    if (pair >= leg) {
      const scale = (leg * (1 - 1e-4)) / pair
      table[i] = { ...table[i], length: table[i].length * scale }
      table[i + 1] = {
        ...table[i + 1],
        length: table[i + 1].length * scale,
      }
    }
  }

  return table
}
