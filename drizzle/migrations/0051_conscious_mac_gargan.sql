ALTER TABLE "ribbon"."survey" ADD COLUMN "ratings" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ribbon"."survey" ADD COLUMN "total_ratings" integer DEFAULT 0;