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
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0) {
        let client = clientList[0]
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i]
          }
        }
        return client.focus()
      }
      return clients.openWindow(event.notification.data.url)
    })
  )
})