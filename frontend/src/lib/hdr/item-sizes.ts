import { BoxReader } from "./isobmff";
import { emptyMeta, scanMeta, type MetaScan } from "./meta";

export const scanItems = (bytes: Uint8Array): MetaScan => {
	const reader = new BoxReader(bytes);
	const ftyp = reader.header(0, reader.length);
	const meta = reader
		.children(ftyp.end, reader.length)
		.find((box) => box.type === "meta");
	const scan = emptyMeta();
	if (meta) scanMeta(reader, meta, scan);
	return scan;
};
