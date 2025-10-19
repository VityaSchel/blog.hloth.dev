export const SITE_TITLE = "hloth blog";
export const SITE_DESCRIPTION =
	"Personal blog about web dev, my IRL stuff, tutorials, life stories, shitpost. by hloth aka Viktor Shchelochkov 😘";

export const CATEGORIES_IDS = [
	"life_story",
	"tutorial",
	"project",
	"announcement",
	"review",
] as const;

export type CategoryId = (typeof CATEGORIES_IDS)[number];

export const CATEGORIES: Record<
	CategoryId,
	{ page: string; name: string; plural: string }
> = {
	life_story: {
		page: "life-stories",
		name: "Life Story",
		plural: "Life Stories",
	},
	tutorial: { page: "tutorials", name: "Tutorial", plural: "Tutorials" },
	project: { page: "projects", name: "Project", plural: "Projects" },
	announcement: {
		page: "announcements",
		name: "Announcement",
		plural: "Announcements",
	},
	review: { page: "reviews", name: "Review", plural: "Reviews" },
} as const;
