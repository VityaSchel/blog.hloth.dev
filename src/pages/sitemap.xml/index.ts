import { getServerSideSitemapLegacy, type IAlternateRef, type ISitemapField } from 'next-sitemap'
import type { GetServerSideProps } from 'next'
import getDB from '@/_app/db/init'
import type { PostSchema } from '@/_app/db/schemas/post'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const db = await getDB()
  const posts = await db.collection<PostSchema>('posts').find().sort({ createdAt: 1 }).toArray()
  const postsGrouped: Record<string, { slug: string, locales: ('ru' | 'en')[], updatedAt: Date }> = {}
  for(const post of posts) {
    if(postsGrouped[post.slug]) {
      postsGrouped[post.slug].locales.push(post.locale)
      if(post.updatedAt.getTime() > postsGrouped[post.slug].updatedAt.getTime()) {
        postsGrouped[post.slug].updatedAt = post.updatedAt
      }
    } else {
      postsGrouped[post.slug] = { slug: post.slug, locales: [post.locale], updatedAt: post.updatedAt}
    }
  }
  const fields: ISitemapField[] = [
    {
      loc: 'https://blog.hloth.dev/',
      alternateRefs: [
        { hreflang: 'ru', href: 'https://blog.hloth.dev/ru/' },
        { hreflang: 'en', href: 'https://blog.hloth.dev/en/' }
      ]
    },
    ...posts.map(post => {
      const alternateRefs: IAlternateRef[] = []
      if (post.locale.includes('ru')) {
        alternateRefs.push({ hreflang: 'ru', href: 'https://blog.hloth.dev/ru/blog/' + post.slug })
      }
      if (post.locale.includes('en')) {
        alternateRefs.push({ hreflang: 'en', href: 'https://blog.hloth.dev/en/blog/' + post.slug })
      }
      alternateRefs.push({ hreflang: 'x-default', href: 'https://blog.hloth.dev/blog/' + post.slug })
      return {
        loc: 'https://blog.hloth.dev/blog/' + post.slug,
        lastmod: post.updatedAt.toISOString(),
        alternateRefs
      }
    })
  ]

  return getServerSideSitemapLegacy(ctx, fields)
}

export default function SitemapIndex() { }