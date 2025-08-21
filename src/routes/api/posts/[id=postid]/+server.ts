import { db } from '$lib/server/db';
import { postsTable } from '$lib/server/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function HEAD({ params, locals }) {
	const post = await db.query.postsTable.findFirst({
		where: and(
			eq(postsTable.id, params.id),
			locals.admin ? undefined : ne(postsTable.visibility, 'hidden')
		),
		columns: { id: true }
	});
	return new Response(null, { status: post ? 200 : 404 });
}
