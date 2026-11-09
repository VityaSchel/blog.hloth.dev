import { SKIP, visit } from "unist-util-visit";
import type { RehypePlugin } from "@astrojs/markdown-remark";
import { TABLE_SCROLL_CLASS } from "blog.hloth.dev-shared/src/table-scroll";

export const rehypeTableScroll: RehypePlugin = () => {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "table" || !parent || index === undefined) return;
			parent.children[index] = {
				type: "element",
				tagName: "div",
				properties: { className: [TABLE_SCROLL_CLASS] },
				children: [node],
			};
			return [SKIP, index + 1];
		});
	};
};
