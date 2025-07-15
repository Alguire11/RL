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

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  isOnboarded: boolean("is_onboarded").default(false),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  rentPayments: many(rentPayments),
  bankConnections: many(bankConnections),
  creditReports: many(creditReports),
  landlordVerifications: many(landlordVerifications),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertPropertySchema = createInsertSchema(properties);
export const insertRentPaymentSchema = createInsertSchema(rentPayments);
export const insertBankConnectionSchema = createInsertSchema(bankConnections);
export const insertCreditReportSchema = createInsertSchema(creditReports);
export const insertReportShareSchema = createInsertSchema(reportShares);
export const insertLandlordVerificationSchema = createInsertSchema(landlordVerifications);

// Types
export type UpsertUser = typeof users.$inferInsert;
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
