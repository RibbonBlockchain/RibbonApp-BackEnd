CREATE TABLE IF NOT EXISTS "ribbon"."survey" (
	"id" serial PRIMARY KEY NOT NULL,
	"image" varchar,
	"name" varchar,
	"slug" varchar,
	"description" varchar,
	"reward" integer DEFAULT 0,
	"category_id" integer NOT NULL,
	"duration" integer DEFAULT 60,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."survey_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"survey_id" integer,
	"user_id" integer NOT NULL,
	"status" "user_task_status" DEFAULT 'PROCESSING',
	"completed_date" date,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."survey_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "survey_category_name_unique" UNIQUE("name"),
	CONSTRAINT "survey_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."survey__question" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar,
	"type" "question_type" NOT NULL,
	"is_first" boolean DEFAULT false,
	"is_last" boolean DEFAULT false,
	"survey_id" integer NOT NULL,
	CONSTRAINT "survey_question_key" UNIQUE("text","survey_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."survey_question_answer" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"option_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."survey_question_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"point" integer DEFAULT 0,
	"text" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"question_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."survey_rating" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating" integer DEFAULT 0,
	"survey_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_id_survey_id" UNIQUE("user_id","survey_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."tassk_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tassk_category_name_unique" UNIQUE("name"),
	CONSTRAINT "tassk_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey" ADD CONSTRAINT "survey_category_id_survey_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "ribbon"."survey_category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_activity" ADD CONSTRAINT "survey_activity_survey_id_survey_id_fk" FOREIGN KEY ("survey_id") REFERENCES "ribbon"."survey"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_activity" ADD CONSTRAINT "survey_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey__question" ADD CONSTRAINT "survey__question_survey_id_survey_id_fk" FOREIGN KEY ("survey_id") REFERENCES "ribbon"."survey"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_question_answer" ADD CONSTRAINT "survey_question_answer_question_id_survey__question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."survey__question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_question_answer" ADD CONSTRAINT "survey_question_answer_option_id_survey_question_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "ribbon"."survey_question_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_question_answer" ADD CONSTRAINT "survey_question_answer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_question_options" ADD CONSTRAINT "survey_question_options_question_id_survey__question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."survey__question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_rating" ADD CONSTRAINT "survey_rating_survey_id_task_id_fk" FOREIGN KEY ("survey_id") REFERENCES "ribbon"."task"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."survey_rating" ADD CONSTRAINT "survey_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
