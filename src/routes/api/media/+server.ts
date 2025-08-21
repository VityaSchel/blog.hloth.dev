import { z } from 'zod';
import { error, json } from '@sveltejs/kit';
import { NODE_ENV, STORAGE_PATH } from '$env/static/private';
import fs from 'fs/promises';
import path from 'path';
import { getPlaiceholder } from 'plaiceholder';
import sharp from 'sharp';
import { db } from '$lib/server/db';
import { mediaTable } from '$lib/server/db/schema';
import { getUrl } from '$lib/media';

export async function POST({ url, locals, request }) {
	if (!locals.admin) {
		throw error(403, 'Unauthorized');
	}
	const remote = url.searchParams.get('remote') === 'true';
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
			const file = formData.get('image');
			if (file === null || !(file instanceof File))
				throw new Error('Invalid file');
			content = await file.bytes();
			contentType = file.type;
		}
	} catch (e) {
		if (NODE_ENV === 'development') console.error(e);
		throw error(400, 'Invalid request');
	}

	const imageMimeTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
	const videoMimeTypes = ['mp4', 'webm'];
	const supportedMimeTypes = [...imageMimeTypes, ...videoMimeTypes];

	const extension = contentType.split('/')[1];

	if (!supportedMimeTypes.includes(extension)) {
		throw error(415, 'Unsupported file type');
	}

	const maxSize = 50 * 1000 * 1000;
	if (content.length > maxSize) {
		throw error(413, 'File too large');
	}

	const id = crypto.randomUUID() + extension;
	await fs.writeFile(path.join(STORAGE_PATH, id), content, 'binary');

	let file;
	if (imageMimeTypes.includes(extension)) {
		const { width, height } = await sharp(content).metadata();
		const placeholder = (await getPlaiceholder(Buffer.from(content))).base64;
		file = {
			placeholder,
			width,
			height
		};
	}
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
}
