import getDB from '@/_app/db/init'
import type { PostSchema } from '@/_app/db/schemas/post'
import { announceNewPost } from '@/_app/push-notifications-sender'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

type SavePostResponse = {
  ok: true
} | {
  ok: false
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SavePostResponse>,
) {
  if (req.cookies['token'] !== process.env.ADMIN_TOKEN) {
    res.status(401).send({ ok: false, error: 'Unauthorized' })
    return
  }
  const body = await z.object({
    title: z.string().min(1).max(64),
    content: z.any(),
    excerpt: z.string().min(1).max(512),
    category: z.string().min(1).max(64),
    readingTime: z.number().int().min(1).max(90),
    banner: z.object({
      src: z.string(),
      placeholder: z.string().min(1),
      alt: z.string().min(1).max(1024),
      width: z.number().int().min(1),
      height: z.number().int().min(1),
    }),
    slug: z.string().min(1).max(64),
    locale: z.enum(['en', 'ru']),
    draft: z.boolean(),
  }).safeParseAsync(req.body)
  if (!body.success) {
    console.error(body.error)
    res.status(400).json({ ok: false, error: 'Invalid body' })
    return
  }
  try {
    if (body.data.slug === 'post' || body.data.slug === 'drafts') {
      res.status(400).json({ ok: false, error: 'Invalid slug' })
      return
    }
    const db = await getDB()
    const postCreated = (await db.collection<PostSchema>('posts').findOne({ slug: body.data.slug, locale: body.data.locale })) === null
    const newPost = await db.collection<PostSchema>('posts').findOneAndUpdate({
      slug: body.data.slug,
      locale: body.data.locale
    }, {
      $set: {
        banner: {
          src: body.data.banner.src,
          placeholder: body.data.banner.placeholder,
          alt: body.data.banner.alt,
          width: body.data.banner.width,
          height: body.data.banner.height,
        },
        category: body.data.category,
        content: body.data.content,
        excerpt: body.data.excerpt,
        readingTime: body.data.readingTime,
        title: body.data.title,
        updatedAt: new Date(),
        draft: body.data.draft,
      },
      $setOnInsert: {
        createdAt: new Date(),
        slug: body.data.slug,
        locale: body.data.locale,
        views: 0,
      }
    }, {
      upsert: true,
      returnDocument: 'after'
    })
    const blogPosts = await db.collection<PostSchema>('posts').find().toArray()
    blogPosts.forEach(async post => {
      await res.revalidate('/ru/blog/' + post.slug)
      await res.revalidate('/en/blog/' + post.slug)
    })
    await res.revalidate('/ru')
    await res.revalidate('/en')
    await res.revalidate('/')
    if (newPost?.draft === false && postCreated) {
      announceNewPost(newPost!)
    }
    res.status(200).json({ ok: true })
  } catch(e) {
    res.status(500).json({ ok: false, error: (e instanceof Error ? e.message : 'Internal server error') })
  }
}