import { education, experience, meta, projects, skills } from '@/content'
import { CARRIAGEWAY, LANE_OFFSET, clamp } from './world'

/**
 * Metres of tarmac between consecutive stops.
 *
 * Raised from 220 in cycle 58 to buy room for a much longer ramp: the exit has
 * to be long enough to read as a real interchange rather than a kink, and the
 * two ramps either side of a stop still have to leave a stretch of open
 * mainline between them. At 420 with ramps at 0.4 of a leg, that stretch is
 * 84m — 80% of the leg is ramp, and you still get back on the highway.
 */
export const LEG_LENGTH = 420
export const METERS_PER_MILE = 1609.34

/**
 * Exit and entrance ramps.
 *
 * Every stop is a real interchange: you leave the mainline on a deceleration
 * ramp, park on it while the panel is open, and rejoin on an acceleration ramp.
 * The two are the same shape mirrored about the stop, so one function describes
 * both.
 *
 * `RAMP_LENGTH` is derived from `LEG_LENGTH` rather than typed, because the two
 * quantities have to agree about something neither can see: the entrance ramp
 * out of one exit must finish before the exit ramp into the next one starts, or
 * the road never returns to the mainline and the "highway" is just a slalom. At
 * 0.4 of a leg each, the middle 20% of every leg is mainline. (Same lesson as
 * `MARKER_SPACING` in cycle 32 — a constant that must match another constant
 * gets computed from it.)
 */
export const RAMP_LENGTH = LEG_LENGTH * 0.4
/**
 * How far right of the mainline lane the ramp has carried you at the stop.
 *
 * Was `CARRIAGEWAY + 2.7`, which cleared the highway by a couple of metres —
 * enough to be a separate ribbon of tarmac, not enough to feel like you had
 * left. At `CARRIAGEWAY + 22` the stop sits well clear
 * of the running lanes, with the gore opening into real verge between them.
 */
export const RAMP_OFFSET = CARRIAGEWAY + 22
/** The ramp is a single lane, centred on the car. */
export const RAMP_WIDTH = 4.4

/**
 * How far the ramp falls below the mainline grade at the stop.
 *
 * An off-ramp that only moves sideways reads as a lane change. Real ones fall
 * away down an embankment and climb back to merge, so the exit goes downhill
 * and the entrance comes back up.
 *
 * This was capped at `CAM_HEIGHT * 0.85` for one cycle, because the renderer
 * could not cope with more: screen height is `CAM_HEIGHT + drop − hillAt(s)`,
 * so once `drop` passed eye height the whole mainline lifted above the horizon
 * and painted as a wedge of tarmac across the sky. Measured at 6.5m — the
 * highway hung over the windscreen.
 *
 * That is fixed properly now rather than avoided. `RoadCanvas` clips **flat
 * surfaces** at the eyeline (a horizontal plane above your eye cannot be seen)
 * while leaving standing objects alone, and fills the gap with an embankment
 * face between the two grades. So the drop is free to be a real one.
 */
export const RAMP_DROP = 5.5

/**
 * The offset at which the ramp is clear of the mainline entirely — its inner
 * edge is past the carriageway's outer edge. Before this the ramp is still a
 * deceleration lane *inside* the carriageway and carries no markings of its
 * own; after it, it is a separate road and gets its own edge lines.
 */
export const RAMP_SEPARATES = CARRIAGEWAY - LANE_OFFSET + RAMP_WIDTH / 2

/** Smoothstep: zero slope at both ends, so the ramp meets the mainline flush. */
function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

/**
 * How far the ramp has carried the road off the mainline at world position `s`.
 *
 * Zero on the open highway, `RAMP_OFFSET` at a stop. Keyed off the *object's*
 * own position, never the camera's, so the road does not change shape as you
 * approach it (guardrail 17).
 */
export function rampAt(s) {
  return RAMP_OFFSET * rampProgress(s)
}

/**
 * How far the ramp has fallen below the mainline grade at `s`. Negative, since
 * the exit runs downhill. Shares `rampProgress` with the lateral offset, so the
 * ramp cannot start turning before it starts descending, or level out while
 * still curving — the two are the same ramp.
 */
export function rampDropAt(s) {
  return -RAMP_DROP * rampProgress(s)
}

/** 0 on the open mainline, 1 at a stop; smoothstepped, so both ends are flush. */
function rampProgress(s) {
  const index = clamp(Math.round(s / LEG_LENGTH), 0, ROUTE_LAST)
  const distance = Math.abs(s - index * LEG_LENGTH)
  if (distance >= RAMP_LENGTH) return 0
  return smoothstep(1 - distance / RAMP_LENGTH)
}

const byDateAscending = (a, b) => new Date(a.date) - new Date(b.date)

/**
 * The calendar year a content date belongs to.
 *
 * Deliberately not `new Date(date).getFullYear()`. The content dates are plain
 * `YYYY-MM-DD` strings, which `Date` parses as UTC midnight and `getFullYear`
 * then reads back in local time — so in any timezone behind UTC a January 1st
 * date reports the *previous* year. That silently moved the StarPlus UI/UX role
 * ('2024-01-01', whose own label reads "Jan 2024 - Oct 2024") to 2023. Putting
 * a wrong year on someone's résumé is the worst bug this page could ship, so
 * the year is read straight off the string.
 */
function yearNumber(date) {
  if (!date) return null
  const iso = /^(\d{4})-\d{2}-\d{2}/.exec(String(date))
  if (iso) return Number(iso[1])
  const parsed = new Date(date).getUTCFullYear()
  return Number.isFinite(parsed) ? parsed : null
}

function yearOf(date) {
  const year = yearNumber(date)
  return year === null ? '' : String(year)
}

function originStop() {
  return {
    id: 'origin',
    kind: 'origin',
    leg: 'Start line',
    signTitle: 'Now leaving',
    signSub: 'the résumé page',
    title: meta.name,
    subtitle: meta.role,
    paragraphs: [meta.tagline],
    hint: 'Hold the accelerator to pull onto the highway.',
    links: [
      { label: 'LinkedIn', href: meta.links.linkedin, external: true },
      { label: 'GitHub', href: meta.links.github, external: true },
      { label: 'Résumé (PDF)', href: meta.resumePath, external: true },
    ],
  }
}

function educationStop() {
  return {
    id: 'education',
    kind: 'education',
    leg: 'School zone',
    year: yearNumber(education.date),
    signTitle: education.school,
    signSub: yearOf(education.date),
    title: education.school,
    subtitle: education.degree,
    meta: [education.location, yearOf(education.date)]
      .filter(Boolean)
      .join(' · '),
    paragraphs: ['Where the whole route started.'],
    links: education.certifications.map((certification) => ({
      label: `${certification.label} certificate`,
      href: certification.href,
      external: true,
    })),
  }
}

function experienceStops() {
  return [...experience].sort(byDateAscending).map((entry) => ({
    id: `experience-${entry.id}`,
    kind: 'experience',
    leg: 'Career highway',
    year: yearNumber(entry.date),
    signTitle: entry.company,
    signSub: entry.lead ?? yearOf(entry.date),
    title: entry.title,
    subtitle: entry.company,
    meta: [entry.lead, entry.location, entry.workMode]
      .filter(Boolean)
      .join(' · '),
    bullets: entry.bullets ?? [],
    paragraphs: entry.drawer ?? [],
  }))
}

function projectStops() {
  return projects.map((project) => {
    // Every capture the project ships, in order — the stop card cycles them.
    const images = (project.screenshots ?? []).map(
      (shot) => `/images/projects/${project.name}${shot}`
    )

    return {
      id: `project-${project.name}`,
      kind: 'project',
      leg: 'Scenic overlook',
      signTitle: project.title.split(' - ')[0],
      signSub: project.technologies.slice(0, 2).join(' · '),
      title: project.title,
      subtitle: 'Side build',
      paragraphs: [project.description],
      tags: project.technologies,
      images,
      image: images[0] ?? null,
      site: project.site ?? null,
      links: [
        project.site
          ? { label: 'Live site', href: project.site, external: true }
          : null,
        project.github
          ? { label: 'Source', href: project.github, external: true }
          : null,
      ].filter(Boolean),
    }
  })
}

function skillsStop() {
  return {
    id: 'skills',
    kind: 'skills',
    leg: 'Pit stop',
    signTitle: 'Toolbox',
    signSub: `${skills.length} bays`,
    title: 'Pit stop — the toolbox',
    subtitle: 'What is in the trunk',
    groups: skills,
  }
}

function destinationStop() {
  return {
    id: 'destination',
    kind: 'destination',
    leg: 'Destination',
    signTitle: 'You have arrived',
    signSub: 'Thanks for riding',
    title: 'You have arrived',
    subtitle: "Let's talk about where you are headed",
    paragraphs: [
      'That is the whole route: school, nine roles, the side builds, and the toolbox that came out of it. If any of it lines up with what you are hiring for, the next leg is a conversation.',
    ],
    links: [
      {
        label: `Email ${meta.email}`,
        href: `mailto:${meta.email}`,
        external: true,
        primary: true,
      },
      { label: 'LinkedIn', href: meta.links.linkedin, external: true },
      { label: 'Download résumé', href: meta.resumePath, external: true },
      {
        label: 'Back to the classic site',
        href: '/',
        external: false,
        quiet: true,
      },
    ],
  }
}

/**
 * The full itinerary, ordered as a drive: where it started, the career
 * highway in chronological order, the side builds, the toolbox, then the
 * destination. Each stop is pinned to a fixed world position.
 */
export const route = [
  originStop(),
  educationStop(),
  ...experienceStops(),
  ...projectStops(),
  skillsStop(),
  destinationStop(),
].map((stop, index, all) => ({
  ...stop,
  index,
  s: index * LEG_LENGTH,
  exitLabel: index === 0 ? 'MILE 0' : `EXIT ${String(index).padStart(2, '0')}`,
  isLast: index === all.length - 1,
}))

export const routeLength = (route.length - 1) * LEG_LENGTH

/**
 * The last stop's index, used by `rampAt` to clamp. Declared here rather than
 * beside `rampAt` because it needs `route`; `rampAt` is a hoisted function
 * declaration and is only ever *called* after this module has finished
 * evaluating, so the ordering is safe.
 */
const ROUTE_LAST = route.length - 1

/**
 * What the roadside looks like on each leg. Every mile used to carry identical
 * lamps and delineators, so you could not tell the school zone from the scenic
 * overlook without reading a sign. The furniture now varies, which makes where
 * you are legible at a glance.
 *
 * `lampEvery` thins the lamp line (1 = every mast, 3 = one in three).
 */
const ROADSIDE_BY_LEG = {
  'Start line': { lampEvery: 1, guardrail: false },
  'School zone': { lampEvery: 1, guardrail: false },
  'Career highway': { lampEvery: 1, guardrail: false },
  'Scenic overlook': { lampEvery: 2, guardrail: true },
  'Pit stop': { lampEvery: 1, guardrail: false },
  Destination: { lampEvery: 1, guardrail: false },
}

const DEFAULT_ROADSIDE = { lampEvery: 1, guardrail: false }

/**
 * Resolved once at module load, indexed by stop. The canvas paints this 60
 * times a second and must never build it per frame.
 */
const ROADSIDE = route.map((stop) => {
  const base = ROADSIDE_BY_LEG[stop.leg] ?? DEFAULT_ROADSIDE
  // The sabbatical really was a quiet stretch of road. Thin the lights out.
  if (stop.id === 'experience-sabbatical') {
    return { lampEvery: 3, guardrail: false }
  }
  return base
})

/**
 * The roadside style at a world position. Keyed off the object's own distance,
 * never the camera's, so a lamp does not change character as you approach it.
 */
export function roadsideAt(s) {
  const index = Math.round(s / LEG_LENGTH)
  if (index < 0) return ROADSIDE[0]
  if (index >= ROADSIDE.length) return ROADSIDE[ROADSIDE.length - 1]
  return ROADSIDE[index]
}

export function legsOf(stops) {
  return stops.reduce((legs, stop) => {
    const current = legs[legs.length - 1]
    if (current && current.name === stop.leg) {
      current.stops.push(stop)
      return legs
    }
    legs.push({ name: stop.leg, stops: [stop] })
    return legs
  }, [])
}

export function formatMiles(meters) {
  return (meters / METERS_PER_MILE).toFixed(1)
}

/**
 * The stops that carry a real date, in route order. Education and the nine
 * roles have one; the side builds, the toolbox and the destination do not, and
 * nothing here invents one for them.
 */
const DATED = route
  .filter((stop) => typeof stop.year === 'number')
  .map((stop) => ({ s: stop.s, year: stop.year }))

const LAST_DATED_S = DATED.length ? DATED[DATED.length - 1].s : 0

/**
 * The trip you just drove, in numbers — shown only at the destination.
 *
 * Every figure is derived from the content, never written down: the counts come
 * from the arrays themselves and the distance from the route's own length. Add
 * a role or a build and these follow automatically, which is the only way a
 * number on someone's résumé is safe to display (guardrail 13).
 */
export const tripSummary = [
  {
    label: 'Driving since',
    value: DATED.length ? String(DATED[0].year) : '—',
  },
  {
    label: 'Roles',
    value: String(route.filter((stop) => stop.kind === 'experience').length),
  },
  {
    label: 'Side builds',
    value: String(route.filter((stop) => stop.kind === 'project').length),
  },
  { label: 'Miles driven', value: formatMiles(routeLength) },
]

/**
 * What year you are driving through. Interpolates between dated stops so the
 * readout ticks over as you travel, and returns null past the last dated stop —
 * the caller shows "NOW" there rather than a fabricated year.
 */
export function yearAt(travel) {
  if (!DATED.length) return null
  if (travel >= LAST_DATED_S) return null
  if (travel <= DATED[0].s) return DATED[0].year

  for (let i = 0; i < DATED.length - 1; i += 1) {
    const from = DATED[i]
    const to = DATED[i + 1]
    if (travel < to.s) {
      const span = to.s - from.s
      const t = span <= 0 ? 0 : (travel - from.s) / span
      return Math.round(from.year + (to.year - from.year) * t)
    }
  }

  return null
}
