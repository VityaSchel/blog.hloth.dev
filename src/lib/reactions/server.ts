import { and, count, eq, sql, gte } from 'drizzle-orm';
import { PowReaction } from 'pow-reaction';
import { db } from '$lib/server/db';
import {
	reactionChallengeSolutionsTable,
	reactionChallengesTable,
	reactionsTable
} from '$lib/server/db/schema';
import { REACTIONS_JWT_SECRET } from '$env/static/private';
import { reactions, type Reaction } from '$lib/reactions';

export const powReactions = Object.fromEntries(
	reactions.map((emoji) => [
		emoji,
		new PowReaction({
			secret: new TextEncoder().encode(REACTIONS_JWT_SECRET),
			reaction: emoji,
			difficulty: {
				windowMs: 1000 * 60 * 60 * 24,
				minDifficulty: 8,
				multiplier: 1,
				async getEntries({ ip, since }) {
					const entries = await db
						.select({ count: count() })
						.from(reactionChallengesTable)
						.where(
							and(
								eq(reactionChallengesTable.ip, ip),
								eq(reactionChallengesTable.emoji, emoji),
								gte(reactionChallengesTable.createdAt, since)
							)
						)
						.then((r) => Number(r[0]?.count ?? 0));
					return entries;
				},
				async putEntry({ ip }) {
					await db.insert(reactionChallengesTable).values({
						emoji,
						ip
					});
				}
			},
			ttl: 1000 * 60,
			isRedeemed: async (id: string) => {
				const row = await db.query.reactionChallengeSolutionsTable.findFirst({
					where: eq(reactionChallengeSolutionsTable.id, id)
				});
				return !!row;
			},
			setRedeemed: async (id: string) => {
				await db.insert(reactionChallengeSolutionsTable).values({ id });
			}
		})
	])
);

export async function getReactions({ postId }: { postId: string }) {
	const row = await db.query.reactionsTable.findFirst({
		where: eq(reactionsTable.postId, postId),
		columns: {
			postId: false
		}
	});
	if (!row) throw new Error('Reactions not found');
	return row;
}

export async function incrementReaction({
	postId,
	reaction
}: {
	postId: string;
	reaction: Reaction;
}) {
	return await db
		.update(reactionsTable)
		.set({
			[reaction]: sql`${reactionsTable[reaction]} + 1`
		})
		.where(eq(reactionsTable.postId, postId))
		.returning({
			...Object.fromEntries(reactions.map((r) => [r, reactionsTable[r]]))
		})
		.then((r) => r[0]);
}

export async function createReactionsRowForPost({
	postId,
	tx = db
}: {
	postId: string;
	tx?: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
}) {
	await tx
		.insert(reactionsTable)
		.values({
			postId,
			...(Object.fromEntries(reactions.map((r) => [r, 0])) as Record<
				Reaction,
				number
			>)
		})
		.onConflictDoNothing();
}
