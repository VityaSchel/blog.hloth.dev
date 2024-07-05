import getDB from '@/_app/db/init'
import type { PostSchema } from '@/_app/db/schemas/post'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function checkSlug(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }
  const slug = req.query.slug as string
  const db = await getDB()
  const post = await db.collection<PostSchema>('posts').findOne({ slug, locale: req.query.locale as 'ru' | 'en' })
  res.status(200).json({ exists: post !== null })
}