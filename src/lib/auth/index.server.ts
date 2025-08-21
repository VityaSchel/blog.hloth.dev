import { type RequestEvent } from '@sveltejs/kit';
import { JWT_SECRET, NODE_ENV } from '$env/static/private';
import { TOKEN_COOKIE_NAME, TOKEN_EXPIRATION_TIME_MS } from '$lib/auth';
import jwt from 'jsonwebtoken';
import { PUBLIC_APP_ENV } from '$env/static/public';
import z from 'zod';

export function generateSessionToken(): string {
	return jwt.sign({}, JWT_SECRET, {
		expiresIn: TOKEN_EXPIRATION_TIME_MS / 1000
	});
}

export function deleteSessionCookie(event: RequestEvent) {
	event.cookies.delete(TOKEN_COOKIE_NAME, {
		httpOnly: true,
		secure: NODE_ENV !== 'development',
		path: '/'
	});
}

export function login(event: RequestEvent) {
	const token = generateSessionToken();
	event.cookies.set(TOKEN_COOKIE_NAME, token, {
		httpOnly: true,
		secure: NODE_ENV !== 'development',
		sameSite: 'lax',
		expires: new Date(Date.now() + TOKEN_EXPIRATION_TIME_MS),
		path: '/'
	});
}

export async function validateToken(token: string) {
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		const data = await z
			.object({
				exp: z.number().nonnegative()
			})
			.parseAsync(payload);
		return data;
	} catch (error) {
		if (PUBLIC_APP_ENV === 'development')
			console.error('Token validation failed:', error);
		return false;
	}
}
