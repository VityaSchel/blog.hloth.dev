import { error, fail, redirect } from "@sveltejs/kit";
import { match } from "../../params/postid";
import { reservedSlugs } from "$lib/post";
import { isExistingId } from "$lib/server/blog";
import { db } from "$lib/server/db";
import { draftsTable } from "$lib/server/db/schema";

export async function load({ locals }) {
	if (!locals.admin) {
		throw error(401, "Unauthorized");
	}
}

export const actions = {
	// POST /post lmao got it
	default: async ({ request, locals }) => {
		if (!locals.admin) {
			return fail(401, {
				error: "Unauthorized",
			});
		}
		const formData = await request.formData();
		const postId = formData.get("postId");
		if (!postId || typeof postId !== "string") {
			return fail(400, {
				error: "Post ID is required",
			});
		}
		if (!match(postId) || postId.length > 128) {
			return fail(400, {
				error: "Post ID is invalid",
			});
		}
		if (reservedSlugs.includes(postId)) {
			return fail(400, {
				error: "Post ID is reserved",
			});
		}
		if (await isExistingId({ postId, drafts: true })) {
			return fail(409, {
				error: "Post ID is already in use",
			});
		}
		await db.insert(draftsTable).values({
			id: postId,
		});
		return redirect(303, "/" + postId);
	},
};
