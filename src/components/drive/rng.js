/**
 * Seeded PRNG for itinerary display miles (st025). Zero-dep Mulberry32.
 * Never use Math.random for leg miles: same seed must replay the same sequence.
 *
 * Algorithm: https://gist.github.com/tommyettinger/46a874533244883189fc (public domain)
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

/** Uniform integer in [1, 99] inclusive from a [0,1) draw. */
export function legMilesFromU01(u01) {
  return Math.floor(u01 * 99) + 1
}

/**
 * Stable uint32 seed from ordered stop ids (content-derived, no browser entropy).
 * @param {string[]} ids
 */
export function seedFromStopIds(ids) {
  // FNV-1a 32-bit over joined ids so reordering content changes the seed.
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
