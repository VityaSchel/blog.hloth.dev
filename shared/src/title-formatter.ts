type TitleSegment = { text: string; emphasized: boolean };

const EMPHASIS = /\*([^*]+)\*/g;

export const titleSegments = (title: string): TitleSegment[] => {
	const segments: TitleSegment[] = [];
	let last = 0;
	for (const match of title.matchAll(EMPHASIS)) {
		const index = match.index ?? 0;
		if (index > last) segments.push({ text: title.slice(last, index), emphasized: false });
		segments.push({ text: match[1] ?? "", emphasized: true });
		last = index + match[0].length;
	}
	if (last < title.length || !segments.length)
		segments.push({ text: title.slice(last), emphasized: false });
	return segments;
};

export function formatTitle(title: string): {
	title: string;
	segments: TitleSegment[];
} {
	const segments = titleSegments(title);
	return { title: segments.map((segment) => segment.text).join(""), segments };
}
