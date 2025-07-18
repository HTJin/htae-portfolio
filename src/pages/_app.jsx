import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ThemeProvider } from 'next-themes'
import { MDXProvider } from '@mdx-js/react'
import ScrollToTop from '@/components/ScrollToTop'
import SideNav from '@/components/SideNav'
import AOS from 'aos'
import * as mdxComponents from '@/components/mdx'
import '@/styles/tailwind.css'
import 'focus-visible'
import 'aos/dist/aos.css'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    AOS.init({
      duration: 1000,
    })
  }, [])

  const isResumePage = router.pathname === '/resume.pdf'

  return (
    <>
      <Head>
        <title>{'<Htae role="Web Developer" />'}</title>
        <meta
          name="description"
          content="I am devoted to meticulously delivering clean, practical web applications. I'm a fan of efficient, minimalistic user-centered design and try to make them into a reality. Your imagination is the limit."
        />
      </Head>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <MDXProvider components={mdxComponents}>
          <Component {...pageProps} />
          {!isResumePage && <ScrollToTop />}
          {!isResumePage && <SideNav />}
        </MDXProvider>
      </ThemeProvider>
    </>
  )
}
