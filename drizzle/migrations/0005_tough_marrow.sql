ALTER TABLE "ribbon"."user" ADD COLUMN "world_id" varchar;--> statement-breakpoint
ALTER TABLE "ribbon"."auth" DROP COLUMN IF EXISTS "world_id";