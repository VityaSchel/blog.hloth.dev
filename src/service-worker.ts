/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

const self = globalThis.self as unknown as ServiceWorkerGlobalScope;
const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		try {
			const response = await fetch(event.request);
			if (!(response instanceof Response)) {
				throw new Error('Invalid response from fetch');
			}

			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			throw err;
		}
	}

	event.respondWith(respond());
});

self.addEventListener('push', function (event) {
	if (!event.data) return;
	const data = event.data.json();
	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.message,
			dir: 'ltr',
			lang: 'en',
			icon: 'https://blog.hloth.dev/notifications-icon.png',
			badge: 'https://blog.hloth.dev/notifications-badge.svg',
			data: { url: data.url },
			// @ts-expect-error - image is not a standard property
			image: data.image
		})
	);
});

self.addEventListener('notificationclick', function (event) {
	event.notification.close();
	self.clients.openWindow(event.notification.data.url);
});
