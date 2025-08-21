import { PUBLIC_APP_ENV } from '$env/static/public';

export const TOKEN_EXPIRATION_TIME_MS = 1000 * 60 * 60 * 24 * 30 * 12; // 12 months
export const TOKEN_REFRESH_WINDOW_MS = 1000 * 60 * 60 * 24 * 30 * 6; // 6 months
export const TOKEN_COOKIE_NAME =
	(PUBLIC_APP_ENV === 'development' ? '' : '__Secure-') +
	'blog.hloth.dev.sesson-token';
