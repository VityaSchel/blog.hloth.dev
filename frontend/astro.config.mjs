// @ts-check

import path from "path";
import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypeHeadingGroup } from "./src/plugins/rehype-heading-group";
import { rehypeStyledHrs } from "./src/plugins/rehype-styled-hrs";
import serviceWorker from "src/plugins/astro-sw";
import { remarkStyledHrs } from "src/plugins/remark-styled-hrs";

// https://astro.build/config
export default defineConfig({
	prefetch: true,
	site: "https://blog.hloth.dev",
	integrations: [
		sitemap(),
		svelte(),
		mdx(),
		serviceWorker({
			path: path.resolve(path.join(__dirname, "src/sw.ts")),
		}),
	],
	output: "static",
	image: {},
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
