export type NavPostLink = { path: string; title: string; ru?: boolean };

export function mapCollectionEntryToNavPostLink(
	entry?: import("astro:content").CollectionEntry<"blog">,
): NavPostLink | undefined {
	return (
		entry && {
			path: "/" + entry.id,
			title: entry.data.title,
			ru: entry.data.locale === "ru",
		}
	);
}
