import { Server } from "net-ipc";

const images = [
	"/Users/hloth/Documents/blog.hloth.dev-new/frontend/public/Statue-of-Liberty-Island-New-York-Bay.jpg",
	"/Users/hloth/Downloads/aakljsdjklasjkldjskladljkasjkldasjkld.jpg",
	"/Users/hloth/Downloads/amlsdksadkasd.webp",
	"/Users/hloth/Downloads/photo_2024-02-24 03.14.02.jpeg",
];

const alts = new Map<string, string>();

const batchSize = 2;

async function spawnWorker(name: string) {
	try {
		const worker = Bun.spawn([
			"node",
			Bun.fileURLToPath(new URL("./alt-gen.worker.ts", import.meta.url)),
		]);

		const server = new Server({
			path: "/alt-gen-worker-" + name,
		});
		server.start().catch(console.error);

		console.log("Spawned worker:", name);
		let image: string | undefined;
		while ((image = images.pop())) {
			if (!image) break;
			worker.send(image);
			console.log(`Worker ${name} processing image: ${image}`);
			const alt = await new Promise<string>((resolve, reject) => {
				server.on("request", (event) => {
					if (typeof event.data === "string") {
						resolve(event.data);
					} else {
						reject(new Error("Failed to generate alt text"));
					}
				});
				server.on("error", (e) => {
					console.error(`Worker ${name} error:`, e);
					reject(e.error);
				});
			});
			alts.set(image, alt);
			console.log(`Worker ${name} generated alt text: ${alt}`);
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
