import { and, count, eq, sql, gte } from "drizzle-orm";
import { PowReaction } from "pow-reaction";
import { db } from "$db";
import {
	reactionChallengeSolutionsTable,
	reactionChallengesTable,
	reactionsTable,
} from "$db/schema";
import { reactions, type Reaction } from "blog.hloth.dev-shared";

const REACTIONS_JWT_SECRET = process.env.REACTIONS_JWT_SECRET;
if (!REACTIONS_JWT_SECRET) {
	throw new Error("REACTIONS_JWT_SECRET is not set");
}

export const defaultReactions = Object.fromEntries(reactions.map((r) => [r, 0])) as Record<
	Reaction,
	number
>;

export const powReactions = Object.fromEntries(
	reactions.map((emoji) => {
		const powReaction = new PowReaction<{ ip: string; pageId: string }>({
			secret: new TextEncoder().encode(REACTIONS_JWT_SECRET),
			reaction: emoji,
			difficulty: {
				windowMs: 1000 * 60 * 60 * 24,
				minDifficulty: 8,
				multiplier: 1,
				async getEntries({ clientId, since }): Promise<number> {
					const entries = await db
						.select({ count: count() })
						.from(reactionChallengesTable)
						.where(
							and(
								eq(reactionChallengesTable.clientId, clientId),
								gte(reactionChallengesTable.createdAt, since),
							),
						)
						.then((r) => Number(r[0]?.count ?? 0));
					return entries;
				},
				async putEntry({ clientId }): Promise<void> {
					await db.insert(reactionChallengesTable).values({
						clientId,
					});
				},
			},
			ttl: 1000 * 60,
			isRedeemed: async ({ challengeId }): Promise<boolean> => {
				const row = await db.query.reactionChallengeSolutionsTable.findFirst({
					where: eq(reactionChallengeSolutionsTable.id, challengeId),
				});
				return !!row;
			},
			setRedeemed: async ({ challengeId }): Promise<void> => {
				await db.insert(reactionChallengeSolutionsTable).values({ id: challengeId });
			},
		});
		return [emoji, powReaction];
	}),
);

export async function getReactions({
	postId,
}: {
	postId: string;
}): Promise<Record<Reaction, number>> {
	const row = await db.query.reactionsTable.findFirst({
		where: eq(reactionsTable.postId, postId),
		columns: {
			postId: false,
		},
	});
	return row ?? defaultReactions;
}

export async function incrementReaction({
	postId,
	reaction,
}: {
	postId: string;
	reaction: Reaction;
}): Promise<Record<Reaction, number>> {
	const updatedRow = await db
		.insert(reactionsTable)
		.values({
			postId,
			...defaultReactions,
			[reaction]: 1,
		})
		.onConflictDoUpdate({
			target: reactionsTable.postId,
			set: {
				[reaction]: sql`${reactionsTable[reaction]} + 1`,
			},
		})
		.returning()
		.then((r) => r[0]);
	if (!updatedRow) throw new Error("Failed to increment reaction");
	return Object.fromEntries(reactions.map((r) => [r, updatedRow[r] ?? 0])) as Record<
		Reaction,
		number
	>;
}
