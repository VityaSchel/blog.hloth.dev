export const load = async ({ locals, depends }) => {
	depends('app:theme');
	return {
		theme: locals.theme
	};
};
