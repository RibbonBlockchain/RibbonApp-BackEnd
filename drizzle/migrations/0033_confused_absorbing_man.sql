ALTER TABLE "ribbon"."survey" ADD COLUMN "status" "questionnaire_status" DEFAULT 'ACTIVE';--> statement-breakpoint
ALTER TABLE "ribbon"."tassk" ADD COLUMN "status" "questionnaire_status" DEFAULT 'ACTIVE';