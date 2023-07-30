import { useState, useEffect, useCallback } from 'react'

export default function SideNav() {
  const [activeSection, setActiveSection] = useState('')

  const sections = ['skills', 'projects', 'experience', 'education']

  const checkActiveSection = useCallback(() => {
    const bottomOfPage =
      window.innerHeight + window.pageYOffset >= document.body.offsetHeight

    if (bottomOfPage) {
      setActiveSection('education')
      return
    }

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      const nextSection = sections[i + 1]
      const sectionElement = document.getElementById(section)
      const nextSectionElement = nextSection
        ? document.getElementById(nextSection)
        : null
      const rect = sectionElement.getBoundingClientRect()
      const nextRect = nextSectionElement
        ? nextSectionElement.getBoundingClientRect()
        : null
      if (
        rect.top < window.innerHeight &&
        (!nextRect || nextRect.top - 600 >= 0)
      ) {
        setActiveSection(section)
        return
      }
    }
    setActiveSection('')
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', checkActiveSection)
    return () => {
      window.removeEventListener('scroll', checkActiveSection)
    }
  }, [checkActiveSection])

  const goToSection = (sectionId) => {
    const sectionElement = document.getElementById(sectionId)

    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav
      className="fixed -right-[9.2rem] bottom-0 top-0 flex rotate-90"
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <a
            onClick={() => goToSection('skills')}
            className={`ml-1 text-sm font-medium ${
              activeSection === 'skills'
                ? 'text-sky-700 dark:text-sky-400'
                : 'text-gray-700 dark:text-gray-400'
            } hover:text-sky-700 dark:hover:text-sky-400 md:ml-2`}
          >
            Skills
          </a>
        </li>
        <li>
          <div className="flex items-center">
            <svg
              className="mx-1 h-3 w-3 text-gray-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 6 10"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 9 4-4-4-4"
              />
            </svg>
            <a
              onClick={() => goToSection('projects')}
              className={`ml-1 text-sm font-medium ${
                activeSection === 'projects'
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-gray-700 dark:text-gray-400'
              } hover:text-sky-700 dark:hover:text-sky-400 md:ml-2`}
            >
              Projects
            </a>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <svg
              className="mx-1 h-3 w-3 text-gray-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 6 10"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 9 4-4-4-4"
              />
            </svg>
            <a
              onClick={() => goToSection('experience')}
              className={`ml-1 text-sm font-medium ${
                activeSection === 'experience'
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-gray-700 dark:text-gray-400'
              } hover:text-sky-700 dark:hover:text-sky-400 md:ml-2`}
            >
              Experience
            </a>
          </div>
        </li>
        <li aria-current="page">
          <div className="flex items-center">
            <svg
              className="mx-1 h-3 w-3 text-gray-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 6 10"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 9 4-4-4-4"
              />
            </svg>
            <a
              onClick={() => goToSection('education')}
              className={`ml-1 text-sm font-medium ${
                activeSection === 'education'
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-gray-700 dark:text-gray-400'
              } hover:text-sky-700 dark:hover:text-sky-400 md:ml-2`}
            >
              Education
            </a>
          </div>
        </li>
      </ol>
    </nav>
  )
}
