import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { analyzer } from "vite-bundle-analyzer";

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		process.env.ANALYZE === "1" && analyzer(),
	],
	optimizeDeps: {
		exclude: ["pow-reaction"],
	},
});
