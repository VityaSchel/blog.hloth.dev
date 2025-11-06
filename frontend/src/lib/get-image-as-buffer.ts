import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export async function getLqip(src: string, { origin }: { origin: string }) {
	let hqImgBuffer: Buffer;
	if (import.meta.env.PROD) {
		hqImgBuffer = await fs.readFile(
			path.join(path.basename(fileURLToPath(import.meta.url)), "../dist", src),
		);
	} else {
		const req = await fetch(new URL(src, origin));
		const arrayBuffer = await req.arrayBuffer();
		hqImgBuffer = Buffer.from(arrayBuffer);
	}
	let lqImg = sharp(hqImgBuffer)
		.autoOrient()
		.resize({ width: 24, fit: "contain", withoutEnlargement: true });
	const useAvif = import.meta.env.PROD;
	if (useAvif) {
		lqImg = lqImg.avif({ quality: 50 });
	} else {
		lqImg = lqImg.jpeg({ quality: 1 });
	}
	const lqImgBuffer = await lqImg.toBuffer();
	return (
		"data:image/" +
		(useAvif ? "avif" : "jpeg") +
		";base64," +
		lqImgBuffer.toString("base64")
	);
}
