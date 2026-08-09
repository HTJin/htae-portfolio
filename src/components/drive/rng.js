/**
 * Zero-dep Mulberry32 for drive seeded draws (st025 miles / st023-st024 ramps).
 *
 * Never use Math.random for geometry or mile labels: same seed must replay.
 * Sky / engineAudio keep their own LCGs; this is the shared route helper.
 *
 * Reference: https://gist.github.com/tommyettinger/46a874533244883189fc (public domain)
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
 * FNV-1a 32-bit hash of a string -> seed for Mulberry32.
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
