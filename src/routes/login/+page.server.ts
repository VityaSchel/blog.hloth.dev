import { JWT_SECRET } from "$env/static/private";
import { login } from "$lib/auth/index.server";
import { fail, redirect } from "@sveltejs/kit";
import { setTimeout } from "timers/promises";

export const load = async ({ locals }) => {
	if (locals.admin) {
		throw redirect(303, "/");
	}
};

export const actions = {
	default: async (event) => {
		const { locals, request } = event;

		if (locals.admin) {
			throw redirect(303, "/");
		}

		const formData = await request.formData();
		const password = formData.get("password");
		if (!password || typeof password !== "string") {
			return fail(400, {
				error: "Password is required",
			});
		}
		await setTimeout(500);
		if (password !== JWT_SECRET) {
			return fail(401, {
				error: "Invalid password",
			});
		}
		login(event);
		return redirect(303, "/");
	},
};
