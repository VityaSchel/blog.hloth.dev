import z from "zod";
import * as cheerio from "cheerio";
import { cached } from "$lib/cache";
import { ONE_WEEK_MS, firstReachable } from "$lib/remote";

export type RichLinkPreview = {
	title: string;
	siteName: string;
	description?: string;
	imageSrc?: string;
};

const MAX_HTML_BYTES = 1_000_000;

const loadDocument = async (link: string) => {
	const response = await fetch(link, { signal: AbortSignal.timeout(8000) });
	if (!response.ok) throw new Error(`Failed to fetch ${link}`);
	if (!response.headers.get("content-type")?.includes("text/html"))
		throw new Error(`Not an HTML page: ${link}`);
	const text = await response.text();
	if (text.length > MAX_HTML_BYTES)
		throw new Error(`Content too large: ${link}`);
	return cheerio.load(text);
};

const fetchPreview = async (link: string): Promise<RichLinkPreview> => {
	const $ = await loadDocument(link);
	const linkUrl = new URL(link);
	const image = $('meta[property="og:image"]').first().attr("content");
	return {
		title: $("title").first().text(),
		siteName:
			$('meta[property="og:site_name"]').attr("content") || linkUrl.hostname,
		description: $('meta[name="description"]').first().attr("content"),
		imageSrc:
			image && URL.canParse(image, linkUrl.origin)
				? await firstReachable([new URL(image, linkUrl.origin).href])
				: undefined,
	};
};

export async function getRichLinkPreview(
	url: string,
): Promise<RichLinkPreview | null> {
	const link = z.url().safeParse(url);
	if (!link.success) return null;
	try {
		return await cached("rich-link", link.data, () => fetchPreview(link.data), {
			maxAgeMs: ONE_WEEK_MS,
		});
	} catch (error) {
		console.warn(`RichLink preview unavailable for ${url}:`, error);
		return null;
	}
}
