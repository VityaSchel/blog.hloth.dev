import { fork } from "child_process";
import { fileURLToPath } from "url";

const images = [
	"/Users/hloth/Documents/blog.hloth.dev-new/frontend/public/Statue-of-Liberty-Island-New-York-Bay.jpg",
	"/Users/hloth/Downloads/aakljsdjklasjkldjskladljkasjkldasjkld.jpg",
	"/Users/hloth/Downloads/amlsdksadkasd.webp",
	"/Users/hloth/Downloads/photo_2024-02-24 03.14.02.jpeg",
];

const alts = new Map<string, string>();

const batchSize = 2;
const abortControllers: AbortController[] = [];

async function spawnWorker(name: string) {
	try {
		const abortController = new AbortController();
		abortControllers.push(abortController);
		const worker = fork(
			fileURLToPath(new URL("./alt-gen.worker.ts", import.meta.url)),
			{
				signal: abortController.signal,
			},
		);

		console.log("Spawned worker:", name);
		let image: string | undefined;
		while ((image = images.pop())) {
			if (!image) break;
			worker.send(image);
			console.log(`Worker ${name} processing image: ${image}`);
			const alt = await new Promise<string>((resolve, reject) => {
				const onMsg = (message: unknown) => {
					worker.off("message", onMsg);
					worker.off("error", onError);
					if (typeof message === "string") {
						resolve(message);
					} else {
						reject(new Error("Failed to generate alt text"));
					}
				};
				const onError = (e: unknown) => {
					worker.off("message", onMsg);
					worker.off("error", onError);
					console.error(`Worker ${name} error:`, e);
					reject(e);
				};
				worker.on("message", onMsg);
				worker.on("error", onError);
			});
			alts.set(image, alt);
		}
	} catch (err) {
		console.error(`Worker ${name} encountered an error:`, err);
	}
}

const workers = [];
for (let i = 0; i < batchSize; i++) {
	workers.push(spawnWorker(`Worker-${i + 1}`));
}

await Promise.all(workers);

// ===

for (const [image, alt] of alts) {
	console.log(`Image: ${image}\nAlt Text: ${alt}\n`);
}

abortControllers.forEach((ac) => ac.abort());
