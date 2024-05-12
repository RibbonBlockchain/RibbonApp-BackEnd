DO $$ BEGIN
 CREATE TYPE "questionnaire_status" AS ENUM('ACTIVE', 'CLOSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "ribbon"."questionniare" ADD COLUMN "status" "questionnaire_status" DEFAULT 'ACTIVE';