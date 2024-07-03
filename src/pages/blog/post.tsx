import { AppBar } from '@/widgets/common/appbar'
import { Container } from '@/widgets/common/container'
import { NewPost } from '@/widgets/post/new-post'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function BlogPage() {
  return (
    <Container>
      <AppBar />
      <NewPost />
    </Container>
  )
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...await serverSideTranslations(locale)
    },
  }
}