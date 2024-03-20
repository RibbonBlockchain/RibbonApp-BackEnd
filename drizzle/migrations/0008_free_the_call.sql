ALTER TABLE "ribbon"."Answer" RENAME TO "answer";--> statement-breakpoint
ALTER TABLE "ribbon"."Options" RENAME TO "options";--> statement-breakpoint
ALTER TABLE "ribbon"."Question" RENAME TO "question";--> statement-breakpoint
ALTER TABLE "ribbon"."answer" DROP CONSTRAINT "Answer_question_id_Question_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."answer" DROP CONSTRAINT "Answer_option_id_Options_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."answer" DROP CONSTRAINT "Answer_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."options" DROP CONSTRAINT "Options_question_id_Question_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."question" DROP CONSTRAINT "Question_task_id_task_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."answer" ADD CONSTRAINT "answer_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."answer" ADD CONSTRAINT "answer_option_id_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "ribbon"."options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."answer" ADD CONSTRAINT "answer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."options" ADD CONSTRAINT "options_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."question" ADD CONSTRAINT "question_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "ribbon"."task"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
