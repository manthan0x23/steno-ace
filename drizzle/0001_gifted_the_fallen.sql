CREATE TYPE "public"."attempt_type" AS ENUM('real', 'practice');--> statement-breakpoint
CREATE TYPE "public"."test_status" AS ENUM('draft', 'active');--> statement-breakpoint
CREATE TYPE "public"."test_type" AS ENUM('legal', 'general');--> statement-breakpoint
CREATE TABLE "test_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"test_id" uuid NOT NULL,
	"type" "attempt_type" NOT NULL,
	"score" integer,
	"answer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"type" "test_type" NOT NULL,
	"audio_key" text,
	"matter" text NOT NULL,
	"outline" text NOT NULL,
	"explanation" text NOT NULL,
	"break_seconds" integer NOT NULL,
	"written_duration_seconds" integer NOT NULL,
	"status" "test_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_id" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "post" CASCADE;--> statement-breakpoint
ALTER TABLE "admin_user" RENAME TO "admin";--> statement-breakpoint
ALTER TABLE "admin" DROP CONSTRAINT "admin_user_username_unique";--> statement-breakpoint
ALTER TABLE "admin" DROP CONSTRAINT "admin_user_invited_by_admin_id_admin_user_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_invite" DROP CONSTRAINT "admin_invite_created_by_admin_id_admin_user_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_invite_usage" DROP CONSTRAINT "admin_invite_usage_used_by_admin_id_admin_user_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_session" DROP CONSTRAINT "admin_session_admin_id_admin_user_id_fk";
--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "profile_picture_key" text;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_admin_id_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_test" ON "test_attempts" USING btree ("user_id","test_id");--> statement-breakpoint
CREATE INDEX "idx_user_type" ON "test_attempts" USING btree ("user_id","type");--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_invited_by_admin_id_admin_id_fk" FOREIGN KEY ("invited_by_admin_id") REFERENCES "public"."admin"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invite" ADD CONSTRAINT "admin_invite_created_by_admin_id_admin_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invite_usage" ADD CONSTRAINT "admin_invite_usage_used_by_admin_id_admin_id_fk" FOREIGN KEY ("used_by_admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_session" ADD CONSTRAINT "admin_session_admin_id_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_username_unique" UNIQUE("username");