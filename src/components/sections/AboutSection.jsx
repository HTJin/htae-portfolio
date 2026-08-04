import {
  AnimatedBlock,
  ContentSection,
} from '@/components/content/ContentArticle'
import { about } from '@/content/about'

/**
 * The heading lives inside ContentSection, matching SkillsSection. The shared
 * SectionIntro renders its title at x=0, which sits behind the fixed sidebar
 * on lg and wider, so the title would be invisible there.
 */
export function AboutSection() {
  return (
    <ContentSection id={about.id}>
      <AnimatedBlock>
        <h2 className="text-2xl dark:text-yellow-200">{about.title}</h2>
      </AnimatedBlock>

      {about.paragraphs.map((paragraph) => (
        <AnimatedBlock key={paragraph.slice(0, 40)}>
          <p className="mt-4 text-base leading-7 text-gray-300">{paragraph}</p>
        </AnimatedBlock>
      ))}
    </ContentSection>
  )
}
