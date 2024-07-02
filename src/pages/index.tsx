import { AppBar } from '@/widgets/common/appbar'
import Headline from '@/assets/hloth-blog.svg'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col p-12'>
      <AppBar />
      <Headline className='headline mt-10' />
    </main>
  )
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...await serverSideTranslations(locale),
    },
  }
}