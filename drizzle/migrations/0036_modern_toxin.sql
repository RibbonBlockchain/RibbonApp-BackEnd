ALTER TABLE "ribbon"."notification" ALTER COLUMN "sender_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ribbon"."notification" ALTER COLUMN "sender_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."notification" ADD CONSTRAINT "notification_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
