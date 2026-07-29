import { useId, useState } from 'react'
import { Button } from '@/components/Button'
import { meta } from '@/content'

export function SignUpForm() {
  let id = useId()
  const [email, setEmail] = useState('')

  const handleClick = (e) => {
    e.preventDefault()
    window.location.href = `mailto:${meta.email}?subject=${encodeURIComponent("Let's Talk")}&body=${encodeURIComponent(`From: ${email}`)}`
  }

  return (
    <form className="relative isolate mt-8 flex items-center pr-1">
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <input
        required
        type="email"
        autoComplete="email"
        name="email"
        id={id}
        placeholder="Your name / email / number"
        className="peer w-0 flex-auto rounded-lg border-transparent bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-transparent sm:text-[0.8125rem]/6"
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button className="" type="submit" arrow onClick={handleClick}>
        Let’s Talk
      </Button>
      <div className="absolute inset-0 -z-10 rounded-lg transition peer-focus:ring-4 peer-focus:ring-sky-300/15" />
      <div className="absolute inset-0 -z-10 rounded-lg bg-white/2.5 ring-1 ring-white/15 transition peer-focus:ring-sky-300" />
    </form>
  )
}
