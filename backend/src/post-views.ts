import { count, eq } from "drizzle-orm";
import { db } from "$db";
import { viewsTable } from "$db/schema";

export async function getViews({ postId }: { postId: string }): Promise<number> {
	const row = await db
		.select({
			viewCount: count(),
		})
		.from(viewsTable)
		.where(eq(viewsTable.postId, postId));
	return row[0]?.viewCount ?? 0;
}

export async function incrementViews({
	postId,
	clientId,
}: {
	postId: string;
	clientId: string;
}): Promise<number> {
	await db
		.insert(viewsTable)
		.values({
			postId,
			clientId,
		})
		.onConflictDoNothing({
			target: viewsTable.clientId,
		});
	return await getViews({ postId });
}
