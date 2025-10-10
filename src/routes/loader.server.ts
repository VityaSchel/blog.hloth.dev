import { eq, desc } from "drizzle-orm";
import { postsTable } from "$lib/server/db/schema";
import { getPosts } from "$lib/server/blog";
import type { CategoryValue } from "$lib/categories";

export async function loadPosts({
	category,
}: {
	category?: CategoryValue;
	visibility?: "public" | "admin" | "drafts";
}) {
	const posts = await getPosts({
		conditions: {
			where:
				category !== undefined ? eq(postsTable.category, category) : undefined,
			orderBy: desc(postsTable.createdAt),
		},
		content: false,
	});
	return {
		posts,
	};
}
