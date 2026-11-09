import z from "zod";
import { cached } from "$lib/cache";
import { ONE_WEEK_MS, firstReachable } from "$lib/remote";

type EmbedPreviewData = { title: string; thumbnailUrl: string };

const oembedSchema = z.object({
	title: z.string(),
	thumbnail_url: z.string().optional(),
});

const fetchPreview = async (
	oembedUrl: string,
	thumbnailCandidates: string[],
): Promise<EmbedPreviewData> => {
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
	return { title: data.title, thumbnailUrl };
};

export const getEmbedPreview = async (
	oembedUrl: string,
	thumbnailCandidates: string[],
): Promise<EmbedPreviewData | null> => {
	try {
		return await cached(
			"embed-preview",
			oembedUrl,
			() => fetchPreview(oembedUrl, thumbnailCandidates),
			{ maxAgeMs: ONE_WEEK_MS },
		);
	} catch (error) {
		console.warn(`Embed preview unavailable for ${oembedUrl}:`, error);
		return null;
	}
};
