import Head from 'next/head'
import { DriveScene } from '@/components/drive/DriveScene'
import { meta } from '@/content'

const title = `${meta.name} | Drive mode`
const description =
  'The résumé of Hyun-Tae Jin from the driver’s seat: hold the accelerator and drive the highway of roles, builds, and skills, one exit at a time.'
const url = `${meta.siteUrl}/drive`

export default function DrivePage() {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#03060c" />
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>
      <DriveScene />
    </>
  )
}
