import { db } from "$lib/server/db";
import { postsTable } from "$lib/server/db/schema";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export async function load({ locals, url }) {
	if (!locals.admin) {
		throw error(403, "Unauthorized");
	}

	const id = url.searchParams.get("edit");
	if (id) {
		const post = await db.query.postsTable.findFirst({
			where: eq(postsTable.id, id),
		});
		if (!post) {
			throw error(404, "Post not found");
		}
		return {
			initial: {
				id,
				title: post.title,
				category: post.category,
				readTime: post.readTime,
				banner: post.banner,
				bannerAlt: post.bannerAlt,
				excerpt: post.excerpt,
				content: post.content,
			},
		};
	} else {
		return { initial: null };
	}
}
