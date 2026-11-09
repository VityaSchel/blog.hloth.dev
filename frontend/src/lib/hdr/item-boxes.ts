import type { Box, BoxReader } from "./isobmff";

export type Location = {
	id: number;
	method: number;
	base: number;
	extents: { offset: number; length: number }[];
};

type Association = { essential: boolean; index: number };

export type Associations = {
	version: number;
	flags: number;
	entries: { id: number; associations: Association[] }[];
};

const nibbles = (value: number) => [value >> 4, value & 0x0f] as const;

export const parseLocations = (reader: BoxReader, iloc: Box): Location[] => {
	const version = reader.u8(iloc.payload);
	let cursor = iloc.payload + 4;
	const [offsetSize, lengthSize] = nibbles(reader.u8(cursor++));
	const [baseSize, indexSize] = nibbles(reader.u8(cursor++));
	const wide = version === 2;
	const count = wide ? reader.u32(cursor) : reader.u16(cursor);
	cursor += wide ? 4 : 2;
	const locations: Location[] = [];
	for (let item = 0; item < count; item++) {
		const id = wide ? reader.u32(cursor) : reader.u16(cursor);
		cursor += wide ? 4 : 2;
		const method = version === 0 ? 0 : reader.u16(cursor) & 0x0f;
		cursor += (version === 0 ? 0 : 2) + 2;
		const base = reader.uint(cursor, baseSize);
		cursor += baseSize;
		const extentCount = reader.u16(cursor);
		cursor += 2;
		const extents: Location["extents"] = [];
		for (let index = 0; index < extentCount; index++) {
			cursor += version === 0 ? 0 : indexSize;
			const offset = reader.uint(cursor, offsetSize);
			const length = reader.uint(cursor + offsetSize, lengthSize);
			cursor += offsetSize + lengthSize;
			extents.push({ offset, length });
		}
		locations.push({ id, method, base, extents });
	}
	return locations;
};

export const parseAssociations = (
	reader: BoxReader,
	ipma: Box,
): Associations => {
	const version = reader.u8(ipma.payload);
	const flags = reader.u32(ipma.payload) & 0xffffff;
	const count = reader.u32(ipma.payload + 4);
	let cursor = ipma.payload + 8;
	const entries: Associations["entries"] = [];
	for (let entry = 0; entry < count; entry++) {
		const id = version < 1 ? reader.u16(cursor) : reader.u32(cursor);
		cursor += version < 1 ? 2 : 4;
		const total = reader.u8(cursor++);
		const associations: Association[] = [];
		for (let index = 0; index < total; index++) {
			const wideIndex = (flags & 1) === 1;
			const raw = wideIndex ? reader.u16(cursor) : reader.u8(cursor);
			cursor += wideIndex ? 2 : 1;
			const bits = wideIndex ? 15 : 7;
			associations.push({
				essential: raw >> bits === 1,
				index: raw & ((1 << bits) - 1),
			});
		}
		entries.push({ id, associations });
	}
	return { version, flags, entries };
};
