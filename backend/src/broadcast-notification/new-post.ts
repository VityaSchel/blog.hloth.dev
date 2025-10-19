import { db } from "$db";
import { newPostNotificationsTable, pushSubscriptionsTable } from "$db/schema";
import { eq, lt } from "drizzle-orm";
import { getPosts, type Post } from "src/rss";
import webPush from "web-push";

const publicWebPushKey = process.env.PUBLIC_WEB_PUSH_KEY;
const privateWebPushKey = process.env.PRIVATE_WEB_PUSH_KEY;
if (!publicWebPushKey || !privateWebPushKey) {
	throw new Error("Web push keys are not set in environment variables");
}

webPush.setVapidDetails("https://blog.hloth.dev", publicWebPushKey, privateWebPushKey);

export async function checkNewPosts(): Promise<void> {
	const [rssPosts, notifiedPosts] = await Promise.all([
		getPosts(),
		db.query.newPostNotificationsTable
			.findMany({ columns: { postId: true } })
			.then((r) => r.map((n) => n.postId)),
	]);
	const newPostIds = rssPosts.filter((p) => !notifiedPosts.includes(p.id));
	console.log(`Found ${newPostIds.length} new posts`);
	for (const post of newPostIds) {
		await notifyNewPost(post);
	}
}

async function notifyNewPost(post: Post): Promise<void> {
	await db.delete(pushSubscriptionsTable).where(lt(pushSubscriptionsTable.expiresAt, new Date()));
	const subscriptions = await db.query.pushSubscriptionsTable.findMany();

	let sent = 0;
	for (const sub of subscriptions) {
		try {
			await webPush.sendNotification(
				{
					endpoint: sub.endpoint,
					keys: {
						p256dh: sub.p256dh,
						auth: sub.auth,
					},
				},
				JSON.stringify({
					id: post.id,
					title: post.title,
					description: post.description,
					image: post.image,
				}),
			);
			sent++;
		} catch (e) {
			console.error(`Failed to send notification to ${sub.endpoint}:`, e);
			try {
				await db
					.delete(pushSubscriptionsTable)
					.where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
			} catch (e) {
				console.error(`Failed to delete subscription ${sub.endpoint}:`, e);
			}
		}
	}

	await db.insert(newPostNotificationsTable).values({ postId: post.id, sent });
	console.log("Sent", sent, "notifications for post", post.id);
}
