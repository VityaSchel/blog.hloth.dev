import z from 'zod';
import { TOKEN_COOKIE_NAME, TOKEN_REFRESH_WINDOW_MS } from '$lib/auth';
import { login, validateToken } from '$lib/auth/index.server';

export const handle = async ({ event, resolve }) => {
	const themeParsing = await z
		.enum(['dark', 'light'])
		.optional()
		.safeParseAsync(event.cookies.get('blog.hloth.dev-theme'));
	const theme = themeParsing.data || null;
	event.locals.theme = theme;

	const authCookieParsing = await z
		.string()
		.min(1)
		.max(8192)
		.safeParseAsync(await event.cookies.get(TOKEN_COOKIE_NAME));
	if (authCookieParsing.success) {
		const authorized = await validateToken(authCookieParsing.data);
		if (authorized) {
			if (authorized.exp * 1000 - Date.now() < TOKEN_REFRESH_WINDOW_MS) {
				login(event);
			}
			event.locals.admin = true;
		}
	}

	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%blog.theme%', theme || 'light')
	});
};
