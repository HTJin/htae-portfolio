import { useState, useEffect, useCallback } from 'react'

export default function SideNav() {
  const [activeSection, setActiveSection] = useState('')

  const sections = ['skills', 'projects', 'experience', 'education']

  const checkActiveSection = useCallback(() => {
    const bottomOfPage =
      window.innerHeight + window.scrollY >= document.body.offsetHeight

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
      className="fixed -right-[9.2rem] lg:-right-[9.8rem] top-[50%] flex h-fit rotate-90"
      aria-label="Breadcrumb"
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
              onClick={() => goToSection(section)}
              className={`ml-1 cursor-pointer text-sm font-medium ${
                activeSection === section
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-gray-700 dark:text-gray-400'
              } hover:text-sky-700 dark:hover:text-sky-400 md:ml-2`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
