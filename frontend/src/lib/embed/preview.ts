import z from "zod";
import { cached } from "$lib/cache";
import { ONE_WEEK_MS, firstReachable } from "$lib/remote";

type EmbedPreviewData = {
	title: string;
	thumbnailUrl: string;
	subtitle?: string;
};

type PreviewSources = {
	oembedUrl: string;
	thumbnailCandidates: string[];
	subtitleUrl?: string;
};

const oembedSchema = z.object({
	title: z.string(),
	thumbnail_url: z.string().optional(),
});

const MUSICIAN_META =
	/<meta\s+name="music:musician_description"\s+content="([^"]+)"/;

const decodeEntities = (text: string) =>
	text
		.replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(+code))
		.replace(/&quot;/g, '"')
		.replace(/&#x27;|&apos;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");

const fetchSubtitle = async (pageUrl: string) => {
	const response = await fetch(pageUrl, {
		signal: AbortSignal.timeout(8000),
	}).catch(() => null);
	if (!response?.ok) return undefined;
	const match = MUSICIAN_META.exec(await response.text());
	return match ? decodeEntities(match[1]) : undefined;
};

const fetchPreview = async ({
	oembedUrl,
	thumbnailCandidates,
	subtitleUrl,
}: PreviewSources): Promise<EmbedPreviewData> => {
	const response = await fetch(oembedUrl, {
		signal: AbortSignal.timeout(8000),
	});
	if (!response.ok)
		throw new Error(
			`oEmbed request failed: ${response.status} ${response.statusText}`,
		);
	const data = oembedSchema.parse(await response.json());
	const thumbnailUrl = await firstReachable([
		...thumbnailCandidates,
		...(data.thumbnail_url ? [data.thumbnail_url] : []),
	]);
	if (!thumbnailUrl) throw new Error(`No reachable thumbnail for ${oembedUrl}`);
	const subtitle = subtitleUrl ? await fetchSubtitle(subtitleUrl) : undefined;
	return { title: data.title, thumbnailUrl, ...(subtitle ? { subtitle } : {}) };
};

export const getEmbedPreview = async (
	sources: PreviewSources,
): Promise<EmbedPreviewData | null> => {
	try {
		return await cached(
			"embed-preview",
			sources.oembedUrl,
			() => fetchPreview(sources),
			{ maxAgeMs: ONE_WEEK_MS },
		);
	} catch (error) {
		console.warn(`Embed preview unavailable for ${sources.oembedUrl}:`, error);
		return null;
	}
};
