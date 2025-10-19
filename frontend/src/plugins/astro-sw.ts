// License: MIT
// https://www.npmjs.com/package/@ayco/astro-sw

import fs from "fs/promises";
import { fileURLToPath } from "url";
import { build, type BuildOptions as EsbuildOptions } from "esbuild";
import { type AstroIntegration } from "astro";
import registerSwScript from "./register-sw.static.js?raw";

const ASTROSW = "astro-sw-hloth.dev";

export default function serviceWorker(options: {
	path: string;
	esbuild?: EsbuildOptions;
}): AstroIntegration {
	const { path: serviceWorkerPath, esbuild = {} } = options || {};

	return {
		name: ASTROSW,
		hooks: {
			"astro:config:setup": async ({ injectScript, logger }) => {
				if (!serviceWorkerPath || serviceWorkerPath === "") {
					logger.error("Missing required path to service worker script");
				}

				// const transformedScript=await transform(registrationScript)

				injectScript("page", registerSwScript);
			},
			"astro:server:setup": async ({ server, logger }) => {
				server.middlewares.use(async (req, res, next) => {
					if (req.url === "/sw.js") {
						try {
							const result = await buildSw({
								options: esbuild,
								path: serviceWorkerPath,
							});
							res.setHeader("Content-Type", "application/javascript");
							res.end(result.contents);
							return;
						} catch (err) {
							logger.error(err instanceof Error ? err.toString() : String(err));
							next();
						}
					} else {
						next();
					}
				});
			},
			"astro:build:done": async ({ dir, logger }) => {
				try {
					const result = await buildSw({
						options: esbuild,
						path: serviceWorkerPath,
					});
					await fs.writeFile(
						fileURLToPath(new URL("./sw.js", dir)),
						result.contents,
					);
				} catch (err) {
					logger.error(err instanceof Error ? err.toString() : String(err));
				}
			},
		},
	};
}
async function buildSw({
	options,
	path,
}: {
	options?: EsbuildOptions;
	path: string;
}) {
	const { outputFiles } = await build({
		bundle: true,
		...options,
		write: false,
		outfile: "sw.js",
		platform: "browser",
		entryPoints: [path],
		external: [],
		packages: "bundle",
	});
	return outputFiles[0];
}
