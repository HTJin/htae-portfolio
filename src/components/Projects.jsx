import { useState } from 'react'
import { projects } from '../lib/projects'
import { IconLink } from './IconLink'
import { GitHubIcon } from './Intro'
import { OpenIcon } from './Icons'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import styles from '../styles/badges.module.css'

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
    <>
      <div className="overflow-x-hidden">
        <div data-aos="fade-left">
          <div className="flex items-end">
            <h2 className="whitespace-nowrap">{title}</h2>
            <div className="flex w-full justify-end">
              <IconLink
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                icon={GitHubIcon}
                className="flex flex-col justify-center"
              />
              <IconLink
                href={site}
                target="_blank"
                rel="noopener noreferrer"
                icon={OpenIcon}
                className="flex flex-col justify-center"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="relative h-[230px] overflow-hidden md:h-[260px] lg:h-[295px]">
        <div data-aos="fade-up">
          <button
            onClick={handleScreenshotClick}
            className="z-50 p-0 transition-opacity duration-500 ease-in-out focus:outline-none"
          >
            <AnimatePresence
              onExitComplete={() => setCurrentScreenshot(nextScreenshot)}
            >
              <motion.div
                key={currentScreenshot}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layoutId={`projectImage-${name}`}
                className="absolute inset-0"
              >
                <Image
                  src={currentScreenshot}
                  alt={name}
                  width={1896}
                  height={955}
                  sizes="(min-width: 1280px) 36rem, (min-width: 1024px) 45vw, (min-width: 640px) 32rem, 95vw"
                  className="cursor-pointer rounded-lg shadow-lg"
                />
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>
      <div className="overflow-x-hidden">
        <div data-aos="fade-left">
          {technologies.map((tech) => (
            <Badge key={tech} tech={tech} />
          ))}
        </div>
      </div>
      <div className="overflow-x-hidden">
        <div data-aos="fade-left">
          <p>{description}</p>
        </div>
      </div>
    </>
  )
}

export function Projects() {
  return projects.map((project) => <Project key={project.name} {...project} />)
}
