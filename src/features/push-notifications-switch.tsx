import React from 'react'
import { useTranslation } from 'next-i18next'
import cx from 'classnames'

const base64ToUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(b64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const webPushPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY
if (!webPushPublicKey) {
  // throw new Error('NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY is not set')
}

export function PushNotificationsSwitch() {
  const { t } = useTranslation()
  const [subscribed, setSubscribed] = React.useState<boolean>(false)
  const [subscription, setSubscription] = React.useState<PushSubscription | null>(null)
  const [registration, setRegistration] = React.useState<ServiceWorkerRegistration | null>(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub && !(sub.expirationTime && Date.now() > sub.expirationTime - 5 * 60 * 1000)) {
            setSubscription(sub)
            setSubscribed(true)
          }
        })
        setRegistration(reg)
      })
    }
  }, [])

  const handleSubscribe = async () => {
    if(registration === null) return
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(webPushPublicKey)
    })
    const subData = sub.toJSON()
    console.log(subData)
    setSubscription(sub)
    setSubscribed(true)
  }

  const handleUnsubscribe = async () => {
    if (registration === null || subscription === null) return
    await subscription.unsubscribe()
    // TODO: you should call your API to delete or invalidate subscription data on server
    setSubscription(null)
    setSubscribed(false)
  }

  const handleSwitch = () => {
    setSubscribed(!subscribed)
  }

  return (//registration !== null && 
    <button
      type='button'
      className='flex items-center gap-8 justify-between w-full text-sm text-left font-medium'
      onClick={handleSwitch}
    >
      <span>{t('push_switch')}</span>
      <div
        className='px-2 py-[4px] h-6 w-16 bg-alt rounded-full flex gap-1 relative tracking-tight shrink-0'
      >
        <span
          className={cx('bg-amber-100 bg-opacity-30 w-[40%] h-[calc(100%-8px)] rounded-full absolute top-1 left-1 border border-white border-opacity-30 shadow-md transition-all duration-300', {
            'left-[calc(60%-4px)] bg-green-600 bg-opacity-50': subscribed
          })}
        />
      </div>
    </button>
  )
}