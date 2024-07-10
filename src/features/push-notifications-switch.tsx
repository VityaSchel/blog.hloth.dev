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
  throw new Error('NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY is not set')
}

export function PushNotificationsSwitch() {
  const { t } = useTranslation()
  const [subscribed, setSubscribed] = React.useState<boolean>(false)
  const [subscription, setSubscription] = React.useState<PushSubscription | null>(null)
  const [registration, setRegistration] = React.useState<ServiceWorkerRegistration | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<null | string>(null)

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
    setError(null)
    if(registration === null) return
    try {
      setLoading(true)
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(webPushPublicKey as string)
      })
      const subData = sub.toJSON()
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subData),
      })
        .then(res => res.json() as Promise<{ ok: true } | { ok: false, error: string }>)
      if (response.ok) {
        setSubscription(sub)
        setSubscribed(true)
      } else {
        throw new Error(response.error)
      }
    } catch (e) {
      console.error(e)
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setError('not_allowed')
      } else {
        setError('unknown_subscribe')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setError(null)
    if (registration === null || subscription === null) return
    setLoading(true)
    try {
      await subscription.unsubscribe()
      const response = await fetch('/api/push-subscription?' + new URLSearchParams({
        endpoint: subscription.endpoint
      }), { method: 'DELETE' })
        .then(res => res.json() as Promise<{ ok: true } | { ok: false, error: string }>)
      if (response.ok) {
        setSubscription(null)
        setSubscribed(false)
      } else {
        throw new Error(response.error)
      }
    } catch(e) {
      console.error(e)
      setError('unknown_subscribe')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitch = () => {
    if(subscribed) {
      handleUnsubscribe()
    } else {
      handleSubscribe()
    }
  }

  return registration !== null && (<>
    {error && (
      <div className='bg-red-600 rounded-lg p-2 text-[11px] leading-tight font-normal mb-2 font-text'>{t(`push.errors.${error}`)}</div>
    )}
    <button
      type='button'
      className='flex items-center gap-8 justify-between w-full text-sm text-left font-medium'
      onClick={handleSwitch}
      disabled={loading}
    >
      <span>{t('push.switch')}</span>
      <div
        className='px-2 py-[4px] h-6 w-16 bg-alt rounded-full flex gap-1 relative tracking-tight shrink-0'
      >
        <span
          className={cx('bg-amber-100 bg-opacity-30 w-[40%] h-[calc(100%-8px)] rounded-full absolute top-1 left-1 border border-white border-opacity-30 shadow-md transition-all duration-300 flex items-center justify-center', {
            'left-[calc(60%-4px)] bg-green-600 bg-opacity-50': subscribed
          })}
        >
          {loading && <svg xmlns='http://www.w3.org/2000/svg' width='2em' height='2em' viewBox='0 0 24 24'><circle cx='18' cy='12' r='0' fill='currentColor'><animate attributeName='r' begin='.67' calcMode='spline' dur='1s' keySplines='0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8' repeatCount='indefinite' values='0;2;0;0'></animate></circle><circle cx='12' cy='12' r='0' fill='currentColor'><animate attributeName='r' begin='.33' calcMode='spline' dur='1s' keySplines='0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8' repeatCount='indefinite' values='0;2;0;0'></animate></circle><circle cx='6' cy='12' r='0' fill='currentColor'><animate attributeName='r' begin='0' calcMode='spline' dur='1.5s' keySplines='0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8' repeatCount='indefinite' values='0;2;0;0'></animate></circle></svg>}
        </span>
      </div>
    </button>
  </>)
}