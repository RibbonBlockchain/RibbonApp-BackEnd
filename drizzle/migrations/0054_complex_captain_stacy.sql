DO $$ BEGIN
 CREATE TYPE "cpi_category" AS ENUM('CONSUMER_PRICE_INDEX', 'FOOD_AND_BEVERAGES', 'ALCOHOL_TOBACCO_NARCOTICS', 'CLOTHING_AND_FOOTWEAR', 'HOUSING_AND_UTILITIES', 'FURNISHINGS_AND_MAINTENANCE', 'HEALTH', 'TRANSPORT', 'COMMUNICATION', 'RECREATION_AND_CULTURE', 'EDUCATION', 'RESTAURANTS_AND_HOTELS', 'MISCELLANEOUS_GOODS_AND_SERVICES');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."cpi_country" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ribbon"."cpi_index" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" double precision,
	"category" "cpi_category",
	"year" integer,
	"month" integer,
	"country_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ribbon"."cpi_index" ADD CONSTRAINT "cpi_index_country_id_cpi_country_id_fk" FOREIGN KEY ("country_id") REFERENCES "ribbon"."cpi_country"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
