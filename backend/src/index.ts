import Elysia from "elysia";
import { cors } from "@elysiajs/cors";
import { postsRouter } from "./routes/posts";
import { postRouter } from "./routes/posts/[id]";
import { postReactionsRouter } from "./routes/posts/[id]/reactions";
import { postReactionsChallengeRouter } from "./routes/posts/[id]/reactions/challenge";
import { postViewsRouter } from "./routes/posts/[id]/views";
import { checkNewPosts } from "src/broadcast-notification/new-post";

const app = new Elysia()
	.use(
		cors({
			origin: process.env.ORIGIN,
		}),
	)
	.onBeforeHandle(({ headers, set }) => {
		const origin = headers["origin"];
		if (!origin) {
			set.status = 400;
			return { ok: false, error: "Origin header is required" };
		}
		if (origin !== process.env.ORIGIN) {
			set.status = 403;
			return { ok: false, error: "Cross-site requests are not allowed" };
		}
	})
	.onError(({ set, error, code, path }) => {
		if (code === "NOT_FOUND") {
			if (process.env.NODE_ENV !== "production") {
				console.error(error);
				console.info(path);
			}
			set.status = 404;
			return { ok: false, error: "Not Found" };
		} else if (code === "VALIDATION") {
			if (process.env.NODE_ENV !== "production") {
				console.error(error);
			}
			set.status = 400;
			return { ok: false, error: "Bad Request" };
		} else if (code === "PARSE") {
			if (process.env.NODE_ENV !== "production") {
				console.error(error);
			}
			set.status = 400;
			return { ok: false, error: "Malformed Request" };
		} else {
			console.error(error);
			set.status = 500;
			return { ok: false, error: "Internal Server Error" };
		}
	})
	.use(postsRouter)
	.use(postRouter)
	.use(postReactionsRouter)
	.use(postReactionsChallengeRouter)
	.use(postViewsRouter);
// https://github.com/elysiajs/elysia/issues/138
app.listen(process.env.PORT ?? 3000, ({ hostname, port }: Bun.Server<void>) => {
	console.log(`Server running at http://${hostname}:${port}`);
});

void checkNewPosts();
