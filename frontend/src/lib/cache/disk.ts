import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd(), "node_modules/.cache/postkit");

type Entry<T> = { storedAt: number; value: T };

const entryPath = (namespace: string, key: string) =>
	path.join(
		root,
		namespace,
		`${createHash("sha256").update(key).digest("hex").slice(0, 32)}.json`,
	);

export const readEntry = async <T>(
	namespace: string,
	key: string,
): Promise<Entry<T> | null> => {
	try {
		return JSON.parse(await readFile(entryPath(namespace, key), "utf8"));
	} catch {
		return null;
	}
};

export const writeEntry = async <T>(
	namespace: string,
	key: string,
	value: T,
): Promise<void> => {
	const file = entryPath(namespace, key);
	await mkdir(path.dirname(file), { recursive: true });
	const entry: Entry<T> = { storedAt: Date.now(), value };
	await writeFile(file, JSON.stringify(entry));
};
