CREATE TYPE "public"."approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "status" "approval_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "moderated_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "moderation_note" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "appointment_id" integer;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "approval_status" "approval_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "moderated_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "moderation_note" text;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_moderated_by_user_id_users_id_fk" FOREIGN KEY ("moderated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_moderated_by_user_id_users_id_fk" FOREIGN KEY ("moderated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;