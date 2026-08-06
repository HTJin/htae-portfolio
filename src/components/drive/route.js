import { education, experience, meta, projects, skills } from '@/content'

/** Metres of tarmac between consecutive stops. */
export const LEG_LENGTH = 220
export const METERS_PER_MILE = 1609.34

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
