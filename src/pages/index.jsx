import { SkillsSection } from '@/components/sections/SkillsSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { ExperienceSection } from '@/components/sections/ExperienceSection'
import { EducationSection } from '@/components/sections/EducationSection'
import { Layout } from '@/components/Layout'
import { generateRssFeed } from '@/lib/generateRssFeed'

export default function HomePage() {
  return (
    <Layout>
      <SkillsSection />
      <ProjectsSection />
      <ExperienceSection />
      <EducationSection />
    </Layout>
  )
}

export async function getStaticProps() {
  if (process.env.NODE_ENV === 'production') {
    await generateRssFeed()
  }
  return { props: {} }
}
