export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const firstReachable = async (
	urls: string[],
): Promise<string | undefined> => {
	for (const url of urls) {
		const response = await fetch(url, {
			method: "HEAD",
			signal: AbortSignal.timeout(5000),
		}).catch(() => null);
		if (response?.ok) return url;
	}
	return undefined;
};
