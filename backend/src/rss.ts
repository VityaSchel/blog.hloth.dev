import * as cheerio from "cheerio";

export type Post = { id: string; title: string; description: string; image: { url: string } };

export async function getPosts(): Promise<Post[]> {
	const req = await fetch(new URL("rss.xml", process.env.ORIGIN));
	if (req.status !== 200) {
		throw new Error(`Failed to fetch RSS feed: ${req.status}`);
	}
	const res = await req.text();
	const $ = cheerio.load(res);
	const channel = $("rss channel")
		.toArray()
		.find((c) => $(":scope > title", c).text() === "hloth blog");
	if (!channel) {
		throw new Error("Failed to find channel in RSS feed");
	}
	const items = $("item", channel)
		.toArray()
		.map((item) => ({
			id: $("post-id", item).text(),
			title: $("title", item).text(),
			description: $("description", item).text(),
			image: {
				url: $("enclosure", item).attr("url")!,
			},
		}));
	return items.reverse();
}
