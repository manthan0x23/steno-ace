CREATE TYPE "public"."attempt_stage" AS ENUM('audio', 'break', 'writing', 'submitted');--> statement-breakpoint
ALTER TABLE "test_attempts" RENAME COLUMN "answer" TO "answer_final";--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "audio_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "stage" "attempt_stage" DEFAULT 'audio' NOT NULL;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "stage_started_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "audio_progress_seconds" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "last_audio_sync_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "answer_draft" text;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "writing_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "break_skipped" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "skipped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "is_submitted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
CREATE INDEX "idx_stage" ON "test_attempts" USING btree ("stage");--> statement-breakpoint
ALTER TABLE "public"."test_attempts" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."attempt_type";--> statement-breakpoint
CREATE TYPE "public"."attempt_type" AS ENUM('assessment', 'practice');--> statement-breakpoint
ALTER TABLE "public"."test_attempts" ALTER COLUMN "type" SET DATA TYPE "public"."attempt_type" USING "type"::"public"."attempt_type";