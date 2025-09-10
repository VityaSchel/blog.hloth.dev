import { sentrySvelteKit } from '@sentry/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';
import { execSync } from 'child_process';

const _info = globalThis.console.info;
globalThis.console.info = (...args) => {
	_info(...args);
	if (
		args.some(
			(a) =>
				typeof a === 'string' &&
				a.includes('Successfully uploaded source maps to Sentry')
		)
	) {
		process.exit(0);
	}
};

const commit = execSync('git rev-parse HEAD')
	.toString()
	.trimEnd()
	.substring(0, 7);

const environment = process.env.PUBLIC_APP_ENV;

const releaseName = `blog-hloth-dev@${commit}-${environment}`;
export default defineConfig({
	plugins: [
		sentrySvelteKit({
			autoUploadSourceMaps: Boolean(process.env.SENTRY_AUTH_TOKEN),
			sourceMapsUploadOptions: process.env.SENTRY_AUTH_TOKEN
				? {
						org: 'sentry',
						project: 'blog-hloth-dev',
						url: 'https://sentry.hloth.dev/',
						authToken: process.env.SENTRY_AUTH_TOKEN,
						release: {
							name: releaseName
						}
					}
				: undefined
		}),
		tailwindcss(),
		sveltekit(),
		process.env.ANALYZE === '1' && analyzer()
	],
	optimizeDeps: {
		exclude: ['pow-reaction']
	}
});
