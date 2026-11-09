import path from "path";
import mediaInfoFactory, { type MediaInfo } from "mediainfo.js";
import { fileURLToPath } from "url";
import { cached, fileRevision } from "$lib/cache";

export type VideoDimensions = { width: number; height: number };

let instance: Promise<MediaInfo<"object">> | undefined;
let queue: Promise<unknown> = Promise.resolve();

const analyze = async (filePath: string): Promise<VideoDimensions> => {
	instance ??= mediaInfoFactory();
	const mediainfo = await instance;
	const content = Bun.file(filePath);
	const result = await mediainfo.analyzeData(content.size, (size, offset) =>
		content.slice(offset, offset + size).bytes(),
	);
	const videoTrack = result.media?.track.find((t) => t["@type"] === "Video");
	if (!videoTrack) throw new Error(`No video track found in ${filePath}`);
	const { Width, Height } = videoTrack;
	if (!Width || !Height)
		throw new Error(`Invalid video dimensions in ${filePath}`);
	return { width: Width, height: Height };
};

export async function getVideoDimensions(
	filePath: string,
): Promise<VideoDimensions> {
	const root = path.resolve(
		path.join(fileURLToPath(import.meta.url), "../../../"),
	);
	const base = path.resolve(
		path.join(root, import.meta.env.PROD ? "./dist-new/" : "./"),
	);
	const cleanPath = filePath.replace(/[?#].*$/, "");
	const resolvedPath = path.resolve(path.join(base, cleanPath));
	if (!(await Bun.file(resolvedPath).exists()))
		throw new Error(`File not found: ${resolvedPath}`);
	return cached("video-dimensions", await fileRevision(resolvedPath), () => {
		const analysis = queue.then(() => analyze(resolvedPath));
		queue = analysis.catch(() => undefined);
		return analysis;
	});
}
