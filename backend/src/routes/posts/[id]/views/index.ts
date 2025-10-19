import Elysia from "elysia";
import { getViews, incrementViews } from "$views";
import { getIp } from "$utils";
import { doesPostExist } from "src/post-middleware";

export const postViewsRouter = new Elysia({
	prefix: "/posts/:id/views",
})
	.get("/", async ({ params, set }) => {
		const postId = params.id;
		if (!(await doesPostExist(postId))) {
			set.status = 404;
			return { ok: false, error: "Post not found" };
		}
		return await getViews({ postId });
	})
	.post("/", async (context) => {
		const { params, set } = context;
		const postId = params.id;
		const ip = getIp(context);
		if (!ip) {
			context.set.status = 403;
			return { ok: false };
		}

		if (!(await doesPostExist(postId))) {
			set.status = 404;
			return { ok: false, error: "Post not found" };
		}

		const hasher = new Bun.CryptoHasher("sha256");
		const now = new Date();
		const date = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
		const payload = [process.env.IP_HASH_PEPPER, postId, date, ip];
		hasher.update(JSON.stringify(payload));
		const clientId = hasher.digest("hex");

		const newValue = await incrementViews({
			postId,
			clientId,
		});

		return { ok: true, value: newValue };
	});
