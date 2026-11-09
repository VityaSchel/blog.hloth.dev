import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { linkKey, spotifyKey, youtubeKey } from "./preview-keys";

describe("preview keys", () => {
	test("YouTube and Spotify previews are keyed by id", () => {
		expect(youtubeKey("tRq8Q-osmXc")).toBe("youtube-tRq8Q-osmXc");
		expect(spotifyKey("0FfqyjhB6Kspvit1oOo7ax")).toBe(
			"spotify-0FfqyjhB6Kspvit1oOo7ax",
		);
	});

	test("links are keyed by the first 16 hex digits of the URL's sha256", () => {
		const url = "https://git.hloth.dev/hloth/bunsogs";
		expect(linkKey(url)).toBe(
			`link-${createHash("sha256").update(url).digest("hex").slice(0, 16)}`,
		);
		expect(linkKey(url)).toMatch(/^link-[0-9a-f]{16}$/);
	});
});
