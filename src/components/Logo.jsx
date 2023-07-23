import Image from 'next/image'

export function Logo() {
  return (
    <Image
      src={require('../images/avatar.png')}
      width={200}
      height={200}
      alt="Avatar"
      className="mt-16"
    />
  )
}
