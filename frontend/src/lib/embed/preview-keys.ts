import { createHash } from "node:crypto";

export const youtubeKey = (videoId: string) => `youtube-${videoId}`;

export const spotifyKey = (id: string) => `spotify-${id}`;

export const linkKey = (url: string) =>
	`link-${createHash("sha256").update(url).digest("hex").slice(0, 16)}`;

export type YouTubePreview = {
	kind: "youtube";
	url: string;
	title: string;
	image: string;
	fetched: string;
};

export type SpotifyPreview = {
	kind: "spotify";
	url: string;
	title: string;
	subtitle?: string;
	image: string;
	fetched: string;
};

export type LinkPreview = {
	kind: "link";
	url: string;
	title: string;
	siteName: string;
	description?: string;
	image?: string;
	fetched: string;
};

export type Preview = YouTubePreview | SpotifyPreview | LinkPreview;
