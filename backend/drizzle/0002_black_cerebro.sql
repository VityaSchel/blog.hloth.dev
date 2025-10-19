CREATE TABLE "new_post_notifications" (
	"post_id" text NOT NULL,
	"sent" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sent_notifications" (
	"endpoint" text NOT NULL,
	"post_id" text NOT NULL,
	CONSTRAINT "sent_notifications_endpoint_post_id_pk" PRIMARY KEY("endpoint","post_id")
);
