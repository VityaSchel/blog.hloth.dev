import type { GetStaticPropsResult } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { Container } from '@/widgets/common/container'
import { AppBar } from '@/widgets/common/appbar'
import Headline from '@/assets/hloth-blog.svg'
import { Posts } from '@/widgets/homepage/posts'
import type { Post, PostProps } from '@/shared/model/post'
import getDB from '@/_app/db/init'
import type { PostSchema } from '@/_app/db/schemas/post'
import { useTranslation } from 'next-i18next'
import Head from 'next/head'
import { useRouter } from 'next/router'

type HomePageProps = {
  posts: PostProps[]
}

export default function Home(props: HomePageProps) {
  const posts = props.posts.map<Post>(post => ({ ...post, date: new Date(post.createdAt) }))
  const { t } = useTranslation()
  const { locale } = useRouter()

  return (
    <Container>
      <AppBar />
      <Head>
        <title>{t('main_page')}</title>
        <meta name='description' content={t('description')} />
        <link rel='canonical' href={'https://blog.hloth.dev/' + locale} />
        <link rel='alternate' hrefLang='ru' href='https://blog.hloth.dev/ru' />
        <link rel='alternate' hrefLang='en' href='https://blog.hloth.dev/en' />
        <link rel='alternate' hrefLang='x-default' href='https://blog.hloth.dev/' />
        <meta property='og:title' content={t('main_page')} />
        <meta property='og:description' content={t('description')} />
        <meta property='og:site_name' content='hloth blog' />
        <meta property='og:type' content='website' />
        <meta property='og:url' content={'https://blog.hloth.dev/' + locale + '/'} />
        <meta property='og:image' content='https://blog.hloth.dev/banner.jpg' />
        <meta property='og:image:width' content='https://blog.hloth.dev/banner.jpg' />
        <meta property='og:image:height' content='https://blog.hloth.dev/banner.jpg' />
        <meta property='og:image:alt' content='hloth blog' />
        <meta property='og:locale' content={locale === 'ru' ? 'ru_RU' : 'en_US'} />
        <meta property='og:locale:alternate' content={locale === 'ru' ? 'en_US' : 'ru_RU'} />
      </Head>
      <Headline className='headline mt-12' />
      <Posts posts={posts} />
    </Container>
  )
}

export async function getStaticProps({ locale }: { locale: string }): Promise<GetStaticPropsResult<HomePageProps>> {
  const db = await getDB()
  const posts = await db.collection('posts').aggregate([
    {
      $match: {
        draft: false
      }
    },
    {
      $group: {
        _id: '$slug',
        documents: {
          $push: '$$ROOT'
        }
      }
    },
    {
      $project: {
        slug: '$_id',
        documents: {
          $filter: {
            input: '$documents',
            as: 'doc',
            cond: { $eq: ['$$doc.locale', locale] }
          }
        },
        fallbackDocument: {
          $arrayElemAt: ['$documents', 0]
        }
      }
    },
    {
      $addFields: {
        selectedDocument: {
          $cond: {
            if: { $gt: [{ $size: '$documents' }, 0] },
            then: { $arrayElemAt: ['$documents', 0] },
            else: '$fallbackDocument'
          }
        }
      }
    },
    {
      $replaceRoot: {
        newRoot: '$selectedDocument'
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    }
  ]).toArray() as PostSchema[]
  return {
    props: {
      ...await serverSideTranslations(locale),
      posts: posts.map(p => ({
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