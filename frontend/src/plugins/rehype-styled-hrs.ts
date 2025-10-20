import { visit } from "unist-util-visit";
import type { RehypePlugin } from "@astrojs/markdown-remark";

export const rehypeStyledHrs: RehypePlugin = () => {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName === "hr") {
				node.properties.className = node.properties.className || [];
				const separatorType = node.properties.type;
				let newClass = "";
				if (separatorType === "asterisks") {
					newClass = "asterisks";
				} else if (separatorType === "dashes") {
					newClass = "dashes";
				}
				if (newClass) {
					if (Array.isArray(node.properties.className)) {
						node.properties.className.push(newClass);
					} else {
						node.properties.className = [newClass];
					}
				}
			}
		});
	};
};
