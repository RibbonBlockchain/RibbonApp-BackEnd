ALTER TABLE "ribbon"."options" RENAME TO "question_options";--> statement-breakpoint
ALTER TABLE "ribbon"."answer" DROP CONSTRAINT "answer_option_id_options_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."question_options" DROP CONSTRAINT "options_question_id_question_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."answer" ADD CONSTRAINT "answer_option_id_question_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "ribbon"."question_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."question_options" ADD CONSTRAINT "question_options_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
