const VARIANT_SUFFIX = /-([1-9]\d*)w\.avif$/;

export const variantBase = (file: string): string | null => {
	const match = VARIANT_SUFFIX.exec(file);
	return match ? `${file.slice(0, match.index)}.avif` : null;
};

export const variantsOf = <T>(
	fsPath: string,
	modules: Record<string, T>,
): T[] =>
	Object.entries(modules)
		.filter(([key]) => {
			const base = variantBase(key);
			return base !== null && base.startsWith("/") && fsPath.endsWith(base);
		})
		.map(([, module]) => module);

type Candidate = { src: string; width: number; height: number };

const sameShape = (candidate: Candidate, original: Candidate) =>
	Math.abs(
		candidate.width / candidate.height - original.width / original.height,
	) <
	0.01 * (original.width / original.height);

export const srcsetOf = <T extends Candidate>(original: T, variants: T[]) => {
	const usable = variants.filter(
		(variant) => variant.width < original.width && sameShape(variant, original),
	);
	const byWidth = new Map<number, T>();
	for (const candidate of [...usable, original])
		byWidth.set(candidate.width, candidate);
	return [...byWidth.values()]
		.sort((a, b) => a.width - b.width)
		.map(({ src, width }) => `${src} ${width}w`)
		.join(", ");
};
