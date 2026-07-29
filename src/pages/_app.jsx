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
      </Head>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <Component {...pageProps} />
        <ScrollToTop />
        <SideNav />
      </ThemeProvider>
    </>
  )
}
