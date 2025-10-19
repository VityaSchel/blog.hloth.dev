import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_TITLE } from "$consts";
import { getImage } from "astro:assets";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => {
	const posts = await getCollection("blog");
	const items: import("@astrojs/rss").RSSFeedItem[] = [];
	const base =
		process.env.NODE_ENV === "development"
			? `http://localhost:${process.env.PORT ?? 4321}`
			: (site?.origin ?? null);
	for (const post of posts) {
		const mediaPath = await getImage({ src: post.data.banner }).then(
			(r) => r.src,
		);
		const mediaUrl = new URL(mediaPath, base ?? "https://blog.hloth.dev");
		const mediaMeta = await fetch(mediaUrl);
		const contentLength = await mediaMeta.bytes().then((b) => b.length);
		console.log(contentLength);
		items.push({
			title: post.data.title,
			description: post.data.excerpt,
			pubDate: new Date(post.data.createdAt),
			author:
				"Viktor Shchelochkov / Full Stack Developer <hi@.hloth.dev> (https://hloth.dev/)",
			categories: [post.data.category],
			// content: post.body,
			enclosure: {
				length: contentLength,
				type: mediaUrl.href,
				url: mediaUrl.href,
			},
			customData: `<post-id>${post.id}</post-id>`,
			link: `/${post.id}`,
		});
	}
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: site!,
		items: items.sort((a, b) => b.pubDate!.getTime() - a.pubDate!.getTime()),
	});
};
