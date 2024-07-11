import React from 'react'
import '@/shared/styles/globals.scss'
import '@/shared/styles/fonts.css'
import type { AppProps } from 'next/app'
import { appWithTranslation } from 'next-i18next'
import { Footer } from '@/widgets/common/footer'
import { ThemeProvider } from 'next-themes'
import { useRouter } from 'next/router'

function HlothBlog({ Component, pageProps }: AppProps) {
  const router = useRouter()
  
  React.useEffect(() => {
    const onResize = () => {
      document.documentElement.style.setProperty('--page-height', `${window.document.body.scrollHeight - window.innerHeight}px`)
    }
    window.addEventListener('resize', onResize)
    router.events.on('routeChangeComplete', onResize)
    onResize()
    return () => {
      window.removeEventListener('resize', onResize)
      router.events.off('routeChangeComplete', onResize)
    }
  }, [router])

  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <Footer />
    </ThemeProvider>
  )
}

export default appWithTranslation(HlothBlog)