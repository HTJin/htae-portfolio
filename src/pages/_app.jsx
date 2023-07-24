import { useEffect } from 'react'
import Head from 'next/head'
import { ThemeProvider } from 'next-themes'
import { MDXProvider } from '@mdx-js/react'
import ScrollToTop from '@/components/ScrollToTop'

import * as mdxComponents from '@/components/mdx'

import '@/styles/tailwind.css'
import 'focus-visible'
import 'aos/dist/aos.css'
import AOS from 'aos'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    AOS.init({
      duration: 1000,
    })
  }, [])

  return (
    <>
      <Head>
        <title>HTae Jin - Web Developer</title>
        <meta
          name="description"
          content="I am devoted to meticulously delivering clean, practical web applications. I'm a fan of efficient, minimalistic user-centered design and try to make them into a reality. Your imagination is the limit."
        />
      </Head>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <MDXProvider components={mdxComponents}>
          <Component {...pageProps} />
          <ScrollToTop />
        </MDXProvider>
      </ThemeProvider>
    </>
  )
}
