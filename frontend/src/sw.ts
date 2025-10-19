self.addEventListener("push", (event) => {
	if (!event.data) return;

	const data = event.data.json();
	const options = {
		id: data.id,
		title: data.title,
		body: data.description,
		icon: "/favicon.ico",
		badge: "/favicon.ico",
		image: data.image,
		data: { id: data.id },
		actions: [
			{
				action: "view",
				title: "View Post",
			},
		],
	};

	event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	if (event.action === "view" || !event.action) {
		const postId = event.notification.data?.id;
		const url = postId ? `/posts/${postId}` : "/";

		event.waitUntil(clients.openWindow(url));
	}
});
