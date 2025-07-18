import { useEffect, useState } from 'react'

export default function ResumePdf() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="h-screen w-full">
      <iframe
        src="/resume/Resume 2025 (Hyun-Tae Jin).pdf"
        className="h-full w-full border-0"
        title="Resume"
      />
    </div>
  )
}
