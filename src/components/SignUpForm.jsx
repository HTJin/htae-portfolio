import { useId } from 'react'
import { useState } from 'react'
import { Button } from '@/components/Button'

export function SignUpForm() {
  let id = useId()
  const [email, setEmail] = useState('')

  const handleClick = (e) => {
    e.preventDefault()
    window.location.href = `mailto:hytaej@gmail.com?subject=Let's Talk&body=From: ${email}`
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
        className="peer w-0 flex-auto bg-transparent px-4 py-2.5 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-[0.8125rem]/6"
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" arrow onClick={handleClick}>
        Let’s Talk
      </Button>
      <div className="absolute inset-0 -z-10 rounded-lg transition peer-focus:ring-4 peer-focus:ring-sky-300/15" />
      <div className="absolute inset-0 -z-10 rounded-lg bg-white/2.5 ring-1 ring-white/15 transition peer-focus:ring-sky-300" />
    </form>
  )
}
