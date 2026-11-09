import { open } from "node:fs/promises";
import { cached, fileRevision } from "$lib/cache";
import { BoxReader, TruncatedBox, type Box } from "./isobmff";
import { emptyMeta, scanMeta, type MetaScan } from "./meta";

const HEAD_BYTES = 64 * 1024;
const PAYLOAD_LIMIT = 4096;

const AVIF_BRANDS = new Set(["avif", "avis"]);

type ByteRange = { offset: number; length: number };

type AvifInspection = {
	avif: boolean;
	toneMapBrand: boolean;
	complete: boolean;
	primaryItem: number | null;
	toneMapItems: number[];
	toneMapItem: number | null;
	gainMapItem: number | null;
	alternativeGroups: number[][];
	transformedItems: number[];
	payload: ByteRange | null;
	headroom: number | null;
	gainMap: boolean;
};

const brandsOf = (reader: BoxReader, ftyp: Box): string[] => {
	const brands = [reader.fourcc(ftyp.payload)];
	for (let offset = ftyp.payload + 8; offset + 4 <= ftyp.end; offset += 4)
		brands.push(reader.fourcc(offset));
	return brands;
};

const alternateHeadroom = (payload: Uint8Array): number | null => {
	const reader = new BoxReader(payload);
	if (payload.length < 22 || reader.u8(0) !== 0 || reader.u16(1) !== 0)
		return null;
	const denominator = reader.u32(18);
	return denominator ? reader.u32(14) / denominator : null;
};

const payloadRange = (scan: MetaScan, item: number): ByteRange | null => {
	const location = scan.locations.get(item);
	if (!location || location.method > 1) return null;
	if (location.method === 0) return location;
	if (!scan.idat) return null;
	return { ...location, offset: scan.idat.payload + location.offset };
};

const pairedToneMap = (scan: MetaScan) =>
	scan.toneMapItems.find((item) =>
		scan.alternativeGroups.some(
			(group) =>
				group[0] === item &&
				scan.primary !== null &&
				group.includes(scan.primary),
		),
	) ?? null;

const gainMapOf = (scan: MetaScan, toneMap: number | null) => {
	if (toneMap === null) return null;
	const inputs = scan.derivations.get(toneMap);
	if (inputs?.length !== 2 || inputs[0] !== scan.primary) return null;
	return inputs[1] === scan.primary ? null : inputs[1];
};

const readPayload = (bytes: Uint8Array, range: ByteRange | null) =>
	range &&
	range.length <= PAYLOAD_LIMIT &&
	range.offset + range.length <= bytes.length
		? bytes.subarray(range.offset, range.offset + range.length)
		: null;

const judge = (
	scan: MetaScan,
	base: Pick<AvifInspection, "avif" | "toneMapBrand" | "complete">,
	bytes: Uint8Array,
	external?: Uint8Array,
): AvifInspection => {
	const toneMapItem = pairedToneMap(scan);
	const gainMapItem = gainMapOf(scan, toneMapItem);
	const payload = toneMapItem === null ? null : payloadRange(scan, toneMapItem);
	const payloadBytes = external ?? readPayload(bytes, payload);
	const headroom = payloadBytes ? alternateHeadroom(payloadBytes) : null;
	const items = [scan.primary, toneMapItem, gainMapItem];
	const transformedItems = [...scan.transformed];
	const gainMap =
		base.avif &&
		base.toneMapBrand &&
		base.complete &&
		gainMapItem !== null &&
		!items.some((item) => item !== null && scan.transformed.has(item)) &&
		headroom !== null &&
		headroom > 0;
	return {
		...base,
		primaryItem: scan.primary,
		toneMapItems: scan.toneMapItems,
		toneMapItem,
		gainMapItem,
		alternativeGroups: scan.alternativeGroups,
		transformedItems,
		payload,
		headroom,
		gainMap,
	};
};

export const inspectAvif = (
	bytes: Uint8Array,
	external?: Uint8Array,
): AvifInspection => {
	const scan = emptyMeta();
	const base = { avif: false, toneMapBrand: false, complete: false };
	try {
		const reader = new BoxReader(bytes);
		const ftyp = reader.complete(reader.header(0, reader.length));
		if (ftyp.type === "ftyp") {
			const brands = brandsOf(reader, ftyp);
			base.avif = brands.some((brand) => AVIF_BRANDS.has(brand));
			base.toneMapBrand = brands.includes("tmap");
			const meta = reader
				.children(ftyp.end, reader.length)
				.find((box) => box.type === "meta");
			if (base.avif && meta) {
				scanMeta(reader, meta, scan);
				base.complete = true;
			}
		}
	} catch (error) {
		if (!(error instanceof TruncatedBox || error instanceof RangeError))
			throw error;
		base.complete = false;
	}
	return judge(scan, base, bytes, external);
};

const readRange = async (
	filePath: string,
	size: number,
	position = 0,
): Promise<Uint8Array> => {
	const handle = await open(filePath, "r");
	try {
		const buffer = new Uint8Array(size);
		const { bytesRead } = await handle.read(buffer, 0, size, position);
		return buffer.subarray(0, bytesRead);
	} finally {
		await handle.close();
	}
};

export const readHead = (filePath: string) => readRange(filePath, HEAD_BYTES);

export const inspectAvifFile = async (
	filePath: string,
): Promise<AvifInspection> => {
	const head = await readHead(filePath);
	const first = inspectAvif(head);
	const { payload } = first;
	if (first.headroom !== null || !payload || payload.length > PAYLOAD_LIMIT)
		return first;
	const bytes = await readRange(filePath, payload.length, payload.offset);
	return inspectAvif(head, bytes);
};

export const gainMapHeadroom = async (
	filePath: string,
): Promise<number | null> => {
	try {
		return await cached(
			"avif-gain-map-headroom",
			await fileRevision(filePath),
			async () => {
				const inspection = await inspectAvifFile(filePath);
				return inspection.gainMap ? inspection.headroom : null;
			},
		);
	} catch (error) {
		console.warn(
			`[hdr] gain map probe failed for ${filePath}: ${String(error)}`,
		);
		return null;
	}
};
