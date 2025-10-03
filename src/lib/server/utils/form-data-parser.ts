export function parseFormData(
	body: FormData,
	map?: { [key: string]: (value: FormDataEntryValue) => unknown },
) {
	try {
		const data: Record<string, unknown> = {};
		body.forEach((value, key) => {
			const transform = map?.[key];
			data[key] = transform ? transform(value) : value;
		});
		return data;
	} catch (error) {
		console.error("Error parsing form data:", error);
		return {};
	}
}
