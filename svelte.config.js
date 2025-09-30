import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { execSync } from "child_process";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		discloseVersion: false,
	},
	kit: {
		version: {
			name:
				execSync("git rev-parse HEAD").toString().trimEnd().substring(0, 7) +
				"/" +
				process.env.PUBLIC_APP_ENV,
		},
		adapter: adapter(),
		csrf: {
			trustedOrigins: [
				"https://blog.hloth.dev",
				"http://blog.hlothdevzkti6suoksy7lcy7hmpxnr3msu5waokzaslsi2mnx5ouu4qd.onion",
			],
		},
	},
};

export default config;
