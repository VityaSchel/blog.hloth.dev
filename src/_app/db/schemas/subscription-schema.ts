export type PushSubscriptionSchema = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}