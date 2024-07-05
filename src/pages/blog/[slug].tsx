import type { PostFullProps } from '@/shared/model/post'
import { AppBar } from '@/widgets/common/appbar'
import { Container } from '@/widgets/common/container'
import { Post } from '@/widgets/post/post'
import type { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import _ from 'lodash'
import { useTranslation } from 'next-i18next'
import getDB from '@/_app/db/init'
import type { PostSchema } from '@/_app/db/schemas/post'
import { useRouter } from 'next/router'
import Page404 from '@/pages/404'

type BlogPageProps = {
  post: PostFullProps
  nextPost: { title: string, slug: string } | null
}

export default function BlogPage(props: BlogPageProps) {
  const router = useRouter()
  const { t } = useTranslation()

  if(router.isFallback) {
    return (
      <Page404 />
    )
  }

  const post = { ...props.post, date: new Date(props.post.createdAt) }

  return (
    <Container>
      <AppBar
        previous={{ title: t('go_to_main_page'), path: '/' }}
        next={props.nextPost ? { title: props.nextPost.title, path: '/blog/' + props.nextPost.slug } : undefined}
      />
      <Post {...post} />
    </Container>
  )
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  const db = await getDB()
  const postsSlugs = await db.collection<PostSchema>('posts')
    .find()
    .project({ slug: 1, locale: 1 })
    .toArray() as Pick<PostSchema, 'slug' | 'locale'>[]
  return {
    paths: postsSlugs.map(p => ({ params: { slug: p.slug }, locale: p.locale })),
    fallback: true
  }
}

export async function getStaticProps({ locale, defaultLocale, params }: GetStaticPropsContext): Promise<GetStaticPropsResult<BlogPageProps>> {
  const slug = params?.slug
  if(!slug) { return { notFound: true } }
  const db = await getDB()
  const post = await db.collection<PostSchema>('posts')
    .findOne({ slug, draft: false, locale: locale as 'ru' | 'en' })
  if (post === null) { return { notFound: true } }
  const nextPost = await db.collection<PostSchema>('posts')
    .findOne({ createdAt: { $lt: post.createdAt }, locale: locale as 'ru' | 'en', draft: false }, { projection: { title: 1, slug: 1 } })
  return {
    props: {
      ...await serverSideTranslations(locale ?? defaultLocale ?? 'en'),
      post: {
        ..._.omit(post, ['_id', 'updatedAt', 'draft', 'views', 'createdAt', 'locale']),
        createdAt: post.createdAt.getTime()
      },
      nextPost: nextPost && {
        title: nextPost.title,
        slug: nextPost.slug
      }
    },
  }
}