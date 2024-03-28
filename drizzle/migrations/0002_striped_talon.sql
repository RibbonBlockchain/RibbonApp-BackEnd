ALTER TABLE "ribbon"."task_activity" ALTER COLUMN "completed_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "ribbon"."wallet" ADD COLUMN "point" integer DEFAULT 0;