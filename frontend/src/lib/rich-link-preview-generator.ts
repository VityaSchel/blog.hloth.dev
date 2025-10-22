import z from "zod";
import * as cheerio from "cheerio";

export async function getRichLinkPreview(url: string) {
	try {
		const linkParsing = await z.url().safeParseAsync(url);
		if (!linkParsing.success) {
			throw new Error("Invalid link");
		}
		const link = linkParsing.data;

		let $;
		try {
			const req = await fetch(link);
			if (!req.ok) {
				throw new Error("Failed to fetch the URL");
			}
			const text = await req.text();
			if (text.length > 1000000) {
				throw new Error("Content too large");
			}
			if (!req.headers.get("content-type")?.includes("text/html")) {
				throw new Error("URL does not point to an HTML page");
			}
			$ = cheerio.load(text);
		} catch (e) {
			console.log("Invalid response from URL");
			throw e;
		}

		let description: string | undefined;
		let imageSrc: string | undefined;
		const title = $("title").first().text();
		const linkUrl = new URL(link);
		const siteName =
			$('meta[property="og:site_name"]').attr("content") || linkUrl.hostname;

		const descriptionTag = $('meta[name="description"]').first();
		if (descriptionTag) {
			description = descriptionTag.attr("content");
		}

		const bannerTag = $('meta[property="og:image"]').first();
		if (bannerTag) {
			const bannerTagUrl = bannerTag.attr("content");
			if (bannerTagUrl) {
				try {
					const imageUrl = new URL(bannerTagUrl, linkUrl.origin).href;
					const image = await fetch(imageUrl);
					if (image.status !== 200) {
						throw new Error("Image not found");
					}
					imageSrc = imageUrl;
				} catch {
					console.warn("Invalid image URL:", bannerTagUrl);
				}
			}
		}

		return {
			title,
			siteName,
			description,
			imageSrc,
		};
	} catch (e) {
		console.error(e);
		return null;
	}
}
