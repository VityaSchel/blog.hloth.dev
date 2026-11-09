import { stat } from "node:fs/promises";
import { readEntry, writeEntry } from "./disk";

const memo = new Map<string, Promise<unknown>>();

type CacheOptions = { maxAgeMs?: number };

const isFresh = (storedAt: number, maxAgeMs?: number) =>
	maxAgeMs === undefined || Date.now() - storedAt < maxAgeMs;

const resolve = async <T>(
	namespace: string,
	key: string,
	produce: () => Promise<T>,
	{ maxAgeMs }: CacheOptions,
): Promise<T> => {
	const entry = await readEntry<T>(namespace, key);
	if (entry && isFresh(entry.storedAt, maxAgeMs)) return entry.value;
	let value: T;
	try {
		value = await produce();
	} catch (error) {
		if (entry) return entry.value;
		throw error;
	}
	await writeEntry(namespace, key, value).catch((error: unknown) =>
		console.warn(`Cache entry ${namespace} not persisted:`, error),
	);
	return value;
};

export const cached = <T>(
	namespace: string,
	key: string,
	produce: () => Promise<T>,
	options: CacheOptions = {},
): Promise<T> => {
	const memoKey = `${namespace}\0${key}`;
	const pending = memo.get(memoKey) as Promise<T> | undefined;
	if (pending) return pending;
	const promise = resolve(namespace, key, produce, options).catch((error) => {
		memo.delete(memoKey);
		throw error;
	});
	memo.set(memoKey, promise);
	return promise;
};

export const fileRevision = async (absolutePath: string): Promise<string> => {
	const { size, mtimeMs } = await stat(absolutePath);
	return `${absolutePath}:${size}:${mtimeMs}`;
};
