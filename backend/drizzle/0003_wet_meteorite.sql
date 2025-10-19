ALTER TABLE "new_post_notifications" ADD PRIMARY KEY ("post_id");--> statement-breakpoint
ALTER TABLE "reactions" ADD PRIMARY KEY ("post_id");--> statement-breakpoint
ALTER TABLE "new_post_notifications" ADD CONSTRAINT "new_post_notifications_post_id_unique" UNIQUE("post_id");--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint");