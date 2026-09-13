import { useState, useEffect, useCallback } from 'react'

const sections = ['skills', 'experience', 'projects', 'education']

export default function SideNav() {
  const [activeSection, setActiveSection] = useState('')

  const checkActiveSection = useCallback(() => {
    const bottomOfPage =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 2

    if (bottomOfPage) {
      setActiveSection('education')
      return
    }

    // The active section is the last one whose heading has crossed 40% of the
    // viewport. The previous rule used a fixed 600px, which on a 768px-tall laptop
    // lit the next section while its heading was still 78% of the way down.
    const line = window.innerHeight * 0.4
    let current = sections[0]
    for (const section of sections) {
      const el = document.getElementById(section)
      if (el && el.getBoundingClientRect().top <= line) current = section
    }
    setActiveSection(current)
  }, [])

  useEffect(() => {
    checkActiveSection()
    window.addEventListener('scroll', checkActiveSection, { passive: true })
    window.addEventListener('resize', checkActiveSection)
    return () => {
      window.removeEventListener('scroll', checkActiveSection)
      window.removeEventListener('resize', checkActiveSection)
    }
  }, [checkActiveSection])

  const goToSection = (event, sectionId) => {
    event.preventDefault()
    const sectionElement = document.getElementById(sectionId)

    if (sectionElement) {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
      sectionElement.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
      })
      setTimeout(() => {
        // Re-check active section after the scroll has completed
        checkActiveSection()
      }, 1000)
    }
  }

  return (
    <nav
      className="fixed -right-[9.2rem] top-[50%] flex h-fit rotate-90 lg:-right-[9.8rem]"
      aria-label="Sections"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {sections.map((section, index) => (
          <li className="inline-flex items-center" key={section}>
            {index !== 0 && (
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
            )}
            <a
              href={`#${section}`}
              onClick={(event) => goToSection(event, section)}
              aria-current={activeSection === section ? 'location' : undefined}
              className={`ml-1 rounded-sm text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 md:ml-2 ${
                activeSection === section
                  ? 'font-semibold text-sky-700 dark:text-sky-400'
                  : 'font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
