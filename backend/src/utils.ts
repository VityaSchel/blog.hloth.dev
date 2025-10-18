import type { Context } from "elysia";

export function getIp(context: Context): string | undefined {
	const reverseProxyIp = context.headers?.["x-forwarded-for"];
	if (!reverseProxyIp && process.env.NODE_ENV === "production") {
		return;
	}

	const ip = reverseProxyIp ?? undefined;

	if (!ip && process.env.NODE_ENV === "development") {
		console.warn("Could not determine IP address");
	}

	return ip;
}
