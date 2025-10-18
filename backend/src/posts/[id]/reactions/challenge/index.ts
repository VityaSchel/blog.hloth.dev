import z from "zod";
import Elysia from "elysia";
import { reactionSchema } from "blog.hloth.dev-shared";
import { powReactions } from "../../../../post-reactions";
import { getIp } from "$utils";

export const postReactionsChallengeRouter = new Elysia({
	prefix: "/posts/:id/reactions/challenge",
}).post(
	"/",
	async (context) => {
		const { body, params, set } = context;

		const ip = getIp(context);
		if (!ip) {
			set.status = 403;
			return { ok: false };
		}

		const powReaction = powReactions[body.reaction];
		if (!powReaction) {
			set.status = 400;
			return { ok: false };
		}

		const challenge = await powReaction.getChallenge({ ip, pageId: params.id });
		return { challenge };
	},
	{
		body: z.object({
			reaction: reactionSchema,
		}),
		params: z.object({
			id: z
				.string()
				.min(1)
				.refine((val) => !val.includes("\0")),
		}),
	},
);
