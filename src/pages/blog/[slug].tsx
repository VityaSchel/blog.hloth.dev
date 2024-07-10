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
import Head from 'next/head'
import { formatTitle } from '@/shared/title'
import { PostAvailableInAltLanguage } from '@/widgets/post/post-available-in-alt-language'

type BlogPageProps = {
  post: PostFullProps | null
  nextPost: { title: string, slug: string } | null
  availableLocales: string[]
}

export default function BlogPage(props: BlogPageProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { locale } = useRouter()

  const post = props.post && { ...props.post, date: new Date(props.post.createdAt) }

  const title = post ? formatTitle(post.title).title : t('page_not_found')
  const description = post ? post.excerpt : t('description')

  return (
    <Container>
      <AppBar
        previous={{ title: t('go_to_main_page'), path: '/' }}
        next={props.nextPost ? { title: props.nextPost.title, path: '/blog/' + props.nextPost.slug } : undefined}
      />
      <Head>
        <title>{title}</title>
        {post === null && <meta name='robots' content='noindex' />}
        <meta name='description' content={description} />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        <meta property='og:site_name' content='hloth blog' />
        <meta property='og:type' content='article' />
        <meta property='og:url' content={'https://blog.hloth.dev/' + locale + '/blog/' + router.query.slug} />
        {post && (<>
          <meta property='og:image' content={post.banner.src} />
          <meta property='og:image:width' content={String(post.banner.width)} />
          <meta property='og:image:height' content={String(post.banner.height)} />
          <meta property='og:image:alt' content={post.banner.alt} />
          <meta property='og:locale' content={post.locale === 'ru' ? 'ru_RU' : 'en_US'} />
          {props.availableLocales
            .filter(l => l !== post.locale)
            .map(locale => <meta property='og:locale:alternate' content={{ ru: 'ru_RU', en: 'en_US' }[locale]} key={locale} />)
          }
          {props.availableLocales.includes('ru') && <link rel='alternate' hrefLang='ru' href={'https://blog.hloth.dev/ru/blog/' + post.slug} />}
          {props.availableLocales.includes('en') && <link rel='alternate' hrefLang='en' href={'https://blog.hloth.dev/en/blog/' + post.slug} />}
          <link rel='alternate' hrefLang='x-default' href={'https://blog.hloth.dev/' + (
            props.availableLocales.includes('en') ? 'en' : 'ru'
          ) + '/blog/' + post.slug} />
          <meta property='article:published_time' content={post.date.toISOString()} />
          <meta property='article:author' content={t('me') + ' (https://hloth.dev/me)'} />
          <meta property='article:section' content={post.category} />

          <script type='application/ld+json'>
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              'headline': formatTitle(post.title).title,
              'description': post.excerpt,
              'image': {
                '@type': 'ImageObject',
                'url': post.banner.src,
                'width': post.banner.width,
                'height': post.banner.height,
                'caption': post.banner.alt
              },
              'author': {
                '@type': 'Person',
                'name': t('me'),
                'url': 'https://hloth.dev/me',
                'email': 'hi@hloth.dev',
              },
              'datePublished': post.date.toISOString(),
              'mainEntityOfPage': {
                '@type': 'WebPage',
                '@id': 'https://blog.hloth.dev/' + locale + '/blog/' + post.slug
              }
            })}
          </script>
        </>)}
      </Head>
      {post === null ? (
        <PostAvailableInAltLanguage />
      ) : (
        <Post {...post} />
      )}
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
    paths: postsSlugs.map(p => [{ params: { slug: p.slug }, locale: 'ru' }, { params: { slug: p.slug }, locale: 'en' }]).flat(),
    fallback: 'blocking'
  }
}

export async function getStaticProps({ locale, defaultLocale, params }: GetStaticPropsContext): Promise<GetStaticPropsResult<BlogPageProps>> {
  const slug = params?.slug
  if(!slug) { return { notFound: true } }
  const db = await getDB()
  const post = await db.collection<PostSchema>('posts')
    .findOne({ slug, draft: false, locale: locale as 'ru' | 'en' })
  if (post === null) { 
    const postInAltLanguage = await db.collection<PostSchema>('posts')
      .findOne({ slug, draft: false })
    if (postInAltLanguage === null) {
      return { notFound: true } 
    }
  }
  const nextPost = post && await db.collection<PostSchema>('posts')
    .findOne({ createdAt: { $lt: post.createdAt }, locale: locale as 'ru' | 'en', draft: false }, { projection: { title: 1, slug: 1 } })
  return {
    props: {
      ...await serverSideTranslations(locale ?? defaultLocale ?? 'en'),
      post: post && {
        ..._.omit(post, ['_id', 'updatedAt', 'draft', 'views', 'createdAt']),
        createdAt: post.createdAt.getTime()
      },
      availableLocales: (await db.collection<PostSchema>('posts')
        .find({ slug })
        .project({ locale: 1 })
        .toArray()).map(d => d.locale),
      nextPost: nextPost && {
        title: nextPost.title,
        slug: nextPost.slug
      }
    },
  }
}