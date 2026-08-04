import { SparkleIcon } from '@/components/Icons'
import { Drawer } from '@/components/Drawer'
import {
  AnimatedBlock,
  ContentArticle,
  SectionIntro,
} from '@/components/content/ContentArticle'
import { experience } from '@/content/experience'

function ExperienceEntry({ entry }) {
  // Deduped: a remote role has location and workMode both set to "Remote",
  // which rendered as "3FGolf | Remote | Remote" on the live site.
  const locationLine = [
    ...new Set([entry.company, entry.location, entry.workMode].filter(Boolean)),
  ].join(' | ')

  return (
    <ContentArticle id={entry.id} date={entry.date}>
      <AnimatedBlock>
        <h2>{entry.title}</h2>
      </AnimatedBlock>

      {/*
        entry.lead is a date range ("Dec 2025 - Present"), which is not a
        heading. As an <h4> after the <h2> title it skipped a level nine
        times over, and then went back up to <h3> for the company line.
        Rendered as a <p> the outline is h2 -> h3 with no skip; the classes
        reproduce the typography h4 rules exactly (font-display, 600, 14px,
        24px line-height, heading colour) plus its 2rem top margin.
      */}
      {entry.lead ? (
        <AnimatedBlock className="-mb-8">
          <p className="mt-8 font-display text-sm font-semibold leading-6 text-[color:var(--typography-headings)]">
            {entry.lead}
          </p>
        </AnimatedBlock>
      ) : null}

      <AnimatedBlock className="-mb-4">
        <h3>
          <SparkleIcon className="h-4 w-4" />
          {locationLine}
        </h3>
      </AnimatedBlock>

      {entry.bullets?.map((bullet) => (
        <AnimatedBlock key={bullet} className="-mb-4">
          <p>- {bullet}</p>
        </AnimatedBlock>
      ))}

      {entry.drawer ? (
        <AnimatedBlock animation="flip-down" className="-mb-10 mt-8">
          <Drawer>
            {entry.drawer.map((paragraph) => (
              <AnimatedBlock key={paragraph.slice(0, 32)}>
                <p className="mb-[1ch] mt-[1ch] indent-6 leading-7">
                  {paragraph}
                </p>
              </AnimatedBlock>
            ))}
          </Drawer>
        </AnimatedBlock>
      ) : null}
    </ContentArticle>
  )
}

export function ExperienceSection() {
  return (
    <>
      <SectionIntro id="experience" title="Experience" />
      {experience.map((entry) => (
        <ExperienceEntry key={entry.id} entry={entry} />
      ))}
    </>
  )
}
