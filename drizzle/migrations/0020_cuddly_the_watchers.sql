ALTER TABLE "ribbon"."task" RENAME TO "questionniare";--> statement-breakpoint
ALTER TABLE "ribbon"."task_activity" RENAME TO "questionnaire_activity";--> statement-breakpoint
ALTER TABLE "ribbon"."survey__question" RENAME TO "survey_question";--> statement-breakpoint
ALTER TABLE "ribbon"."questionniare" DROP CONSTRAINT "task_slug_unique";--> statement-breakpoint
ALTER TABLE "ribbon"."question" DROP CONSTRAINT "question_task_id_task_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire_rating" DROP CONSTRAINT "questionnaire_rating_questionnaire_id_task_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."survey_question_answer" DROP CONSTRAINT "survey_question_answer_question_id_survey__question_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."survey_question_options" DROP CONSTRAINT "survey_question_options_question_id_survey__question_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."survey_rating" DROP CONSTRAINT "survey_rating_survey_id_task_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire_activity" DROP CONSTRAINT "task_activity_task_id_task_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire_activity" DROP CONSTRAINT "task_activity_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."survey_question" DROP CONSTRAINT "survey__question_survey_id_survey_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."question" ADD CONSTRAINT "question_task_id_questionniare_id_fk" FOREIGN KEY ("task_id") REFERENCES "ribbon"."questionniare"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."questionnaire_rating" ADD CONSTRAINT "questionnaire_rating_questionnaire_id_questionniare_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "ribbon"."questionniare"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_question_answer" ADD CONSTRAINT "survey_question_answer_question_id_survey_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."survey_question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_question_options" ADD CONSTRAINT "survey_question_options_question_id_survey_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."survey_question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_rating" ADD CONSTRAINT "survey_rating_survey_id_survey_id_fk" FOREIGN KEY ("survey_id") REFERENCES "ribbon"."survey"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."questionnaire_activity" ADD CONSTRAINT "questionnaire_activity_task_id_questionniare_id_fk" FOREIGN KEY ("task_id") REFERENCES "ribbon"."questionniare"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."questionnaire_activity" ADD CONSTRAINT "questionnaire_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_question" ADD CONSTRAINT "survey_question_survey_id_survey_id_fk" FOREIGN KEY ("survey_id") REFERENCES "ribbon"."survey"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "ribbon"."questionniare" ADD CONSTRAINT "questionniare_slug_unique" UNIQUE("slug");