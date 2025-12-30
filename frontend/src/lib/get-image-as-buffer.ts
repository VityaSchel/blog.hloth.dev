import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export async function getLqip(src: string, { origin }: { origin: string }) {
	let hqImgBuffer: Buffer;
	if (import.meta.env.PROD) {
		hqImgBuffer = await fs.readFile(
			path.join(
				path.basename(fileURLToPath(import.meta.url)),
				"../dist-new",
				src,
			),
		);
	} else {
		const req = await fetch(new URL(src, origin));
		const arrayBuffer = await req.arrayBuffer();
		hqImgBuffer = Buffer.from(arrayBuffer);
	}
	const hqImg = sharp(hqImgBuffer).autoOrient();
	const meta = await hqImg.metadata();
	const width = meta.width;
	const height = meta.height;
	let lqImg = hqImg.resize({
		width: 24,
		fit: "contain",
		withoutEnlargement: true,
	});
	const useAvif = import.meta.env.PROD;
	if (useAvif) {
		lqImg = lqImg.avif({ quality: 50 });
	} else {
		lqImg = lqImg.jpeg({ quality: 1 });
	}
	const lqImgBuffer = await lqImg.toBuffer();
	return {
		src:
			"data:image/" +
			(useAvif ? "avif" : "jpeg") +
			";base64," +
			lqImgBuffer.toString("base64"),
		width,
		height,
	};
}
