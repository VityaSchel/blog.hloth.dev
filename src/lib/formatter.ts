export function formatTitle(title: string): {
	title: string;
	emphasized: string;
	regular: string;
} {
	const emStart = title.indexOf('*');
	if (emStart === 0) {
		const emEnd = title.indexOf('*', 1);
		const emphasized = title.slice(1, emEnd);
		const regular = title.slice(emEnd + 1);
		return { title: emphasized + regular, emphasized, regular };
	} else {
		return { title, emphasized: '', regular: title };
	}
}
