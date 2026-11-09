import { load } from "cheerio";
import {
	layoutGallery,
	MAX_PER_ALBUM,
	tallestBand,
	type GalleryNode,
} from "./layout";

const ASPECT_RATIO =
	/(?:^|[\s;])(?:--)?aspect-ratio:\s*([\d.]+)(?:\s*\/\s*([\d.]+))?/;

export interface GalleryMarkup {
	ratio: number;
	band: number;
	fitsScreen: boolean;
	html: string;
	rest: string;
}

const ratioOf = (style: string | undefined) => {
	const match = style?.match(ASPECT_RATIO);
	if (!match) return null;
	const ratio = Number(match[1]) / Number(match[2] ?? 1);
	return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
};

const renderNode = (node: GalleryNode, cells: string[], grow = 1): string => {
	const style = `flex-grow: ${grow.toFixed(5)}`;
	if ("index" in node) {
		return `<div class="gallery-cell" style="${style}">${cells[node.index]}</div>`;
	}
	const total = node.children.reduce((sum, child) => sum + child.size, 0);
	const children = node.children.map((child) =>
		renderNode(child, cells, child.size / total),
	);
	return `<div class="gallery-${node.direction}" style="${style}">${children.join("")}</div>`;
};

export function buildGallery(slotHtml: string): GalleryMarkup {
	const $ = load(slotHtml, null, false);
	const media: { ratio: number; html: string }[] = [];
	const rest: string[] = [];
	$.root()
		.contents()
		.each((_, node) => {
			const element = $(node);
			if (node.type === "text" && !element.text().trim()) return;
			const ratio =
				node.type === "tag"
					? (ratioOf(element.attr("style")) ??
						ratioOf(
							element.find('[style*="aspect-ratio"]').first().attr("style"),
						))
					: null;
			if (ratio === null) rest.push($.html(node));
			else media.push({ ratio, html: $.html(node) });
		});
	const layout = layoutGallery(media.map((item) => item.ratio));
	const cells = media.map((item) => item.html);
	return {
		ratio: layout?.ratio ?? 1,
		band: layout ? tallestBand(layout.root) : 1,
		fitsScreen: media.length <= MAX_PER_ALBUM,
		html: layout ? renderNode(layout.root, cells) : "",
		rest: rest.join(""),
	};
}
