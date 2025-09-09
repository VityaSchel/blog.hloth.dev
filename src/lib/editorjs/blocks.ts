import { imageSchema, videoSchema } from '$lib/media';
import z from 'zod';

export const headerBlockSchema = z.object({
	type: z.literal('header'),
	data: z.object({
		text: z.string().max(1024),
		level: z.number().int().min(1).max(6)
	})
});

export const paragraphBlockSchema = z.object({
	type: z.literal('paragraph'),
	data: z.object({
		text: z.string().max(64 * 1024)
	})
});

export const linkToolBlockSchema = z.object({
	type: z.literal('linkTool'),
	data: z.object({
		link: z.url().max(2048),
		meta: z.object({
			title: z.string().max(512).optional(),
			site_name: z.string().max(256).optional(),
			description: z.string().max(2048).optional(),
			image: z
				.object({
					url: z.url().optional()
				})
				.optional()
		})
	})
});

export const delimiterBlockSchema = z.object({
	type: z.literal('delimiter'),
	data: z.object({})
});

export const listItemsSchema = z.array(
	z.object({
		content: z.string().max(8192),
		meta: z.object({
			checked: z.boolean().optional()
		}),
		get items() {
			return listItemsSchema;
		}
	})
);

export type ListItems = z.infer<typeof listItemsSchema>;

export const listBlockSchema = z.object({
	type: z.literal('list'),
	data: z.object({
		style: z.enum(['ordered', 'unordered', 'checklist']),
		items: listItemsSchema
	})
});

export const quoteBlockSchema = z.object({
	type: z.literal('quote'),
	data: z.object({
		text: z.string().max(64 * 1024),
		caption: z.string().max(1024)
	})
});

export const warningBlockSchema = z.object({
	type: z.literal('warning'),
	data: z.object({
		title: z.string().max(256),
		message: z.string().max(2048)
	})
});

export const imageBlockSchema = z.object({
	type: z.literal('image'),
	data: z.object({
		file: imageSchema,
		alt: z.string().min(1).max(1024),
		caption: z.string().max(1024),
		withBorder: z.boolean(),
		withBackground: z.boolean()
	})
});

export const videoBlockSchema = z.object({
	type: z.literal('video'),
	data: z.object({
		file: videoSchema,
		caption: z.string().max(1024),
		aspectRatio: z.number().positive()
	})
});

export const codeBlockSchema = z.object({
	type: z.literal('code'),
	data: z.object({
		code: z.string().max(64 * 1024),
		languageCode: z.string().max(128)
	})
});

export const embedBlockSchema = z.object({
	type: z.literal('embed'),
	data: z.object({
		service: z.string(),
		source: z.url(),
		embed: z.url(),
		width: z.number().int().min(1),
		height: z.number().int().min(1),
		caption: z.string().max(1024)
	})
});

export const paywallBlockSchema = z.object({
	type: z.literal('paywall'),
	data: z.object({
		links: z.array(
			z.object({
				url: z.string().max(1024),
				title: z.string().max(512)
			})
		)
	})
});

export const contentBlockSchema = z.discriminatedUnion('type', [
	headerBlockSchema,
	paragraphBlockSchema,
	linkToolBlockSchema,
	delimiterBlockSchema,
	listBlockSchema,
	quoteBlockSchema,
	warningBlockSchema,
	imageBlockSchema,
	videoBlockSchema,
	codeBlockSchema,
	paywallBlockSchema,
	embedBlockSchema
]);

export const contentSchema = z.object({
	time: z.number().optional(),
	blocks: z.array(contentBlockSchema.and(z.object({ id: z.string() }))),
	version: z.string()
});

export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type Content = z.infer<typeof contentSchema>;
export type ContentPostSSR = Omit<Content, 'blocks'> & {
	blocks: Array<
		ContentBlock & { id: string } extends infer T
			? T extends { type: 'code'; data: infer D }
				? T & { data: D & { ssr?: string } }
				: T
			: never
	>;
};
