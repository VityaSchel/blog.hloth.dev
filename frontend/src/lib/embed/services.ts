type ResolvedEmbed = {
	url: string;
	link: string;
	service: string;
	serviceId: string;
	aspectRatio: number | null;
	privacyPolicy?: string;
	oembedUrl?: string;
	subtitleUrl?: string;
	thumbnailCandidates: string[];
};

const YOUTUBE_HOSTS = new Set([
	"youtube.com",
	"www.youtube.com",
	"m.youtube.com",
	"music.youtube.com",
	"youtube-nocookie.com",
	"www.youtube-nocookie.com",
	"youtu.be",
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

const YOUTUBE_PATH_ID = /^\/(?:embed|shorts|live|v)\/([\w-]{11})/;

const SPOTIFY_PATH =
	/^\/(?:embed\/)?(track|album|playlist|episode|show|artist)\/(\w+)/;

const youTubeVideoId = (source: URL) => {
	if (source.hostname === "youtu.be") return source.pathname.slice(1, 12);
	return (
		YOUTUBE_PATH_ID.exec(source.pathname)?.[1] ?? source.searchParams.get("v")
	);
};

const startSeconds = (value: string | null) => {
	if (!value) return null;
	if (/^\d+$/.test(value)) return Number(value);
	const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
	if (!match || !match[0]) return null;
	const [, hours = "0", minutes = "0", seconds = "0"] = match;
	return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

const resolveYouTube = (
	source: URL,
	aspectRatio: number | null,
): ResolvedEmbed => {
	const videoId = youTubeVideoId(source);
	if (!videoId || !/^[\w-]{11}$/.test(videoId))
		throw new Error("Could not determine YouTube video ID from URL");
	const start = startSeconds(
		source.searchParams.get("start") ?? source.searchParams.get("t"),
	);
	const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
	const watchUrl = new URL("https://www.youtube.com/watch");
	watchUrl.searchParams.set("v", videoId);
	if (start) {
		embedUrl.searchParams.set("start", String(start));
		watchUrl.searchParams.set("t", `${start}s`);
	}
	return {
		url: embedUrl.toString(),
		link: watchUrl.toString(),
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

const resolveSpotify = (source: URL): ResolvedEmbed => {
	const match = SPOTIFY_PATH.exec(source.pathname.replace(/^\/intl-\w+/, ""));
	if (!match)
		throw new Error(
			"Spotify embeds need a track, album, playlist, episode, show or artist URL",
		);
	const [, kind, id] = match;
	const link = `https://open.spotify.com/${kind}/${id}`;
	return {
		url: `https://open.spotify.com/embed/${kind}/${id}`,
		link,
		service: "Spotify",
		serviceId: "spotify",
		aspectRatio: null,
		privacyPolicy: "https://www.spotify.com/to/legal/privacy-policy/",
		oembedUrl: `https://open.spotify.com/oembed?url=${encodeURIComponent(link)}`,
		subtitleUrl: link,
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
			link: url,
			service,
			serviceId: service.toLowerCase(),
			aspectRatio,
			thumbnailCandidates: [],
		};
	const source = new URL(url);
	if (YOUTUBE_HOSTS.has(source.hostname))
		return resolveYouTube(source, aspectRatio);
	if (TWITTER_HOSTS.has(source.hostname))
		return resolveEmbed(url, "Twitter", aspectRatio);
	if (source.hostname === "open.spotify.com") return resolveSpotify(source);
	throw new Error("Service argument must be provided for this URL");
};
