// The site build has no network access, so it reads embed and link previews only from <content>/previews.
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveEmbed, type EmbedPreviewKey } from "../src/lib/embed/services";
import {
	linkKey,
	spotifyKey,
	youtubeKey,
	type LinkPreview,
	type SpotifyPreview,
	type YouTubePreview,
} from "../src/lib/embed/preview-keys";

const MAX_PAGE_BYTES = 1_000_000;
const MAX_IMAGE_BYTES = 5_000_000;
const USER_AGENT = "Mozilla/5.0 (compatible; blog-previews/1.0)";
const IMAGE_TYPES: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/avif": "avif",
};
const ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

const args = process.argv.slice(2);
const refresh = args.includes("--refresh");
const content = path.resolve(
	args.find((arg) => !arg.startsWith("--")) ??
		path.join(import.meta.dir, "../src/content"),
);
const out = path.join(content, "previews");

const postFiles = async (directory: string): Promise<string[]> => {
	const entries = await readdir(directory, {
		withFileTypes: true,
		recursive: true,
	}).catch(() => []);
	return entries
		.filter((entry) => entry.isFile() && /\.mdx?$/.test(entry.name))
		.map((entry) => path.join(entry.parentPath, entry.name));
};

const attribute = (tag: string, name: string) =>
	new RegExp(`\\b${name}="([^"]+)"`).exec(tag)?.[1];

const tags = (source: string, name: string) =>
	source.match(new RegExp(`<${name}\\b[^>]*>`, "g")) ?? [];

const writeAtomic = async (file: string, data: string | Uint8Array) => {
	await writeFile(`${file}.tmp`, data);
	await rename(`${file}.tmp`, file);
};

const writeEntry = (key: string, entry: object) =>
	writeAtomic(
		path.join(out, `${key}.json`),
		`${JSON.stringify(entry, null, "\t")}\n`,
	);

const get = async (url: string, accept: string) => {
	const response = await fetch(url, {
		headers: { "User-Agent": USER_AGENT, Accept: accept },
		redirect: "follow",
		signal: AbortSignal.timeout(20_000),
	});
	if (!response.ok) throw new Error(`${url} answered ${response.status}`);
	return response;
};

const readLimited = async (response: Response, limit: number) => {
	const body = new Uint8Array(await response.arrayBuffer());
	if (body.length > limit)
		throw new Error(`${response.url} is over ${limit} bytes`);
	return body;
};

const saveImage = async (url: string, key: string) => {
	const response = await get(url, "image/*");
	const type = (response.headers.get("content-type") ?? "").split(";")[0]!;
	const extension = IMAGE_TYPES[type.trim()];
	if (!extension)
		throw new Error(`${url} is not a JPEG, PNG, WebP, GIF or AVIF image`);
	const name = `${key}.${extension}`;
	await writeAtomic(
		path.join(out, name),
		await readLimited(response, MAX_IMAGE_BYTES),
	);
	return name;
};

const decode = (text: string) =>
	text
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
			String.fromCodePoint(parseInt(hex, 16)),
		)
		.replace(/&#([0-9]+);/g, (_, digits) =>
			String.fromCodePoint(parseInt(digits, 10)),
		)
		.replace(
			/&([a-z]+);/gi,
			(match, name) => ENTITIES[name.toLowerCase()] ?? match,
		)
		.replace(/\s+/g, " ")
		.trim();

const meta = (html: string, kind: "name" | "property", value: string) => {
	for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
		const key = new RegExp(`\\b${kind}\\s*=\\s*["']([^"']*)["']`, "i").exec(
			tag,
		)?.[1];
		if (key?.toLowerCase() !== value) continue;
		const found = /\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i.exec(
			tag,
		);
		if (found) return decode(found[1] ?? found[2] ?? "");
	}
	return undefined;
};

const page = async (url: string) => {
	const response = await get(url, "text/html");
	if (!(response.headers.get("content-type") ?? "").includes("text/html"))
		throw new Error(`${url} is not an HTML page`);
	return {
		url: response.url,
		html: new TextDecoder().decode(await readLimited(response, MAX_PAGE_BYTES)),
	};
};

const youtube = async (videoId: string, url: string) => {
	const key = youtubeKey(videoId);
	const watch = `https://www.youtube.com/watch?v=${videoId}`;
	const oembed = (await (
		await get(
			`https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`,
			"application/json",
		)
	).json()) as { title?: string; thumbnail_url?: string };
	if (!oembed.title) throw new Error(`YouTube has no title for ${videoId}`);
	const candidates = [
		"maxresdefault",
		"hq720",
		"sddefault",
		"hqdefault",
		"mqdefault",
		"default",
	].map((size) => `https://i.ytimg.com/vi/${videoId}/${size}.jpg`);
	if (oembed.thumbnail_url) candidates.push(oembed.thumbnail_url);
	let image: string | undefined;
	for (const candidate of candidates) {
		image = await saveImage(candidate, key).catch(() => undefined);
		if (image) break;
	}
	if (!image) throw new Error(`no thumbnail of ${videoId} could be fetched`);
	const entry: YouTubePreview = {
		kind: "youtube",
		url,
		title: oembed.title,
		image,
		fetched: new Date().toISOString(),
	};
	await writeEntry(key, entry);
};

const spotify = async (id: string, url: string, link: string) => {
	const key = spotifyKey(id);
	const oembed = (await (
		await get(
			`https://open.spotify.com/oembed?url=${encodeURIComponent(link)}`,
			"application/json",
		)
	).json()) as { title?: string; thumbnail_url?: string };
	if (!oembed.title || !oembed.thumbnail_url)
		throw new Error(`Spotify has no title or cover for ${link}`);
	const image = await saveImage(oembed.thumbnail_url, key);
	const subtitle = await page(link)
		.then(({ html }) => meta(html, "name", "music:musician_description"))
		.catch(() => undefined);
	const entry: SpotifyPreview = {
		kind: "spotify",
		url,
		title: oembed.title,
		...(subtitle ? { subtitle } : {}),
		image,
		fetched: new Date().toISOString(),
	};
	await writeEntry(key, entry);
};

const richLink = async (url: string) => {
	const key = linkKey(url);
	const { url: finalUrl, html } = await page(url);
	const title = decode(
		/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "",
	);
	const ogImage = meta(html, "property", "og:image");
	const image = ogImage
		? await saveImage(new URL(ogImage, finalUrl).href, key).catch(
				() => undefined,
			)
		: undefined;
	const entry: LinkPreview = {
		kind: "link",
		url,
		title: title || new URL(url).hostname,
		siteName: meta(html, "property", "og:site_name") || new URL(url).hostname,
		description: meta(html, "name", "description"),
		...(image ? { image } : {}),
		fetched: new Date().toISOString(),
	};
	await writeEntry(key, entry);
};

const embedFetcher = (key: EmbedPreviewKey, url: string, link: string) =>
	key.kind === "youtube"
		? { name: `${youtubeKey(key.id)}.json`, run: () => youtube(key.id, url) }
		: {
				name: `${spotifyKey(key.id)}.json`,
				run: () => spotify(key.id, url, link),
			};

const published = await postFiles(path.join(content, "blog"));
const drafts = await postFiles(path.join(content, "drafts"));
const wanted = new Map<
	string,
	{ run: () => Promise<void>; draftOnly: boolean }
>();
const problems: string[] = [];
for (const file of [...published, ...drafts]) {
	const draft = drafts.includes(file);
	const want = (name: string, run: () => Promise<void>) =>
		wanted.set(name, {
			run,
			draftOnly: draft && (wanted.get(name)?.draftOnly ?? true),
		});
	const source = await readFile(file, "utf8");
	for (const tag of tags(source, "Embed")) {
		const url = attribute(tag, "url");
		if (!url) continue;
		try {
			const embed = resolveEmbed(url, attribute(tag, "service"), 16 / 9);
			if (!embed.preview) continue;
			const { name, run } = embedFetcher(embed.preview, url, embed.link);
			want(name, run);
		} catch (error) {
			problems.push(
				`${path.relative(content, file)}: ${url}: ${(error as Error).message}`,
			);
		}
	}
	for (const tag of tags(source, "RichLink")) {
		const url = attribute(tag, "url");
		if (url) want(`${linkKey(url)}.json`, () => richLink(url));
	}
}

await mkdir(out, { recursive: true });
let fetched = 0;
let present = 0;
const failed: string[] = [];
const draftFailed: string[] = [];
for (const [name, { run, draftOnly }] of wanted) {
	if (!refresh && (await Bun.file(path.join(out, name)).exists())) {
		present++;
		continue;
	}
	try {
		await run();
		fetched++;
		console.log(`fetched ${name}`);
	} catch (error) {
		(draftOnly ? draftFailed : failed).push(
			`${name}: ${(error as Error).message}`,
		);
	}
}
const unused = (await readdir(out)).filter(
	(file) => file.endsWith(".json") && !wanted.has(file),
);
console.log(
	`previews in ${out}: ${wanted.size} needed by ${published.length} posts and ${drafts.length} drafts, ${present} present, ${fetched} fetched, ${failed.length + draftFailed.length} failed`,
);
if (unused.length > 0) console.log(`not used by any post: ${unused.join(" ")}`);
for (const line of problems) console.error(`UNRESOLVED ${line}`);
for (const line of draftFailed)
	console.warn(
		`FAILED for a draft only (its dev page fails until fetched): ${line}`,
	);
for (const line of failed) console.error(`FAILED ${line}`);
process.exit(failed.length > 0 || problems.length > 0 ? 1 : 0);
