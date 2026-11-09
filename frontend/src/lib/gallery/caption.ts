import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkRehype)
	.use(rehypeExternalLinks, { rel: ["nofollow", "noreferrer"] })
	.use(rehypeStringify);

export const captionHtml = async (caption: string) =>
	String(await processor.process(caption.replaceAll("\\n", "\n"))).trim();
