import { postCategorySchema } from "$lib/zod";
import { loadPosts } from "./loader.server";
import { redirect } from "@sveltejs/kit";

export async function load({ url, locals }) {
	const categoryFilter = await postCategorySchema.safeParseAsync(
		url.searchParams.get("category"),
	);
	return {
		...(await loadPosts({
			category: categoryFilter.data,
			visibility: locals.admin ? "admin" : "public",
		})),
		category: categoryFilter.success,
	};
}

export const actions = {
	async theme({ request, cookies, url }) {
		const body = await request.formData();
		const switchToDarkTheme = body.get("theme") === "dark";
		let redirectPath;
		try {
			const redirectPathParam = body.get("redirect");
			if (typeof redirectPathParam !== "string")
				throw new Error("Invalid redirect path");
			const dest = new URL(redirectPathParam, url);
			if (dest.origin !== url.origin)
				throw new Error("Redirect to a different origin is not allowed");
			redirectPath = dest.pathname + dest.search;
		} catch {
			redirectPath = "/";
		}
		cookies.set("blog.hloth.dev-theme", switchToDarkTheme ? "dark" : "light", {
			httpOnly: false,
			path: "/",
		});
		return redirect(302, redirectPath);
	},
};
