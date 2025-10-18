CREATE TABLE "push_subscriptions" (
	"endpoint" text PRIMARY KEY NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"expires_at" timestamp with time zone
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
	"post_id" text NOT NULL,
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
CREATE INDEX "reaction_challenges_client_id_created_at_idx" ON "reaction_challenges" USING btree ("client_id","created_at" DESC NULLS LAST);