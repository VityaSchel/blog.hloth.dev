import z from 'zod';
import { json } from '@sveltejs/kit';
import { reactionSchema } from '$lib/reactions';
import { powReactions } from '$lib/reactions/server';

export async function POST({ request, getClientAddress }) {
	const body = await z
		.object({
			reaction: reactionSchema
		})
		.safeParseAsync(await request.json());

	if (!body.success) {
		return json({ success: false }, { status: 400 });
	}

	const ip = getClientAddress();
	if (!ip) {
		return json({ success: false }, { status: 403 });
	}

	const powReaction = powReactions[body.data.reaction];
	const challenge = await powReaction.getChallenge({ ip });
	return json({ challenge });
}
