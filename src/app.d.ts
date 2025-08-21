declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			theme: 'dark' | 'light' | null;
			admin: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
