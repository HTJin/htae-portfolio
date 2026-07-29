import * as Icons from '@/components/Icons'
import {
  AnimatedBlock,
  ContentSection,
} from '@/components/content/ContentArticle'
import { skills } from '@/content/skills'

const iconMap = {
  CodeBracket: Icons.CodeBracket,
  BookOpen: Icons.BookOpen,
  CircleStack: Icons.CircleStack,
  WrenchScrewdriver: Icons.WrenchScrewdriver,
  VersionControl: Icons.VersionControl,
  GlobeAlt: Icons.GlobeAlt,
  AgileDiscipline: Icons.AgileDiscipline,
}

export function SkillsSection() {
  return (
    <ContentSection id="skills">
      <AnimatedBlock>
        <h2 className="text-2xl dark:text-yellow-200">Skills</h2>
      </AnimatedBlock>

      {skills.map((group) => {
        const Icon = iconMap[group.icon]

        return (
          <div key={group.id}>
            <AnimatedBlock animation="zoom-in-right">
              <h3>
                {Icon ? <Icon /> : null}
                {group.title}
              </h3>
            </AnimatedBlock>
            <AnimatedBlock animation="zoom-in-right">
              <div className="overflow-x-hidden text-sm">
                <div>{group.items}</div>
              </div>
            </AnimatedBlock>
          </div>
        )
      })}
    </ContentSection>
  )
}
