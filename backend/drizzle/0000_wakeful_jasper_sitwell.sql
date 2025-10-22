CREATE TABLE "new_post_notifications" (
	"post_id" text PRIMARY KEY NOT NULL,
	"sent" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "new_post_notifications_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"endpoint" text PRIMARY KEY NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "reaction_challenge_solutions" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reaction_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"post_id" text PRIMARY KEY NOT NULL,
	"👍" integer DEFAULT 0 NOT NULL,
	"❤️" integer DEFAULT 0 NOT NULL,
	"🔥" integer DEFAULT 0 NOT NULL,
	"👀" integer DEFAULT 0 NOT NULL,
	"😮" integer DEFAULT 0 NOT NULL,
	"🤔" integer DEFAULT 0 NOT NULL,
	"🚀" integer DEFAULT 0 NOT NULL,
	"🎉" integer DEFAULT 0 NOT NULL,
	"🤯" integer DEFAULT 0 NOT NULL,
	"💀" integer DEFAULT 0 NOT NULL,
	"🙏" integer DEFAULT 0 NOT NULL,
	"🌚" integer DEFAULT 0 NOT NULL,
	"🆒" integer DEFAULT 0 NOT NULL,
	"🏳️‍🌈" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "reactions_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "sent_notifications" (
	"endpoint" text NOT NULL,
	"post_id" text NOT NULL,
	CONSTRAINT "sent_notifications_endpoint_post_id_pk" PRIMARY KEY("endpoint","post_id")
);
--> statement-breakpoint
CREATE TABLE "views" (
	"post_id" text NOT NULL,
	"client_id" text NOT NULL,
	CONSTRAINT "views_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE INDEX "reaction_challenges_client_id_created_at_idx" ON "reaction_challenges" USING btree ("client_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "views_post_id_idx" ON "views" USING btree ("post_id");