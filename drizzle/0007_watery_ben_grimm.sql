CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"to" text NOT NULL,
	"seen_by" text[],
	"link" text,
	"is_link_external" boolean,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notif_to_idx" ON "notifications" USING btree ("to");--> statement-breakpoint
CREATE INDEX "notif_created_at_idx" ON "notifications" USING btree ("created_at");