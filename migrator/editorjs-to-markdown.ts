import fs from "fs";
function convertEditorJsToMarkdown() {
	const stdinBuffer = fs.readFileSync(0);
	const editorjs = JSON.parse(stdinBuffer.toString());

	let output = "";
	for (const block of editorjs.blocks) {
		switch (block.type) {
			case "header":
				output += "#".repeat(block.data.level) + " " + block.data.text + "\n\n";
				break;
			case "paragraph": {
				const text = block.data.text.replace(/<br\s*\/?>/gi, "\n");
				output += text + "\n\n";
				break;
			}
			case "list": {
				type ListItem = {
					meta: Record<string, never>;
					items: ListItem[];
					content: string;
				};
				const formatList = (
					list: ListItem[],
					indent: number,
					style: "unordered" | "ordered",
				) => {
					let res = "";
					for (let i = 0; i < list.length; i++) {
						const item = list[i];
						const prefix = style === "ordered" ? `${i + 1}. ` : "- ";
						res += "  ".repeat(indent) + prefix + item.content + "\n";
					}
					return res;
				};
				output +=
					formatList(
						block.data.items,
						0,
						block.data.style === "ordered" ? "ordered" : "unordered",
					) + "\n";
				break;
			}
			case "image": {
				const alt = block.data.alt || "";
				let caption = block.data.caption.replace(/<br\s*\/?>/gi, "\n").trim();
				if (caption === "") caption = null;
				const url = "/files/" + block.data.file.id;
				output += `![${alt}](${url}${caption ? ` "${caption}"` : ""})\n\n`;
				break;
			}
			case "embed":
				output += "TODO: embed\n\n";
				break;
			case "video":
				// output += "TODO: video\n\n";
				output += `![${block.data.caption || "Video"}](${"/files/" + block.data.file.id})\n\n`;
				break;

			default:
				throw new Error(
					`Unsupported block type: ${block.type}: ${JSON.stringify(block)}`,
				);
		}
	}

	return output;
}

console.log(convertEditorJsToMarkdown());
