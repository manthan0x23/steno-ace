CREATE TYPE "public"."invite_status" AS ENUM('active', 'invalidated', 'expired', 'limit_reached');--> statement-breakpoint
CREATE TYPE "public"."attempt_stage" AS ENUM('audio', 'break', 'writing', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."attempt_type" AS ENUM('assessment', 'practice');--> statement-breakpoint
CREATE TYPE "public"."test_status" AS ENUM('draft', 'active');--> statement-breakpoint
CREATE TYPE "public"."test_type" AS ENUM('legal', 'general');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"phone" text,
	"profile_url" text,
	"gender" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"profile_picture_key" text,
	"is_super" boolean DEFAULT false NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"invited_by_admin_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "admin_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"created_by_admin_id" text NOT NULL,
	"max_uses" integer NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"status" "invite_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admin_invite_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"invite_id" text NOT NULL,
	"used_by_admin_id" text NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_session" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "admin_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "test_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"test_id" text NOT NULL,
	"type" "attempt_type" NOT NULL,
	"stage" "attempt_stage" DEFAULT 'audio' NOT NULL,
	"stage_started_at" timestamp with time zone DEFAULT now(),
	"audio_progress_seconds" integer DEFAULT 0,
	"last_audio_sync_at" timestamp with time zone,
	"answer_draft" text,
	"answer_final" text,
	"writing_started_at" timestamp with time zone,
	"break_skipped" boolean DEFAULT false,
	"score" integer,
	"skipped_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"is_submitted" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" "test_type" NOT NULL,
	"audio_key" text NOT NULL,
	"matter" text NOT NULL,
	"outline" text NOT NULL,
	"break_seconds" integer NOT NULL,
	"written_duration_seconds" integer NOT NULL,
	"dictation_duration_seconds" integer NOT NULL,
	"status" "test_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_id" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaderboard" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"user_id" text NOT NULL,
	"best_score" integer NOT NULL,
	"best_wpm" integer,
	"best_accuracy" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"user_id" text NOT NULL,
	"test_id" text NOT NULL,
	"type" "attempt_type" NOT NULL,
	"score" integer NOT NULL,
	"wpm" integer NOT NULL,
	"accuracy" integer NOT NULL,
	"mistakes" integer,
	"submitted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "results_attempt_id_unique" UNIQUE("attempt_id")
);
--> statement-breakpoint
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
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_invited_by_admin_id_admin_id_fk" FOREIGN KEY ("invited_by_admin_id") REFERENCES "public"."admin"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invite" ADD CONSTRAINT "admin_invite_created_by_admin_id_admin_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invite_usage" ADD CONSTRAINT "admin_invite_usage_invite_id_admin_invite_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."admin_invite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invite_usage" ADD CONSTRAINT "admin_invite_usage_used_by_admin_id_admin_id_fk" FOREIGN KEY ("used_by_admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_session" ADD CONSTRAINT "admin_session_admin_id_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_admin_id_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_attempt_id_test_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_test" ON "test_attempts" USING btree ("user_id","test_id");--> statement-breakpoint
CREATE INDEX "idx_user_type" ON "test_attempts" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "idx_stage" ON "test_attempts" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_results_user" ON "results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_results_test" ON "results" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "idx_results_type" ON "results" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notif_to_idx" ON "notifications" USING btree ("to");--> statement-breakpoint
CREATE INDEX "notif_created_at_idx" ON "notifications" USING btree ("created_at");