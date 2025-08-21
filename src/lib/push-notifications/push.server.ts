import webPush from 'web-push';
import { asc, gte, or, isNull } from 'drizzle-orm';
import { PUBLIC_WEB_PUSH_KEY } from '$env/static/public';
import { NODE_ENV, PRIVATE_WEB_PUSH_KEY } from '$env/static/private';
import { db } from '$lib/server/db';
import { pushSubscriptionsTable } from '$lib/server/db/schema';
import type { NewPostNotificationPayload } from '$lib/push-notifications/notification';

webPush.setVapidDetails(
	'https://blog.hloth.dev',
	PUBLIC_WEB_PUSH_KEY,
	PRIVATE_WEB_PUSH_KEY
);

export async function broadcastNewPostNotification(
	payload: NewPostNotificationPayload
) {
	const subscriptions = await db.query.pushSubscriptionsTable.findMany({
		where: or(
			isNull(pushSubscriptionsTable.expiresAt),
			gte(pushSubscriptionsTable.expiresAt, new Date())
		),
		columns: {
			endpoint: true,
			p256dh: true,
			auth: true
		},
		orderBy: asc(pushSubscriptionsTable.expiresAt)
	});
	let errors = 0,
		sent = 0;
	for (const subscription of subscriptions) {
		try {
			await webPush.sendNotification(
				{
					endpoint: subscription.endpoint,
					keys: { auth: subscription.auth, p256dh: subscription.p256dh }
				},
				JSON.stringify(payload)
			);
			sent++;
		} catch (e) {
			if (NODE_ENV === 'development') console.error(e);
			errors++;
		}
	}
	console.log(
		`Sent ${sent + errors} notifications: ${sent} success, ${errors} errors`
	);
}
