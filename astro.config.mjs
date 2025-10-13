// @ts-check

import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { imageService } from "@unpic/astro/service";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
	prefetch: true,
	site: "https://blog.hloth.dev",
	integrations: [sitemap(), svelte()],
	output: "static",
	image: {
		service: imageService({
			placeholder: "blurhash",
			fallbackService: "sharp",
		}),
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
