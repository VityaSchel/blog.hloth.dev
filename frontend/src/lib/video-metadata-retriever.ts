import path from "path";
import mediaInfoFactory from "mediainfo.js";
import { fileURLToPath } from "url";

export async function getVideoDimensions(filePath: string) {
	const root = path.resolve(
		path.join(fileURLToPath(import.meta.url), "../../../"),
	);
	const base = path.resolve(
		path.join(root, import.meta.env.PROD ? "./dist-new/" : "./"),
	);
	const resolvedPath = path.resolve(path.join(base, filePath));
	const content = Bun.file(resolvedPath);
	if (!(await content.exists()))
		throw new Error("File not found: " + resolvedPath + " " + import.meta.url);
	const mediainfo = await mediaInfoFactory();
	const result = await mediainfo.analyzeData(content.size, (size, offset) =>
		content.slice(offset, offset + size).bytes(),
	);
	const mediaInfo = result.media;
	if (!mediaInfo) throw new Error("Invalid video file");
	const videoTrack = mediaInfo.track.find((t) => t["@type"] === "Video");
	if (!videoTrack) throw new Error("No video track found");
	if (!videoTrack.Width || !videoTrack.Height)
		throw new Error("Invalid video dimensions");
	return {
		width: videoTrack.Width,
		height: videoTrack.Height,
	};
}
