-- ALTER TABLE "ribbon"."questionniare" ADD COLUMN "category_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."questionniare" ADD CONSTRAINT "questionniare_category_id_questionnaire_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "ribbon"."questionnaire_category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;