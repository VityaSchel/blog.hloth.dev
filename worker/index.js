'use strict'

self.addEventListener('push', function (event) {
  const data = JSON.parse(event.data.text())
  event.waitUntil(
    registration.showNotification(data.title, {
      body: data.message,
      icon: 'https://blog.hloth.dev/android-chrome-192x192.png',
      badge: 'https://blog.hloth.dev/safari-pinned-tab.svg',
      data: { url: data.url },
      image: data.image,
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  clients.openWindow(event.notification.data.url)
})