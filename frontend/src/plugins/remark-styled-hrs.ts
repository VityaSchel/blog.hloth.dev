import { visit } from "unist-util-visit";
import type { RemarkPlugin } from "@astrojs/markdown-remark";

export const remarkStyledHrs: RemarkPlugin = () => {
	return (tree, file) => {
		visit(tree, "thematicBreak", (node) => {
			const sourceSeparator = file.value.slice(
				node.position?.start.offset,
				node.position?.end.offset,
			);
			node.data = node.data || {};
			node.data.hProperties = node.data.hProperties || {};
			if (sourceSeparator === "***") {
				node.data.hProperties.type = "asterisks";
			} else if (sourceSeparator === "---") {
				node.data.hProperties.type = "dashes";
			}
		});
	};
};
