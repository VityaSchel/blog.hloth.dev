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
	const lqImgBuffer = await sharp(hqImgBuffer)
		.autoOrient()
		.resize({ width: 24, fit: "contain", withoutEnlargement: true })
		.avif({ quality: 50 })
		.toBuffer();
	return "data:image/avif;base64," + lqImgBuffer.toString("base64");
}
