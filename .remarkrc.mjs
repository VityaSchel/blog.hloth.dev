import remarkFrontmatter from "remark-frontmatter";
import remarkLintFrontmatterSchema from "remark-lint-frontmatter-schema";

const remarkConfig = {
	plugins: [
		remarkFrontmatter,
		[
			remarkLintFrontmatterSchema,
			{
				schemas: {
					"./.astro/collections/blog.schema.json": [
						"./src/content/blog/**/*.md",
					],
				},
			},
		],
	],
};
export default remarkConfig;
