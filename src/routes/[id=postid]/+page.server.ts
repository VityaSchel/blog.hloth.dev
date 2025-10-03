import { getPost, incrementViews } from "$lib/server/blog";
import { db } from "$lib/server/db";
import { postsTable } from "$lib/server/db/schema";
import { eq, and, inArray, desc, lt } from "drizzle-orm";
// import { codeToHtml } from "shiki";

export async function load({ params, locals }) {
	let visibilityCondition;
	if (locals.admin)
		visibilityCondition = inArray(postsTable.visibility, [
			"published",
			"unlisted",
		]);

	const post = await getPost({
		conditions: {
			where: and(eq(postsTable.id, params.id), visibilityCondition),
		},
	});

	void incrementViews(post.id);

	const nextPost = await db.query.postsTable.findFirst({
		where: and(
			lt(postsTable.createdAt, new Date(post.createdAt)),
			visibilityCondition,
		),
		orderBy: desc(postsTable.createdAt),
		columns: {
			title: true,
			id: true,
		},
	});

	// TODO: fix code blocks for SSR
	// for (const block of content.blocks) {
	// 	if (block.type === 'code') {
	// 		try {
	// 			block.data.ssr = await codeToHtml(block.data.code, {
	// 				lang: block.data.languageCode.substring('language-'.length),
	// 				theme: locals.theme === 'dark' ? 'github-dark' : 'github-light'
	// 			});
	// 		} catch (e) {
	// 			console.error(e);
	// 			// Skip
	// 		}
	// 	}
	// }

	return {
		post,
		nextPost,
		admin: locals.admin,
	};
}
