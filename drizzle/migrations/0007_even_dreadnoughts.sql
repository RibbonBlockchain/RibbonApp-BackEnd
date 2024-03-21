DO $$ BEGIN
 CREATE TYPE "user_task_status" AS ENUM('COMPLETED', 'PROCESSING');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."user_task_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" "user_task_status" DEFAULT 'PROCESSING',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."user_task_activity" ADD CONSTRAINT "user_task_activity_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "ribbon"."task"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."user_task_activity" ADD CONSTRAINT "user_task_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
