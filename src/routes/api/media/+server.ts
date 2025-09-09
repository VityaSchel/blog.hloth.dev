import { z } from 'zod';
import { error, isHttpError, json } from '@sveltejs/kit';
import { STORAGE_PATH } from '$env/static/private';
import fs from 'fs/promises';
import path from 'path';
import { getPlaiceholder } from 'plaiceholder';
import sharp from 'sharp';
import { db } from '$lib/server/db';
import { mediaTable } from '$lib/server/db/schema';
import { getUrl } from '$lib/media';

export async function POST({ url, locals, request }) {
	try {
		if (!locals.admin) {
			throw error(403, 'Unauthorized');
		}
		const remote = url.searchParams.get('remote') === 'true';

		const typeParsing = await z
			.enum(['video', 'image'])
			.safeParseAsync(url.searchParams.get('type'));
		if (!typeParsing.success) {
			throw error(400, 'Invalid media type in query');
		}
		const type = typeParsing.data;

		const cropParsing = await z
			.enum(['banner'])
			.nullable()
			.safeParseAsync(url.searchParams.get('crop'));
		if (!cropParsing.success) {
			throw error(400, 'Invalid crop argument in query');
		}
		const crop = cropParsing.data;

		let content: Uint8Array;
		let contentType: string;
		try {
			if (remote) {
				const { url } = await z
					.object({ url: z.url() })
					.parseAsync(await request.json());
				const req = await fetch(url);
				content = await req.bytes();
				contentType =
					req.headers.get('content-type') ?? 'application/octet-stream';
			} else {
				const formData = await request.formData();
				const file = formData.get(type);
				if (file === null || !(file instanceof File))
					throw new Error('Invalid file');
				content = await file.bytes();
				contentType = file.type;
			}
		} catch (e) {
			console.error(e);
			throw error(400, 'Invalid request');
		}

		const supportedMimeTypes = {
			image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
			video: ['mp4', 'webm']
		};

		let extension = contentType.split('/')[1];

		if (!supportedMimeTypes[type].includes(extension)) {
			throw error(415, 'Unsupported file type');
		}

		const maxSize = (type === 'image' ? 3 : 50) * 1000 * 1000;
		if (content.length > maxSize) {
			throw error(413, 'File too large');
		}

		let file;
		if (type === 'image') {
			let img = await sharp(content).autoOrient();
			const { width, height } = await img.metadata();
			const aspectRatio = width / height;
			if (!Number.isFinite(aspectRatio)) {
				throw error(415, 'Invalid image');
			}
			if (crop === 'banner') {
				let newWidth: number, newHeight: number;
				const targetAspectRatio = 1625 / 1000;
				if (aspectRatio > 1) {
					newWidth = Math.min(width, 1625);
					newHeight = Math.round(newWidth / targetAspectRatio);
				} else if (aspectRatio < 1) {
					newHeight = Math.min(height, 1000);
					newWidth = Math.round(newHeight * targetAspectRatio);
				} else {
					newWidth = newHeight = width;
				}
				img = img.resize({
					width: newWidth,
					height: newHeight,
					fit: 'cover',
					position: 'center'
				});
			}
			content = await img.webp({ quality: 80, force: true }).toBuffer();
			extension = 'webp';
			const placeholder = (await getPlaiceholder(Buffer.from(content))).base64;
			file = {
				placeholder,
				width,
				height
			};
		}
		const id = crypto.randomUUID() + '.' + extension;
		await fs.writeFile(path.join(STORAGE_PATH, id), content, 'binary');
		await db.insert(mediaTable).values({
			id,
			...file
		});
		return json({
			success: 1,
			file: {
				id,
				url: getUrl(id),
				...file
			}
		});
	} catch (e) {
		if (isHttpError(e)) {
			console.error(e);
			return json({ success: 0, error: e.body.message }, { status: e.status });
		} else {
			throw e;
		}
	}
}
