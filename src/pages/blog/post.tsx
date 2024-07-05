import getDB from '@/_app/db/init'
import type { PostFull, PostFullProps } from '@/shared/model/post'
import { AppBar } from '@/widgets/common/appbar'
import { Container } from '@/widgets/common/container'
import { PostEditor } from '@/widgets/post/post-editor'
import _ from 'lodash'
import type { GetServerSidePropsContext } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function BlogPage(props: { post?: PostFullProps }) {
  const post: PostFull | null = props.post ? { ...props.post, date: new Date(props.post.createdAt) } : null

  return (
    <Container>
      <AppBar />
      <PostEditor initial={post} />
    </Container>
  )
}

export async function getServerSideProps({ locale, req, query }: GetServerSidePropsContext) {
  if(req.cookies['token'] !== process.env.ADMIN_TOKEN) {
    return { notFound: true }
  }
  const edit = query.edit
  if(edit) {
    const db = await getDB()
    const post = await db.collection('posts').findOne({ slug: edit, locale })
    if(post === null) {
      return { notFound: true }
    }
    return {
      props: {
        ...await serverSideTranslations(locale as string),
        post: {
          ..._.omit(post, ['_id', 'locale', 'draft', 'createdAt', 'updatedAt']),
          createdAt: post.createdAt.getTime(),
        }
      }
    }
  }
  return {
    props: {
      ...await serverSideTranslations(locale as string)
    },
  }
}