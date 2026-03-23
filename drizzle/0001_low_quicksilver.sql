CREATE TABLE "hall_of_fame" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"photo_key" text,
	"department" text NOT NULL,
	"batch" text,
	"note" text,
	"added_by_id" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hall_of_fame" ADD CONSTRAINT "hall_of_fame_added_by_id_admin_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."admin"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hof_department_idx" ON "hall_of_fame" USING btree ("department");--> statement-breakpoint
CREATE INDEX "hof_created_at_idx" ON "hall_of_fame" USING btree ("created_at");