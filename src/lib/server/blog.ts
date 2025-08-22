import { db } from '$lib/server/db';
import { mediaTable, postsTable } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { desc, eq, sql, type InferSelectModel } from 'drizzle-orm';

type Conditions = Omit<
	Parameters<typeof db.query.postsTable.findFirst>[0],
	'with' | 'columns'
>;

type Post = Pick<
	InferSelectModel<typeof postsTable>,
	| 'id'
	| 'title'
	| 'bannerAlt'
	| 'excerpt'
	| 'category'
	| 'readTime'
	| 'views'
	| 'createdAt'
	| 'updatedAt'
	| 'content'
	| 'locale'
> & {
	banner: Pick<
		InferSelectModel<typeof mediaTable>,
		'id' | 'placeholder' | 'width' | 'height'
	>;
};

type FetchedPost<Content extends boolean> = Content extends true
	? Post
	: Omit<Post, 'content'>;

async function fetchPosts<T extends boolean>({
	conditions,
	content,
	limit
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
					height: true
				}
			}
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
			...(content ? { content: true } : {})
		},
		limit
	});
	return posts as FetchedPost<T>[];
}

export async function getPost({
	conditions,
	incrementViews = false
}: {
	conditions: Conditions;
	incrementViews?: boolean;
}) {
	const posts = await getPosts({
		conditions,
		content: true,
		limit: 1
	});
	const post = posts[0];
	if (!post) {
		throw error(404, 'Post not found');
	}
	if (incrementViews) {
		await db
			.update(postsTable)
			.set({ views: sql`${postsTable.views} + 1` })
			.where(eq(postsTable.id, post.id));
	}
	return post;
}

export async function getPosts<T extends boolean>({
	conditions,
	content,
	limit
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
					'Missing properties in post.banner for media file',
					bannerId
				);
				throw error(500, 'Internal server error');
			}

			return {
				...details,
				banner: {
					id: bannerId,
					placeholder,
					width,
					height
				},
				bannerAlt,
				createdAt: post.createdAt.getTime(),
				updatedAt: post.updatedAt.getTime()
			};
		}
	);
}

export async function getIds() {
	return await db.query.postsTable.findMany({
		where: eq(postsTable.visibility, 'published'),
		columns: { id: true, updatedAt: true },
		orderBy: desc(postsTable.createdAt)
	});
}
