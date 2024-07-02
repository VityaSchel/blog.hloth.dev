import '@/shared/styles/globals.scss'
import '@/shared/styles/fonts.css'
import type { AppProps } from 'next/app'
import { appWithTranslation } from 'next-i18next'

function HlothBlog({ Component, pageProps }: AppProps) {
  return (
    <Component {...pageProps} />
  )
}

export default appWithTranslation(HlothBlog)