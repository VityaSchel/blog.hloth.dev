import { AppBar } from '@/widgets/common/appbar'
import { Container } from '@/widgets/common/container'
import { useTranslation } from 'next-i18next'
import Head from 'next/head'
import Image from 'next/image'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function SiteOfflinePage() {
  const { t } = useTranslation()

  return (
    <Container>
      <AppBar />
      <Head>
        <title>hloth blog</title>
      </Head>
      <div className='flex-1 flex flex-col gap-4 justify-center items-center'>
        <Image src='/no-connection-cat.jpeg' alt='🐱' className='rounded-lg' />
        <h1>{t('offline')}</h1>
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