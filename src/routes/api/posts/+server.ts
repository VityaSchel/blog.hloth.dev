import z from "zod";
import { error, json } from "@sveltejs/kit";
import { noNullCharacter } from "$lib/zod";
import { db } from "$lib/server/db";
import { getUrl, mediaFileIdSchema } from "$lib/media";
import { postsTable, statusEnum } from "$lib/server/db/schema";
import { categorySchema } from "$lib/categories";
import { eq } from "drizzle-orm";
import { broadcastNewPostNotification } from "$lib/push-notifications/push.server";
import { createReactionsRowForPost } from "$lib/reactions/server";

export async function POST({ locals, request }) {
	if (!locals.admin) {
		throw error(403, "Unauthorized");
	}
	const bodyParsing = await z
		.object({
			id: z.string().refine(noNullCharacter).min(1).max(64),
			title: z.string().refine(noNullCharacter).min(1).max(64),
			category: categorySchema,
			readTime: z.number().int().min(1).max(90),
			bannerId: mediaFileIdSchema,
			bannerAlt: z.string().refine(noNullCharacter).min(1).max(1024),
			content: z.string().max(1 * 1024 * 1024),
			excerpt: z.string().min(1).max(512),
			visibility: z.enum(statusEnum.enumValues),
		})
		.safeParseAsync(await request.json());
	if (!bodyParsing.success) {
		console.error(bodyParsing.error);
		throw error(400, "Invalid request");
	}
	const body = bodyParsing.data;
	if (forbiddenIds.includes(body.id)) {
		throw error(400, "Invalid post ID");
	}
	const existingPost = await db.query.postsTable.findFirst({
		where: eq(postsTable.id, body.id),
		columns: {
			visibility: true,
		},
	});
	await db.transaction(async (tx) => {
		await tx
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
				visibility: body.visibility,
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
					visibility: body.visibility,
					updatedAt: new Date(),
				},
			});
		await createReactionsRowForPost({ postId: body.id, tx });
	});
	if (
		body.visibility === "published" &&
		(!existingPost || existingPost.visibility != "published")
	) {
		broadcastNewPostNotification({
			title: body.title,
			message: body.excerpt,
			postedAt: Date.now(),
			image: getUrl(body.bannerId),
			url: "https://blog.hloth.dev/" + body.id,
		});
	}
	return json(
		{
			ok: true,
		},
		{
			status: 201,
		},
	);
}
