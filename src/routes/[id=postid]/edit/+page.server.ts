import z from "zod";
import { eq } from "drizzle-orm";
import { error, fail, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { draftsTable, postsTable } from "$lib/server/db/schema";
import {
	postBannerAltSchema,
	postCategorySchema,
	postContentSchema,
	postExcerptSchema,
	postReadTimeSchema,
	postTitleSchema,
} from "$lib/zod";
import { mediaFileIdSchema } from "$lib/media";
import { broadcastNewPostNotification } from "$lib/push-notifications/push.server";
import { createReactionsRowForPost } from "$lib/reactions/server";
import { getDraft, isExistingId } from "$lib/server/blog";
import type { Draft } from "$lib/post";
import { parseFormData } from "$lib/server/utils/form-data-parser";

export async function load({ locals, params }) {
	if (!locals.admin) {
		throw error(403, "Unauthorized");
	}

	const draftDb = await db.query.draftsTable.findFirst({
		where: eq(draftsTable.id, params.id),
	});
	if (!draftDb) {
		throw error(404, "Post not found");
	}

	const draft: Draft = {
		title: draftDb.title,
		category: draftDb.category,
		readTime: draftDb.readTime,
		banner: draftDb.banner,
		bannerAlt: draftDb.bannerAlt,
		excerpt: draftDb.excerpt,
		content: draftDb.content,
	};

	const post = await db.query.postsTable.findFirst({
		where: eq(postsTable.id, params.id),
		columns: {
			content: true,
		},
	});

	return {
		draft,
		diff: post?.content ?? "",
	};
}

export const actions = {
	save: async function POST({ locals, request, params }) {
		if (!locals.admin) {
			return fail(403, { error: "Unauthorized" });
		}
		const draftId = params.id;
		const bodyParsing = await z
			.strictObject({
				title: postTitleSchema.nullable().default(null),
				category: postCategorySchema.nullable().default(null),
				readTime: postReadTimeSchema.nullable().default(null),
				bannerId: mediaFileIdSchema.nullable().default(null),
				bannerAlt: postBannerAltSchema.nullable().default(null),
				content: postContentSchema.nullable().default(null),
				excerpt: postExcerptSchema.nullable().default(null),
			})
			.safeParseAsync(
				parseFormData(await request.formData(), { readTime: Number }),
			);
		if (!bodyParsing.success) {
			return fail(400, {
				error: z.prettifyError(bodyParsing.error),
			});
		}
		const body = bodyParsing.data;
		await db.transaction(async (tx) => {
			await tx
				.update(draftsTable)
				.set({
					title: body.title,
					category: body.category,
					readTime: body.readTime,
					banner: body.bannerId,
					bannerAlt: body.bannerAlt,
					content: body.content,
					excerpt: body.excerpt,
				})
				.where(eq(draftsTable.id, draftId));
		});
		return {
			success: true,
		};
	},
	post: async function POST({ locals, params }) {
		if (!locals.admin) {
			return fail(403, { error: "Unauthorized" });
		}
		const postId = params.id;
		const draft = await getDraft(postId);
		if (!draft) {
			return fail(404, { error: "Draft not found" });
		}

		const draftParsing = await z
			.object({
				title: postTitleSchema,
				category: postCategorySchema,
				readTime: postReadTimeSchema,
				banner: mediaFileIdSchema,
				bannerAlt: postBannerAltSchema,
				content: postContentSchema,
				excerpt: postExcerptSchema,
			})
			.safeParseAsync(draft);
		if (!draftParsing.success) {
			return fail(400, {
				error: z.prettifyError(draftParsing.error),
			});
		}
		const post = draftParsing.data;

		const isExistingPost = await isExistingId({ postId });
		await db.transaction(async (tx) => {
			if (isExistingPost) {
				await tx
					.update(postsTable)
					.set({
						title: post.title,
						category: post.category,
						readTime: post.readTime,
						banner: post.banner,
						bannerAlt: post.bannerAlt,
						content: post.content,
						excerpt: post.excerpt,
						updatedAt: new Date(),
					})
					.where(eq(postsTable.id, postId));
			} else {
				await tx.insert(postsTable).values({
					id: postId,
					title: post.title,
					category: post.category,
					readTime: post.readTime,
					banner: post.banner,
					bannerAlt: post.bannerAlt,
					content: post.content,
					excerpt: post.excerpt,
					createdAt: new Date(),
					updatedAt: new Date(),
					locale: "en",
					views: 0,
				});
				await createReactionsRowForPost({ postId, tx });
			}
		});

		if (!isExistingPost) {
			void broadcastNewPostNotification({
				title: post.title,
				message: post.excerpt,
				postedAt: Date.now(),
				image: `/files/${post.banner}`,
				url: "https://blog.hloth.dev/" + postId,
			});
		}

		return redirect(303, "/" + postId);
	},
};
