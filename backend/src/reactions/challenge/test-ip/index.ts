import { json } from "@sveltejs/kit";

export function GET({ getClientAddress }) {
	if (process.env.TEST_IP_API !== "1") {
		return new Response(null, { status: 404 });
	}
	return json({ ip: getClientAddress() });
}
