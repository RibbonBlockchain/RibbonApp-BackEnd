CREATE TABLE IF NOT EXISTS "ribbon"."questionnaire_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "questionnaire_category_name_unique" UNIQUE("name")
);
