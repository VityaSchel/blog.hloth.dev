import { and, eq, desc, ne } from 'drizzle-orm';
import { postsTable, type Category } from '$lib/server/db/schema';
import { getPosts } from '$lib/server/blog';

export async function loadPosts({
	category,
	visibility
}: {
	category?: Category;
	visibility?: 'public' | 'admin' | 'drafts';
}) {
	const posts = await getPosts({
		conditions: {
			where: and(
				eq(postsTable.visibility, 'published'),
				category !== undefined ? eq(postsTable.category, category) : undefined,
				visibility === 'public'
					? eq(postsTable.visibility, 'published')
					: visibility === 'drafts'
						? eq(postsTable.visibility, 'hidden')
						: ne(postsTable.visibility, 'hidden')
			),
			orderBy: desc(postsTable.createdAt)
		},
		content: false
	});
	return {
		posts
	};
}
