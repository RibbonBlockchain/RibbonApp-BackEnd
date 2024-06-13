CREATE TABLE IF NOT EXISTS "ribbon"."reward_partner" (
	"id" serial PRIMARY KEY NOT NULL,
	"logo" varchar,
	"name" varchar,
	"token" varchar,
	"value" double precision DEFAULT 0,
	"volume" double precision DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ribbon"."notification" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();