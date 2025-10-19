declare module "bun" {
	interface Env {
		NODE_ENV: string;
		DATABASE_URL: string;
		PORT?: string;
		ORIGIN: string;
		IP_HASH_PEPPER: string;
		PUBLIC_WEB_PUSH_KEY: string;
		PRIVATE_WEB_PUSH_KEY: string;
	}
}
