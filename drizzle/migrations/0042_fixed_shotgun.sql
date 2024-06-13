ALTER TABLE "ribbon"."reward_partner" ADD COLUMN "vault_address" text;--> statement-breakpoint
ALTER TABLE "ribbon"."user" ADD COLUMN "partner_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."user" ADD CONSTRAINT "user_partner_id_reward_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "ribbon"."reward_partner"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
