CREATE TYPE "public"."category" AS ENUM('life_story', 'tutorial', 'project', 'announcement', 'review');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'ru');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('hidden', 'unlisted', 'published');--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"placeholder" text,
	"width" integer,
	"height" integer
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"banner" text NOT NULL,
	"banner_alt" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" jsonb NOT NULL,
	"category" "category" NOT NULL,
	"read_time" integer NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"status" "status" NOT NULL,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"emoji" text NOT NULL,
	"ip" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"post_id" text NOT NULL,
	"👍" integer DEFAULT 0 NOT NULL,
	"❤️" integer DEFAULT 0 NOT NULL,
	"👀" integer DEFAULT 0 NOT NULL,
	"😮" integer DEFAULT 0 NOT NULL,
	"🤔" integer DEFAULT 0 NOT NULL,
	"🚀" integer DEFAULT 0 NOT NULL,
	"🤯" integer DEFAULT 0 NOT NULL,
	"💀" integer DEFAULT 0 NOT NULL,
	"🙏" integer DEFAULT 0 NOT NULL,
	"🌚" integer DEFAULT 0 NOT NULL,
	"🆒" integer DEFAULT 0 NOT NULL,
	"🏳️‍🌈" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_banner_media_id_fk" FOREIGN KEY ("banner") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reaction_challenges_ip_emoji_idx" ON "reaction_challenges" USING btree ("ip","emoji","created_at" DESC NULLS LAST);