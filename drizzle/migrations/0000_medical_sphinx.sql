CREATE SCHEMA "ribbon";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "role" AS ENUM('PATIENT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_status" AS ENUM('ACTIVE', 'ONBOARDING');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "verification_code_reason" AS ENUM('SMS_ONBOARDING');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."auth" (
	"id" serial PRIMARY KEY NOT NULL,
	"password" varchar,
	"access_token" varchar,
	"refresh_token" varchar,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."user" (
	"id" serial PRIMARY KEY NOT NULL,
	"avatar" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"email" varchar,
	"phone" varchar,
	"country_code" varchar,
	"role" "role" DEFAULT 'PATIENT' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE',
	"referrer_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."verification_code" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar,
	"email" varchar,
	"phone" varchar,
	"reason" "verification_code_reason",
	"expires_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "verification_code_email_unique" UNIQUE("email"),
	CONSTRAINT "verification_code_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."auth" ADD CONSTRAINT "auth_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
