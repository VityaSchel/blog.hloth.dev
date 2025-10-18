CREATE TABLE "views" (
	"post_id" text NOT NULL,
	"client_id" text NOT NULL,
	CONSTRAINT "views_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE INDEX "views_post_id_idx" ON "views" USING btree ("post_id");