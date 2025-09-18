DROP INDEX "reaction_challenges_ip_emoji_idx";--> statement-breakpoint
ALTER TABLE "reaction_challenges" ADD COLUMN "client_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX "reaction_challenges_ip_emoji_idx" ON "reaction_challenges" USING btree ("client_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "reaction_challenges" DROP COLUMN "emoji";--> statement-breakpoint
ALTER TABLE "reaction_challenges" DROP COLUMN "ip";