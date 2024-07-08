import React from 'react'
import { AppBar } from '@/widgets/common/appbar'
import { Container } from '@/widgets/common/container'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Ru404 from '@/assets/404ru.svg'
import En404 from '@/assets/404en.svg'
import Jp404 from '@/assets/404jp.svg'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Page404() {
  const { t, i18n } = useTranslation()
  const [hover, setHover] = React.useState(false)
  const { locale, pathname } = useRouter()

  return (
    <Container>
      <AppBar
        previous={{ title: t('go_to_main_page'), path: '/' }}
      />
      <Head>
        <title>{t('page_not_found')}</title>
        <meta name='description' content={t('description')} />
        <meta property='og:title' content={t('page_not_found')} />
        <meta property='og:description' content={t('description')} />
        <meta property='og:site_name' content='hloth blog' />
        <meta property='og:type' content='website' />
        <meta property='og:url' content={'https://blog.hloth.dev/' + locale + '/' + pathname} />
        <meta property='og:image' content='https://blog.hloth.dev/banner.jpg' />
        <meta property='og:image:width' content='https://blog.hloth.dev/banner.jpg' />
        <meta property='og:image:height' content='https://blog.hloth.dev/banner.jpg' />
        <meta property='og:image:alt' content='hloth blog' />
        <meta property='og:locale' content={locale === 'ru' ? 'ru_RU' : 'en_US'} />
        <meta property='og:locale:alternate' content={locale === 'ru' ? 'en_US' : 'ru_RU'} />
      </Head>
      <div className='flex flex-1 pt-8 md:pt-0 md:items-center justify-center'>
        <div className='flex items-center md:items-start flex-col md:flex-row gap-6 lg:gap-12 h-full md:h-[200px] xl:h-[300px]'>
          <div className='h-full hidden md:w-fit [&>svg]:h-full [&>svg]:w-auto lg:flex gap-2 mix-blend-exclusion'>
            {i18n.language === 'ru' ? <Ru404 /> : <En404 />}
            {i18n.language === 'ru' ? <En404 /> : <Ru404 />}
            <Jp404 />
          </div>
          <video 
            src='/god-bless-america.mp4' 
            autoPlay 
            loop 
            muted 
            className='w-auto h-full aspect-[640/360] rounded-xl shadow-lg grayscale-animated bg-gray max-h-[300px] md:max-h-none'
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ '--grayscale': hover ? 0 : 1 } as React.CSSProperties}
          />

          <h1 className='font-display text-3xl xl:text-4xl font-medium text-page-not-found'>{t('page_not_found')}</h1>
        </div>
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