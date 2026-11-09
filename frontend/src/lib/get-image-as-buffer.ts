import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import type { ImageMetadata } from "astro";
import { cached, fileRevision } from "$lib/cache";

type SourceImage = ImageMetadata & { fsPath?: string };

export type Lqip = { src: string; width?: number; height?: number };

const useAvif = import.meta.env.PROD;
const namespace = useAvif ? "lqip-avif" : "lqip-jpeg";

const fetchImage = async (url: URL, attempt = 0): Promise<Buffer> => {
	const response = await fetch(url);
	const type = response.headers.get("content-type") ?? "";
	if (response.ok && type.startsWith("image/"))
		return Buffer.from(await response.arrayBuffer());
	if (attempt < 2) {
		await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
		return fetchImage(url, attempt + 1);
	}
	throw new Error(`${url.pathname} answered ${response.status} ${type}`);
};

const readSource = async (src: string, origin: string): Promise<Buffer> => {
	if (!import.meta.env.PROD) return fetchImage(new URL(src, origin));
	return fs.readFile(
		path.join(
			path.basename(fileURLToPath(import.meta.url)),
			"../dist-new",
			src,
		),
	);
};

const renderLqip = async (src: string, origin: string): Promise<Lqip> => {
	const source = sharp(await readSource(src, origin)).autoOrient();
	const { width, height } = await source.metadata();
	const resized = source.resize({
		width: 24,
		fit: "contain",
		withoutEnlargement: true,
	});
	const encoded = useAvif
		? resized.avif({ quality: 50 })
		: resized.jpeg({ quality: 1 });
	const data = (await encoded.toBuffer()).toString("base64");
	return {
		src: `data:image/${useAvif ? "avif" : "jpeg"};base64,${data}`,
		width,
		height,
	};
};

const TRANSPARENT_PIXEL =
	"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export async function getLqip(
	image: SourceImage,
	{ origin }: { origin: string },
): Promise<Lqip> {
	const src = image.src;
	const key = image.fsPath ? await fileRevision(image.fsPath) : src;
	try {
		return await cached(namespace, key, () => renderLqip(src, origin));
	} catch (error) {
		console.warn(`[lqip] placeholder skipped for ${src}: ${String(error)}`);
		return { src: TRANSPARENT_PIXEL, width: image.width, height: image.height };
	}
}
