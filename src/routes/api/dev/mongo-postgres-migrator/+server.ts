import { NODE_ENV } from '$env/static/private';
import { categorySchema } from '$lib/categories';
import { legacyContentSchema, type Content } from '$lib/editorjs/blocks';
import { db } from '$lib/server/db';
import { mediaTable, postsTable } from '$lib/server/db/schema';
import { noNullCharacter } from '$lib/zod';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';

export async function POST({ request }) {
	if (NODE_ENV !== 'development') {
		throw error(403, 'Unauthorized');
	}
	const object = await request.json();
	const schema = z.strictObject({
		_id: z.unknown(),
		locale: z.unknown(),
		slug: z.string().refine(noNullCharacter).min(1).max(64),
		banner: z.strictObject({
			src: z.url(),
			placeholder: z.string(),
			alt: z.string().refine(noNullCharacter).min(1).max(1024),
			width: z.number().int().min(1),
			height: z.number().int().min(1)
		}),
		category: categorySchema,
		content: legacyContentSchema.strict(),
		createdAt: z.strictObject({
			$date: z.iso.datetime()
		}),
		draft: z.boolean(),
		excerpt: z.string().min(1).max(512),
		readingTime: z.number().int().min(1).max(90),
		title: z.string().refine(noNullCharacter).min(1).max(64),
		updatedAt: z.strictObject({
			$date: z.iso.datetime()
		}),
		views: z.number().int().min(0)
	});

	const post = schema.parse(object);
	async function uploadFile(file: {
		src: string;
		placeholder?: string | null;
		width?: number | null;
		height?: number | null;
	}) {
		const id = file.src.substring('https://blog.hloth.dev/files/'.length);
		try {
			await db.insert(mediaTable).values({
				id,
				width: file.width,
				height: file.height,
				placeholder: file.placeholder
			});
		} catch {
			// Skip
		}
		return id;
	}
	const content: Content = {
		time: post.content.time,
		version: post.content.version,
		blocks: []
	};
	for (const block of post.content.blocks) {
		if (block.type === 'image') {
			const file = block.data.file;
			let media:
				| {
						type: 'image';
						src: string;
						width: number;
						height: number;
						placeholder: string;
				  }
				| {
						type: 'video';
						src: string;
				  };
			if (file.url.endsWith('.mp4')) {
				media = {
					type: 'video',
					src: file.url
				};
			} else {
				if (!file.width || !file.height || !file.placeholder) {
					console.error(file);
					throw error(
						400,
						'Image file must have width, height, and placeholder'
					);
				}
				media = {
					type: 'image',
					src: file.url,
					width: file.width,
					height: file.height,
					placeholder: file.placeholder
				};
			}
			const fileId = await uploadFile({
				src: file.url,
				...(media.type === 'image' && {
					placeholder: media.placeholder,
					width: media.width,
					height: media.height
				})
			});
			content.blocks.push(
				media.type === 'video'
					? {
							id: block.id,
							type: 'video',
							data: {
								caption: block.data.caption,
								file: {
									id: fileId
								}
							}
						}
					: {
							id: block.id,
							type: 'image',
							data: {
								caption: block.data.caption,
								alt: block.data.caption || 'Image',
								withBackground: block.data.withBackground,
								withBorder: block.data.withBorder,
								file: {
									id: fileId,
									width: media.width,
									height: media.height,
									placeholder: media.placeholder
								}
							}
						}
			);
		} else if (block.type === 'list') {
			content.blocks.push({
				...block,
				data: {
					...block.data,
					items: block.data.items.map((i) => ({
						meta: {},
						content: i,
						items: []
					}))
				}
			});
		} else {
			content.blocks.push(block);
		}
	}
	await db.insert(postsTable).values({
		id: post.slug,
		title: post.title,
		category: post.category,
		readTime: post.readingTime,
		banner: await uploadFile(post.banner),
		bannerAlt: post.banner.alt,
		content: content,
		excerpt: post.excerpt,
		visibility: post.draft ? 'hidden' : 'published',
		createdAt: new Date(post.createdAt.$date),
		updatedAt: new Date(post.updatedAt.$date),
		views: post.views
	});
	return json({ ok: true });
}
