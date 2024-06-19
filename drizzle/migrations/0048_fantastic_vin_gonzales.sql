CREATE TABLE IF NOT EXISTS "ribbon"."cpi_upload_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"fileName" varchar,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."cpi_upload_history" ADD CONSTRAINT "cpi_upload_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
