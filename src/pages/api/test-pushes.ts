import getDB from '@/_app/db/init'
import type { PostSchema } from '@/_app/db/schemas/post'
import { announceNewPost } from '@/_app/push-notifications-sender'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function testPushes(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true } | { ok: false, error: string }>
) {
  if (req.cookies['token'] !== process.env.ADMIN_TOKEN) {
    res.status(401).send({ ok: false, error: 'Unauthorized' })
    return
  }
  const db = await getDB()
  const posts = await db.collection<PostSchema>('posts').find({}).sort({ createdAt: -1 }).limit(1).toArray()
  announceNewPost(posts[0])
  res.json({ ok: true })
}