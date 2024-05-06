CREATE TABLE IF NOT EXISTS "ribbon"."tassk" (
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
CREATE TABLE IF NOT EXISTS "ribbon"."tassk_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"tassk_id" integer,
	"user_id" integer NOT NULL,
	"status" "user_task_status" DEFAULT 'PROCESSING',
	"completed_date" date,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."task_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "task_category_name_unique" UNIQUE("name"),
	CONSTRAINT "task_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."task_question" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar,
	"type" "question_type" NOT NULL,
	"is_first" boolean DEFAULT false,
	"is_last" boolean DEFAULT false,
	"task_id" integer NOT NULL,
	CONSTRAINT "task_question_key" UNIQUE("text","task_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."task_question_answer" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"response" varchar,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."task_question_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"point" integer DEFAULT 0,
	"text" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"question_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."task_rating" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating" integer DEFAULT 0,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_id_task_id" UNIQUE("user_id","task_id")
);
--> statement-breakpoint
DROP TABLE "ribbon"."tassk_category";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."tassk" ADD CONSTRAINT "tassk_category_id_task_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "ribbon"."task_category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."tassk_activity" ADD CONSTRAINT "tassk_activity_tassk_id_tassk_id_fk" FOREIGN KEY ("tassk_id") REFERENCES "ribbon"."tassk"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."tassk_activity" ADD CONSTRAINT "tassk_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."task_question" ADD CONSTRAINT "task_question_task_id_tassk_id_fk" FOREIGN KEY ("task_id") REFERENCES "ribbon"."tassk"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."task_question_answer" ADD CONSTRAINT "task_question_answer_question_id_task_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."task_question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."task_question_answer" ADD CONSTRAINT "task_question_answer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."task_question_options" ADD CONSTRAINT "task_question_options_question_id_task_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "ribbon"."task_question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."task_rating" ADD CONSTRAINT "task_rating_task_id_tassk_id_fk" FOREIGN KEY ("task_id") REFERENCES "ribbon"."tassk"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."task_rating" ADD CONSTRAINT "task_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ribbon"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
