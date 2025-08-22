import type { Content } from '$lib/editorjs/blocks';
import { asc, relations, type InferSelectModel } from 'drizzle-orm';
import {
	pgTable,
	pgEnum,
	text,
	integer,
	jsonb,
	timestamp
} from 'drizzle-orm/pg-core';

export const categoryEnum = pgEnum('category', [
	'life_story',
	'tutorial',
	'project',
	'announcement',
	'review'
]);

export const statusEnum = pgEnum('status', ['hidden', 'unlisted', 'published']);

export const localeEnum = pgEnum('locale', ['en', 'ru']);

export const postsTable = pgTable('posts', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	banner: text('banner')
		.notNull()
		.references(() => mediaTable.id),
	bannerAlt: text('banner_alt').notNull(),
	excerpt: text('excerpt').notNull(),
	content: jsonb('content').notNull().$type<Content>(),
	category: categoryEnum('category').notNull(),
	readTime: integer('read_time').notNull(),
	views: integer('views').notNull().default(0),
	visibility: statusEnum('status').notNull(),
	locale: localeEnum('locale').notNull().default('en'),
	createdAt: timestamp('created_at', {
		withTimezone: true
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true
	})
		.notNull()
		.defaultNow()
});

export const postsTableRelations = relations(postsTable, ({ one }) => ({
	banner: one(mediaTable, {
		fields: [postsTable.banner],
		references: [mediaTable.id]
	})
}));

export const mediaTable = pgTable('media', {
	id: text('id').primaryKey(),
	placeholder: text('placeholder'),
	width: integer('width'),
	height: integer('height')
});

export const pushSubscriptionsTable = pgTable(
	'push_subscriptions',
	{
		endpoint: text('endpoint').primaryKey(),
		p256dh: text('p256dh').notNull(),
		auth: text('auth').notNull(),
		expiresAt: timestamp('expires_at', {
			withTimezone: true
		})
	},
	(t) => [asc(t.expiresAt)]
);

export type Post = InferSelectModel<typeof postsTable>;
export type Media = InferSelectModel<typeof mediaTable>;
export type PushSubscription = InferSelectModel<typeof pushSubscriptionsTable>;
export type Category = (typeof categoryEnum.enumValues)[number];
