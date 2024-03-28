ALTER TABLE "ribbon"."task" ADD COLUMN "image" varchar;--> statement-breakpoint
ALTER TABLE "ribbon"."task_activity" ADD COLUMN "completed_date" timestamp with time zone;