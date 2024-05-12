ALTER TABLE "ribbon"."questionniare" RENAME TO "questionnaire";--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire" DROP CONSTRAINT "questionniare_slug_unique";--> statement-breakpoint
ALTER TABLE "ribbon"."question" DROP CONSTRAINT "question_task_id_questionniare_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire_activity" DROP CONSTRAINT "questionnaire_activity_task_id_questionniare_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire_rating" DROP CONSTRAINT "questionnaire_rating_questionnaire_id_questionniare_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire" DROP CONSTRAINT "questionniare_category_id_questionnaire_category_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire" ALTER COLUMN "category_id" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire" ALTER COLUMN "category_id" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."question" ADD CONSTRAINT "question_task_id_questionnaire_id_fk" FOREIGN KEY ("task_id") REFERENCES "ribbon"."questionnaire"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."questionnaire_activity" ADD CONSTRAINT "questionnaire_activity_task_id_questionnaire_id_fk" FOREIGN KEY ("task_id") REFERENCES "ribbon"."questionnaire"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."questionnaire_rating" ADD CONSTRAINT "questionnaire_rating_questionnaire_id_questionnaire_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "ribbon"."questionnaire"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire" ADD CONSTRAINT "questionnaire_slug_unique" UNIQUE("slug");