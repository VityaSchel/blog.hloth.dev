import type { Box, BoxReader } from "./isobmff";
import { parseAssociations, parseLocations } from "./item-boxes";

const TRANSFORMS = new Set(["irot", "imir", "clap", "pasp"]);

type Extent = { method: number; offset: number; length: number };

export type MetaScan = {
	primary: number | null;
	toneMapItems: number[];
	itemTypes: Map<number, string>;
	alternativeGroups: number[][];
	derivations: Map<number, number[]>;
	transformed: Set<number>;
	locations: Map<number, Extent>;
	sizes: Map<number, number>;
	idat: Box | null;
};

export const emptyMeta = (): MetaScan => ({
	primary: null,
	toneMapItems: [],
	itemTypes: new Map(),
	alternativeGroups: [],
	derivations: new Map(),
	transformed: new Set(),
	locations: new Map(),
	sizes: new Map(),
	idat: null,
});

const itemId = (reader: BoxReader, offset: number, wide: boolean) =>
	wide ? reader.u32(offset) : reader.u16(offset);

const scanPrimary = (reader: BoxReader, pitm: Box, scan: MetaScan) => {
	scan.primary = itemId(reader, pitm.payload + 4, reader.u8(pitm.payload) > 0);
};

const scanItemInfo = (reader: BoxReader, iinf: Box, scan: MetaScan) => {
	const first = iinf.payload + (reader.u8(iinf.payload) === 0 ? 6 : 8);
	for (const infe of reader.children(first, iinf.end)) {
		if (infe.type !== "infe") continue;
		reader.complete(infe);
		const version = reader.u8(infe.payload);
		if (version < 2) continue;
		const wide = version > 2;
		const id = itemId(reader, infe.payload + 4, wide);
		const type = reader.fourcc(infe.payload + (wide ? 10 : 8));
		scan.itemTypes.set(id, type);
		if (type === "tmap") scan.toneMapItems.push(id);
	}
};

const scanReferences = (reader: BoxReader, iref: Box, scan: MetaScan) => {
	const wide = reader.u8(iref.payload) > 0;
	const size = wide ? 4 : 2;
	for (const reference of reader.children(iref.payload + 4, iref.end)) {
		if (reference.type !== "dimg") continue;
		const from = itemId(reader, reference.payload, wide);
		const count = reader.u16(reference.payload + size);
		const targets: number[] = [];
		for (let index = 0; index < count; index++)
			targets.push(
				itemId(reader, reference.payload + size + 2 + index * size, wide),
			);
		scan.derivations.set(from, targets);
	}
};

const scanGroups = (reader: BoxReader, grpl: Box, scan: MetaScan) => {
	for (const group of reader.children(grpl.payload, grpl.end)) {
		if (group.type !== "altr") continue;
		const count = reader.u32(group.payload + 8);
		const entities: number[] = [];
		for (let index = 0; index < count; index++)
			entities.push(reader.u32(group.payload + 12 + index * 4));
		scan.alternativeGroups.push(entities);
	}
};

const scanProperties = (reader: BoxReader, iprp: Box, scan: MetaScan) => {
	const boxes = reader.children(iprp.payload, iprp.end);
	const ipco = boxes.find((child) => child.type === "ipco");
	if (!ipco) return;
	const properties = reader
		.children(ipco.payload, ipco.end)
		.map((property) => property.type);
	for (const ipma of boxes) {
		if (ipma.type !== "ipma") continue;
		for (const { id, associations } of parseAssociations(reader, ipma).entries)
			if (
				associations.some(({ index }) =>
					TRANSFORMS.has(properties[index - 1] ?? ""),
				)
			)
				scan.transformed.add(id);
	}
};

const scanLocations = (reader: BoxReader, iloc: Box, scan: MetaScan) => {
	for (const { id, method, base, extents } of parseLocations(reader, iloc)) {
		scan.sizes.set(
			id,
			extents.reduce((size, { length }) => size + length, 0),
		);
		const [only] = extents;
		if (extents.length === 1)
			scan.locations.set(id, {
				method,
				offset: base + only.offset,
				length: only.length,
			});
	}
};

const SCANNERS: Record<
	string,
	(reader: BoxReader, box: Box, scan: MetaScan) => void
> = {
	pitm: scanPrimary,
	iinf: scanItemInfo,
	iref: scanReferences,
	grpl: scanGroups,
	iprp: scanProperties,
	iloc: scanLocations,
	idat: (_, box, scan) => void (scan.idat = box),
};

export const scanMeta = (reader: BoxReader, meta: Box, scan: MetaScan) => {
	for (const child of reader.children(meta.payload + 4, meta.end))
		SCANNERS[child.type]?.(reader, reader.complete(child), scan);
};
