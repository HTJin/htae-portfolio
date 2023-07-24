import { useState, useEffect } from 'react'
import { ChevronUpIcon } from './Drawer'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  return (
    <div className="flex flex-col">
      {isVisible && (
        <button
          type="button"
          className="fixed bottom-2 right-[50%] lg:right-[25%] z-50" // added right-5 and bg-blue-500
          onClick={() => scrollToTop()}
        >
          <ChevronUpIcon className="h-6 w-6 fill-white opacity-50 transition-opacity group-hover:opacity-100 lg:fill-gray-900 lg:dark:fill-white" />
        </button>
      )}
    </div>
  )
}
