import { asc, type InferSelectModel, type NotNull } from "drizzle-orm";
import {
	pgTable,
	text,
	integer,
	timestamp,
	serial,
	index,
	type PgIntegerBuilderInitial,
} from "drizzle-orm/pg-core";
import { reactions, type Reaction } from "blog.hloth.dev-shared";

export const pushSubscriptionsTable = pgTable(
	"push_subscriptions",
	{
		endpoint: text("endpoint").primaryKey(),
		p256dh: text("p256dh").notNull(),
		auth: text("auth").notNull(),
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
		}),
	},
	(t) => [asc(t.expiresAt)],
);

export const reactionsTable = pgTable("reactions", {
	postId: text("post_id").notNull().unique(),
	...(Object.fromEntries(reactions.map((r) => [r, integer(r).notNull().default(0)])) as {
		[k in Reaction]: NotNull<PgIntegerBuilderInitial<k>>;
	}),
});

export const reactionChallengesTable = pgTable(
	"reaction_challenges",
	{
		id: serial("id").primaryKey(),
		clientId: text("client_id").notNull(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(t) => [index("reaction_challenges_client_id_created_at_idx").on(t.clientId, t.createdAt.desc())],
);

export const reactionChallengeSolutionsTable = pgTable("reaction_challenge_solutions", {
	id: text("id").primaryKey(),
});

export const viewsTable = pgTable(
	"views",
	{
		postId: text("post_id").notNull(),
		clientId: text("client_id").notNull().unique(),
	},
	(t) => [index("views_post_id_idx").on(t.postId)],
);

export type DbPushSubscription = InferSelectModel<typeof pushSubscriptionsTable>;
export type DbReactions = InferSelectModel<typeof reactionsTable>;
export type DbReactionChallenge = InferSelectModel<typeof reactionChallengesTable>;
export type DbReactionChallengeSolution = InferSelectModel<typeof reactionChallengeSolutionsTable>;
export type DbViews = InferSelectModel<typeof viewsTable>;
