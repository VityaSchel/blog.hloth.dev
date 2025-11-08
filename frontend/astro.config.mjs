// @ts-check

import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, envField } from "astro/config";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypeHeadingGroup } from "./src/plugins/rehype-heading-group.js";
import { rehypeStyledHrs } from "./src/plugins/rehype-styled-hrs.js";
import { remarkStyledHrs } from "./src/plugins/remark-styled-hrs.js";
import rehypeExternalLinks from "rehype-external-links";
import serviceWorker from "./src/plugins/astro-sw.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url)) + "/";

// https://astro.build/config
/** @type { import("astro").AstroUserConfig } */
export default defineConfig({
	prefetch: true,
	site: "https://blog.hloth.dev",
	experimental: {
		contentIntellisense: true,
	},
	integrations: [
		svelte(),
		mdx(),
		serviceWorker({
			path: path.resolve(path.join(__dirname, "src/sw.ts")),
		}),
	],
	outDir: "dist-new",
	output: "static",
	image: {
		domains: ["i.ytimg.com"],
	},
	markdown: {
		shikiConfig: {
			themes: {
				light: "min-light",
				dark: "dark-plus",
			},
		},
		remarkPlugins: [remarkStyledHrs],
		rehypePlugins: [
			rehypeHeadingGroup,
			rehypeSlug,
			[rehypeExternalLinks, { rel: ["nofollow", "noreferrer"] }],
			[
				rehypeAutolinkHeadings,
				{
					behavior: "append",
					properties: {
						class:
							"opacity-0 transition-opacity group-hover/heading:opacity-100 focus-visible:opacity-100 ml-2",
						ariaLabel: "Link to heading",
					},
					content: {
						type: "text",
						value: "#",
					},
				},
			],
			rehypeStyledHrs,
		],
	},
	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: {
			exclude: ["pow-reaction"],
		},
	},
	env: {
		schema: {
			PUBLIC_WEB_PUSH_KEY: envField.string({
				access: "public",
				context: "client",
			}),
			API_URL: envField.string({
				access: "public",
				context: "client",
			}),
		},
	},
});
