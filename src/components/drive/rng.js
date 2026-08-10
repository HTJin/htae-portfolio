/**
 * Zero-dep Mulberry32 PRNG for drive seeded draws (st025 miles / st023 ramps).
 *
 * Not used for Sky / engineAudio noise; those keep their own LCGs.
 * Never use non-seeded Math.random for geometry or mile labels: same seed must replay.
 *
 * Reference shape: https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 */

/** @param {number} seed unsigned 32-bit-ish integer */
export function mulberry32(seed) {
  let t = seed >>> 0
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Integer in [min, max] inclusive from a u01 draw. */
export function intInclusive(u01, min, max) {
  return Math.floor(u01 * (max - min + 1)) + min
}

/**
 * FNV-1a 32-bit hash of a string → seed for Mulberry32.
 * Content-derived so ordered stop ids produce a stable sequence without storage.
 */
export function hashSeed(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
