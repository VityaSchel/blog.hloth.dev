import type { DbPost, DbMedia } from "$lib/server/db/schema";

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
};
