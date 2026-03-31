ALTER TYPE "public"."subscription_status" ADD VALUE 'revoked';--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "revocation_reason" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_unique" UNIQUE("user_id");