import { education, experience, meta, projects, skills } from '@/content'

/** Metres of tarmac between consecutive stops. */
export const LEG_LENGTH = 220
export const METERS_PER_MILE = 1609.34

const byDateAscending = (a, b) => new Date(a.date) - new Date(b.date)

function yearOf(date) {
  return date ? String(new Date(date).getFullYear()) : ''
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
      },
      { label: 'LinkedIn', href: meta.links.linkedin, external: true },
      { label: 'Download résumé', href: meta.resumePath, external: true },
      { label: 'Back to the classic site', href: '/', external: false },
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
