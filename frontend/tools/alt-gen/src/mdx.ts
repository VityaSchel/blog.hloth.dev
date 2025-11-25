import path from "path";
import { remark } from "remark";
import remarkMdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";
import type { RootContent } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";

const mdx = remark().use(remarkMdx).use(remarkFrontmatter);

export async function parseMdx({
	content,
	dir,
}: {
	content: string;
	dir: string;
}): Promise<Map<MdxJsxFlowElement, string>> {
	const file = mdx.parse(content);

	const imageMap = new Map<MdxJsxFlowElement, string>();

	const importMap = new Map<string, string>();
	async function loop(children: RootContent[]) {
		for (const node of children) {
			if (
				node.type === "mdxJsxFlowElement" &&
				node.name === "Image" &&
				node.attributes.find(
					(attr) =>
						attr.type === "mdxJsxAttribute" &&
						attr.name === "alt" &&
						!attr.value,
				)
			) {
				const src = node.attributes.find(
					(a) => a.type === "mdxJsxAttribute" && a.name === "src",
				)?.value;
				if (src && typeof src !== "string") {
					const data = src.data?.estree;
					if (
						data &&
						data.body.length === 1 &&
						data.body[0]?.type === "ExpressionStatement" &&
						data.body[0].expression.type === "Identifier"
					) {
						const importVarName = data.body[0].expression.name;
						const importPath = importMap.get(importVarName);
						if (importPath) {
							const importFullPath = path.join(dir, importPath);

							imageMap.set(node, importFullPath);
						} else {
							console.error(
								`Image with missing alt and unknown import variable: ${importVarName}`,
							);
						}
					} else {
						console.error(`Image with missing alt and non-string src: ${src}`);
					}
				} else {
					console.error(`Image with missing alt and unknown src: ${src}`);
				}
			}
			if (node.type === "mdxjsEsm") {
				const data = node.data?.estree;
				data?.body.forEach((statement) => {
					if (statement.type === "ImportDeclaration") {
						if (
							statement.specifiers.length === 1 &&
							statement.specifiers[0]?.type === "ImportDefaultSpecifier"
						) {
							const importVarName = statement.specifiers[0].local.name;
							const importPath = statement.source.value;
							if (typeof importPath === "string") {
								importMap.set(importVarName, importPath);
							} else {
								console.error(`Unexpected import path: ${importPath}`);
							}
						} else {
							console.error(
								`Unexpected import statement: ${statement}. Is this an image?`,
							);
						}
					}
				});
			}
			if ("children" in node) {
				const loopResult = await loop(node.children);
				if (loopResult === "halt") {
					return "halt";
				}
			}
		}
	}
	await loop(file.children);

	return imageMap;
}

export async function applyMdxAlts({
	source,
	alts,
}: {
	source: string;
	alts: Map<MdxJsxFlowElement, string>;
}) {
	const edits: { start: number; end: number; text: string }[] = [];

	for (const [node, alt] of alts.entries()) {
		const altAttribute = node.attributes.find(
			(a) => a.type === "mdxJsxAttribute" && a.name === "alt",
		);
		if (altAttribute) {
			const attrStart = altAttribute.position?.start.offset;
			const attrEnd = altAttribute.position?.end.offset;
			if (attrStart === undefined || attrEnd === undefined) {
				throw new Error("Alt attribute position not found on node");
			}
			const attrSource = source.slice(attrStart, attrEnd);
			const eqPos = attrSource.indexOf("=");
			const quote = attrSource[eqPos + 1];
			if (!quote) {
				throw new Error("Alt attribute format invalid");
			}
			const openQuote = attrStart + eqPos + 1;
			const closeQuote = attrStart + attrSource.lastIndexOf(quote);
			edits.push({
				start: openQuote + 1,
				end: closeQuote,
				text: alt,
			});
		} else {
			console.error(
				node.attributes
					.find((a) => a.type === "mdxJsxAttribute" && a.name === "src")
					?.value?.toString(),
			);
			throw new Error("Alt attribute not found on node");
		}
	}

	edits.sort((a, b) => b.start - a.start);

	let result = source;
	for (const edit of edits) {
		result =
			result.slice(0, edit.start) +
			edit.text.replaceAll('"', "&quot;") +
			result.slice(edit.end);
	}

	return result;
}
