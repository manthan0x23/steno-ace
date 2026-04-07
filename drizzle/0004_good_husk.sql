ALTER TABLE "user" ADD COLUMN "is_demo" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "demo_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "demo_revoked" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "demo_note" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "demo_created_by_admin_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_demo_created_by_admin_id_admin_id_fk" FOREIGN KEY ("demo_created_by_admin_id") REFERENCES "public"."admin"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "is_demo_idx_users" ON "user" USING btree ("is_demo");