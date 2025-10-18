import type { Context } from "elysia";

export function getIp(context: Context): string | undefined {
	const reverseProxyIp = context.headers?.["x-forwarded-for"];
	if (!reverseProxyIp && process.env.NODE_ENV === "production") {
		return;
	}

	let ip = reverseProxyIp ?? undefined;

	if (!ip && process.env.NODE_ENV === "development") {
		console.warn("Could not determine IP address, falling back to 127.0.0.1");
		ip = "127.0.0.1";
	}

	return ip;
}
