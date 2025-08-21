import { getPost } from '$lib/server/blog';
import { db } from '$lib/server/db';
import { postsTable } from '$lib/server/db/schema';
import { eq, and, inArray, desc, lt } from 'drizzle-orm';

export async function load({ params, locals }) {
	let visibilityCondition;
	if (locals.admin)
		visibilityCondition = inArray(postsTable.visibility, [
			'published',
			'unlisted'
		]);

	const post = await getPost({
		conditions: {
			where: and(eq(postsTable.id, params.id), visibilityCondition)
		},
		incrementViews: true
	});

	const nextPost = await db.query.postsTable.findFirst({
		where: and(
			lt(postsTable.createdAt, new Date(post.createdAt)),
			visibilityCondition
		),
		orderBy: desc(postsTable.createdAt),
		columns: {
			title: true,
			id: true
		}
	});

	return {
		post,
		nextPost,
		admin: locals.admin
	};
}
