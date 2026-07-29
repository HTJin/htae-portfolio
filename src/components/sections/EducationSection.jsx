import { IconLink } from '@/components/IconLink'
import { AcademicCap, CheckBadge } from '@/components/Icons'
import {
  AnimatedBlock,
  ContentArticle,
  SectionIntro,
} from '@/components/content/ContentArticle'
import { education } from '@/content/education'

export function EducationSection() {
  return (
    <>
      <SectionIntro id="education" title="Education" />
      <ContentArticle id="university-of-pittsburgh" date={education.date}>
        <AnimatedBlock>
          <h2 className="flex items-center text-[.9em]">
            <AcademicCap />
            <span className="w-[1ch]" />
            {education.school} | {education.location}
          </h2>
        </AnimatedBlock>

        <AnimatedBlock className="-mb-4">
          <p>{education.degree}</p>
        </AnimatedBlock>

        <AnimatedBlock>
          <div className="overflow-hidden">
            <div className="flex flex-col">
              Certifications:
              {education.certifications.map((cert) => (
                <IconLink
                  key={cert.label}
                  href={cert.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={CheckBadge}
                  className="w-fit whitespace-nowrap"
                >
                  {cert.label}
                </IconLink>
              ))}
            </div>
          </div>
        </AnimatedBlock>
      </ContentArticle>
    </>
  )
}
