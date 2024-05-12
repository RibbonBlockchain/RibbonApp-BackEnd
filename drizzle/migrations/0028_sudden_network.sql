ALTER TABLE "ribbon"."questionnaire" DROP CONSTRAINT "questionnaire_category_id_questionnaire_category_id_fk";
--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire" ALTER COLUMN "category_id" DROP NOT NULL;