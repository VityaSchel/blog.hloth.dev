import { loadPosts } from '../loader.server';
import { error } from '@sveltejs/kit';

export async function load({ locals }) {
	if (!locals.admin) {
		throw error(401, 'Unauthorized');
	}
	return {
		...(await loadPosts({
			visibility: 'drafts'
		}))
	};
}
