import { shameCorner } from '$lib/shame-corner.svelte';

export function init() {
	console.log('Initializing shame corner...');
	shameCorner.safari = /^((?!chrome|android).)*safari/i.test(
		navigator.userAgent
	);
}
