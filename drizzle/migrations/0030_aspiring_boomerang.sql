ALTER TABLE "ribbon"."questionnaire" ALTER COLUMN "category_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."questionnaire" ADD CONSTRAINT "questionnaire_category_id_questionnaire_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "ribbon"."questionnaire_category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire" DROP COLUMN IF EXISTS "cat_id";