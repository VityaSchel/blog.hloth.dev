import type { ImageMetadata } from "astro";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { gainMapHeadroom } from "./gain-map";
import { srcsetOf, variantsOf } from "./variants";

type SourceImage = ImageMetadata & { fsPath?: string };

export type HdrSource = { srcset: string; sizes: string; headroom: number };

const variantModules = import.meta.glob<SourceImage>("/src/**/*-[1-9]*w.avif", {
	import: "default",
});

type Loader = () => Promise<SourceImage>;

const variantsOnDisk = async (
	fsPath: string,
): Promise<Record<string, Loader>> => {
	const directory = path.dirname(fsPath);
	const names = await readdir(directory).catch(() => [] as string[]);
	return Object.fromEntries(
		names.map((name): [string, Loader] => {
			const key = `/${path.relative(process.cwd(), path.join(directory, name))}`;
			return [
				key,
				async () =>
					((await import(/* @vite-ignore */ key)) as { default: SourceImage })
						.default,
			];
		}),
	);
};

const gainMapVariants = async (fsPath: string): Promise<SourceImage[]> => {
	const modules = import.meta.env.DEV
		? await variantsOnDisk(fsPath)
		: variantModules;
	const loaded = await Promise.all(
		variantsOf(fsPath, modules).map((load) => load()),
	);
	const checks = await Promise.all(
		loaded.map(async (variant) => {
			if (variant.fsPath && (await gainMapHeadroom(variant.fsPath)) !== null)
				return true;
			console.warn(`[hdr] ignoring ${variant.fsPath}: no gain map`);
			return false;
		}),
	);
	return loaded.filter((_, index) => checks[index]);
};

export const hdrSource = async (
	image: SourceImage,
	displayWidth: number,
): Promise<HdrSource | null> => {
	const fsPath = image.fsPath;
	if (image.format !== "avif" || !fsPath) return null;
	const headroom = await gainMapHeadroom(fsPath);
	if (headroom === null) return null;
	return {
		srcset: srcsetOf(image, await gainMapVariants(fsPath)),
		sizes: `(max-width: ${displayWidth}px) 100vw, ${displayWidth}px`,
		headroom,
	};
};
