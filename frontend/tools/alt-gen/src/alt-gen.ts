import { ChildProcess, fork } from "child_process";
import { fileURLToPath } from "url";

const batchSize = 3;

export async function batchAltGen<T>(imagesMap: [T, string][]) {
	const alts = new Map<T, string>();
	const imagesNumber = imagesMap.length;
	console.log(`Found ${imagesNumber} images to process.`);

	const workers: ChildProcess[] = [];
	async function spawnWorker(name: string) {
		try {
			const worker = fork(
				fileURLToPath(new URL("./worker.ts", import.meta.url)),
			);
			workers.push(worker);

			console.log("Spawned worker:", name);
			let image: [T, string] | undefined;
			while ((image = imagesMap.pop())) {
				if (!image) break;
				const [key, fullPath] = image;
				worker.send(fullPath);
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
				alts.set(key, alt);

				if (imagesNumber > 0) {
					const processed = imagesNumber - imagesMap.length;
					console.log(`${processed}/${imagesNumber}`);
				}
			}
		} catch (err) {
			console.error(`Worker ${name} encountered an error:`, err);
		}
	}

	const workersPromises = [];
	for (let i = 0; i < Math.min(imagesNumber, batchSize); i++) {
		workersPromises.push(spawnWorker(`Worker-${i + 1}`));
	}

	await Promise.all(workersPromises);

	workers.forEach((ac) => ac.kill());

	return alts;
}
