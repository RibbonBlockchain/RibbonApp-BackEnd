ALTER TABLE "ribbon"."questionnaire_category" ADD COLUMN "slug" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "ribbon"."questionnaire_category" ADD CONSTRAINT "questionnaire_category_slug_unique" UNIQUE("slug");