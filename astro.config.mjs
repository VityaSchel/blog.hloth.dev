// @ts-check

import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypeHeadingGroup } from "$lib/plugins/heading-group";

// https://astro.build/config
export default defineConfig({
	prefetch: true,
	site: "https://blog.hloth.dev",
	integrations: [sitemap(), svelte(), mdx()],
	output: "static",
	image: {
		
	},
	markdown: {
		shikiConfig: {
			themes: {
				light: "min-light",
				dark: "dark-plus",
			},
		},
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
		],
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
