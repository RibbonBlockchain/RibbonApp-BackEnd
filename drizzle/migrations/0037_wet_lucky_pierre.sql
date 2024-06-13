ALTER TABLE "ribbon"."questionnaire_activity" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "ribbon"."survey_activity" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "ribbon"."tassk_activity" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();