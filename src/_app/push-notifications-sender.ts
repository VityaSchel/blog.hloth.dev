import getDB from '@/_app/db/init'
import type { PostSchema } from '@/_app/db/schemas/post'
import type { PushSubscriptionSchema } from '@/_app/db/schemas/subscription-schema'
import webPush from 'web-push'

const webPushEmail = process.env.WEB_PUSH_EMAIL
if (!webPushEmail) {
  throw new Error('WEB_PUSH_EMAIL is not set')
}
const webPushPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY
if (!webPushPublicKey) {
  throw new Error('NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY is not set')
}
const webPushPrivateKey = process.env.WEB_PUSH_PRIVATE_KEY
if (!webPushPrivateKey) {
  throw new Error('WEB_PUSH_PRIVATE_KEY is not set')
}

webPush.setVapidDetails(
  `mailto:${webPushEmail}`,
  webPushPublicKey,
  webPushPrivateKey
)

export type PushNewPostPayload = {
  title: string
  message: string
  postedAt: number
  image: string
  url: string
}

export async function announceNewPost(post: PostSchema) {
  const db = await getDB()
  const subscriptions = await db.collection<PushSubscriptionSchema>('push_subscriptions').find().toArray()
  let errors = 0, sent = 0
  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification(
        { endpoint: subscription.endpoint, keys: { auth: subscription.keys.auth, p256dh: subscription.keys.p256dh } },
        JSON.stringify({ 
          title: post.title, 
          message: post.excerpt, 
          postedAt: post.createdAt.getTime(),
          image: post.banner.src,
          url: `https://blog.hloth.dev/${post.locale}/blog/${post.slug}`
        } satisfies PushNewPostPayload)
      )
      sent++
    } catch(e) {
      errors++
    }
  }
  console.log(`Sent ${sent+errors} notifications: ${sent} success, ${errors} errors`)
}