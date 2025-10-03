import type { DbPost, DbMedia } from "$lib/server/db/schema";
import type { Reaction } from "$lib/reactions";

export type Post = Pick<
	DbPost,
	| "id"
	| "title"
	| "bannerAlt"
	| "excerpt"
	| "category"
	| "readTime"
	| "views"
	| "createdAt"
	| "updatedAt"
	| "content"
	| "locale"
> & {
	banner: Pick<DbMedia, "id" | "placeholder" | "width" | "height">;
} & {
	reactions: Record<Reaction, number>;
};

export const reservedSlugs = ["login", "post", "drafts", "api", "sitemap.xml"];
