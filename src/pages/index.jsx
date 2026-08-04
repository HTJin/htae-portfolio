import { SkillsSection } from '@/components/sections/SkillsSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { ExperienceSection } from '@/components/sections/ExperienceSection'
import { ApproachSection } from '@/components/sections/ApproachSection'
import { EducationSection } from '@/components/sections/EducationSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { Layout } from '@/components/Layout'
import { generateRssFeed } from '@/lib/generateRssFeed'

export default function HomePage() {
  return (
    <Layout>
      <SkillsSection />
      <ExperienceSection />
      <ApproachSection />
      <ProjectsSection />
      <EducationSection />
      <AboutSection />
    </Layout>
  )
}

export async function getStaticProps() {
  if (process.env.NODE_ENV === 'production') {
    await generateRssFeed()
  }
  return { props: {} }
}
