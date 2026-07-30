import { useEffect } from 'react'
import Head from 'next/head'
import { ThemeProvider } from 'next-themes'
import ScrollToTop from '@/components/ScrollToTop'
import SideNav from '@/components/SideNav'
import AOS from 'aos'
import { meta } from '@/content'
import '@/styles/tailwind.css'
import 'focus-visible'
import 'aos/dist/aos.css'

const siteUrl = meta.siteUrl
const ogImage = `${siteUrl}${meta.ogImagePath}`

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: meta.name,
      description: meta.pageDescription,
      inLanguage: 'en-US',
      publisher: { '@id': `${siteUrl}/#person` },
    },
    {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
      name: meta.name,
      url: siteUrl,
      image: ogImage,
      jobTitle: meta.role,
      email: `mailto:${meta.email}`,
      sameAs: [meta.links.linkedin, meta.links.github],
    },
    {
      '@type': 'ProfilePage',
      '@id': `${siteUrl}/#profilepage`,
      url: siteUrl,
      name: meta.pageTitle,
      description: meta.pageDescription,
      mainEntity: { '@id': `${siteUrl}/#person` },
      isPartOf: { '@id': `${siteUrl}/#website` },
    },
  ],
}

export default function App({ Component, pageProps }) {
  useEffect(() => {
    AOS.init({
      duration: 1000,
    })
  }, [])

  return (
    <>
      <Head>
        <title>{meta.pageTitle}</title>
        <meta name="description" content={meta.pageDescription} />
        <meta name="author" content={meta.name} />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#020617" />
        <link rel="canonical" href={siteUrl} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${meta.name} portfolio feed`}
          href={`${siteUrl}/rss/feed.xml`}
        />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={meta.name} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={meta.pageTitle} />
        <meta property="og:description" content={meta.pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={`Portrait of ${meta.name}`} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={meta.pageTitle} />
        <meta name="twitter:description" content={meta.pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={`Portrait of ${meta.name}`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <Component {...pageProps} />
        <ScrollToTop />
        <SideNav />
      </ThemeProvider>
    </>
  )
}
