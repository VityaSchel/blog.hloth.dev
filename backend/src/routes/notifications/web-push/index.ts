import z from "zod";
import Elysia from "elysia";
import { db } from "$db";
import { pushSubscriptionsTable } from "$db/schema";
import { noNullCharacter } from "blog.hloth.dev-shared";

export const pushNotificationsRouter = new Elysia({
	prefix: "/notifications/web-push",
}).post(
	"/",
	async ({ body }) => {
		await db.insert(pushSubscriptionsTable).values({
			endpoint: body.endpoint,
			p256dh: body.keys.p256dh,
			auth: body.keys.auth,
			expiresAt: body.expirationTime,
		});

		return { ok: true };
	},
	{
		body: z.object({
			endpoint: z.url().min(1).max(2000).refine(noNullCharacter),
			keys: z.object({
				p256dh: z.string().min(1).max(2048).refine(noNullCharacter),
				auth: z.string().min(1).max(2048).refine(noNullCharacter),
			}),
			expirationTime: z
				.number()
				.nonnegative()
				.refine((t) => t > Date.now())
				.transform((t) => new Date(t))
				.nullable()
				.default(null),
		}),
	},
);
