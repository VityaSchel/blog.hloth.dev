import '@/shared/styles/globals.scss'
import '@/shared/styles/fonts.css'
import type { AppProps } from 'next/app'
import { appWithTranslation } from 'next-i18next'
import { Footer } from '@/widgets/common/footer'
import { ThemeProvider } from 'next-themes'

function HlothBlog({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <Footer />
    </ThemeProvider>
  )
}

export default appWithTranslation(HlothBlog)