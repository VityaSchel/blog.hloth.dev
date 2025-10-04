import { db } from "$lib/server/db";
import { mediaTable, type DbMedia } from "$lib/server/db/schema";
import { getPlaiceholder } from "plaiceholder";
import sharp from "sharp";
import mediaInfoFactory from "mediainfo.js";

export async function processImage({
	content,
	crop,
}: {
	content: Uint8Array;
	crop: "banner" | null;
}) {
	let img = await sharp(content).autoOrient();
	const { width, height } = await img.metadata();
	const aspectRatio = width / height;
	if (!Number.isFinite(aspectRatio)) {
		throw new Error("Invalid image dimensions");
	}
	if (crop === "banner") {
		let newWidth: number, newHeight: number;
		const targetAspectRatio = 1625 / 1000;
		if (aspectRatio > 1) {
			// landscape
			newWidth = Math.min(width, 1625);
			newHeight = Math.round(newWidth / targetAspectRatio);
		} else if (aspectRatio < 1) {
			// portrait
			newHeight = Math.min(height, 1000);
			newWidth = Math.round(newHeight * targetAspectRatio);
		} else {
			// square
			newWidth = newHeight = width;
		}
		img = img.resize({
			width: newWidth,
			height: newHeight,
			fit: "cover",
			position: "center",
		});
	}
	content = await img.webp({ quality: 80, force: true }).toBuffer();
	const placeholder = (await getPlaiceholder(Buffer.from(content))).base64;
	return {
		content,
		meta: {
			width,
			height,
			placeholder,
		},
	};
}

export async function processVideo({ content }: { content: Uint8Array }) {
	const mediainfo = await mediaInfoFactory();
	const result = await mediainfo.analyzeData(content.length, (size, offset) =>
		content.slice(offset, offset + size),
	);
	const mediaInfo = result.media;
	if (!mediaInfo) throw new Error("Invalid video file");
	const videoTrack = mediaInfo.track.find((t) => t["@type"] === "Video");
	if (!videoTrack) throw new Error("No video track found");
	if (!videoTrack.Width || !videoTrack.Height)
		throw new Error("Invalid video dimensions");
	return {
		content,
		meta: {
			width: videoTrack.Width,
			height: videoTrack.Height,
			placeholder: "",
		},
	};
}

export async function insertMedia(file: DbMedia) {
	await db.insert(mediaTable).values(file);
}
