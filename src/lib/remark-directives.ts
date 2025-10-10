import type { Root } from "mdast";
import type { Plugin } from "unified";
import type { LeafDirective, LeafDirectiveData } from "mdast-util-directive";
import { visit } from "unist-util-visit";

export interface EmbedLeafDirective extends LeafDirective {
	type: "leafDirective";
	name: "embed";
	attributes?: {
		url?: string;
	};
}

export interface EmbedLeafDirectiveData extends LeafDirectiveData {
	type: "embed";
	url: string;
}

export const customDirectives: Plugin<[], Root> = () => {
	return (tree, file) => {
		console.log({ tree, file });
		visit(tree, (node) => {
			console.log({ node });
			if (
				node.type === "textDirective" ||
				node.type === "leafDirective" ||
				node.type === "containerDirective"
			) {
				if (node.name === "embed") {
					console.log("Found ::embed directive", node);
					if (node.type !== "leafDirective") {
						return file.fail(
							"Unexpected ::embed directive type, use two colons for a leaf directive",
							node,
						);
					}

					const embed = node as EmbedLeafDirective;
					const url = embed.attributes?.url;
					if (!url) {
						return file.fail(
							"Missing url attribute on ::embed directive",
							node,
						);
					}

					const data: EmbedLeafDirectiveData = {
						type: "embed",
						url: url,
					};
					node.data = data;
				}
			}
		});
	};
};
