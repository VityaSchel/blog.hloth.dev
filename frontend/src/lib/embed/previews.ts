import type { ImageMetadata } from "astro";
import type { EmbedPreviewKey } from "./services";
import { linkKey, spotifyKey, youtubeKey, type Preview } from "./preview-keys";

const DIRECTORY = "/src/content/previews";

const entries = import.meta.glob<Preview>("/src/content/previews/*.json", {
	eager: true,
	import: "default",
});

const images = import.meta.glob<ImageMetadata>(
	"/src/content/previews/*.{jpg,jpeg,png,webp,gif,avif}",
	{ eager: true, import: "default" },
);

const missing = (url: string, file: string) =>
	new Error(
		`No preview for ${url} (previews/${file}): run "bun run prefetch-previews" in frontend/, then commit previews/ in the posts repository`,
	);

const entryOf = <Kind extends Preview["kind"]>(
	kind: Kind,
	key: string,
	url: string,
) => {
	const file = `${key}.json`;
	const found = entries[`${DIRECTORY}/${file}`];
	if (found?.kind !== kind) throw missing(url, file);
	return found as Extract<Preview, { kind: Kind }>;
};

const imageOf = (url: string, file: string) => {
	const found = images[`${DIRECTORY}/${file}`];
	if (!found) throw missing(url, file);
	return found;
};

export const embedPreview = (key: EmbedPreviewKey, url: string) => {
	if (key.kind === "youtube") {
		const found = entryOf("youtube", youtubeKey(key.id), url);
		return { title: found.title, image: imageOf(url, found.image) };
	}
	const found = entryOf("spotify", spotifyKey(key.id), url);
	return {
		title: found.title,
		subtitle: found.subtitle,
		image: imageOf(url, found.image),
	};
};

export const linkPreview = (url: string) => {
	const found = entryOf("link", linkKey(url), url);
	if (found.url !== url) throw missing(url, `${linkKey(url)}.json`);
	return {
		title: found.title,
		siteName: found.siteName,
		description: found.description,
		image: found.image ? imageOf(url, found.image) : undefined,
	};
};
