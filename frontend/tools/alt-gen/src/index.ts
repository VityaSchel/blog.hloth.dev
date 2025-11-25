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

const imageMap = await parseMdx({
	content: mdxContent,
	dir: mdxDir,
});
const alts = await batchAltGen(Array.from(imageMap.entries())); //.slice(0, 50)
const output = await applyMdxAlts({ source: mdxContent, alts });
await fs.writeFile(mdxFile, output, "utf-8");
