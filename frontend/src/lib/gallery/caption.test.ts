import { describe, expect, test } from "bun:test";
import { captionHtml } from "./caption";

describe("captionHtml", () => {
	test("renders links with the site's external link rel", async () => {
		expect(
			await captionHtml(
				"[“Batumi” restaurant](https://www.instagram.com/batumienvalencia/), Valencia",
			),
		).toBe(
			'<p><a href="https://www.instagram.com/batumienvalencia/" rel="nofollow noreferrer">“Batumi” restaurant</a>, Valencia</p>',
		);
	});

	test("keeps relative links without rel", async () => {
		expect(await captionHtml("[my post](/i-am-20)")).toBe(
			'<p><a href="/i-am-20">my post</a></p>',
		);
	});

	test("keeps a typed \\n and a real newline as line breaks", async () => {
		expect(await captionHtml("first\\nsecond")).toBe("<p>first\nsecond</p>");
		expect(await captionHtml("first\nsecond")).toBe("<p>first\nsecond</p>");
	});

	test("splits paragraphs on a blank line", async () => {
		expect(await captionHtml("first\\n\\nsecond")).toBe(
			"<p>first</p>\n<p>second</p>",
		);
	});

	test("renders emphasis, code and strikethrough", async () => {
		expect(await captionHtml("**bold** _italic_ `code` ~gone~")).toBe(
			"<p><strong>bold</strong> <em>italic</em> <code>code</code> <del>gone</del></p>",
		);
	});

	test("drops raw HTML", async () => {
		expect(await captionHtml("<script>alert(1)</script>")).toBe("");
		const inline = await captionHtml(
			"before <img src=x onerror=alert(1)> after",
		);
		expect(inline).not.toContain("<img");
		expect(inline).toContain("before");
		expect(inline).toContain("after");
	});
});
