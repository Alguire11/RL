import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  rlid: varchar("rlid", { length: 20 }).unique(),
  email: varchar("email").unique().notNull(),
  username: varchar("username").unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  isOnboarded: boolean("is_onboarded").default(false),
  emailVerified: boolean("email_verified").default(false),
  address: jsonb("address"),
  rentInfo: jsonb("rent_info"),
  role: varchar("role").default("user"),
  subscriptionPlan: varchar("subscription_plan").default("free"),
  subscriptionStatus: varchar("subscription_status").default("active"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  postcode: varchar("postcode").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  landlordName: varchar("landlord_name"),
  landlordEmail: varchar("landlord_email"),
  landlordPhone: varchar("landlord_phone"),
  tenancyStartDate: date("tenancy_start_date"),
  tenancyEndDate: date("tenancy_end_date"),
  leaseType: varchar("lease_type"), // fixed_term, periodic, month_to_month
  contractDuration: integer("contract_duration"), // Duration in months
  isActive: boolean("is_active").default(true),
  rentUpdateCount: integer("rent_update_count").default(0),
  lastRentUpdateMonth: varchar("last_rent_update_month"), // Format: YYYY-MM
  rentInfo: jsonb("rent_info"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User badges/certifications table
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  badgeType: varchar("badge_type").notNull(), // 'payment_streak', 'reliable_tenant', 'platinum_member', etc.
  level: integer("level").default(1), // 1-5 star levels
  earnedAt: timestamp("earned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // Additional badge data like streak count, duration, etc.
});

// Certification portfolios table for landlord sharing
export const certificationPortfolios = pgTable("certification_portfolios", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  badges: jsonb("badges"), // Array of badge IDs included in portfolio
  paymentHistory: jsonb("payment_history"), // Summarized payment data
  landlordTestimonials: jsonb("landlord_testimonials"), // Previous landlord reviews
  isActive: boolean("is_active").default(true),
  shareToken: varchar("share_token").unique(), // Token for secure sharing
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rent payments table
export const rentPayments = pgTable("rent_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  status: varchar("status", { enum: ["pending", "paid", "late", "missed"] }).default("pending"),
  paymentMethod: varchar("payment_method"),
  transactionId: varchar("transaction_id"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bank connections table
export const bankConnections = pgTable("bank_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bankName: varchar("bank_name").notNull(),
  accountNumber: varchar("account_number").notNull(),
  sortCode: varchar("sort_code"),
  isActive: boolean("is_active").default(true),
  connectionData: jsonb("connection_data"), // Store Open Banking connection details
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit reports table
export const creditReports = pgTable("credit_reports", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  reportId: uuid("report_id").defaultRandom().notNull(),
  reportData: jsonb("report_data").notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  shareCount: integer("share_count").default(0),
  verificationId: varchar("verification_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Report shares table
export const reportShares = pgTable("report_shares", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => creditReports.id).notNull(),
  recipientEmail: varchar("recipient_email"),
  recipientType: varchar("recipient_type", { enum: ["landlord", "lender", "agency"] }),
  shareUrl: varchar("share_url").notNull(),
  accessCount: integer("access_count").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Landlord verifications table
export const landlordVerifications = pgTable("landlord_verifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  verificationToken: varchar("verification_token").notNull(),
  landlordEmail: varchar("landlord_email").notNull(),
  verifiedAt: timestamp("verified_at"),
  isVerified: boolean("is_verified").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tenant invitations table
export const tenantInvitations = pgTable("tenant_invitations", {
  id: serial("id").primaryKey(),
  landlordId: varchar("landlord_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  tenantEmail: varchar("tenant_email").notNull(),
  inviteToken: varchar("invite_token").unique().notNull(),
  status: varchar("status", { enum: ["pending", "accepted", "expired", "cancelled"] }).default("pending"),
  inviteUrl: text("invite_url").notNull(),
  qrCodeData: text("qr_code_data"), // Base64 encoded QR code
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  tenantId: varchar("tenant_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type", { enum: ["payment_reminder", "report_generated", "landlord_verified", "system"] }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  paymentReminders: boolean("payment_reminders").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  reminderDays: integer("reminder_days").default(3),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Security log table
export const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs table (comprehensive system history)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // create, update, delete, export, login_as
  entityType: varchar("entity_type").notNull(), // user, property, payment, system
  entityId: varchar("entity_id"), // Can be string or number, storing as string for flexibility
  details: jsonb("details"), // Changed fields, snapshot, etc.
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { enum: ["admin", "moderator", "viewer"] }).default("viewer"),
  permissions: text("permissions").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data export requests table
export const dataExportRequests = pgTable("data_export_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: varchar("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending"),
  dataType: varchar("data_type", { enum: ["all", "payments", "reports", "profile"] }).default("all"),
  downloadUrl: varchar("download_url"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertPropertySchema = createInsertSchema(properties).extend({
  contractDuration: z.union([z.number().int().positive(), z.string().transform((val) => {
    const num = parseInt(val, 10);
    return isNaN(num) || num <= 0 ? undefined : num;
  }).optional(), z.undefined()]).optional(),
});
export const insertRentPaymentSchema = createInsertSchema(rentPayments);
export const insertBankConnectionSchema = createInsertSchema(bankConnections);
export const insertCreditReportSchema = createInsertSchema(creditReports);
export const insertReportShareSchema = createInsertSchema(reportShares);
export const insertLandlordVerificationSchema = createInsertSchema(landlordVerifications);
export const insertTenantInvitationSchema = createInsertSchema(tenantInvitations);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const insertSecurityLogSchema = createInsertSchema(securityLogs);
export const insertAuditLogSchema = createInsertSchema(auditLogs);
export const insertAdminUserSchema = createInsertSchema(adminUsers);
export const insertDataExportRequestSchema = createInsertSchema(dataExportRequests);
export const insertUserBadgeSchema = createInsertSchema(userBadges);
export const insertCertificationPortfolioSchema = createInsertSchema(certificationPortfolios);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type LoginUser = Pick<User, 'email' | 'password'>;
export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type RentPayment = typeof rentPayments.$inferSelect;
export type InsertRentPayment = typeof rentPayments.$inferInsert;
export type BankConnection = typeof bankConnections.$inferSelect;
export type InsertBankConnection = typeof bankConnections.$inferInsert;
export type CreditReport = typeof creditReports.$inferSelect;
export type InsertCreditReport = typeof creditReports.$inferInsert;
export type ReportShare = typeof reportShares.$inferSelect;
export type InsertReportShare = typeof reportShares.$inferInsert;
export type LandlordVerification = typeof landlordVerifications.$inferSelect;
export type InsertLandlordVerification = typeof landlordVerifications.$inferInsert;
export type TenantInvitation = typeof tenantInvitations.$inferSelect;
export type InsertTenantInvitation = typeof tenantInvitations.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = typeof securityLogs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
export type DataExportRequest = typeof dataExportRequests.$inferSelect;
export type InsertDataExportRequest = typeof dataExportRequests.$inferInsert;

// Achievement badges table for gamification
export const achievementBadges = pgTable("achievement_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  badgeType: varchar("badge_type", {
    enum: ["first_payment", "streak_3", "streak_6", "streak_12", "perfect_year", "early_bird", "consistent_payer"]
  }).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  title: varchar("title").notNull(),
  description: varchar("description").notNull(),
  iconName: varchar("icon_name").notNull(),
});

// Manual payment entries for users without bank linking
export const manualPayments = pgTable("manual_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method"), // bank_transfer, cash, cheque, etc.
  description: varchar("description"),
  receiptUrl: varchar("receipt_url"), // For uploaded receipt images
  landlordEmail: varchar("landlord_email"), // Landlord email for verification
  landlordPhone: varchar("landlord_phone"), // Landlord phone for verification
  needsVerification: boolean("needs_verification").default(true),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"), // landlord email or admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment streak tracking table
export const paymentStreaks = pgTable("payment_streaks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastPaymentDate: date("last_payment_date"),
  lastUpdateAt: timestamp("last_update_at").defaultNow(),
});

// Enhanced report shares with more options
export const enhancedReportShares = pgTable("enhanced_report_shares", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  shareToken: varchar("share_token").unique().notNull(),
  recipientEmail: varchar("recipient_email"),
  recipientName: varchar("recipient_name"),
  shareType: varchar("share_type", { enum: ["email", "link", "download"] }).notNull(),
  expiresAt: timestamp("expires_at"),
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  isPasswordProtected: boolean("is_password_protected").default(false),
  passwordHash: varchar("password_hash"),
  customMessage: text("custom_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AchievementBadge = typeof achievementBadges.$inferSelect;
export type InsertAchievementBadge = typeof achievementBadges.$inferInsert;
export type ManualPayment = typeof manualPayments.$inferSelect;
export type InsertManualPayment = typeof manualPayments.$inferInsert;
export type PaymentStreak = typeof paymentStreaks.$inferSelect;
export type InsertPaymentStreak = typeof paymentStreaks.$inferInsert;
export type EnhancedReportShare = typeof enhancedReportShares.$inferSelect;
export type InsertEnhancedReportShare = typeof enhancedReportShares.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;
export type CertificationPortfolio = typeof certificationPortfolios.$inferSelect;
export type InsertCertificationPortfolio = typeof certificationPortfolios.$inferInsert;

// Moderation items table
export const moderationItems = pgTable("moderation_items", {
  id: serial("id").primaryKey(),
  type: varchar("type", { enum: ["user_report", "content_violation", "payment_dispute", "spam"] }).notNull(),
  userId: varchar("user_id").references(() => users.id),
  reporterId: varchar("reporter_id").references(() => users.id),
  subject: varchar("subject").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { enum: ["pending", "reviewing", "resolved", "dismissed"] }).default("pending"),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ModerationItem = typeof moderationItems.$inferSelect;
export type InsertModerationItem = typeof moderationItems.$inferInsert;

// System settings table for persisting admin configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").unique().notNull(), // Setting key (e.g., 'maintenanceMode', 'allowNewRegistrations')
  value: jsonb("value").notNull(), // Setting value (can be any JSON type)
  updatedBy: varchar("updated_by").references(() => users.id), // Admin who last updated this setting
  updatedAt: timestamp("updated_at").defaultNow(),
  description: text("description"), // Optional description of what this setting does
});

// Disputes table for tracking payment and verification disputes
export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(), // User who created the dispute
  propertyId: integer("property_id").references(() => properties.id), // Related property (if applicable)
  paymentId: integer("payment_id").references(() => rentPayments.id), // Related payment (if applicable)
  type: varchar("type", { enum: ["payment", "verification", "property", "other"] }).notNull(), // Dispute type
  subject: varchar("subject").notNull(), // Short subject line
  description: text("description").notNull(), // Detailed description
  status: varchar("status", { enum: ["open", "in_progress", "resolved", "closed"] }).default("open"), // Current status
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"), // Priority level
  assignedTo: varchar("assigned_to").references(() => users.id), // Admin assigned to handle this dispute
  resolution: text("resolution"), // Resolution notes when closed
  createdAt: timestamp("created_at").defaultNow(), // When dispute was created
  updatedAt: timestamp("updated_at").defaultNow(), // Last update timestamp
  resolvedAt: timestamp("resolved_at"), // When dispute was resolved
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

// Rent logs table for tracking verified rent payments
export const rentLogs = pgTable("rent_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // Format: YYYY-MM
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  verified: boolean("verified").default(false),
  verifiedBy: varchar("verified_by").references(() => users.id), // landlord or admin user id
  proofURL: varchar("proof_url"), // URL to uploaded receipt/proof
  landlordId: varchar("landlord_id").references(() => users.id), // Linked landlord if applicable
  landlordEmail: varchar("landlord_email"), // Stored email if landlord not registered yet
  submittedAt: timestamp("submitted_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Landlord-tenant links for multi-unit support
export const landlordTenantLinks = pgTable("landlord_tenant_links", {
  id: serial("id").primaryKey(),
  landlordId: varchar("landlord_id").references(() => users.id).notNull(),
  tenantId: varchar("tenant_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  status: varchar("status", { enum: ["pending", "active", "inactive", "terminated"] }).default("pending"),
  linkedAt: timestamp("linked_at").defaultNow(),
  terminatedAt: timestamp("terminated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin actions log for tracking verifications, rejections, deletions
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  actionType: varchar("action_type", {
    enum: ["verify_rent", "reject_rent", "delete_rent", "verify_landlord", "reject_landlord", "delete_user", "other"]
  }).notNull(),
  targetType: varchar("target_type", { enum: ["rent_log", "user", "landlord", "property", "other"] }).notNull(),
  targetId: varchar("target_id").notNull(), // ID of the target (rent_log id, user id, etc.)
  details: jsonb("details"), // Additional action details
  createdAt: timestamp("created_at").defaultNow(),
});

// Pending landlord registrations - store email/info before they register
export const pendingLandlords = pgTable("pending_landlords", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  businessName: varchar("business_name"),
  invitedBy: varchar("invited_by").references(() => users.id), // Tenant who invited them
  invitationToken: varchar("invitation_token").unique(),
  status: varchar("status", { enum: ["pending", "registered", "expired"] }).default("pending"),
  metadata: jsonb("metadata"), // Additional info
  createdAt: timestamp("created_at").defaultNow(),
  registeredAt: timestamp("registered_at"),
});

export type RentLog = typeof rentLogs.$inferSelect;
export type InsertRentLog = typeof rentLogs.$inferInsert;
export type LandlordTenantLink = typeof landlordTenantLinks.$inferSelect;
export type InsertLandlordTenantLink = typeof landlordTenantLinks.$inferInsert;
export type AdminAction = typeof adminActions.$inferSelect;
export type InsertAdminAction = typeof adminActions.$inferInsert;
export type PendingLandlord = typeof pendingLandlords.$inferSelect;
export type InsertPendingLandlord = typeof pendingLandlords.$inferInsert;

// Maintenance requests table
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  status: varchar("status", { enum: ["open", "in_progress", "resolved", "closed"] }).default("open"),
  photos: jsonb("photos"), // Array of photo URLs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = typeof maintenanceRequests.$inferInsert;
export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests);

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  tenant: one(users, { fields: [maintenanceRequests.tenantId], references: [users.id] }),
  property: one(properties, { fields: [maintenanceRequests.propertyId], references: [properties.id] }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  properties: many(properties),
  rentPayments: many(rentPayments),
  bankConnections: many(bankConnections),
  creditReports: many(creditReports),
  landlordVerifications: many(landlordVerifications),
  notifications: many(notifications),
  preferences: one(userPreferences),
  securityLogs: many(securityLogs),
  adminUser: one(adminUsers),
  dataExportRequests: many(dataExportRequests),
  badges: many(userBadges),
  certificationPortfolios: many(certificationPortfolios),
  maintenanceRequests: many(maintenanceRequests),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  user: one(users, { fields: [properties.userId], references: [users.id] }),
  rentPayments: many(rentPayments),
  creditReports: many(creditReports),
  landlordVerifications: many(landlordVerifications),
  maintenanceRequests: many(maintenanceRequests),
}));

export const rentPaymentsRelations = relations(rentPayments, ({ one }) => ({
  user: one(users, { fields: [rentPayments.userId], references: [users.id] }),
  property: one(properties, { fields: [rentPayments.propertyId], references: [properties.id] }),
}));

export const bankConnectionsRelations = relations(bankConnections, ({ one }) => ({
  user: one(users, { fields: [bankConnections.userId], references: [users.id] }),
}));

export const creditReportsRelations = relations(creditReports, ({ one, many }) => ({
  user: one(users, { fields: [creditReports.userId], references: [users.id] }),
  property: one(properties, { fields: [creditReports.propertyId], references: [properties.id] }),
  shares: many(reportShares),
}));

export const reportSharesRelations = relations(reportShares, ({ one }) => ({
  report: one(creditReports, { fields: [reportShares.reportId], references: [creditReports.id] }),
}));

export const landlordVerificationsRelations = relations(landlordVerifications, ({ one }) => ({
  user: one(users, { fields: [landlordVerifications.userId], references: [users.id] }),
  property: one(properties, { fields: [landlordVerifications.propertyId], references: [properties.id] }),
}));

export const tenantInvitationsRelations = relations(tenantInvitations, ({ one }) => ({
  landlord: one(users, { fields: [tenantInvitations.landlordId], references: [users.id] }),
  property: one(properties, { fields: [tenantInvitations.propertyId], references: [properties.id] }),
  tenant: one(users, { fields: [tenantInvitations.tenantId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));

export const securityLogsRelations = relations(securityLogs, ({ one }) => ({
  user: one(users, { fields: [securityLogs.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const adminUsersRelations = relations(adminUsers, ({ one }) => ({
  user: one(users, { fields: [adminUsers.userId], references: [users.id] }),
}));

export const dataExportRequestsRelations = relations(dataExportRequests, ({ one }) => ({
  user: one(users, { fields: [dataExportRequests.userId], references: [users.id] }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
}));

export const certificationPortfoliosRelations = relations(certificationPortfolios, ({ one }) => ({
  user: one(users, { fields: [certificationPortfolios.userId], references: [users.id] }),
}));

export const rentLogsRelations = relations(rentLogs, ({ one }) => ({
  user: one(users, { fields: [rentLogs.userId], references: [users.id] }),
  landlord: one(users, { fields: [rentLogs.landlordId], references: [users.id] }),
  verifier: one(users, { fields: [rentLogs.verifiedBy], references: [users.id] }),
}));

export const landlordTenantLinksRelations = relations(landlordTenantLinks, ({ one }) => ({
  landlord: one(users, { fields: [landlordTenantLinks.landlordId], references: [users.id] }),
  tenant: one(users, { fields: [landlordTenantLinks.tenantId], references: [users.id] }),
  property: one(properties, { fields: [landlordTenantLinks.propertyId], references: [properties.id] }),
}));

export const adminActionsRelations = relations(adminActions, ({ one }) => ({
  admin: one(users, { fields: [adminActions.adminId], references: [users.id] }),
}));

export const pendingLandlordsRelations = relations(pendingLandlords, ({ one }) => ({
  inviter: one(users, { fields: [pendingLandlords.invitedBy], references: [users.id] }),
}));
