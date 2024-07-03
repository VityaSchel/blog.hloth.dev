import type { PostProps } from '@/shared/model/post'
import { AppBar } from '@/widgets/common/appbar'
import { Container } from '@/widgets/common/container'
import { Post } from '@/widgets/post/post'
import type { GetServerSidePropsResult } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { getPlaiceholder } from 'plaiceholder'

type BlogPageProps = {
  post: PostProps
}

export default function BlogPage(props: BlogPageProps) {
  const post = { ...props.post, date: new Date(props.post.createdAt) }

  return (
    <Container>
      <AppBar />
      <Post {...post} />
    </Container>
  )
}

export async function getServerSideProps({ locale }: { locale: string }): Promise<GetServerSidePropsResult<BlogPageProps>> {
  return {
    props: {
      ...await serverSideTranslations(locale),
      post: {
        slug: 'hello-world',
        title: 'Design trends 2024 are finally here',
        excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        createdAt: Date.now() - 86400000,
        banner: {
          src: 'https://images.unsplash.com/photo-1621961458348-f013d219b50c',
          placeholder: (
            await getPlaiceholder(
              Buffer.from(await (
                await fetch('https://images.unsplash.com/photo-1621961458348-f013d219b50c')
              ).arrayBuffer())
            )
          ).base64,
          alt: 'Hello, World!'
        },
        category: 'tutorial',
        readingTime: 4,
      }
    },
  }
}