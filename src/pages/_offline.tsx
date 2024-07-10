import React from 'react'
import { AppBar } from '@/widgets/common/appbar'
import { Container } from '@/widgets/common/container'
import Head from 'next/head'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function SiteOfflinePage() {
  const [locale, setLocale] = React.useState('en')

  React.useEffect(() => {
    const locale = window.location.pathname.match(/^\/([^/]+)/)?.[1]
    console.log('Auto-detected', locale, 'locale')
    setLocale(locale === 'ru' ? 'ru' : 'en')
  }, [])

  return (
    <Container>
      <AppBar />
      <Head>
        <title>hloth blog</title>
      </Head>
      <div className='flex-1 flex flex-col gap-4 justify-center items-center'>
        <img src='/no-connection-cat.jpeg' alt='🐱' className='rounded-lg' width={354} height={329} />
        <h1>{locale === 'ru' ? 'Нет соединения с интернетом' : 'No internet connection'}</h1>
      </div>
    </Container>
  )
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...await serverSideTranslations(locale)
    },
  }
}