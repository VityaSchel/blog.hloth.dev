'use strict'

self.addEventListener('push', function (event) {
  const data = JSON.parse(event.data.text())
  event.waitUntil(
    registration.showNotification(data.title, {
      body: data.message,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      data: { url: data.url },
      image: data.image,
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  clients.openWindow(event.notification.data.url)
})