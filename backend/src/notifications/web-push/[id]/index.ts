import { db } from "$db";
import { pushSubscriptionsTable } from "$db/schema";
import { eq } from "drizzle-orm";
import Elysia from "elysia";

export const pushNotificationSubscriptionRouter = new Elysia({
	prefix: "/notifications/web-push/:id",
}).delete("/", async ({ params, set }) => {
	const result = await db
		.delete(pushSubscriptionsTable)
		.where(eq(pushSubscriptionsTable.endpoint, params.id))
		.returning({
			endpoint: pushSubscriptionsTable.endpoint,
		});
	if (result.length) {
		return { ok: true };
	} else {
		set.status = 404;
		return { ok: false };
	}
});
