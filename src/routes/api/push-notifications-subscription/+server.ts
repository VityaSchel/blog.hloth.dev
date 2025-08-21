import z from 'zod';
import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pushSubscriptionsTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { noNullCharacter } from '$lib/zod';

export async function POST({ request }) {
	const body = await z
		.object({
			endpoint: z.url().refine(noNullCharacter),
			keys: z.object({
				p256dh: z.string().min(1).refine(noNullCharacter),
				auth: z.string().min(1).refine(noNullCharacter)
			}),
			expirationTime: z
				.number()
				.nonnegative()
				.refine((t) => t > Date.now())
				.transform((t) => new Date(t))
				.nullable()
				.default(null)
		})
		.safeParseAsync(await request.json());
	if (!body.success) {
		throw error(400, 'Invalid body');
	}

	await db.insert(pushSubscriptionsTable).values({
		endpoint: body.data.endpoint,
		p256dh: body.data.keys.p256dh,
		auth: body.data.keys.auth,
		expiresAt: body.data.expirationTime
	});

	return json({ ok: true });
}

export async function DELETE({ url }) {
	const endpoint = await z
		.url()
		.refine(noNullCharacter)
		.safeParseAsync(url.searchParams.get('endpoint'));
	if (!endpoint.success) {
		throw error(400, 'Invalid endpoint');
	}

	await db
		.delete(pushSubscriptionsTable)
		.where(eq(pushSubscriptionsTable.endpoint, endpoint.data));
	return json({ ok: true });
}
