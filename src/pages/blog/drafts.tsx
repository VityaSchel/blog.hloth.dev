import type { GetServerSidePropsContext } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { Container } from '@/widgets/common/container'
import { AppBar } from '@/widgets/common/appbar'
import { Posts } from '@/widgets/homepage/posts'
import type { Post, PostProps } from '@/shared/model/post'
import getDB from '@/_app/db/init'
import type { PostSchema } from '@/_app/db/schemas/post'
import { useTranslation } from 'next-i18next'
import { Separator } from '@/shared/ui/separator'

type HomePageProps = {
  posts: PostProps[]
}

export default function DraftsPage(props: HomePageProps) {
  const posts = props.posts.map<Post>(post => ({ ...post, date: new Date(post.createdAt) }))
  const { t } = useTranslation()

  return (
    <Container>
      <AppBar />
      <h1 className='text-6xl mt-24 mb-6 font-semibold font-display'>🙈 {t('drafts')}</h1>
      <Separator />
      <Posts posts={posts} drafts />
    </Container>
  )
}

export async function getServerSideProps({ locale, req }: GetServerSidePropsContext) {
  if (req.cookies['token'] !== process.env.ADMIN_TOKEN) {
    return { notFound: true }
  }
  const db = await getDB()
  const drafts = await db.collection<PostSchema>('posts').find({ draft: true }).toArray()
  return {
    props: {
      ...await serverSideTranslations(locale as string),
      posts: drafts.map(p => ({
        createdAt: p.createdAt.getTime(),
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        category: p.category,
        readingTime: p.readingTime,
        banner: p.banner,
        locale: p.locale,
      }))
    },
  }
}