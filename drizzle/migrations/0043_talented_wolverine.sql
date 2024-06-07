CREATE TABLE IF NOT EXISTS "ribbon"."block_transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" double precision,
	"points" double precision,
	"metadata" jsonb,
	"user_id" integer NOT NULL,
	"partner_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."block_transaction" ADD CONSTRAINT "block_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."block_transaction" ADD CONSTRAINT "block_transaction_partner_id_reward_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "ribbon"."reward_partner"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
