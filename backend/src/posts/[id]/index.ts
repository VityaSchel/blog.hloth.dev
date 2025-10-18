import Elysia from "elysia";

export const postRouter = new Elysia({
	prefix: "/posts/:id/",
	name: "post",
});
