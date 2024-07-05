import React from 'react'
import { AppBar } from '@/widgets/common/appbar'
import { Container } from '@/widgets/common/container'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Ru404 from '@/assets/404ru.svg'
import En404 from '@/assets/404en.svg'
import Jp404 from '@/assets/404jp.svg'

export default function Page404() {
  const { t, i18n } = useTranslation()
  const [hover, setHover] = React.useState(false)

  return (
    <Container>
      <AppBar 
        previous={{ title: t('go_to_main_page'), path: '/' }}
      />
      <div className='flex flex-1 items-center justify-center'>
        <div className='flex gap-12 h-[300px]'>
          <div className='h-full w-fit [&>svg]:h-full flex gap-2 mix-blend-exclusion'>
            {i18n.language === 'ru' ? <Ru404 /> : <En404 />}
            {i18n.language === 'ru' ? <En404 /> : <Ru404 />}
            <Jp404 />
          </div>
          <video 
            src='/god-bless-america.mp4' 
            autoPlay 
            loop 
            muted 
            className='w-auto h-full aspect-[640/360] rounded-xl shadow-lg grayscale-animated bg-gray'
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ '--grayscale': hover ? 0 : 1 } as React.CSSProperties}
          />

          <h1 className='font-display text-4xl font-medium text-page-not-found'>{t('page_not_found')}</h1>
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