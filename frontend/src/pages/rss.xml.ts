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
		const banner = await getImage({ src: post.data.banner });
		const bannerUrl = new URL(banner.src, base ?? "https://blog.hloth.dev");
		items.push({
			title: post.data.title,
			description: post.data.excerpt,
			pubDate: new Date(post.data.createdAt),
			author:
				"Viktor Shchelochkov / Full Stack Developer <hi@.hloth.dev> (https://hloth.dev/)",
			categories: [post.data.category],
			// content: post.body,
			enclosure: {
				// https://www.rssboard.org/rss-profile#element-channel-item-enclosure:~:text=When%20an%20enclosure%27s%20size%20cannot%20be%20determined%2C%20a%20publisher%20SHOULD%20use%20a%20length%20of%200
				length: 0,
				type: "image/" + post.data.banner.format,
				url: bannerUrl.href,
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
