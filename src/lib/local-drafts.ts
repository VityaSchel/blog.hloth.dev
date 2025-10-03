import { categorySchema } from "$lib/categories";
import { mediaFileIdSchema } from "$lib/media";
import { z } from "zod";

const postFullSchema = z.object({
	id: z.string(),
	title: z.string(),
	banner: mediaFileIdSchema.nullable(),
	bannerAlt: z.string().nullable(),
	excerpt: z.string(),
	category: categorySchema,
	readTime: z.number().int().nonnegative().max(90),
	content: z.string(),
});

export type PostDraftSchema = z.infer<typeof postFullSchema>;

export function getDraft() {
	const postSerialized = window.localStorage.getItem("blog.hloth.dev-draft");
	if (postSerialized === null) {
		return null;
	} else {
		const parsing = postFullSchema.safeParse(JSON.parse(postSerialized));
		if (parsing.success) {
			return parsing.data;
		} else {
			return null;
		}
	}
}

export function saveDraft(post: z.infer<typeof postFullSchema>) {
	postFullSchema.parse(post);
	window.localStorage.setItem("blog.hloth.dev-draft", JSON.stringify(post));
}

export function clearDraft() {
	window.localStorage.removeItem("blog.hloth.dev-draft");
}
