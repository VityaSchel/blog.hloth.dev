import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./consts";

const blogCategories = CATEGORIES.map((c) => c.id);

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			excerpt: z.string(),
			category: z.enum([blogCategories[0]!, ...blogCategories.slice(1)]),
			readTime: z.number().min(1).max(90),
			banner: image(),
			bannerAlt: z.string().min(1),
			createdAt: z.coerce.date(),
			updatedAt: z.coerce.date().optional(),
		}),
});

export const collections = { blog };
