import getDB from '@/_app/db/init'
import type { PostSchema } from '@/_app/db/schemas/post'
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
    const db = await getDB()
    await db.collection<PostSchema>('posts').updateOne({
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
        createdAt: new Date(),
        excerpt: body.data.excerpt,
        readingTime: body.data.readingTime,
        title: body.data.title,
        updatedAt: new Date(),
        views: 0,
        draft: body.data.draft,
      },
      $setOnInsert: {
        slug: body.data.slug,
        locale: body.data.locale
      }
    }, {
      upsert: true
    })
    await res.revalidate('/blog/' + body.data.slug)
    await res.revalidate('/')
    res.status(200).json({ ok: true })
  } catch(e) {
    res.status(500).json({ ok: false, error: (e instanceof Error ? e.message : 'Internal server error') })
  }
}