import z from "zod";
import { json } from "@sveltejs/kit";
import {
	getReactions,
	incrementReaction,
	powReactions,
} from "";


export async function GET({ params }) {
	const postId = params.id;
	return json(await getReactions({ postId }));
}

export async function POST({ params, request, getClientAddress }) {
	const postId = params.id;

	const body = await z
		.object({
			challenge: z.string().min(1),
			solutions: z.array(z.number().int().nonnegative()),
			reaction: reactionSchema,
		})
		.safeParseAsync(await request.json());

	if (!body.success) {
		return json({ success: false }, { status: 400 });
	}
	const { challenge, solutions } = body.data;

	const ip = getClientAddress();
	if (!ip) {
		return json({ success: false }, { status: 403 });
	}

	const powReaction = powReactions[body.data.reaction];
	const success = await powReaction.verifySolution(
		{ challenge, solutions },
		{ ip, pageId: params.id },
	);
	if (success) {
		const reactions = await incrementReaction({
			postId,
			reaction: body.data.reaction,
		});
		return json({ success: true, reactions });
	} else {
		return json({ success: false }, { status: 403 });
	}
}
