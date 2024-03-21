DO $$ BEGIN
 CREATE TYPE "gender" AS ENUM('MALE', 'FEMALE', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "ribbon"."user_task_activity" RENAME TO "task_activity";--> statement-breakpoint
ALTER TABLE "ribbon"."task_activity" DROP CONSTRAINT "user_task_activity_task_id_task_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."task_activity" DROP CONSTRAINT "user_task_activity_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."task" ADD COLUMN "slug" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "ribbon"."task" ADD COLUMN "point" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ribbon"."task" ADD COLUMN "duration" integer DEFAULT 60;--> statement-breakpoint
ALTER TABLE "ribbon"."user" ADD COLUMN "other_names" varchar;--> statement-breakpoint
ALTER TABLE "ribbon"."user" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "ribbon"."user" ADD COLUMN "dob" date;--> statement-breakpoint
ALTER TABLE "ribbon"."user" ADD COLUMN "socals" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."task_activity" ADD CONSTRAINT "task_activity_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "ribbon"."task"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."task_activity" ADD CONSTRAINT "task_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "ribbon"."task" ADD CONSTRAINT "task_slug_unique" UNIQUE("slug");