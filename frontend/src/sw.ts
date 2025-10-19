/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import * as z from "zod/mini";

const self = globalThis.self as unknown as ServiceWorkerGlobalScope;

self.addEventListener("push", (event) => {
	if (!(event instanceof PushEvent)) return;
	if (!self.registration) return;

	const data = z
		.object({
			id: z.string(),
			title: z.string(),
			description: z.string(),
			image: z.object({ url: z.string().check(z.url()) }),
		})
		.parse(event.data?.json());

	event.waitUntil(
		self.registration.showNotification(data.title, {
			// id: data.id,
			dir: "ltr",
			lang: "en",
			body: data.description,
			icon: "https://blog.hloth.dev/notifications-icon.png",
			badge: "https://blog.hloth.dev/notifications-badge.svg",
			// @ts-expect-error - image is not a standard property
			image: data.image.url,
			data: {
				postId: data.id,
			},
			actions: [
				{
					action: "openPost",
					title: "Read Post",
				},
			],
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	if (event.action === "openPost" || !event.action) {
		const { postId } = z
			.object({
				postId: z.string(),
			})
			.parse(event.notification.data);
		const url = "/" + postId;

		event.waitUntil(self.clients.openWindow(url));
	}
});
