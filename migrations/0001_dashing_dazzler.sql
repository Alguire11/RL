CREATE TABLE "admin_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" varchar NOT NULL,
	"action_type" varchar NOT NULL,
	"target_type" varchar NOT NULL,
	"target_id" varchar NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"key" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"permissions" jsonb,
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0,
	"rate_limit" integer DEFAULT 1000,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"details" jsonb,
	"ip_address" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"tenant_ref" text,
	"scope" varchar NOT NULL,
	"status" varchar NOT NULL,
	"captured_at" timestamp DEFAULT now(),
	"withdrawn_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_events" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"event_type" text NOT NULL,
	"message_id" text,
	"timestamp" timestamp DEFAULT now(),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"user_id" text NOT NULL,
	"token" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "landlord_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" varchar NOT NULL,
	"landlord_id" varchar NOT NULL,
	"property_id" integer,
	"rating" integer NOT NULL,
	"comment" text,
	"is_verified" boolean DEFAULT false,
	"is_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "landlord_tenant_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"landlord_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"property_id" integer,
	"status" varchar DEFAULT 'pending',
	"lease_start_date" timestamp,
	"lease_end_date" timestamp,
	"linked_at" timestamp DEFAULT now(),
	"terminated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "maintenance_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar NOT NULL,
	"property_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"priority" varchar DEFAULT 'medium',
	"status" varchar DEFAULT 'open',
	"photos" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pending_landlords" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"phone" varchar,
	"business_name" varchar,
	"invited_by" varchar,
	"invitation_token" varchar,
	"status" varchar DEFAULT 'pending',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"registered_at" timestamp,
	CONSTRAINT "pending_landlords_invitation_token_unique" UNIQUE("invitation_token")
);
--> statement-breakpoint
CREATE TABLE "rent_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"month" varchar(7) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"verified" boolean DEFAULT false,
	"verified_by" varchar,
	"proof_url" varchar,
	"landlord_id" varchar,
	"landlord_email" varchar,
	"submitted_at" timestamp DEFAULT now(),
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rent_score_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"score" integer NOT NULL,
	"change" integer DEFAULT 0,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reporting_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month" varchar(7) NOT NULL,
	"include_unverified" boolean DEFAULT false,
	"only_consented" boolean DEFAULT true,
	"format" varchar DEFAULT 'csv',
	"status" varchar DEFAULT 'queued',
	"record_count" integer DEFAULT 0,
	"checksum_sha256" text,
	"download_url" text,
	"created_by_admin_id" varchar,
	"failed_reason" text,
	"ready_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reporting_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"tenant_ref" text NOT NULL,
	"landlord_ref" text,
	"property_ref" text,
	"postcode_outward" varchar,
	"rent_amount_pence" integer,
	"rent_frequency" varchar,
	"period_start" date,
	"period_end" date,
	"due_date" date,
	"paid_date" date,
	"payment_status" varchar,
	"verification_status" varchar,
	"verification_method" varchar,
	"verification_timestamp" timestamp,
	"evidence_hashes" jsonb,
	"consent_status" varchar,
	"consent_timestamp" timestamp,
	"audit_ref" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"message" text NOT NULL,
	"priority" varchar DEFAULT 'normal',
	"status" varchar DEFAULT 'open',
	"assigned_to" varchar,
	"replies" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tenancies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenancy_ref" varchar NOT NULL,
	"property_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" varchar DEFAULT 'active',
	"monthly_rent" numeric(10, 2) NOT NULL,
	"outstanding_balance" numeric(10, 2) DEFAULT '0',
	"joint_tenancy_count" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tenancies_tenancy_ref_unique" UNIQUE("tenancy_ref")
);
--> statement-breakpoint
CREATE TABLE "tenancy_tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenancy_id" uuid NOT NULL,
	"tenant_id" varchar NOT NULL,
	"joint_indicator" boolean DEFAULT false,
	"primary_tenant" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar,
	"middle_name" varchar,
	"date_of_birth" date,
	"previous_address" jsonb,
	"opt_out_reporting" boolean DEFAULT false,
	"gone_away" boolean DEFAULT false,
	"arrangement_to_pay" boolean DEFAULT false,
	"query" boolean DEFAULT false,
	"deceased" boolean DEFAULT false,
	"third_party_paid" boolean DEFAULT false,
	"eviction_flag" boolean DEFAULT false,
	"eviction_date" date,
	"housing_benefit_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tenant_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "manual_payments" ADD COLUMN "payment_method" varchar;--> statement-breakpoint
ALTER TABLE "manual_payments" ADD COLUMN "landlord_email" varchar;--> statement-breakpoint
ALTER TABLE "manual_payments" ADD COLUMN "landlord_phone" varchar;--> statement-breakpoint
ALTER TABLE "manual_payments" ADD COLUMN "verification_token" varchar;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "lease_type" varchar;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "contract_duration" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "verification_token" varchar;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "rent_info" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_name" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_reason" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_calendar_refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_calendar_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landlord_reviews" ADD CONSTRAINT "landlord_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landlord_reviews" ADD CONSTRAINT "landlord_reviews_landlord_id_users_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landlord_reviews" ADD CONSTRAINT "landlord_reviews_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landlord_tenant_links" ADD CONSTRAINT "landlord_tenant_links_landlord_id_users_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landlord_tenant_links" ADD CONSTRAINT "landlord_tenant_links_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landlord_tenant_links" ADD CONSTRAINT "landlord_tenant_links_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_landlords" ADD CONSTRAINT "pending_landlords_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_logs" ADD CONSTRAINT "rent_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_logs" ADD CONSTRAINT "rent_logs_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_logs" ADD CONSTRAINT "rent_logs_landlord_id_users_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_score_history" ADD CONSTRAINT "rent_score_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_batches" ADD CONSTRAINT "reporting_batches_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_records" ADD CONSTRAINT "reporting_records_batch_id_reporting_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."reporting_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenancy_tenants" ADD CONSTRAINT "tenancy_tenants_tenancy_id_tenancies_id_fk" FOREIGN KEY ("tenancy_id") REFERENCES "public"."tenancies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenancy_tenants" ADD CONSTRAINT "tenancy_tenants_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_profiles" ADD CONSTRAINT "tenant_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_consents_tenant_id" ON "consents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "IDX_consents_scope" ON "consents" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "IDX_consents_tenant_ref" ON "consents" USING btree ("tenant_ref");--> statement-breakpoint
CREATE INDEX "IDX_email_events_email" ON "email_events" USING btree ("email");--> statement-breakpoint
CREATE INDEX "IDX_email_events_type" ON "email_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "IDX_email_events_message_id" ON "email_events" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_rent_score_history_user_id" ON "rent_score_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_rent_score_history_recorded_at" ON "rent_score_history" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "IDX_reporting_batches_month" ON "reporting_batches" USING btree ("month");--> statement-breakpoint
CREATE INDEX "IDX_reporting_records_batch_id" ON "reporting_records" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "IDX_reporting_records_tenant_ref" ON "reporting_records" USING btree ("tenant_ref");--> statement-breakpoint
CREATE INDEX "IDX_tenancies_property_id" ON "tenancies" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "IDX_tenancies_ref" ON "tenancies" USING btree ("tenancy_ref");--> statement-breakpoint
CREATE INDEX "IDX_tenancy_tenants_tenancy_id" ON "tenancy_tenants" USING btree ("tenancy_id");--> statement-breakpoint
CREATE INDEX "IDX_tenancy_tenants_tenant_id" ON "tenancy_tenants" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "IDX_tenant_profiles_user_id" ON "tenant_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_admin_users_user_id" ON "admin_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_bank_connections_user_id" ON "bank_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_credit_reports_user_id" ON "credit_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_credit_reports_property_id" ON "credit_reports" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "IDX_data_export_requests_user_id" ON "data_export_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_landlord_verifications_user_id" ON "landlord_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_landlord_verifications_property_id" ON "landlord_verifications" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "IDX_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_properties_user_id" ON "properties" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_rent_payments_user_id" ON "rent_payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_rent_payments_property_id" ON "rent_payments" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "IDX_report_shares_report_id" ON "report_shares" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "IDX_security_logs_user_id" ON "security_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_tenant_invitations_landlord_id" ON "tenant_invitations" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "IDX_tenant_invitations_property_id" ON "tenant_invitations" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "IDX_tenant_invitations_tenant_id" ON "tenant_invitations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "IDX_user_preferences_user_id" ON "user_preferences" USING btree ("user_id");