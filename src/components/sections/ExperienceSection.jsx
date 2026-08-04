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

      {entry.lead ? (
        <AnimatedBlock className="-mb-8">
          <h4>{entry.lead}</h4>
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
