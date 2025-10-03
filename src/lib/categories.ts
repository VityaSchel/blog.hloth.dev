import type { DbCategory } from "$lib/server/db/schema";

export const categories: DbCategory[] = [
	"life_story",
	"tutorial",
	"project",
	"announcement",
	"review",
] as const;

export type CategoryValue = (typeof categories)[number];

export const categoriesNames: Record<CategoryValue, string> = {
	life_story: "Life Story",
	project: "Project",
	tutorial: "Tutorial",
	announcement: "Announcement",
	review: "Review",
} as const;
