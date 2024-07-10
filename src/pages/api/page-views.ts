import getDB from '@/_app/db/init'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

const botUserAgents = [
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 'baiduspider'
]

const isBot = (userAgent: string) => {
  return botUserAgents.some((bot) => userAgent.toLowerCase().includes(bot))
}

export default async function PageViewsAPI(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if(req.method === 'GET') {
    if (req.cookies['token'] !== process.env.ADMIN_TOKEN) {
      res.status(401).send({ message: 'Unauthorized' })
      return
    }

    const body = await z.object({
      page: z.string().min(1).max(128)
    }).safeParseAsync(req.query)
    if(!body.success) {
      return res.status(400).json({ message: 'Invalid request query' })
    }

    const db = await getDB()
    const pageViewsCount = await db.collection('page_views').countDocuments({ pageKey: body.data.page })

    res.status(200).json({ pageKey: body.data.page, count: pageViewsCount })
  } else if (req.method === 'POST') {
    const userAgent = req.headers['user-agent']
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    
    if (userAgent && isBot(userAgent)) {
      return res.status(200).json({ message: 'Bot detected, not counted' })
    }

    const body = await z.object({
      pageKey: z.string().max(128).min(1)
    }).safeParseAsync(req.body)
    if(!body.success) {
      return res.status(400).json({ message: 'Invalid request body' })
    }

    const db = await getDB()

    if(body.data.pageKey.startsWith('/blog/')) {
      const blogPostID = body.data.pageKey.substring('/blog/'.length)
      if(!blogPostID) {
        return res.status(400).json({ message: 'Invalid page key' })
      }
      const blogPost = await db.collection('posts').findOne({ slug: blogPostID })
      if(!blogPost) {
        return res.status(404).json({ message: 'Post not found' })
      }
    } else {
      return res.status(400).json({ message: 'Invalid page key' })
    }

    const existingEntry = await db.collection('page_views').findOne({
      ipAddress,
      pageKey: body.data.pageKey,
      timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })

    if (existingEntry) {
      return res.status(200).json({ ok: true })
    }

    await db.collection('page_views').insertOne({
      ipAddress,
      userAgent,
      pageKey: body.data.pageKey,
      timestamp: new Date()
    })

    res.status(200).json({ ok: true })
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}