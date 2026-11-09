export class TruncatedBox extends Error {}

export type Box = {
	type: string;
	start: number;
	payload: number;
	end: number;
};

const decoder = new TextDecoder("latin1");

export class BoxReader {
	readonly view: DataView;

	constructor(readonly bytes: Uint8Array) {
		this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	}

	get length(): number {
		return this.bytes.byteLength;
	}

	require(offset: number, size: number): void {
		if (offset < 0 || offset + size > this.length) throw new TruncatedBox();
	}

	u8(offset: number): number {
		this.require(offset, 1);
		return this.view.getUint8(offset);
	}

	u16(offset: number): number {
		this.require(offset, 2);
		return this.view.getUint16(offset);
	}

	u32(offset: number): number {
		this.require(offset, 4);
		return this.view.getUint32(offset);
	}

	uint(offset: number, size: number): number {
		if (size === 0) return 0;
		if (size === 2) return this.u16(offset);
		if (size === 4) return this.u32(offset);
		if (size === 8) return this.u32(offset) * 2 ** 32 + this.u32(offset + 4);
		throw new RangeError(`unsupported field size ${size}`);
	}

	fourcc(offset: number): string {
		this.require(offset, 4);
		return decoder.decode(this.bytes.subarray(offset, offset + 4));
	}

	header(start: number, limit: number): Box {
		const declared = this.u32(start);
		const type = this.fourcc(start + 4);
		let payload = start + 8;
		let end = start + declared;
		if (declared === 1) {
			end = start + this.uint(start + 8, 8);
			payload += 8;
		} else if (declared === 0) {
			end = limit;
		}
		if (end < payload) throw new RangeError(`malformed ${type} box`);
		return { type, start, payload, end };
	}

	children(start: number, end: number): Box[] {
		const boxes: Box[] = [];
		let cursor = start;
		while (cursor + 8 <= end) {
			const box = this.header(cursor, end);
			boxes.push(box);
			cursor = box.end;
		}
		return boxes;
	}

	complete(box: Box): Box {
		this.require(box.start, box.end - box.start);
		return box;
	}
}
