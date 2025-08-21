import * as sitemap from 'super-sitemap';
import { error, type RequestHandler } from '@sveltejs/kit';
import { getIds } from '$lib/server/blog';
import { NODE_ENV } from '$env/static/private';

export const GET: RequestHandler = async () => {
	let blogIds;
	try {
		blogIds = await getIds();
	} catch (e) {
		if (NODE_ENV === 'development') console.error(e);
		throw error(500, 'Could not load data for param values.');
	}

	return await sitemap.response({
		origin: 'https://blog.hloth.dev',
		excludeRoutePatterns: ['^/drafts$', '^/post$', '^/login$'],
		paramValues: {
			'/[id=postid]': blogIds.map((post) => ({
				values: [post.id],
				lastmod: post.updatedAt.toISOString()
			}))
		},
		defaultChangefreq: 'daily',
		defaultPriority: 0.7
	});
};
