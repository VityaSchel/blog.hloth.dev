import z from 'zod';
import { error, json } from '@sveltejs/kit';
import { noNullCharacter } from '$lib/zod';
import { NODE_ENV } from '$env/static/private';
import { db } from '$lib/server/db';
import { contentSchema } from '$lib/editorjs/blocks';
import { getUrl, mediaFileIdSchema } from '$lib/media';
import { postsTable, statusEnum } from '$lib/server/db/schema';
import { categorySchema } from '$lib/categories';
import { eq } from 'drizzle-orm';
import { broadcastNewPostNotification } from '$lib/push-notifications/push.server';

export async function POST({ locals, request }) {
	if (!locals.admin) {
		throw error(403, 'Unauthorized');
	}
	const bodyParsing = await z
		.object({
			id: z.string().refine(noNullCharacter).min(1).max(64),
			title: z.string().refine(noNullCharacter).min(1).max(64),
			category: categorySchema,
			readTime: z.number().int().min(1).max(90),
			bannerId: mediaFileIdSchema,
			bannerAlt: z.string().refine(noNullCharacter).min(1).max(1024),
			content: contentSchema,
			excerpt: z.string().min(1).max(512),
			visibility: z.enum(statusEnum.enumValues)
		})
		.safeParseAsync(await request.json());
	if (!bodyParsing.success) {
		if (NODE_ENV === 'development') console.error(bodyParsing.error);
		throw error(400, 'Invalid request');
	}
	const body = bodyParsing.data;
	const forbiddenIds = ['post', 'drafts', 'login', 'api'];
	if (forbiddenIds.includes(body.id)) {
		throw error(400, 'Invalid post ID');
	}
	const existingPost = await db.query.postsTable.findFirst({
		where: eq(postsTable.id, body.id),
		columns: {
			visibility: true
		}
	});
	await db
		.insert(postsTable)
		.values({
			id: body.id,
			title: body.title,
			category: body.category,
			readTime: body.readTime,
			banner: body.bannerId,
			bannerAlt: body.bannerAlt,
			content: body.content,
			excerpt: body.excerpt,
			visibility: body.visibility
		})
		.onConflictDoUpdate({
			target: postsTable.id,
			set: {
				title: body.title,
				category: body.category,
				readTime: body.readTime,
				banner: body.bannerId,
				bannerAlt: body.bannerAlt,
				content: body.content,
				excerpt: body.excerpt,
				visibility: body.visibility
			}
		});
	if (
		body.visibility === 'published' &&
		(!existingPost || existingPost.visibility != 'published')
	) {
		broadcastNewPostNotification({
			title: body.title,
			message: body.excerpt,
			postedAt: Date.now(),
			image: getUrl(body.bannerId),
			url: 'https://blog.hloth.dev/' + body.id
		});
	}
	return json(
		{
			ok: true
		},
		{
			status: 201
		}
	);
}
