import React, { useState, useEffect } from 'react'
import clsx from 'clsx'

function ChevronUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="ml-2 inline-block h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="ml-2 inline-block h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function Drawer({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isContentVisible, setContentVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setContentVisible(true)
    } else {
      const timer = setTimeout(() => {
        setContentVisible(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <div>
      <button
        className="rounded-lg border border-sky-700 px-4 py-2 font-bold text-sky-700 transition-colors duration-300 hover:bg-sky-700 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-sky-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Close' : 'Details'}
        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-in-out',
          {
            'h-0': !isOpen,
            'h-[47.5rem]': isOpen,
          }
        )}
      >
        {isContentVisible && children}
      </div>
    </div>
  )
}
