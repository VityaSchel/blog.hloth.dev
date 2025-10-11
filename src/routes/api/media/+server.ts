import { z } from "zod";
import { error, isHttpError, json } from "@sveltejs/kit";
import { STORAGE_PATH } from "$env/static/private";
import fs from "fs/promises";
import path from "path";
import { type DbMedia } from "$lib/server/db/schema";
import { insertMedia, processImage, processVideo } from "$lib/server/media";

export async function POST({ url, locals, request }) {
	try {
		if (!locals.admin) {
			throw error(403, "Unauthorized");
		}
		const remote = url.searchParams.get("remote") === "true";

		const typeParsing = await z
			.enum(["video", "image"])
			.safeParseAsync(url.searchParams.get("type"));
		if (!typeParsing.success) {
			throw error(400, "Invalid media type in query");
		}
		const type = typeParsing.data;

		const cropParsing = await z
			.enum(["banner"])
			.nullable()
			.safeParseAsync(url.searchParams.get("crop"));
		if (!cropParsing.success) {
			throw error(400, "Invalid crop argument in query");
		}
		const crop = cropParsing.data;

		let content: Uint8Array;
		let contentType: string;
		try {
			if (remote) {
				const { url } = await z
					.object({ url: z.url() })
					.parseAsync(await request.json());
				const req = await fetch(url);
				content = await req.bytes();
				contentType =
					req.headers.get("content-type") ?? "application/octet-stream";
			} else {
				const formData = await request.formData();
				const file = formData.get(type);
				if (file === null || !(file instanceof File))
					throw new Error("Invalid file");
				content = await file.bytes();
				contentType = file.type;
			}
		} catch (e) {
			console.error(e);
			throw error(400, "Invalid request");
		}

		const supportedMimeTypes = {
			image: ["jpg", "jpeg", "png", "webp", "gif"],
			video: ["mp4", "webm"],
		};

		let extension = contentType.split("/")[1];

		if (!supportedMimeTypes[type].includes(extension)) {
			throw error(415, "Unsupported file type");
		}

		const maxSize = (type === "image" ? 3 : 50) * 1000 * 1000;
		if (content.length > maxSize) {
			throw error(413, "File too large");
		}

		let result: {
			meta: Pick<DbMedia, "width" | "height" | "placeholder">;
			content: Uint8Array;
		};
		if (type === "image") {
			try {
				result = await processImage({ content, crop });
				extension = "webp";
			} catch (e) {
				console.error(e);
				throw error(415, "Invalid image");
			}
		} else {
			try {
				result = await processVideo({ content });
			} catch (e) {
				console.error(e);
				throw error(415, "Invalid video");
			}
		}
		const id = crypto.randomUUID() + "." + extension;
		try {
			await fs.writeFile(path.join(STORAGE_PATH, id), result.content, "binary");
		} catch (e) {
			console.error(e);
			throw error(500, "Failed to store file");
		}
		try {
			await insertMedia({
				...result.meta,
				id,
			});
		} catch (e) {
			console.error(e);
			throw error(500, "Failed to insert media to database");
		}
		return json({
			success: 1,
			file: {
				id,
				url: `/files/${id}`,
				...result.meta,
			},
		});
	} catch (e) {
		if (isHttpError(e)) {
			console.error(e);
			return json({ success: 0, error: e.body.message }, { status: e.status });
		} else {
			console.error(e);
			throw e;
		}
	}
}
