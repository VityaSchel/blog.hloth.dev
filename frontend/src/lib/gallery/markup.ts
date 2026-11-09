import { load } from "cheerio";
import {
	layoutGallery,
	leafShares,
	MAX_PER_ALBUM,
	tallestBand,
	type GalleryNode,
} from "./layout";

export const GALLERY_ROW_MAX = 400;

const COLUMN_WIDTH = "min(100vw - 3rem, 680px)";

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

export const albumWidthCap = (ratio: number, band: number) =>
	Math.round((GALLERY_ROW_MAX * ratio) / band);

export const cellSizes = (factor: number, albumCap: number) =>
	`calc(${factor.toFixed(4)} * min(${COLUMN_WIDTH}, ${albumCap}px))`;

export function buildGallery(slotHtml: string): GalleryMarkup {
	const $ = load(slotHtml, null, false);
	const media: { ratio: number; element: ReturnType<typeof $> }[] = [];
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
			else media.push({ ratio, element });
		});
	const layout = layoutGallery(media.map((item) => item.ratio));
	const band = layout ? tallestBand(layout.root) : 1;
	if (layout) {
		const cap = albumWidthCap(layout.ratio, band);
		for (const [index, share] of leafShares(layout.root)) {
			const { ratio, element } = media[index]!;
			const factor = Math.max(
				share.width,
				(share.height * ratio) / layout.ratio,
			);
			element
				.find("img[srcset], source[srcset]")
				.attr("sizes", cellSizes(factor, cap));
		}
	}
	const cells = media.map((item) => $.html(item.element));
	return {
		ratio: layout?.ratio ?? 1,
		band,
		fitsScreen: media.length <= MAX_PER_ALBUM,
		html: layout ? renderNode(layout.root, cells) : "",
		rest: rest.join(""),
	};
}
