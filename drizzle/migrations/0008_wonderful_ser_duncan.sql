DO $$ BEGIN
 CREATE TYPE "activity_type" AS ENUM('DAILY_REWARD', 'APP_TASK');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "ribbon"."task_activity" ALTER COLUMN "task_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ribbon"."task_activity" ADD COLUMN "type" "activity_type" DEFAULT 'APP_TASK';--> statement-breakpoint
ALTER TABLE "ribbon"."user" ADD COLUMN "numberOfClaims" integer DEFAULT 0;