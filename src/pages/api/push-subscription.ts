import getDB from '@/_app/db/init'
import type { PushSubscriptionSchema } from '@/_app/db/schemas/subscription-schema'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse<{ ok: true } | { ok: false, error: string }>) {
  if (req.method === 'POST') {
    const body = await z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
      }),
    }).safeParseAsync(req.body)
    if(!body.success) {
      res.status(400).json({ ok: false, error: 'Invalid body' })
      return
    }

    const userAgent = req.headers['user-agent']
    let ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    if(ipAddress && Array.isArray(ipAddress)) {
      ipAddress = ipAddress[0]
    }
    
    const db = await getDB()
    await db.collection<PushSubscriptionSchema>('push_subscriptions').insertOne({
      endpoint: body.data.endpoint,
      keys: {
        p256dh: body.data.keys.p256dh,
        auth: body.data.keys.auth,
      },
      ip: ipAddress,
      userAgent: userAgent,
    })
    res.json({ ok: true })
  } else if(req.method === 'DELETE') {
    const endpoint = await z.string().url().safeParseAsync(req.query.endpoint)
    if (endpoint.success) {
      const db = await getDB()
      await db.collection<PushSubscriptionSchema>('push_subscriptions').deleteOne({ endpoint: endpoint.data })
      res.json({ ok: true })
    } else {
      res.status(400).json({ ok: false, error: 'Invalid endpoint' })
    }
  } else {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
}