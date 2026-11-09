import { describe, expect, test } from "bun:test";
import { resolveEmbed } from "./services";

describe("resolveEmbed", () => {
	test.each([
		"https://www.youtube.com/watch?v=tRq8Q-osmXc",
		"https://youtu.be/tRq8Q-osmXc?si=share",
		"https://www.youtube.com/embed/tRq8Q-osmXc",
		"https://m.youtube.com/shorts/tRq8Q-osmXc",
		"https://www.youtube-nocookie.com/embed/tRq8Q-osmXc",
	])("%s becomes a nocookie embed with a YouTube preview key", (url) => {
		const embed = resolveEmbed(url, undefined, 16 / 9);
		expect(embed.url).toBe(
			"https://www.youtube-nocookie.com/embed/tRq8Q-osmXc",
		);
		expect(embed.link).toBe("https://www.youtube.com/watch?v=tRq8Q-osmXc");
		expect(embed.preview).toEqual({ kind: "youtube", id: "tRq8Q-osmXc" });
	});

	test("keeps the start time", () => {
		const embed = resolveEmbed(
			"https://www.youtube.com/watch?v=tRq8Q-osmXc&t=1m30s",
			undefined,
			16 / 9,
		);
		expect(embed.url).toBe(
			"https://www.youtube-nocookie.com/embed/tRq8Q-osmXc?start=90",
		);
		expect(embed.link).toBe(
			"https://www.youtube.com/watch?v=tRq8Q-osmXc&t=90s",
		);
	});

	test.each([
		"https://open.spotify.com/embed/track/0FfqyjhB6Kspvit1oOo7ax",
		"https://open.spotify.com/intl-de/track/0FfqyjhB6Kspvit1oOo7ax?si=x",
	])("%s becomes a Spotify embed with a preview key", (url) => {
		const embed = resolveEmbed(url, undefined, 16 / 9);
		expect(embed.url).toBe(
			"https://open.spotify.com/embed/track/0FfqyjhB6Kspvit1oOo7ax",
		);
		expect(embed.link).toBe(
			"https://open.spotify.com/track/0FfqyjhB6Kspvit1oOo7ax",
		);
		expect(embed.aspectRatio).toBeNull();
		expect(embed.preview).toEqual({
			kind: "spotify",
			id: "0FfqyjhB6Kspvit1oOo7ax",
		});
	});

	test("an explicit service needs no preview", () => {
		expect(
			resolveEmbed("https://example.org", "Example", 1).preview,
		).toBeUndefined();
	});

	test.each([
		"https://www.youtube.com/watch",
		"https://open.spotify.com/user/x",
	])("%s is rejected", (url) => {
		expect(() => resolveEmbed(url, undefined, 1)).toThrow();
	});
});
