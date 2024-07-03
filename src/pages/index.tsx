import type { GetStaticPropsResult } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { Container } from '@/widgets/common/container'
import { AppBar } from '@/widgets/common/appbar'
import Headline from '@/assets/hloth-blog.svg'
import { Posts } from '@/widgets/homepage/posts'
import type { Post, PostProps } from '@/shared/model/post'
import { getPlaiceholder } from 'plaiceholder'

type HomePageProps = {
  posts: PostProps[]
}

export default function Home(props: HomePageProps) {
  const posts = props.posts.map<Post>(post => ({ ...post, date: new Date(post.createdAt) }))

  return (
    <Container>
      <AppBar />
      <Headline className='headline mt-12' />
      <Posts posts={posts} />
    </Container>
  )
}

export async function getStaticProps({ locale }: { locale: string }): Promise<GetStaticPropsResult<HomePageProps>> {
  return {
    props: {
      ...await serverSideTranslations(locale),
      posts: [
        {
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
        },
        {
          slug: 'hello-world',
          title: 'Designing for the Web 3.0 is much easier than you think',
          excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
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
          category: 'review',
          readingTime: 9,
        },
      ]
    },
  }
}