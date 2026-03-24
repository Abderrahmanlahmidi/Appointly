CREATE TYPE "public"."service_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "total_price" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "availabilities" ALTER COLUMN "date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "availabilities" ALTER COLUMN "start_time" SET DATA TYPE time;--> statement-breakpoint
ALTER TABLE "availabilities" ALTER COLUMN "end_time" SET DATA TYPE time;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "price" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "client_id" integer;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "provider_id" integer;--> statement-breakpoint
ALTER TABLE "availabilities" ADD COLUMN "service_id" integer;--> statement-breakpoint
ALTER TABLE "chatbot_logs" ADD COLUMN "bot_response" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "status" "service_status" DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "provider_id" integer;--> statement-breakpoint
UPDATE "chatbot_logs" SET "bot_response" = "response" WHERE "bot_response" IS NULL;--> statement-breakpoint
UPDATE "chatbot_logs" SET "bot_response" = '' WHERE "bot_response" IS NULL;--> statement-breakpoint
ALTER TABLE "chatbot_logs" ALTER COLUMN "bot_response" SET NOT NULL;--> statement-breakpoint
UPDATE "notifications" SET "title" = 'Notification' WHERE "title" IS NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
UPDATE "appointments" SET "client_id" = "user_id" WHERE "client_id" IS NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "date_time";--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "chatbot_logs" DROP COLUMN "detected_intent";--> statement-breakpoint
ALTER TABLE "chatbot_logs" DROP COLUMN "response";
