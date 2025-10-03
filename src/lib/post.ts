import type { DbPost, DbMedia, DbDraft } from "$lib/server/db/schema";
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

export type Draft = Pick<
	DbDraft,
	| "title"
	| "category"
	| "readTime"
	| "banner"
	| "bannerAlt"
	| "excerpt"
	| "content"
>;

export const reservedSlugs = ["login", "post", "drafts", "api", "sitemap.xml"];
