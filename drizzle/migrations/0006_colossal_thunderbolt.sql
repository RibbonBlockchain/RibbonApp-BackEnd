DO $$ BEGIN
 CREATE TYPE "question_type" AS ENUM('BOOLEAN', 'MULTICHOICE', 'MULTISELECT', 'SHORT_ANSWER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "task_type" AS ENUM('QUESTIONNAIRE', 'APP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."Answer" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"option_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."Options" (
	"id" serial PRIMARY KEY NOT NULL,
	"point" integer DEFAULT 0,
	"text" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"question_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."Question" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar,
	"type" "question_type" NOT NULL,
	"is_first" boolean DEFAULT false,
	"is_last" boolean DEFAULT false,
	"task_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."task" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"description" varchar,
	"type" "task_type" NOT NULL,
	"reward" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."Answer" ADD CONSTRAINT "Answer_question_id_Question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."Question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."Answer" ADD CONSTRAINT "Answer_option_id_Options_id_fk" FOREIGN KEY ("option_id") REFERENCES "ribbon"."Options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."Answer" ADD CONSTRAINT "Answer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."Options" ADD CONSTRAINT "Options_question_id_Question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."Question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."Question" ADD CONSTRAINT "Question_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "ribbon"."task"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
