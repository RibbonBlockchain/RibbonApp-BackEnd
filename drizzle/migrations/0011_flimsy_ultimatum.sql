CREATE TABLE IF NOT EXISTS "ribbon"."notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" varchar,
	"user_id" integer NOT NULL,
	"isRead" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
