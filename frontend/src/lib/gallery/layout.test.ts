import { describe, expect, test } from "bun:test";
import { layoutGallery, MAX_PER_ROW, type GalleryNode } from "./layout";

const leaves = (node: GalleryNode): number[] =>
	"index" in node ? [node.index] : node.children.flatMap(leaves);

const splits = (
	node: GalleryNode,
): Extract<GalleryNode, { children: unknown }>[] =>
	"index" in node ? [] : [node, ...node.children.flatMap(splits)];

const PORTRAIT = 3 / 4;
const LANDSCAPE = 4 / 3;
const WIDE = 16 / 9;

const seeded = (seed: number) => () => {
	seed = (seed * 16807) % 2147483647;
	return seed / 2147483647;
};

describe("layoutGallery", () => {
	test("returns null without media", () => {
		expect(layoutGallery([])).toBeNull();
	});

	test("rejects broken ratios", () => {
		expect(() => layoutGallery([1, Number.NaN])).toThrow(RangeError);
		expect(() => layoutGallery([0])).toThrow(RangeError);
	});

	test("keeps a single image at its own ratio", () => {
		expect(layoutGallery([PORTRAIT])).toEqual({
			ratio: PORTRAIT,
			root: { index: 0, size: 1 },
		});
	});

	test("stacks two similar wide images", () => {
		const layout = layoutGallery([WIDE, WIDE])!;
		expect(layout.root).toMatchObject({ direction: "column" });
		expect(layout.ratio).toBeCloseTo(1, 5);
	});

	test("puts two portraits side by side", () => {
		const layout = layoutGallery([PORTRAIT, PORTRAIT])!;
		expect(layout.root).toMatchObject({ direction: "row" });
		expect(leaves(layout.root)).toEqual([0, 1]);
	});

	test("puts a narrow first image left of the other two", () => {
		const layout = layoutGallery([PORTRAIT, LANDSCAPE, LANDSCAPE])!;
		expect(layout.root).toMatchObject({
			direction: "row",
			children: [{ index: 0 }, { direction: "column" }],
		});
	});

	test("puts a wide first image above three others", () => {
		const layout = layoutGallery([WIDE, PORTRAIT, PORTRAIT, PORTRAIT])!;
		expect(layout.root).toMatchObject({
			direction: "column",
			children: [{ index: 0 }, { direction: "row" }],
		});
	});

	test("splits five portraits into two rows, fuller row last", () => {
		const layout = layoutGallery(Array(5).fill(PORTRAIT))!;
		const rows = splits(layout.root).filter((n) => n.direction === "row");
		expect(rows.map((row) => row.children.length)).toEqual([2, 3]);
	});

	test.each(Array.from({ length: 30 }, (_, i) => i + 1))(
		"%i images: every image once, at most %p per row",
		(count) => {
			const random = seeded(count * 7919);
			const ratios = Array.from({ length: count }, () => 0.4 + random() * 2.6);
			const layout = layoutGallery(ratios)!;
			expect(leaves(layout.root).sort((a, b) => a - b)).toEqual(
				ratios.map((_, i) => i),
			);
			for (const split of splits(layout.root)) {
				if (split.direction === "row") {
					expect(split.children.length).toBeLessThanOrEqual(MAX_PER_ROW);
				}
				for (const child of split.children) {
					expect(child.size).toBeGreaterThan(0);
				}
			}
			expect(layout.ratio).toBeGreaterThan(0);
			expect(Number.isFinite(layout.ratio)).toBe(true);
		},
	);
});
