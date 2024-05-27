DO $$ BEGIN
 CREATE TYPE "transaction_status" AS ENUM('SUCCESS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."notification_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"message" varchar,
	"sender_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"reward" double precision DEFAULT 0.1,
	"category_id" integer NOT NULL,
	"status" "transaction_status" DEFAULT 'SUCCESS',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."notification_history" ADD CONSTRAINT "notification_history_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."transaction" ADD CONSTRAINT "transaction_category_id_survey_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "ribbon"."survey_category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
