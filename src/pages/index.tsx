import type { GetStaticPropsResult } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { Container } from '@/widgets/common/container'
import { AppBar } from '@/widgets/common/appbar'
import Headline from '@/assets/hloth-blog.svg'
import { Posts } from '@/widgets/homepage/posts'
import type { Post, PostProps } from '@/shared/model/post'
import getDB from '@/_app/db/init'
import type { PostSchema } from '@/_app/db/schemas/post'

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
        banner: p.banner
      }))
    },
  }
}