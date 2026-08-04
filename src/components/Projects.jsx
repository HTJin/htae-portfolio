import { useState } from 'react'
import { projects } from '@/content/projects'
import { IconLink } from './IconLink'
import { GitHubIcon } from './Intro'
import { OpenIcon } from './Icons'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import styles from '../styles/badges.module.css'

const PROJECT_IMAGE_SIZES =
  '(min-width: 1024px) 36rem, (min-width: 640px) 32rem, 100vw'

function Badge({ tech }) {
  const techToColor = {
    React: styles.bgBlue,
    Typescript: styles.bgIndigo,
    Vue: styles.bgGreen,
    Flask: styles.bgOrange,
    Jinja: styles.bgAmber,
    SQLAlchemy: styles.bgPink,
    Javascript: styles.bgYellow,
    Render: styles.bgEmerald,
    Redux: styles.bgPurple,
    HTML: styles.bgRed,
    SASS: styles.bgPink,
    CSS: styles.bgPurple,
    TailwindCSS: styles.bgSky,
    Python: styles.bgBlue,
    PostgreSQL: styles.bgIndigo,
    Firebase: styles.bgPink,
    'Material-UI': styles.bgViolet,
    Vercel: styles.bgBlack,
    NextJS: styles.bgBlack,
    Supabase: styles.bgGreen,
  }
  const colorClass = techToColor[tech]

  return (
    <span
      className={`${colorClass} mb-2 mr-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset`}
    >
      {tech}
    </span>
  )
}

function Project({
  name,
  title,
  description,
  technologies,
  screenshots,
  github,
  site,
}) {
  const [currentScreenshot, setCurrentScreenshot] = useState(
    '/images/projects/' + name + screenshots[0]
  )
  const [nextScreenshot, setNextScreenshot] = useState('')

  const handleScreenshotClick = () => {
    const currentImage = currentScreenshot.replace(
      '/images/projects/' + name,
      ''
    )
    const currentIndex = screenshots.indexOf(currentImage)
    const nextIndex = (currentIndex + 1) % screenshots.length
    setNextScreenshot('/images/projects/' + name + screenshots[nextIndex])
    setCurrentScreenshot('/images/projects/' + name + screenshots[nextIndex])
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-xl overflow-hidden lg:mx-0">
      <div className="min-w-0 overflow-hidden">
        <div data-aos="fade-left">
          <div className="flex min-w-0 items-end gap-2">
            <h2 className="min-w-0">{title}</h2>
            <div className="ml-auto flex shrink-0">
              {/*
                These links render an icon and no text, so without an
                aria-label a screen reader announces only the raw URL.
              */}
              <IconLink
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                icon={GitHubIcon}
                aria-label={`${title} — source on GitHub`}
                className="flex flex-col justify-center"
              />
              <IconLink
                href={site}
                target="_blank"
                rel="noopener noreferrer"
                icon={OpenIcon}
                aria-label={`${title} — live site`}
                className="flex flex-col justify-center"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="relative aspect-video w-full min-w-0 !max-w-xl overflow-hidden">
        <div className="absolute inset-0 min-w-0 max-w-full" data-aos="fade-up">
          <button
            type="button"
            onClick={handleScreenshotClick}
            className="relative block h-full w-full min-w-0 max-w-full p-0 transition-opacity duration-500 ease-in-out focus:outline-none"
          >
            <AnimatePresence
              mode="wait"
              onExitComplete={() => setCurrentScreenshot(nextScreenshot)}
            >
              <motion.div
                key={currentScreenshot}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative h-full w-full min-w-0"
              >
                <Image
                  src={currentScreenshot}
                  alt={name}
                  fill
                  sizes={PROJECT_IMAGE_SIZES}
                  className="max-w-full cursor-pointer rounded-lg object-cover shadow-lg"
                  style={{ maxWidth: '100%' }}
                />
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>
      <div className="min-w-0 overflow-hidden">
        <div data-aos="fade-left">
          {technologies.map((tech) => (
            <Badge key={tech} tech={tech} />
          ))}
        </div>
      </div>
      <div className="min-w-0 overflow-hidden">
        <div data-aos="fade-left">
          <p>{description}</p>
        </div>
      </div>
    </div>
  )
}

export function Projects() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-xl lg:mx-0">
      {projects.map((project) => (
        <Project key={project.name} {...project} />
      ))}
    </div>
  )
}
