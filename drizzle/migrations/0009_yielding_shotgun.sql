CREATE TABLE IF NOT EXISTS "ribbon"."questionnaire_rating" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating" integer DEFAULT 0,
	"questionnaire_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_id_question_id" UNIQUE("user_id","questionnaire_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."questionnaire_rating" ADD CONSTRAINT "questionnaire_rating_questionnaire_id_task_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "ribbon"."task"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."questionnaire_rating" ADD CONSTRAINT "questionnaire_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
