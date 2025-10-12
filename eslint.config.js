import prettier from "eslint-config-prettier";
import { fileURLToPath } from "node:url";
import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import ts from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import markdown from "@eslint/markdown";
import frontmatterSchema from "eslint-plugin-markdown-frontmatter-schema";
import blogPostSchema from "./.astro/collections/blog.schema.json" with { type: "json" };

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));

const sharedMarkdownConfig = {
	language: "markdown/commonmark",
	plugins: {
		markdown,
		"frontmatter-schema": frontmatterSchema,
	},
	languageOptions: { frontmatter: "yaml" },
};

/** @type { import("eslint").Linter.Config[] } */
export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{
		files: ["**/*.js", "**/*.mjs"],
		...js.configs.recommended,
	},
	...ts.configs.recommended,
	prettier,
	...eslintPluginAstro.configs.recommended.map((config) => ({
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
		...sharedMarkdownConfig,
		files: ["**/*.md"],
		rules: {
			"markdown/no-html": "error",
		},
	},
	{
		...sharedMarkdownConfig,
		files: ["src/content/blog/**/*.md"],
		rules: {
			"frontmatter-schema/frontmatter-schema": [
				"error",
				{
					defaultSchema: blogPostSchema,
				},
			],
		},
	},
);
