CREATE TABLE "leaderboard" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"user_id" text NOT NULL,
	"best_score" integer NOT NULL,
	"best_wpm" integer,
	"best_accuracy" integer,
	"updated_at" timestamp with time zone DEFAULT now()
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
ALTER TABLE "results" ADD CONSTRAINT "results_attempt_id_test_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_results_user" ON "results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_results_test" ON "results" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "idx_results_type" ON "results" USING btree ("type");