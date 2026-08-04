import {
  AnimatedBlock,
  ContentSection,
} from '@/components/content/ContentArticle'
import { approach } from '@/content/approach'

/**
 * The heading lives inside ContentSection, matching SkillsSection. The shared
 * SectionIntro renders its title at x=0, which sits behind the fixed sidebar
 * on lg and wider, so the title would be invisible there.
 */
export function ApproachSection() {
  return (
    <ContentSection id={approach.id}>
      <AnimatedBlock>
        <h2 className="text-2xl dark:text-yellow-200">{approach.title}</h2>
      </AnimatedBlock>

      <AnimatedBlock>
        <p className="mt-2 text-base leading-7 text-gray-300">
          {approach.lead}
        </p>
      </AnimatedBlock>

      {/*
        These cards intentionally do not use AnimatedBlock: its
        `overflow-x-hidden` computes `overflow-y` to `auto`, and the AOS
        transform then overflows and puts a scrollbar on every card.
      */}
      <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {approach.items.map((item) => (
          <div
            key={item.id}
            data-aos="fade-up"
            className="h-full rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-sky-300/30"
          >
            <h3 className="font-display text-base font-semibold text-sky-300">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-300">{item.body}</p>
          </div>
        ))}
      </div>
    </ContentSection>
  )
}
