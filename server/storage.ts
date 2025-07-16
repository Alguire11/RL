import {
  users,
  properties,
  rentPayments,
  bankConnections,
  creditReports,
  reportShares,
  landlordVerifications,
  type User,
  type UpsertUser,
  type Property,
  type InsertProperty,
  type RentPayment,
  type InsertRentPayment,
  type BankConnection,
  type InsertBankConnection,
  type CreditReport,
  type InsertCreditReport,
  type ReportShare,
  type InsertReportShare,
  type LandlordVerification,
  type InsertLandlordVerification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Property operations
  createProperty(property: InsertProperty): Promise<Property>;
  getUserProperties(userId: string): Promise<Property[]>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property>;
  deleteProperty(id: number): Promise<void>;
  
  // Rent payment operations
  createRentPayment(payment: InsertRentPayment): Promise<RentPayment>;
  getUserRentPayments(userId: string): Promise<RentPayment[]>;
  getPropertyRentPayments(propertyId: number): Promise<RentPayment[]>;
  updateRentPayment(id: number, payment: Partial<InsertRentPayment>): Promise<RentPayment>;
  deleteRentPayment(id: number): Promise<void>;
  
  // Bank connection operations
  createBankConnection(connection: InsertBankConnection): Promise<BankConnection>;
  getUserBankConnections(userId: string): Promise<BankConnection[]>;
  updateBankConnection(id: number, connection: Partial<InsertBankConnection>): Promise<BankConnection>;
  deleteBankConnection(id: number): Promise<void>;
  
  // Credit report operations
  createCreditReport(report: InsertCreditReport): Promise<CreditReport>;
  getUserCreditReports(userId: string): Promise<CreditReport[]>;
  getCreditReportByReportId(reportId: string): Promise<CreditReport | undefined>;
  updateCreditReport(id: number, report: Partial<InsertCreditReport>): Promise<CreditReport>;
  
  // Report share operations
  createReportShare(share: InsertReportShare): Promise<ReportShare>;
  getReportShares(reportId: number): Promise<ReportShare[]>;
  getReportShareByUrl(url: string): Promise<ReportShare | undefined>;
  incrementShareAccess(shareId: number): Promise<void>;
  
  // Landlord verification operations
  createLandlordVerification(verification: InsertLandlordVerification): Promise<LandlordVerification>;
  getLandlordVerification(token: string): Promise<LandlordVerification | undefined>;
  updateLandlordVerification(id: number, verification: Partial<InsertLandlordVerification>): Promise<LandlordVerification>;
  
  // Dashboard statistics
  getUserStats(userId: string): Promise<{
    paymentStreak: number;
    totalPaid: number;
    onTimePercentage: number;
    nextPaymentDue: string | null;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Property operations
  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db
      .insert(properties)
      .values(property)
      .returning();
    return newProperty;
  }

  async getUserProperties(userId: string): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(and(eq(properties.userId, userId), eq(properties.isActive, true)))
      .orderBy(desc(properties.createdAt));
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property> {
    const [updatedProperty] = await db
      .update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<void> {
    await db
      .update(properties)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(properties.id, id));
  }

  // Rent payment operations
  async createRentPayment(payment: InsertRentPayment): Promise<RentPayment> {
    const [newPayment] = await db
      .insert(rentPayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getUserRentPayments(userId: string): Promise<RentPayment[]> {
    return await db
      .select()
      .from(rentPayments)
      .where(eq(rentPayments.userId, userId))
      .orderBy(desc(rentPayments.dueDate));
  }

  async getPropertyRentPayments(propertyId: number): Promise<RentPayment[]> {
    return await db
      .select()
      .from(rentPayments)
      .where(eq(rentPayments.propertyId, propertyId))
      .orderBy(desc(rentPayments.dueDate));
  }

  async updateRentPayment(id: number, payment: Partial<InsertRentPayment>): Promise<RentPayment> {
    const [updatedPayment] = await db
      .update(rentPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(rentPayments.id, id))
      .returning();
    return updatedPayment;
  }

  async deleteRentPayment(id: number): Promise<void> {
    await db.delete(rentPayments).where(eq(rentPayments.id, id));
  }

  // Bank connection operations
  async createBankConnection(connection: InsertBankConnection): Promise<BankConnection> {
    const [newConnection] = await db
      .insert(bankConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async getUserBankConnections(userId: string): Promise<BankConnection[]> {
    return await db
      .select()
      .from(bankConnections)
      .where(and(eq(bankConnections.userId, userId), eq(bankConnections.isActive, true)))
      .orderBy(desc(bankConnections.createdAt));
  }

  async updateBankConnection(id: number, connection: Partial<InsertBankConnection>): Promise<BankConnection> {
    const [updatedConnection] = await db
      .update(bankConnections)
      .set({ ...connection, updatedAt: new Date() })
      .where(eq(bankConnections.id, id))
      .returning();
    return updatedConnection;
  }

  async deleteBankConnection(id: number): Promise<void> {
    await db
      .update(bankConnections)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(bankConnections.id, id));
  }

  // Credit report operations
  async createCreditReport(report: InsertCreditReport): Promise<CreditReport> {
    const [newReport] = await db
      .insert(creditReports)
      .values(report)
      .returning();
    return newReport;
  }

  async getUserCreditReports(userId: string): Promise<CreditReport[]> {
    return await db
      .select()
      .from(creditReports)
      .where(and(eq(creditReports.userId, userId), eq(creditReports.isActive, true)))
      .orderBy(desc(creditReports.createdAt));
  }

  async getCreditReportByReportId(reportId: string): Promise<CreditReport | undefined> {
    const [report] = await db
      .select()
      .from(creditReports)
      .where(and(eq(creditReports.reportId, reportId), eq(creditReports.isActive, true)));
    return report;
  }

  async updateCreditReport(id: number, report: Partial<InsertCreditReport>): Promise<CreditReport> {
    const [updatedReport] = await db
      .update(creditReports)
      .set(report)
      .where(eq(creditReports.id, id))
      .returning();
    return updatedReport;
  }

  // Report share operations
  async createReportShare(share: InsertReportShare): Promise<ReportShare> {
    const [newShare] = await db
      .insert(reportShares)
      .values(share)
      .returning();
    return newShare;
  }

  async getReportShares(reportId: number): Promise<ReportShare[]> {
    return await db
      .select()
      .from(reportShares)
      .where(and(eq(reportShares.reportId, reportId), eq(reportShares.isActive, true)))
      .orderBy(desc(reportShares.createdAt));
  }

  async getReportShareByUrl(url: string): Promise<ReportShare | undefined> {
    const [share] = await db
      .select()
      .from(reportShares)
      .where(and(eq(reportShares.shareUrl, url), eq(reportShares.isActive, true)));
    return share;
  }

  async incrementShareAccess(shareId: number): Promise<void> {
    await db
      .update(reportShares)
      .set({ accessCount: sql`${reportShares.accessCount} + 1` })
      .where(eq(reportShares.id, shareId));
  }

  // Landlord verification operations
  async createLandlordVerification(verification: InsertLandlordVerification): Promise<LandlordVerification> {
    const [newVerification] = await db
      .insert(landlordVerifications)
      .values(verification)
      .returning();
    return newVerification;
  }

  async getLandlordVerification(token: string): Promise<LandlordVerification | undefined> {
    const [verification] = await db
      .select()
      .from(landlordVerifications)
      .where(eq(landlordVerifications.verificationToken, token));
    return verification;
  }

  async updateLandlordVerification(id: number, verification: Partial<InsertLandlordVerification>): Promise<LandlordVerification> {
    const [updatedVerification] = await db
      .update(landlordVerifications)
      .set(verification)
      .where(eq(landlordVerifications.id, id))
      .returning();
    return updatedVerification;
  }

  // Dashboard statistics
  async getUserStats(userId: string): Promise<{
    paymentStreak: number;
    totalPaid: number;
    onTimePercentage: number;
    nextPaymentDue: string | null;
  }> {
    // Get all payments for the user
    const payments = await db
      .select()
      .from(rentPayments)
      .where(eq(rentPayments.userId, userId))
      .orderBy(desc(rentPayments.dueDate));

    // Calculate total paid
    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Calculate on-time percentage
    const paidPayments = payments.filter(p => p.status === 'paid');
    const onTimePayments = paidPayments.filter(p => 
      p.paidDate && p.paidDate <= p.dueDate
    );
    const onTimePercentage = paidPayments.length > 0 
      ? (onTimePayments.length / paidPayments.length) * 100 
      : 0;

    // Calculate payment streak (consecutive on-time payments)
    let paymentStreak = 0;
    for (const payment of payments) {
      if (payment.status === 'paid' && payment.paidDate && payment.paidDate <= payment.dueDate) {
        paymentStreak++;
      } else if (payment.status === 'paid' || payment.status === 'late') {
        break;
      }
    }

    // Find next payment due
    const nextPayment = payments.find(p => p.status === 'pending');
    const nextPaymentDue = nextPayment ? nextPayment.dueDate : null;

    return {
      paymentStreak,
      totalPaid,
      onTimePercentage,
      nextPaymentDue,
    };
  }
}

export const storage = new DatabaseStorage();
