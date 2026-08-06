/**
 * The light changes as you drive. The route is a career in chronological
 * order, so the drive should pass *time*, not just distance.
 *
 * Deliberately not a full day cycle: the art is night-tuned (stars, a moon,
 * sodium lamp glow, neon HUD) and a washed-out midday would wreck it. This is
 * a narrow, rich band instead — golden-hour dusk at MILE 0, deepening twilight
 * across the career highway, full night by the toolbox, and the first hint of
 * dawn at the destination. The dawn is the point: the last stop is the one
 * that asks about what comes next.
 */

const rgb = (r, g, b) => [r, g, b]

/**
 * Keyframes along the route. `at` is the fraction of the route travelled;
 * every field is interpolated between the two neighbouring keyframes.
 */
const KEYFRAMES = [
  {
    at: 0, // golden hour — pulling onto the highway
    skyTop: rgb(18, 32, 66),
    skyUpper: rgb(46, 58, 102),
    skyLower: rgb(140, 86, 92),
    skyHorizon: rgb(226, 140, 84),
    glow: rgb(255, 170, 96),
    glowAlpha: 0.3,
    skyline: rgb(38, 28, 44),
    starOpacity: 0,
    moonOpacity: 0.12,
    groundFar: rgb(38, 34, 40),
    groundNear: rgb(16, 13, 15),
    vergeDark: rgb(44, 34, 32),
    vergeLight: rgb(66, 50, 44),
    tarmacFar: rgb(58, 52, 54),
    tarmacNear: rgb(32, 28, 30),
    paint: rgb(250, 244, 236),
    centreLine: rgb(252, 214, 118),
    lamp: rgb(255, 226, 176),
    lampAlpha: 0.15,
    haze: rgb(196, 122, 84),
    hazeAlpha: 0.75,
    signFace: rgb(22, 96, 62),
  },
  {
    at: 0.38, // civil twilight — the middle of the career highway
    skyTop: rgb(10, 18, 44),
    skyUpper: rgb(26, 36, 78),
    skyLower: rgb(72, 58, 110),
    skyHorizon: rgb(168, 96, 110),
    glow: rgb(214, 132, 150),
    glowAlpha: 0.26,
    skyline: rgb(24, 20, 40),
    starOpacity: 0.35,
    moonOpacity: 0.5,
    groundFar: rgb(26, 28, 42),
    groundNear: rgb(11, 11, 17),
    vergeDark: rgb(28, 27, 40),
    vergeLight: rgb(44, 44, 60),
    tarmacFar: rgb(40, 40, 50),
    tarmacNear: rgb(24, 23, 29),
    paint: rgb(242, 240, 244),
    centreLine: rgb(250, 224, 140),
    lamp: rgb(255, 220, 164),
    lampAlpha: 0.55,
    haze: rgb(96, 74, 110),
    hazeAlpha: 0.85,
    signFace: rgb(20, 92, 60),
  },
  {
    at: 0.68, // deep twilight — the side builds
    skyTop: rgb(4, 8, 20),
    skyUpper: rgb(10, 20, 48),
    skyLower: rgb(20, 44, 84),
    skyHorizon: rgb(38, 80, 120),
    glow: rgb(70, 150, 220),
    glowAlpha: 0.24,
    skyline: rgb(10, 20, 38),
    starOpacity: 0.82,
    moonOpacity: 0.9,
    groundFar: rgb(14, 24, 40),
    groundNear: rgb(7, 9, 15),
    vergeDark: rgb(13, 28, 44),
    vergeLight: rgb(20, 40, 60),
    tarmacFar: rgb(29, 34, 43),
    tarmacNear: rgb(21, 24, 30),
    paint: rgb(235, 243, 251),
    centreLine: rgb(250, 228, 146),
    lamp: rgb(255, 216, 152),
    lampAlpha: 0.9,
    haze: rgb(14, 40, 70),
    hazeAlpha: 0.92,
    signFace: rgb(18, 96, 60),
  },
  {
    at: 0.92, // full night — the toolbox. This is the original palette.
    skyTop: rgb(3, 6, 13),
    skyUpper: rgb(6, 18, 36),
    skyLower: rgb(11, 36, 64),
    skyHorizon: rgb(20, 64, 95),
    glow: rgb(56, 189, 248),
    glowAlpha: 0.22,
    skyline: rgb(6, 18, 34),
    starOpacity: 1,
    moonOpacity: 1,
    groundFar: rgb(10, 21, 38),
    groundNear: rgb(4, 7, 13),
    vergeDark: rgb(11, 26, 43),
    vergeLight: rgb(16, 36, 56),
    tarmacFar: rgb(27, 32, 41),
    tarmacNear: rgb(20, 23, 29),
    paint: rgb(233, 241, 250),
    centreLine: rgb(250, 226, 140),
    lamp: rgb(255, 214, 150),
    lampAlpha: 1,
    haze: rgb(12, 34, 60),
    hazeAlpha: 0.95,
    signFace: rgb(18, 96, 60),
  },
  {
    at: 1, // first light — "you have arrived", and what comes next
    skyTop: rgb(5, 10, 22),
    skyUpper: rgb(10, 26, 50),
    skyLower: rgb(26, 62, 96),
    skyHorizon: rgb(122, 152, 172),
    glow: rgb(186, 214, 236),
    glowAlpha: 0.32,
    skyline: rgb(10, 24, 42),
    starOpacity: 0.6,
    moonOpacity: 0.7,
    groundFar: rgb(16, 28, 44),
    groundNear: rgb(6, 9, 15),
    vergeDark: rgb(14, 30, 46),
    vergeLight: rgb(22, 44, 64),
    tarmacFar: rgb(34, 40, 50),
    tarmacNear: rgb(23, 26, 33),
    paint: rgb(240, 246, 252),
    centreLine: rgb(250, 228, 150),
    lamp: rgb(255, 220, 164),
    lampAlpha: 0.6,
    haze: rgb(96, 126, 152),
    hazeAlpha: 0.85,
    signFace: rgb(20, 100, 64),
  },
]

const COLOR_KEYS = [
  'skyTop',
  'skyUpper',
  'skyLower',
  'skyHorizon',
  'glow',
  'skyline',
  'groundFar',
  'groundNear',
  'vergeDark',
  'vergeLight',
  'tarmacFar',
  'tarmacNear',
  'paint',
  'centreLine',
  'lamp',
  'haze',
  'signFace',
]

const SCALAR_KEYS = [
  'glowAlpha',
  'starOpacity',
  'moonOpacity',
  'lampAlpha',
  'hazeAlpha',
]

/**
 * One palette object, mutated in place. The canvas paints 60 times a second —
 * allocating a fresh palette (and fresh colour strings) every frame would put
 * real pressure on the collector for no benefit.
 */
const palette = {}
COLOR_KEYS.forEach((key) => {
  palette[key] = 'rgb(0, 0, 0)'
})
SCALAR_KEYS.forEach((key) => {
  palette[key] = 0
})

// Progress is quantised before the strings are rebuilt: the eye cannot see a
// 1/360th step of a dusk-to-night fade, but the allocator can feel it.
const STEPS = 360
let builtStep = -1

function lerp(a, b, t) {
  return a + (b - a) * t
}

function css(from, to, t) {
  return `rgb(${Math.round(lerp(from[0], to[0], t))}, ${Math.round(
    lerp(from[1], to[1], t)
  )}, ${Math.round(lerp(from[2], to[2], t))})`
}

export function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

/**
 * The palette at a point along the route. Returns the shared object — read it,
 * don't keep it.
 */
export function paletteAt(progress) {
  const p = clamp01(progress)
  const step = Math.round(p * STEPS)
  if (step === builtStep) return palette
  builtStep = step

  const quantised = step / STEPS
  let index = 0
  while (index < KEYFRAMES.length - 2 && quantised > KEYFRAMES[index + 1].at) {
    index += 1
  }

  const from = KEYFRAMES[index]
  const to = KEYFRAMES[index + 1]
  const span = to.at - from.at
  const t = span <= 0 ? 0 : clamp01((quantised - from.at) / span)

  for (const key of COLOR_KEYS) {
    palette[key] = css(from[key], to[key], t)
  }
  for (const key of SCALAR_KEYS) {
    palette[key] = Number(lerp(from[key], to[key], t).toFixed(4))
  }

  return palette
}

/** `rgb(1, 2, 3)` -> `rgba(1, 2, 3, alpha)`, for the haze and glow layers. */
export function withAlpha(color, alpha) {
  return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
}
