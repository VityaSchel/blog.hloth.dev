import React from 'react'
import getDB from '@/_app/db/init'
import { getDraft } from '@/shared/drafts'
import type { PostEditorFields, PostFullProps } from '@/shared/model/post'
import { AppBar } from '@/widgets/common/appbar'
import { Container } from '@/widgets/common/container'
import { PostEditor } from '@/widgets/post/post-editor'
import _ from 'lodash'
import type { GetServerSidePropsContext } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function BlogPage(props: { post?: PostFullProps }) {
  const [draft, setDraft] = React.useState<PostEditorFields | null | undefined>(undefined)
  const router = useRouter()

  React.useEffect(() => {
    if(!props.post) {
      const draft = getDraft(router.locale as string)
      setDraft(draft)
    }
  }, [props.post, router.locale])

  return (
    <Container>
      <Head>
        <meta name='robots' content='noindex' />
      </Head>
      <AppBar />
      {(props.post || draft !== undefined) && (
        <PostEditor initial={props.post || draft as PostEditorFields | null} />
      )}
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