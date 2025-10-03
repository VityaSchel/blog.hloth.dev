import { db } from "$lib/server/db";
import { draftsTable, postsTable, type DbDraft } from "$lib/server/db/schema";
import { error } from "@sveltejs/kit";
import { desc, eq, sql } from "drizzle-orm";
import type { Reaction } from "../reactions";
import type { Post } from "$lib/post";

type Conditions = Omit<
	Parameters<typeof db.query.postsTable.findFirst>[0],
	"with" | "columns"
>;

type FetchedPost<Content extends boolean> = Content extends true
	? Post & { reactions: Record<Reaction, number> }
	: Omit<Post, "content">;

async function fetchPosts<T extends boolean>({
	conditions,
	content,
	limit,
}: {
	conditions: Conditions;
	content: T;
	limit?: number;
}): Promise<FetchedPost<T>[]> {
	const posts = await db.query.postsTable.findMany({
		...conditions,
		with: {
			banner: {
				columns: {
					id: true,
					placeholder: true,
					width: true,
					height: true,
				},
			},
			...(content && {
				reactions: {
					columns: {
						postId: false,
					},
				},
			}),
		},
		columns: {
			id: true,
			title: true,
			bannerAlt: true,
			excerpt: true,
			category: true,
			readTime: true,
			views: true,
			createdAt: true,
			updatedAt: true,
			locale: true,
			...(content ? { content: true } : {}),
		},
		limit,
	});
	return posts as FetchedPost<T>[];
}

export async function getPost(conditions: Conditions): Promise<Post> {
	const posts = await getPosts({
		conditions,
		content: true,
		limit: 1,
	});
	const post = posts[0];
	if (!post) {
		throw error(404, "Post not found");
	}
	return post;
}

export async function getPosts<T extends boolean>({
	conditions,
	content,
	limit,
}: {
	conditions: Conditions;
	content: T;
	limit?: number;
}) {
	return (await fetchPosts({ conditions, content, limit })).map(
		(post: FetchedPost<T>) => {
			const {
				banner: { id: bannerId, placeholder, width, height },
				bannerAlt,
				...details
			} = post;

			if (placeholder === null || width === null || height === null) {
				console.error(
					"Missing properties in post.banner for media file",
					bannerId,
				);
				throw error(500, "Internal server error");
			}

			return {
				...details,
				banner: {
					id: bannerId,
					placeholder,
					width,
					height,
				},
				bannerAlt,
				createdAt: post.createdAt.getTime(),
				updatedAt: post.updatedAt.getTime(),
			};
		},
	);
}

export async function incrementViews(postId: Post["id"]) {
	await db
		.update(postsTable)
		.set({ views: sql`${postsTable.views} + 1` })
		.where(eq(postsTable.id, postId));
}

export async function getIds() {
	return await db.query.postsTable.findMany({
		columns: { id: true, updatedAt: true },
		orderBy: desc(postsTable.createdAt),
	});
}

export async function isExistingId({
	postId,
	drafts,
}: {
	postId: string;
	drafts?: boolean;
}) {
	if (drafts) {
		if (
			await db.query.draftsTable.findFirst({
				where: eq(draftsTable.id, postId),
				columns: { id: true },
			})
		) {
			return true;
		}
	}
	return !!(await db.query.postsTable.findFirst({
		where: eq(postsTable.id, postId),
		columns: { id: true },
	}));
}

export async function getDraft(id: string): Promise<DbDraft | null> {
	return (
		(await db.query.draftsTable.findFirst({
			where: eq(draftsTable.id, id),
		})) ?? null
	);
}
