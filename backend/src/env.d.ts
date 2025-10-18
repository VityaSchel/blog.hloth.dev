declare module "bun" {
	interface Env {
		NODE_ENV: string;
		DATABASE_URL: string;
		PORT?: string;
		ORIGIN: string;
		IP_HASH_PEPPER: string;
	}
}
