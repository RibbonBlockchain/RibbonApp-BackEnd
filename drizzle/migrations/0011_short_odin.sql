ALTER TABLE "ribbon"."task" DROP CONSTRAINT "task_slug_unique";--> statement-breakpoint
ALTER TABLE "ribbon"."task" ALTER COLUMN "slug" DROP NOT NULL;