import path from "path";
import mediaInfoFactory from "mediainfo.js";

export async function getVideoDimensions(filePath: string) {
	const content = Bun.file(path.resolve("." + filePath));
	if (!(await content.exists())) throw new Error("File not found");
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
