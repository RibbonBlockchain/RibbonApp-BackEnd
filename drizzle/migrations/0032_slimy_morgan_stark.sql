-- ALTER TABLE "ribbon"."question_options" DROP CONSTRAINT "key";--> statement-breakpoint
ALTER TABLE "ribbon"."question_options" ADD CONSTRAINT "uniq_question_option" UNIQUE("text","question_id");