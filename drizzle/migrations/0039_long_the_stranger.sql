ALTER TABLE "ribbon"."answer" ALTER COLUMN "option_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ribbon"."answer" ADD COLUMN "text" varchar;