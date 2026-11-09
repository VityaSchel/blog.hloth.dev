export type Direction = "row" | "column";

export type GalleryNode =
	| { index: number; size: number }
	| { direction: Direction; size: number; children: GalleryNode[] };

export interface GalleryLayout {
	ratio: number;
	root: GalleryNode;
}

interface Album {
	width: number;
	height: number;
	root: GalleryNode;
}

export const MAX_PER_ROW = 3;
export const MAX_PER_ALBUM = 10;
const MIN_SHARE = 0.15;
const COMPACT_HEIGHT = 1;
const COMPLEX_HEIGHT = 4 / 3;
const MAX_SIMPLE_RATIO = 2;
const HEAD_HEIGHT_SHARE = 0.66;

const shapeOf = (ratio: number) =>
	ratio > 1.2 ? "wide" : ratio < 0.8 ? "narrow" : "square";

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

const leaf = (index: number, size: number): GalleryNode => ({ index, size });

const split = (
	direction: Direction,
	size: number,
	children: GalleryNode[],
): GalleryNode => ({ direction, size, children });

const lane = (
	direction: Direction,
	indices: number[],
	sizes: number[],
	breadth: number,
) =>
	split(
		direction,
		breadth,
		indices.map((index, i) => leaf(index, sizes[i]!)),
	);

const shares = (weights: number[]) => {
	const total = sum(weights);
	const lifted = weights.map((weight) => Math.max(weight / total, MIN_SHARE));
	const excess = sum(lifted) - 1;
	const flexible = sum(lifted.filter((share) => share > MIN_SHARE));
	return lifted.map((share) =>
		share > MIN_SHARE ? share - (excess * share) / flexible : share,
	);
};

const single = (ratio: number): Album => ({
	width: ratio,
	height: 1,
	root: leaf(0, 1),
});

function pair(a: number, b: number): Album {
	const shapes = `${shapeOf(a)}-${shapeOf(b)}`;
	if (shapes === "wide-wide" && (a + b) / 2 > 1.4 && Math.abs(b - a) < 0.2) {
		const height = Math.min(1 / a, 1 / b, COMPACT_HEIGHT / 2);
		const root = lane("column", [0, 1], [height, height], 1);
		return { width: 1, height: height * 2, root };
	}
	if (shapes === "wide-wide" || shapes === "square-square") {
		const height = Math.min(0.5 / a, 0.5 / b, COMPACT_HEIGHT);
		return { width: 1, height, root: lane("row", [0, 1], [0.5, 0.5], height) };
	}
	const second = clamp(b / (a + b), 0.4, 1 - 1.5 * MIN_SHARE);
	const first = 1 - second;
	const height = Math.min(COMPACT_HEIGHT, first / a, second / b);
	return {
		width: 1,
		height,
		root: lane("row", [0, 1], [first, second], height),
	};
}

function triple(a: number, b: number, c: number): Album {
	if (shapeOf(a) === "narrow") {
		const height = COMPACT_HEIGHT;
		const lower = Math.min(height / 2, (height * b) / (b + c));
		const upper = height - lower;
		const right = clamp(Math.min(upper * b, lower * c), MIN_SHARE, 0.5);
		const left = Math.min(height * a, 1 - right);
		const side = lane("column", [1, 2], [upper, lower], right);
		return {
			width: left + right,
			height,
			root: split("row", height, [leaf(0, left), side]),
		};
	}
	const head = Math.min(1 / a, COMPACT_HEIGHT * HEAD_HEIGHT_SHARE);
	const tail = Math.min(COMPACT_HEIGHT - head, 0.5 / b, 0.5 / c);
	const bottom = lane("row", [1, 2], [0.5, 0.5], tail);
	return {
		width: 1,
		height: head + tail,
		root: split("column", 1, [leaf(0, head), bottom]),
	};
}

function quad(a: number, rest: number[]): Album {
	if (shapeOf(a) === "wide") {
		const head = Math.min(1 / a, COMPACT_HEIGHT * HEAD_HEIGHT_SHARE);
		const tail = Math.min(COMPACT_HEIGHT - head, 1 / sum(rest));
		const bottom = lane("row", [1, 2, 3], shares(rest), tail);
		return {
			width: 1,
			height: head + tail,
			root: split("column", 1, [leaf(0, head), bottom]),
		};
	}
	const height = COMPACT_HEIGHT;
	const inverse = rest.map((ratio) => 1 / ratio);
	const left = Math.min(height * a, 0.6);
	const right = Math.max(MIN_SHARE, Math.min(1 - left, height / sum(inverse)));
	const heights = shares(inverse).map((share) => share * height);
	const side = lane("column", [1, 2, 3], heights, right);
	return {
		width: left + right,
		height,
		root: split("row", height, [leaf(0, left), side]),
	};
}

const cropped = (ratios: number[]) => {
	const landscape = sum(ratios) / ratios.length > 1.1;
	return ratios.map((ratio) =>
		landscape ? clamp(ratio, 1, 2.75) : clamp(ratio, 2 / 3, 1),
	);
};

function* compositions(
	count: number,
	prefix: number[] = [],
): Generator<number[]> {
	if (count === 0) {
		yield prefix;
		return;
	}
	for (let take = 1; take <= Math.min(MAX_PER_ROW, count); take++) {
		yield* compositions(count - take, [...prefix, take]);
	}
}

const rowHeights = (ratios: number[], counts: number[]) => {
	let start = 0;
	return counts.map((count) => {
		const height = 1 / sum(ratios.slice(start, start + count));
		start += count;
		return height;
	});
};

const scoreOf = (counts: number[], heights: number[]) => {
	const cramped = Math.min(...heights) < MIN_SHARE ? 1.5 : 1;
	const topHeavy = counts.some((count, i) => i > 0 && counts[i - 1]! > count);
	return (
		Math.abs(sum(heights) - COMPLEX_HEIGHT) * cramped * (topHeavy ? 1.5 : 1)
	);
};

function rows(ratios: number[], offset = 0): Album {
	const fitted = cropped(ratios);
	let best = {
		score: Infinity,
		counts: [] as number[],
		heights: [] as number[],
	};
	for (const counts of compositions(fitted.length)) {
		if (counts.length < 2 && fitted.length > 1) continue;
		const heights = rowHeights(fitted, counts);
		const score = scoreOf(counts, heights);
		if (score < best.score) best = { score, counts, heights };
	}
	let start = 0;
	const children = best.counts.map((count, i) => {
		const height = best.heights[i]!;
		const indices = Array.from({ length: count }, (_, k) => offset + start + k);
		const widths = fitted.slice(start, start + count).map((r) => r * height);
		start += count;
		return lane("row", indices, widths, height);
	});
	return {
		width: 1,
		height: sum(best.heights),
		root: split("column", 1, children),
	};
}

function chunked(ratios: number[]): Album {
	const count = Math.ceil(ratios.length / MAX_PER_ALBUM);
	const albums: Album[] = [];
	for (let i = 0, start = 0; i < count; i++) {
		const size = Math.round((ratios.length - start) / (count - i));
		albums.push(rows(ratios.slice(start, start + size), start));
		start += size;
	}
	const children = albums.flatMap((album) =>
		"children" in album.root ? album.root.children : [album.root],
	);
	return {
		width: 1,
		height: sum(albums.map((album) => album.height)),
		root: split("column", 1, children),
	};
}

function album(ratios: number[]): Album {
	const [a, b, c] = ratios as [number, number, number];
	if (ratios.length === 1) return single(a);
	if (ratios.length > MAX_PER_ALBUM) return chunked(ratios);
	if (ratios.length >= 5 || ratios.some((r) => r > MAX_SIMPLE_RATIO)) {
		return rows(ratios);
	}
	if (ratios.length === 2) return pair(a, b);
	if (ratios.length === 3) return triple(a, b, c);
	return quad(a, ratios.slice(1));
}

export function layoutGallery(ratios: number[]): GalleryLayout | null {
	if (ratios.length === 0) return null;
	if (ratios.some((ratio) => !Number.isFinite(ratio) || ratio <= 0)) {
		throw new RangeError(`Invalid gallery aspect ratios: ${ratios.join(", ")}`);
	}
	const { width, height, root } = album(ratios);
	return { ratio: width / height, root };
}

export const tallestBand = (node: GalleryNode, share = 1): number => {
	if ("index" in node || node.direction === "row") return share;
	const total = sum(node.children.map((child) => child.size));
	return Math.max(
		...node.children.map((child) =>
			tallestBand(child, (share * child.size) / total),
		),
	);
};

export type LeafShare = { width: number; height: number };

export const leafShares = (
	node: GalleryNode,
	share: LeafShare = { width: 1, height: 1 },
	shares = new Map<number, LeafShare>(),
): Map<number, LeafShare> => {
	if ("index" in node) return shares.set(node.index, share);
	const total = sum(node.children.map((child) => child.size));
	for (const child of node.children) {
		const part = child.size / total;
		leafShares(
			child,
			node.direction === "row"
				? { width: share.width * part, height: share.height }
				: { width: share.width, height: share.height * part },
			shares,
		);
	}
	return shares;
};
