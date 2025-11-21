// /* eslint-disable @typescript-eslint/no-unused-expressions */
// const mdxPost = env.files[0];
// if (!mdxPost) {
// 	throw new Error("No file provided");
// }

// import { remark } from "remark";
// import remarkMdx from "remark-mdx";
// import type { RootContent } from "mdast";
// import fs from "fs/promises";
// import sharp from "sharp";

// const workspaceDir = workspace.root();
// const mdxFileDir = mdxPost.filename;
// const mdxDir = path.resolve(workspaceDir, path.dirname(mdxFileDir));

// const file = remark().use(remarkMdx).parse(mdxPost.content);

// const importMap = new Map<string, string>();
// async function loop(children: RootContent[]) {
// 	for (const node of children) {
// 		if (
// 			node.type === "mdxJsxFlowElement" &&
// 			node.name === "Image" &&
// 			node.attributes.find(
// 				(attr) =>
// 					attr.type === "mdxJsxAttribute" && attr.name === "alt" && !attr.value,
// 			)
// 		) {
// 			const src = node.attributes.find(
// 				(a) => a.type === "mdxJsxAttribute" && a.name === "src",
// 			)?.value;
// 			if (src && typeof src !== "string") {
// 				const data = src.data?.estree;
// 				if (
// 					data &&
// 					data.body.length === 1 &&
// 					data.body[0]?.type === "ExpressionStatement" &&
// 					data.body[0].expression.type === "Identifier"
// 				) {
// 					const importVarName = data.body[0].expression.name;
// 					const importPath = importMap.get(importVarName);
// 					if (importPath) {
// 						const importFullPath = path.join(mdxDir, importPath);
// 						const content = await fs.readFile(importFullPath);
// 						const converted = await sharp(content)
// 							.resize(512, 512, {
// 								fit: "inside",
// 							})
// 							.jpeg({
// 								quality: 50,
// 							})
// 							.toBuffer();
// 						const start = performance.now();
// 						console.log("Sending image for alt text generation...");
// 						const { text, error } = await runPrompt(
// 							(_) => {
// 								_.defImages(converted, { detail: "low" });
// 								_.$`
// 									You are an expert in assistive technology.

// 									You will analyze the image
// 									and generate a description alt text for the image.

// 									- Do not include alt text in the description.
// 									- Keep it short but descriptive.
// 									- Do not generate the [ character.`;
// 							},
// 							{
// 								system: [
// 									"system.assistant",
// 									"system.safety_jailbreak",
// 									"system.safety_harmful_content",
// 									"system.safety_validate_harmful_content",
// 								],
// 								// LOW tier
// 								// "github:mistral-ai/mistral-small-2503" // 5155ms
// 								// "github:microsoft/Phi-4-multimodal-instruct" // 5100ms
// 								// "github:meta/Llama-3.2-11B-Vision-Instruct" // 7300ms
// 								// "github:openai/gpt-4.1-mini" // 6600ms
// 								// "github:openai/gpt-4.1-nano" // 5300ms
// 								// "github:mistral-ai/mistral-medium-2505" // 6700ms
// 								// HIGH tier
// 								// "github:openai/gpt-4o" // 6400ms
// 								model: "haik",
// 								maxTokens: 4000,
// 								temperature: 0.5,
// 								cache: "alt-text",
// 								label: `alt-textify ${importFullPath}`,
// 							},
// 						);
// 						const end = performance.now();
// 						console.log(
// 							`Alt text generation took ${(end - start).toFixed(2)} ms`,
// 						);
// 						if (error) {
// 							console.error(
// 								`Error generating alt text for image ${importFullPath}: ${error}`,
// 							);
// 							return "halt";
// 						} else if (text) {
// 							console.log("Successfully generated alt text:", text);
// 						}
// 						return "halt";
// 					} else {
// 						console.error(
// 							`Image with missing alt and unknown import variable: ${importVarName}`,
// 						);
// 					}
// 				} else {
// 					console.error(`Image with missing alt and non-string src: ${src}`);
// 				}
// 			} else {
// 				console.error(`Image with missing alt and unknown src: ${src}`);
// 			}
// 		}
// 		if (node.type === "mdxjsEsm") {
// 			const data = node.data?.estree;
// 			data?.body.forEach((statement) => {
// 				if (statement.type === "ImportDeclaration") {
// 					if (
// 						statement.specifiers.length === 1 &&
// 						statement.specifiers[0]?.type === "ImportDefaultSpecifier"
// 					) {
// 						const importVarName = statement.specifiers[0].local.name;
// 						const importPath = statement.source.value;
// 						if (typeof importPath === "string") {
// 							importMap.set(importVarName, importPath);
// 						} else {
// 							console.error(`Unexpected import path: ${importPath}`);
// 						}
// 					} else {
// 						console.error(
// 							`Unexpected import statement: ${statement}. Is this an image?`,
// 						);
// 					}
// 				}
// 			});
// 		}
// 		if ("children" in node) {
// 			const loopResult = await loop(node.children);
// 			if (loopResult === "halt") {
// 				return "halt";
// 			}
// 		}
// 	}
// }
// await loop(file.children);
