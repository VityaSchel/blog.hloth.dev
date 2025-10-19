import { fileURLToPath } from "node:url";
import { includeIgnoreFile } from "@eslint/compat";
import globals from "globals";

import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";

import js from "@eslint/js";
import ts from "typescript-eslint";
import astro from "eslint-plugin-astro";
import svelte from "eslint-plugin-svelte";
import * as mdx from "eslint-plugin-mdx";

// import blogPostSchema from "./.astro/collections/blog.schema.json" with { type: "json" };

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));

/** @type { import("eslint").Linter.Config[] } */
export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{
		files: ["**/*.js", "**/*.mjs"],
		...js.configs.recommended,
	},
	...ts.configs.recommended,
	...svelte.configs.recommended.map((config) => ({
		...config,
		files: config.files || ["**/*.svelte"],
	})),
	prettier,
	...astro.configs.recommended.map((config) => ({
		...config,
		files: config.files || ["**/*.astro"],
	})),
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
		rules: {
			"no-undef": "off",
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: [".svelte"],
				parser: ts.parser,
				// svelteConfig,
			},
		},
		rules: {
			"svelte/no-navigation-without-resolve": "off",
		},
	},
	{
		...mdx.flat,
		processor: mdx.createRemarkProcessor({
			lintCodeBlocks: true,
		}),
	},
	{
		...mdx.flatCodeBlocks,
		rules: {
			...mdx.flatCodeBlocks.rules,
			"no-var": "error",
			"prefer-const": "error",
		},
	},
	{
		files: ["**/*.mdx"],
		rules: {
			"@typescript-eslint/no-unused-vars": "off",
		},
	},
);
