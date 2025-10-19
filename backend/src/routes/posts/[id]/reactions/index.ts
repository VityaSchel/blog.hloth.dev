import z from "zod";
import Elysia from "elysia";
import { getReactions, incrementReaction, powReactions } from "src/post-reactions";
import { reactionSchema } from "blog.hloth.dev-shared";
import { getIp } from "$utils";
import { doesPostExist } from "src/post-middleware";

export const postReactionsRouter = new Elysia({
	prefix: "/posts/:id/reactions",
})
	.get("/", async ({ params }) => {
		const postId = params.id;
		return await getReactions({ postId });
	})
	.post(
		"/",
		async (context) => {
			const { params, body, set } = context;

			const postId = params.id;
			const { challenge, solutions } = body;
			const ip = getIp(context);
			if (!ip) {
				set.status = 403;
				return { ok: false };
			}

			if (!(await doesPostExist(postId))) {
				set.status = 404;
				return { ok: false, error: "Post not found" };
			}

			const powReaction = powReactions[body.reaction];
			if (!powReaction) {
				set.status = 400;
				return { ok: false };
			}

			const success = await powReaction.verifySolution(
				{ challenge, solutions },
				{ ip, pageId: params.id },
			);
			if (!success) {
				set.status = 400;
				return { ok: false };
			}

			const reactions = await incrementReaction({
				postId,
				reaction: body.reaction,
			});
			return { ok: true, reactions };
		},
		{
			body: z.object({
				challenge: z.string().min(1),
				solutions: z.array(z.number().int().nonnegative()),
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
