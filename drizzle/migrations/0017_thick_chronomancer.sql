ALTER TABLE "ribbon"."survey" ALTER COLUMN "reward" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "ribbon"."survey" ALTER COLUMN "reward" SET DEFAULT 0.1;--> statement-breakpoint
ALTER TABLE "ribbon"."tassk" ALTER COLUMN "reward" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "ribbon"."tassk" ALTER COLUMN "reward" SET DEFAULT 0.1;