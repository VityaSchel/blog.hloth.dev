import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES_IDS } from "$consts";

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			excerpt: z.string(),
			category: z.enum([CATEGORIES_IDS[0]!, ...CATEGORIES_IDS.slice(1)]),
			readTime: z.number().min(1).max(90),
			banner: image(),
			bannerAlt: z.string().min(1),
			createdAt: z.coerce.date(),
			updatedAt: z.coerce.date().optional(),
			locale: z.enum(["en", "ru"]).default("en"),
		}),
});

const drafts = defineCollection({
	loader: glob({ base: "./src/content/drafts", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			title: z.string().optional(),
			excerpt: z.string().optional(),
			category: z
				.enum([CATEGORIES_IDS[0]!, ...CATEGORIES_IDS.slice(1)])
				.optional(),
			readTime: z.number().min(1).max(90).optional(),
			banner: image().optional(),
			bannerAlt: z.string().min(1).optional(),
			createdAt: z.coerce.date().optional(),
			updatedAt: z.coerce.date().optional(),
			locale: z.enum(["en", "ru"]).default("en"),
		}),
});

export const collections = { blog, drafts };
