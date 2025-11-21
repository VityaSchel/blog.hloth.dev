import path from "path";
import fs from "fs/promises";
import { parseMdx, applyMdxAlts } from "./mdx";
import { batchAltGen } from "./alt-gen";

const mdxFile = process.argv[2];
if (!mdxFile) {
	console.error("Please provide an MDX file path as an argument.");
	process.exit(1);
}

const mdxContent = await fs.readFile(mdxFile, "utf-8");
const mdxDir = path.dirname(mdxFile);

const { tree, imageMap } = await parseMdx({
	content: mdxContent,
	dir: mdxDir,
});
const alts = await batchAltGen(Array.from(imageMap.entries()));
const output = await applyMdxAlts({ tree, alts });
await fs.writeFile(mdxFile + ".alt.mdx", output, "utf-8");
