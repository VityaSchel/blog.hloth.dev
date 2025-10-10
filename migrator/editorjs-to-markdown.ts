import fs from "fs";
function convertEditorJsToMarkdown() {
	const stdinBuffer = fs.readFileSync(0);
	const editorjs = JSON.parse(stdinBuffer.toString());

	function escape(str: string) {
		return String(str).replace(/"/g, "&quot;");
	}

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
				if (caption) {
					caption = `[${caption}]`;
				} else {
					caption = "";
				}
				const args = [
					`src="${escape(url)}"`,
					`alt="${escape(alt)}"`,
					`width=${escape(block.data.file.width)}`,
					`height=${escape(block.data.file.height)}`,
				];
				output += `::img${caption}{${args.join(" ")}}\n\n`;
				break;
			}
			case "embed": {
				const args = [
					`url="${escape(block.data.embed)}"`,
					`ar=${block.data.width / block.data.height}`,
				];
				if (block.data.service !== "youtube") {
					args.push(`service="${escape(block.data.service)}"`);
				}
				let caption = "";
				if (block.data.caption) {
					caption = `[${block.data.caption.replaceAll(/]/g, "\\]")}]`;
				}
				output += `::embed${caption}{${args.join(" ")}}\n\n`;
				break;
			}
			case "video": {
				let caption = "";
				if (block.data.caption) {
					caption = `[${block.data.caption.replaceAll(/]/g, "\\]")}]`;
				}
				const args = [
					`src="/files/${escape(block.data.file.id)}"`,
					`ar=${block.data.aspectRatio}`,
				];
				output += `::video${caption}{${args.join(" ")}}\n\n`;
				break;
			}
			default:
				throw new Error(
					`Unsupported block type: ${block.type}: ${JSON.stringify(block)}`,
				);
		}
	}

	return output;
}

console.log(convertEditorJsToMarkdown());
