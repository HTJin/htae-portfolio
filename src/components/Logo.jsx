import Image from 'next/image'

export function Logo() {
  return (
    <Image
      src={require('../images/avatar.png')}
      width={200}
      height={200}
      alt="Avatar"
      className="mt-4 h-36 w-36 sm:mt-8 sm:h-44 sm:w-44 lg:mt-16 lg:h-[200px] lg:w-[200px]"
    />
  )
}
