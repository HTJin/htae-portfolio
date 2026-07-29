import { Projects } from '@/components/Projects'
import {
  AnimatedBlock,
  ContentSection,
  SectionIntro,
} from '@/components/content/ContentArticle'

export function ProjectsSection() {
  return (
    <>
      <SectionIntro id="projects" title="Projects" />
      <ContentSection id="few-projects-ive-tinkered-with">
        <AnimatedBlock>
          <h2 className="flex flex-col text-3xl dark:text-yellow-200 lg:flex-row lg:whitespace-nowrap">
            <span className="mr-[.5ch]">
              Few Projects I&apos;ve tinkered with
            </span>
            <span>. . .</span>
          </h2>
        </AnimatedBlock>
        <Projects />
      </ContentSection>
    </>
  )
}
