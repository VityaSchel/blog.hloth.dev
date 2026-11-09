type ResolvedEmbed = {
	url: string;
	service: string;
	serviceId: string;
	aspectRatio: number | null;
	privacyPolicy?: string;
	oembedUrl?: string;
	thumbnailCandidates: string[];
};

const YOUTUBE_HOSTS = new Set([
	"youtube.com",
	"www.youtube.com",
	"youtube-nocookie.com",
	"www.youtube-nocookie.com",
]);

const TWITTER_HOSTS = new Set([
	"twitter.com",
	"www.twitter.com",
	"x.com",
	"www.x.com",
]);

const YOUTUBE_THUMBNAIL_SIZES = [
	"maxresdefault",
	"hq720",
	"sddefault",
	"hqdefault",
	"mqdefault",
	"default",
];

const resolveYouTube = (
	source: URL,
	original: string,
	aspectRatio: number | null,
): ResolvedEmbed => {
	const alreadyPrivate = source.hostname.includes("youtube-nocookie.com");
	if (!alreadyPrivate) {
		source.hostname = "www.youtube-nocookie.com";
		source.searchParams.delete("si");
	}
	const videoId = source.pathname.includes("/embed/")
		? source.pathname.split("/embed/")[1].split("/")[0]
		: source.searchParams.get("v");
	if (!videoId)
		throw new Error("Could not determine YouTube video ID from URL");
	return {
		url: alreadyPrivate ? original : source.toString(),
		service: "YouTube",
		serviceId: "youtube",
		aspectRatio,
		privacyPolicy: "https://policies.google.com/privacy",
		oembedUrl: `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
		thumbnailCandidates: YOUTUBE_THUMBNAIL_SIZES.map(
			(size) => `https://i.ytimg.com/vi/${videoId}/${size}.jpg`,
		),
	};
};

const resolveSpotify = (source: URL, original: string): ResolvedEmbed => {
	if (!source.pathname.includes("/embed/"))
		throw new Error("Spotify embeds must use the /embed/ URL format");
	return {
		url: original,
		service: "Spotify",
		serviceId: "spotify",
		aspectRatio: null,
		privacyPolicy: "https://www.spotify.com/to/legal/privacy-policy/",
		thumbnailCandidates: [],
	};
};

export const resolveEmbed = (
	url: string,
	service: string | undefined,
	aspectRatio: number | null,
): ResolvedEmbed => {
	if (service)
		return {
			url,
			service,
			serviceId: service.toLowerCase(),
			aspectRatio,
			thumbnailCandidates: [],
		};
	const source = new URL(url);
	if (YOUTUBE_HOSTS.has(source.hostname))
		return resolveYouTube(source, url, aspectRatio);
	if (TWITTER_HOSTS.has(source.hostname))
		return resolveEmbed(url, "Twitter", aspectRatio);
	if (source.hostname === "open.spotify.com")
		return resolveSpotify(source, url);
	throw new Error("Service argument must be provided for this URL");
};
