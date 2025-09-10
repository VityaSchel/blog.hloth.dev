import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'child_process';

let commit = 'unknown';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	compilerOptions: {
		experimental: {
			async: true
		}
	},

	kit: {
		adapter: adapter(),

		version: {
			name: commit + '/' + process.env.PUBLIC_APP_ENV
		},

		experimental: {
			tracing: {
				server: true
			},

			instrumentation: {
				server: true
			}
		}
	}
};

export default config;

commit = execSync('git rev-parse HEAD').toString().trimEnd().substring(0, 7);

config.kit.version.name = commit + '/' + process.env.PUBLIC_APP_ENV;
