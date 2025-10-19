// License: MIT
// https://www.npmjs.com/package/@ayco/astro-sw

import { readFile, writeFile, readdir, unlink } from "fs/promises";
import { fileURLToPath } from "url";
import { resolve, dirname, join } from "path";
import { build, type BuildOptions } from "esbuild";
import type { AstroIntegration } from "astro";
import dedent from "dedent-js";
import registerSwScript from "./register-sw.static.js?raw";

const ASTROSW = "astro-sw-hloth.dev";

export default function serviceWorker(options: {
	path: string;
	assetCachePrefix?: string;
	assetCacheVersionID?: string;
	customRoutes?: string[];
	excludeRoutes?: string[];
	logAssets?: true;
	esbuild?: BuildOptions;
	experimental?: {
		strategy?: {
			fetchFn: () => void;
			installFn: () => void;
			activateFn: () => void;
			waitFn: () => void;
		};
	};
}): AstroIntegration {
	const {
		assetCachePrefix = ASTROSW,
		assetCacheVersionID = "0",
		path: serviceWorkerPath = undefined,
		customRoutes = [],
		excludeRoutes = [],
		logAssets = false,
		esbuild = {},
	} = options || {};

	let assets: string[] = [];

	// let output = "static";
	const __dirname = resolve(dirname("."));

	return {
		name: ASTROSW,
		hooks: {
			"astro:config:setup": async ({
				injectScript,
				// config: _config,
				command,
				logger,
			}) => {
				if (!serviceWorkerPath || serviceWorkerPath === "") {
					logger.error("Missing required path to service worker script");
				}

				// const transformedScript=await transform(registrationScript)

				// output = _config.output;
				if (command === "build") {
					injectScript("page", registerSwScript);
				}
			},
			"astro:config:done": async ({ injectTypes }) => {
				const injectedTypes = dedent`
					declare const __assets: string[];
					declare const __version: string;
					declare const __prefix: string;
				`;
				injectTypes({ filename: "caching.d.ts", content: injectedTypes });
			},
			"astro:build:ssr": ({ manifest }) => {
				assets = manifest.assets;
			},
			"astro:build:done": async ({ dir, routes, pages, logger }) => {
				const outfile = fileURLToPath(new URL("./sw.js", dir));
				const swPath =
					serviceWorkerPath && serviceWorkerPath !== ""
						? join(__dirname, serviceWorkerPath)
						: undefined;
				let originalScript;

				const _publicFiles = (
					(await readdir(dir, { withFileTypes: true })) ?? []
				)
					.filter((dirent) => dirent.isFile())
					.map((dirent) => `/${dirent.name}`);

				const _routes =
					routes
						.filter(({ type }) => type === "page")
						.filter(({ pathname }) => pathname !== undefined)
						.flatMap(({ pathname }) =>
							pathname === "/" ? pathname : [pathname!, `${pathname}/`],
						)
						.filter((pathname) => pathname !== "") ?? [];

				const _pages =
					pages
						.filter(({ pathname }) => pathname !== "")
						.map(({ pathname }) => `/${pathname}`) ?? [];

				const _pagesWithoutEndSlash =
					pages
						.filter(({ pathname }) => pathname !== "")
						.map(({ pathname }) => {
							const lastChar = pathname.slice(-1);
							const len = pathname.length;
							return lastChar === "/"
								? `/${pathname.slice(0, len - 1)}`
								: `/${pathname}`;
						})
						.filter((pathname) => pathname !== "") ?? [];

				const _excludeRoutes = [
					...excludeRoutes,
					...excludeRoutes.map((route) => `${route}/`),
				];

				assets = [
					...new Set([
						...assets,
						..._routes,
						..._pages,
						..._pagesWithoutEndSlash,
						...customRoutes,
						..._publicFiles,
					]),
				].filter(
					(asset) =>
						!!asset &&
						asset !== "" &&
						!asset.includes("404") &&
						!asset.includes("index.html") &&
						!_excludeRoutes.includes(asset),
				);

				if (logAssets) {
					logger.info(
						`${assets.length} assets for caching: \n  ▶ ${assets
							.toString()
							.replace(/,/g, "\n  ▶ ")}\n`,
					);
				} else {
					logger.info(`${assets.length} assets for caching.`);
				}

				if (swPath) {
					try {
						logger.info(`Using service worker in path: ${swPath}`);
						originalScript = await readFile(swPath);
					} catch {
						logger.error(`Service worker script not found! ${swPath}`);
					}
				} else {
					logger.error(dedent`
						[${ASTROSW}]  ERR: The 'path' option is required!
						[${ASTROSW}] INFO: Please see service worker options in https://ayco.io/gh/astro-sw#readme
					`);
				}

				const assetsDeclaration = `const __assets = ${JSON.stringify(
					assets,
				)};\n`;
				const versionDeclaration = `const __version = ${JSON.stringify(
					assetCacheVersionID,
				)};\n`;
				const prefixDeclaration = `const __prefix = ${JSON.stringify(
					assetCachePrefix,
				)};\n`;

				const tempFile = `${swPath}.tmp.ts`;

				try {
					await writeFile(
						tempFile,
						assetsDeclaration +
							versionDeclaration +
							prefixDeclaration +
							originalScript,
						{ flag: "w+" },
					);
				} catch (err) {
					logger.error(err instanceof Error ? err.toString() : String(err));
				}

				try {
					await build({
						bundle: true,
						...esbuild,
						outfile,
						platform: "browser",
						entryPoints: [tempFile],
					});
				} catch (err) {
					logger.error(err instanceof Error ? err.toString() : String(err));
				}

				try {
					await unlink(tempFile);
				} catch (err) {
					logger.error(err instanceof Error ? err.toString() : String(err));
				}
			},
		},
	};
}
