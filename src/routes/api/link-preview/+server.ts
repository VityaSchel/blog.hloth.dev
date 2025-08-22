import { z } from 'zod';
import { error, isHttpError, json } from '@sveltejs/kit';
import { NODE_ENV } from '$env/static/private';
import * as cheerio from 'cheerio';

export async function GET({ url, locals }) {
	try {
		if (!locals.admin) {
			throw error(403, 'Unauthorized');
		}
		const linkParsing = await z
			.url()
			.safeParseAsync(url.searchParams.get('url'));
		if (!linkParsing.success) {
			throw error(400, 'Invalid link');
		}
		const link = linkParsing.data;

		let $;
		try {
			const req = await fetch(link);
			if (!req.ok) {
				throw new Error('Failed to fetch the URL');
			}
			const text = await req.text();
			if (text.length > 1000000) {
				throw error(413, 'Content too large');
			}
			if (!req.headers.get('content-type')?.includes('text/html')) {
				throw error(415, 'URL does not point to an HTML page');
			}
			$ = cheerio.load(text);
		} catch (e) {
			if (NODE_ENV === 'development') console.error(e);
			throw error(400, 'Invalid response from URL');
		}

		let description: string | undefined;
		let imageUrl: string | undefined;
		const title = $('title').first().text();
		const site_name =
			$('meta[property="og:site_name"]').attr('content') ||
			new URL(link).hostname;

		const descriptionTag = $('meta[name="description"]').first();
		if (descriptionTag) {
			description = descriptionTag.attr('content');
		}

		const bannerTag = $('meta[property="og:image"]').first();
		if (bannerTag) {
			imageUrl = bannerTag.attr('content');
		}

		return json({
			success: 1,
			meta: {
				title,
				site_name,
				description,
				image: { url: imageUrl }
			}
		});
	} catch (e) {
		if (isHttpError(e)) {
			return json({ success: 0, error: e.body.message }, { status: e.status });
		} else {
			throw e;
		}
	}
}
