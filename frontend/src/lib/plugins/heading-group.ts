import { visit } from "unist-util-visit";
import type { RehypePlugin } from "@astrojs/markdown-remark";

export const rehypeHeadingGroup: RehypePlugin = () => {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.tagName)) {
				node.properties.className = node.properties.className || [];
				if (Array.isArray(node.properties.className)) {
					node.properties.className.push("group/heading");
				} else {
					node.properties.className = "group/heading";
				}
			}
		});
	};
};
