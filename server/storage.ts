import {
  users,
  properties,
  rentPayments,
  bankConnections,
  creditReports,
  reportShares,
  landlordVerifications,
  notifications,
  userPreferences,
  securityLogs,
  adminUsers,
  dataExportRequests,
  userBadges,
  certificationPortfolios,
  achievementBadges,
  manualPayments,
  paymentStreaks,
  enhancedReportShares,
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
  type Notification,
  type InsertNotification,
  type UserPreferences,
  type InsertUserPreferences,
  type SecurityLog,
  type InsertSecurityLog,
  type AdminUser,
  type InsertAdminUser,
  type DataExportRequest,
  type InsertDataExportRequest,
  type UserBadge,
  type InsertUserBadge,
  type CertificationPortfolio,
  type InsertCertificationPortfolio,
  type AchievementBadge,
  type InsertAchievementBadge,
  type ManualPayment,
  type InsertManualPayment,
  type PaymentStreak,
  type InsertPaymentStreak,
  type EnhancedReportShare,
  type InsertEnhancedReportShare,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, or, isNull, gte, lte } from "drizzle-orm";

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
    creditScore: number;
    onTimeScore: number;
    verificationScore: number;
    rentToIncomeScore: number;
  }>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  deleteNotification(notificationId: number): Promise<void>;

  // User preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;

  // Security log operations
  createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog>;
  getUserSecurityLogs(userId: string): Promise<SecurityLog[]>;

  // Admin operations
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  getAdminUser(userId: string): Promise<AdminUser | undefined>;
  updateAdminUser(userId: string, updates: Partial<InsertAdminUser>): Promise<AdminUser>;
  deleteAdminUser(userId: string): Promise<void>;

  // Data export operations
  createDataExportRequest(request: InsertDataExportRequest): Promise<DataExportRequest>;
  getUserDataExportRequests(userId: string): Promise<DataExportRequest[]>;
  updateDataExportRequest(id: number, updates: Partial<InsertDataExportRequest>): Promise<DataExportRequest>;

  // Badge operations
  createUserBadge(badge: InsertUserBadge): Promise<UserBadge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  updateUserBadge(id: number, badge: Partial<InsertUserBadge>): Promise<UserBadge>;

  // Certification portfolio operations
  createCertificationPortfolio(portfolio: InsertCertificationPortfolio): Promise<CertificationPortfolio>;
  getUserCertificationPortfolios(userId: string): Promise<CertificationPortfolio[]>;
  getCertificationPortfolioByToken(shareToken: string): Promise<CertificationPortfolio | undefined>;
  deleteCertificationPortfolio(id: number, userId: string): Promise<void>;

  // Payment helper operations
  getUserPayments(userId: string): Promise<RentPayment[]>;

  // Admin dashboard operations
  getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalPayments: number;
    totalReports: number;
    recentUsers: User[];
    recentPayments: RentPayment[];
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

  async updateUserAddress(userId: string, address: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        address: address,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRentInfo(userId: string, rentInfo: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        rentInfo: rentInfo,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
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
    creditScore: number;
    onTimeScore: number;
    verificationScore: number;
    rentToIncomeScore: number;
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

    // Calculate Credit Score (0-1000 scale)
    // Algorithm: 60% on-time payments, 20% verification, 20% rent-to-income ratio
    
    // 1. On-time payment score (600 points max)
    const onTimeScore = (onTimePercentage / 100) * 600;
    
    // 2. Verification frequency score (200 points max)
    const verifiedPayments = paidPayments.filter(p => p.isVerified);
    const verificationRate = paidPayments.length > 0 
      ? (verifiedPayments.length / paidPayments.length) 
      : 0;
    const verificationScore = verificationRate * 200;
    
    // 3. Rent-to-income ratio score (200 points max)
    // For MVP: Use payment consistency and streak as proxy for financial stability
    // In production, this would use actual income data
    const consistencyFactor = paidPayments.length > 0 
      ? Math.min(paidPayments.length / 12, 1) // Reward up to 12 months of history
      : 0;
    const streakBonus = Math.min(paymentStreak / 12, 0.5); // Up to 50% bonus for good streak
    const rentToIncomeScore = (consistencyFactor * 0.5 + streakBonus) * 200;
    
    // Calculate total credit score
    const creditScore = Math.round(onTimeScore + verificationScore + rentToIncomeScore);

    return {
      paymentStreak,
      totalPaid,
      onTimePercentage,
      nextPaymentDue,
      creditScore,
      onTimeScore: Math.round(onTimeScore),
      verificationScore: Math.round(verificationScore),
      rentToIncomeScore: Math.round(rentToIncomeScore),
    };
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async deleteNotification(notificationId: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  // Subscription operations
  async updateUserSubscription(userId: string, data: { subscriptionPlan: string, subscriptionStatus: string, subscriptionEndDate?: Date | null }): Promise<void> {
    await db.update(users)
      .set({
        subscriptionPlan: data.subscriptionPlan,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionEndDate: data.subscriptionEndDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [upsertedPreferences] = await db
      .insert(userPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedPreferences;
  }

  // Security log operations
  async createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog> {
    const [newLog] = await db
      .insert(securityLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getUserSecurityLogs(userId: string): Promise<SecurityLog[]> {
    return await db
      .select()
      .from(securityLogs)
      .where(eq(securityLogs.userId, userId))
      .orderBy(desc(securityLogs.createdAt));
  }

  // Admin operations
  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    const [newAdminUser] = await db
      .insert(adminUsers)
      .values(adminUser)
      .returning();
    return newAdminUser;
  }

  async getAdminUser(userId: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(and(eq(adminUsers.userId, userId), eq(adminUsers.isActive, true)));
    return adminUser;
  }

  async updateAdminUser(userId: string, updates: Partial<InsertAdminUser>): Promise<AdminUser> {
    const [updatedAdminUser] = await db
      .update(adminUsers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminUsers.userId, userId))
      .returning();
    return updatedAdminUser;
  }

  async deleteAdminUser(userId: string): Promise<void> {
    await db
      .update(adminUsers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(adminUsers.userId, userId));
  }

  // Data export operations
  async createDataExportRequest(request: InsertDataExportRequest): Promise<DataExportRequest> {
    const [newRequest] = await db
      .insert(dataExportRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async getUserDataExportRequests(userId: string): Promise<DataExportRequest[]> {
    return await db
      .select()
      .from(dataExportRequests)
      .where(eq(dataExportRequests.userId, userId))
      .orderBy(desc(dataExportRequests.createdAt));
  }

  async updateDataExportRequest(id: number, updates: Partial<InsertDataExportRequest>): Promise<DataExportRequest> {
    const [updatedRequest] = await db
      .update(dataExportRequests)
      .set(updates)
      .where(eq(dataExportRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Admin dashboard operations
  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalPayments: number;
    totalReports: number;
    freeUsers: number;
    standardUsers: number;
    premiumUsers: number;
    monthlyRevenue: number;
    recentUsers: User[];
    recentPayments: RentPayment[];
  }> {
    const [userStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const [activeUserStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isOnboarded, true));

    const [paymentStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rentPayments);

    const [reportStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(creditReports);

    const [freeUserStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(or(eq(users.subscriptionPlan, 'free'), isNull(users.subscriptionPlan)));

    const [standardUserStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionPlan, 'standard'));

    const [premiumUserStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionPlan, 'premium'));

    const standardUsers = standardUserStats?.count || 0;
    const premiumUsers = premiumUserStats?.count || 0;
    const monthlyRevenue = (standardUsers * 9.99) + (premiumUsers * 19.99);

    const recentUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);

    const recentPayments = await db
      .select()
      .from(rentPayments)
      .orderBy(desc(rentPayments.createdAt))
      .limit(10);

    return {
      totalUsers: userStats?.count || 0,
      activeUsers: activeUserStats?.count || 0,
      totalPayments: paymentStats?.count || 0,
      totalReports: reportStats?.count || 0,
      freeUsers: freeUserStats?.count || 0,
      standardUsers,
      premiumUsers,
      monthlyRevenue,
      recentUsers,
      recentPayments,
    };
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }
  // Badge operations
  async createUserBadge(badge: InsertUserBadge): Promise<UserBadge> {
    const [created] = await db.insert(userBadges).values(badge).returning();
    return created;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }

  async updateUserBadge(id: number, badge: Partial<InsertUserBadge>): Promise<UserBadge> {
    const [updated] = await db
      .update(userBadges)
      .set(badge)
      .where(eq(userBadges.id, id))
      .returning();
    return updated;
  }

  // Certification portfolio operations
  async createCertificationPortfolio(portfolio: InsertCertificationPortfolio): Promise<CertificationPortfolio> {
    const [created] = await db.insert(certificationPortfolios).values(portfolio).returning();
    return created;
  }

  async getUserCertificationPortfolios(userId: string): Promise<CertificationPortfolio[]> {
    return await db
      .select()
      .from(certificationPortfolios)
      .where(eq(certificationPortfolios.userId, userId))
      .orderBy(desc(certificationPortfolios.createdAt));
  }

  async getCertificationPortfolioByToken(shareToken: string): Promise<CertificationPortfolio | undefined> {
    const [portfolio] = await db
      .select()
      .from(certificationPortfolios)
      .where(eq(certificationPortfolios.shareToken, shareToken));
    return portfolio;
  }

  async deleteCertificationPortfolio(id: number, userId: string): Promise<void> {
    await db
      .delete(certificationPortfolios)
      .where(
        and(
          eq(certificationPortfolios.id, id),
          eq(certificationPortfolios.userId, userId)
        )
      );
  }

  // Payment helper operations
  async getUserPayments(userId: string): Promise<RentPayment[]> {
    return await db
      .select()
      .from(rentPayments)
      .where(eq(rentPayments.userId, userId))
      .orderBy(desc(rentPayments.dueDate));
  }
  // Manual payment operations
  async createManualPayment(payment: InsertManualPayment): Promise<ManualPayment> {
    const [newPayment] = await db
      .insert(manualPayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getUserManualPayments(userId: string): Promise<ManualPayment[]> {
    return await db
      .select()
      .from(manualPayments)
      .where(eq(manualPayments.userId, userId))
      .orderBy(desc(manualPayments.paymentDate));
  }

  async updateManualPayment(id: number, updates: Partial<InsertManualPayment>): Promise<ManualPayment> {
    const [updatedPayment] = await db
      .update(manualPayments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(manualPayments.id, id))
      .returning();
    return updatedPayment;
  }

  async deleteManualPayment(id: number): Promise<void> {
    await db.delete(manualPayments).where(eq(manualPayments.id, id));
  }

  // Achievement badge operations
  async createAchievementBadge(badge: InsertAchievementBadge): Promise<AchievementBadge> {
    const [newBadge] = await db
      .insert(achievementBadges)
      .values(badge)
      .returning();
    return newBadge;
  }

  async getUserAchievementBadges(userId: string): Promise<AchievementBadge[]> {
    return await db
      .select()
      .from(achievementBadges)
      .where(eq(achievementBadges.userId, userId))
      .orderBy(desc(achievementBadges.earnedAt));
  }

  // Payment streak operations
  async getUserPaymentStreak(userId: string): Promise<PaymentStreak | undefined> {
    const [streak] = await db
      .select()
      .from(paymentStreaks)
      .where(eq(paymentStreaks.userId, userId));
    return streak;
  }

  async updatePaymentStreak(userId: string, streakData: Partial<InsertPaymentStreak>): Promise<PaymentStreak> {
    const existingStreak = await this.getUserPaymentStreak(userId);
    
    if (existingStreak) {
      const [updatedStreak] = await db
        .update(paymentStreaks)
        .set({ ...streakData, lastUpdateAt: new Date() })
        .where(eq(paymentStreaks.userId, userId))
        .returning();
      return updatedStreak;
    } else {
      const [newStreak] = await db
        .insert(paymentStreaks)
        .values({ 
          userId, 
          ...streakData,
          lastUpdateAt: new Date()
        })
        .returning();
      return newStreak;
    }
  }

  // Enhanced report share operations
  async createEnhancedReportShare(share: InsertEnhancedReportShare): Promise<EnhancedReportShare> {
    const [newShare] = await db
      .insert(enhancedReportShares)
      .values(share)
      .returning();
    return newShare;
  }

  async getEnhancedReportShareByToken(token: string): Promise<EnhancedReportShare | undefined> {
    const [share] = await db
      .select()
      .from(enhancedReportShares)
      .where(eq(enhancedReportShares.shareToken, token));
    return share;
  }

  async getUserEnhancedReportShares(userId: string): Promise<EnhancedReportShare[]> {
    return await db
      .select()
      .from(enhancedReportShares)
      .where(eq(enhancedReportShares.userId, userId))
      .orderBy(desc(enhancedReportShares.createdAt));
  }

  async incrementEnhancedShareAccess(shareId: number): Promise<void> {
    await db
      .update(enhancedReportShares)
      .set({ 
        accessCount: sql`${enhancedReportShares.accessCount} + 1`,
        lastAccessedAt: new Date()
      })
      .where(eq(enhancedReportShares.id, shareId));
  }

  // Badge calculation helper method
  async calculateAndAwardBadges(userId: string): Promise<AchievementBadge[]> {
    const newBadges: AchievementBadge[] = [];
    
    // Get user's payment history
    const payments = await this.getUserRentPayments(userId);
    const manualPayments = await this.getUserManualPayments(userId);
    const allPayments = [...payments, ...manualPayments.map(mp => ({
      ...mp,
      status: 'paid' as const,
      dueDate: mp.paymentDate,
      paidDate: mp.paymentDate
    }))];
    
    const paidPayments = allPayments.filter(p => p.status === 'paid');
    const existingBadges = await this.getUserAchievementBadges(userId);
    const existingBadgeTypes = existingBadges.map(b => b.badgeType);

    // First payment badge
    if (paidPayments.length >= 1 && !existingBadgeTypes.includes('first_payment')) {
      const badge = await this.createAchievementBadge({
        userId,
        badgeType: 'first_payment',
        title: 'First Payment',
        description: 'Made your first rent payment',
        iconName: 'Trophy'
      });
      newBadges.push(badge);
    }

    // Streak badges
    const currentStreak = await this.calculateCurrentStreak(userId);
    
    const streakBadges = [
      { type: 'streak_3', months: 3, title: '3-Month Streak', description: '3 consecutive on-time payments' },
      { type: 'streak_6', months: 6, title: '6-Month Streak', description: '6 consecutive on-time payments' },
      { type: 'streak_12', months: 12, title: '1-Year Streak', description: '12 consecutive on-time payments' }
    ];

    for (const streakInfo of streakBadges) {
      if (currentStreak >= streakInfo.months && !existingBadgeTypes.includes(streakInfo.type as any)) {
        const badge = await this.createAchievementBadge({
          userId,
          badgeType: streakInfo.type as any,
          title: streakInfo.title,
          description: streakInfo.description,
          iconName: 'Award'
        });
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  // Helper method to calculate current payment streak
  async calculateCurrentStreak(userId: string): Promise<number> {
    const payments = await this.getUserRentPayments(userId);
    const manualPayments = await this.getUserManualPayments(userId);
    
    // Combine and sort all payments by date
    const allPayments = [...payments, ...manualPayments.map(mp => ({
      ...mp,
      status: 'paid' as const,
      dueDate: mp.paymentDate,
      paidDate: mp.paymentDate
    }))].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    let streak = 0;
    for (const payment of allPayments) {
      if (payment.status === 'paid' && payment.paidDate) {
        const paidDate = new Date(payment.paidDate);
        const dueDate = new Date(payment.dueDate);
        if (paidDate <= dueDate) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return streak;
  }
}

export const storage = new DatabaseStorage();
