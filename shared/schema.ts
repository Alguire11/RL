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
  email: varchar("email").unique().notNull(),
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
  isActive: boolean("is_active").default(true),
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
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  user: one(users, { fields: [properties.userId], references: [users.id] }),
  rentPayments: many(rentPayments),
  creditReports: many(creditReports),
  landlordVerifications: many(landlordVerifications),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));

export const securityLogsRelations = relations(securityLogs, ({ one }) => ({
  user: one(users, { fields: [securityLogs.userId], references: [users.id] }),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertPropertySchema = createInsertSchema(properties);
export const insertRentPaymentSchema = createInsertSchema(rentPayments);
export const insertBankConnectionSchema = createInsertSchema(bankConnections);
export const insertCreditReportSchema = createInsertSchema(creditReports);
export const insertReportShareSchema = createInsertSchema(reportShares);
export const insertLandlordVerificationSchema = createInsertSchema(landlordVerifications);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const insertSecurityLogSchema = createInsertSchema(securityLogs);
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
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = typeof securityLogs.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
export type DataExportRequest = typeof dataExportRequests.$inferSelect;
export type InsertDataExportRequest = typeof dataExportRequests.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;
export type CertificationPortfolio = typeof certificationPortfolios.$inferSelect;
export type InsertCertificationPortfolio = typeof certificationPortfolios.$inferInsert;
