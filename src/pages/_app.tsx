import React from 'react'
import '@/shared/styles/globals.scss'
import '@/shared/styles/fonts.css'
import type { AppProps } from 'next/app'
import { appWithTranslation } from 'next-i18next'
import { Footer } from '@/widgets/common/footer'
import { ThemeProvider } from 'next-themes'

function HlothBlog({ Component, pageProps }: AppProps) {
  React.useEffect(() => {
    const onResize = () => {
      document.documentElement.style.setProperty('--page-height', `${window.document.body.scrollHeight - window.innerHeight}px`)
    }
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <Footer />
    </ThemeProvider>
  )
}

export default appWithTranslation(HlothBlog)