import {
  users,
  properties,
  rentPayments,
  bankConnections,
  creditReports,
  reportShares,
  landlordVerifications,
  tenantInvitations,
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
  type TenantInvitation,
  type InsertTenantInvitation,
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
  moderationItems,
  type ModerationItem,
  type InsertModerationItem,
  systemSettings,
  type SystemSetting,
  type InsertSystemSetting,
  disputes,
  type Dispute,
  type InsertDispute,
  rentLogs,
  type RentLog,
  type InsertRentLog,
  landlordTenantLinks,
  type LandlordTenantLink,
  type InsertLandlordTenantLink,
  adminActions,
  type AdminAction,
  type InsertAdminAction,
  pendingLandlords,
  type PendingLandlord,
  type InsertPendingLandlord,
  maintenanceRequests,
  type MaintenanceRequest,
  type InsertMaintenanceRequest,
  auditLogs,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import type { DashboardStats } from "@shared/dashboard";
import { computeDashboardStats } from "./dashboardStats";
import { db } from "./db";
import { eq, and, desc, asc, sql, or, isNull, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersWithPreferences(): Promise<User[]>;

  // Property operations
  createProperty(property: InsertProperty): Promise<Property>;
  getUserProperties(userId: string): Promise<Property[]>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property>;
  deleteProperty(id: number): Promise<void>;

  // Rent payment operations
  createRentPayment(payment: InsertRentPayment): Promise<RentPayment>;
  getManualPaymentById(id: number): Promise<ManualPayment | undefined>;
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

  // Tenant invitation operations
  createTenantInvitation(invitation: InsertTenantInvitation): Promise<TenantInvitation>;
  getTenantInvitation(token: string): Promise<TenantInvitation | undefined>;
  getLandlordInvitations(landlordId: string): Promise<TenantInvitation[]>;
  acceptTenantInvitation(id: number, tenantId: string): Promise<TenantInvitation>;
  expireInvitation(id: number): Promise<void>;

  // Landlord operations
  getPropertyById(id: number): Promise<Property | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getLandlordTenants(landlordId: string): Promise<Array<{ tenant: User; property: Property; payments: RentPayment[] }>>;
  getLandlordVerifications(landlordId: string): Promise<RentPayment[]>;
  getLandlordPendingRequests(landlordId: string): Promise<Array<{ type: string; id: number; tenant: User; property: Property; data: any }>>;

  // Dashboard statistics
  getUserStats(userId: string): Promise<DashboardStats>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  deleteNotification(notificationId: number): Promise<void>;

  // User preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;

  // Security & Audit
  createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog>;
  getSecurityLogs(filters?: { userId?: string; limit?: number }): Promise<SecurityLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

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

  // Admin bulk operations
  getAllUsers(): Promise<User[]>;
  getAllProperties(): Promise<Property[]>;
  getAllPayments(): Promise<RentPayment[]>;

  // Moderation operations
  getModerationItems(filters?: {
    status?: string;
    type?: string;
    priority?: string;
  }): Promise<ModerationItem[]>;
  updateModerationItem(id: number, updates: Partial<ModerationItem>): Promise<ModerationItem>;

  // System settings operations
  getSystemSettings(): Promise<Record<string, any>>;
  updateSystemSettings(settings: Record<string, any>, updatedBy: string): Promise<void>;
  getSystemSetting(key: string): Promise<any>;

  // Rent log operations
  createRentLog(log: InsertRentLog): Promise<RentLog>;
  getUserRentLogs(userId: string): Promise<RentLog[]>;
  getRentLog(id: number): Promise<RentLog | undefined>;
  updateRentLog(id: number, updates: Partial<InsertRentLog>): Promise<RentLog>;
  deleteRentLog(id: number): Promise<void>;
  getUnverifiedRentLogs(landlordId?: string): Promise<RentLog[]>;

  // Landlord-tenant link operations
  createLandlordTenantLink(link: InsertLandlordTenantLink): Promise<LandlordTenantLink>;
  getLandlordTenantLinks(landlordId: string): Promise<LandlordTenantLink[]>;
  getTenantLandlordLinks(tenantId: string): Promise<LandlordTenantLink[]>;

  // Admin action operations
  createAdminAction(action: InsertAdminAction): Promise<AdminAction>;
  getAdminActions(adminId?: string): Promise<AdminAction[]>;

  // Pending landlord operations
  createPendingLandlord(pending: InsertPendingLandlord): Promise<PendingLandlord>;
  getPendingLandlord(email: string): Promise<PendingLandlord | undefined>;
  updatePendingLandlordStatus(email: string, status: string): Promise<void>;

  // Disputes operations
  getDisputes(filters?: {
    status?: string;
    type?: string;
    priority?: string;
  }): Promise<Dispute[]>;
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  updateDispute(id: number, updates: Partial<Dispute>): Promise<Dispute>;

  getSecurityLogs(filters: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: string;
    limit?: number;
  }): Promise<SecurityLog[]>;

  // Maintenance request operations
  createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  getMaintenanceRequests(filters?: {
    tenantId?: string;
    propertyId?: number;
    status?: string;
    landlordId?: string;
  }): Promise<MaintenanceRequest[]>;
  updateMaintenanceRequest(id: number, updates: Partial<MaintenanceRequest>): Promise<MaintenanceRequest>;

  // Security & Audit
  createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog>;
  getSecurityLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<SecurityLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
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

  // Tenant invitation operations
  async createTenantInvitation(invitation: InsertTenantInvitation): Promise<TenantInvitation> {
    const [newInvitation] = await db.insert(tenantInvitations).values(invitation).returning();
    return newInvitation;
  }

  async getTenantInvitation(token: string): Promise<TenantInvitation | undefined> {
    const [invitation] = await db.select().from(tenantInvitations).where(eq(tenantInvitations.inviteToken, token)).limit(1);
    return invitation;
  }

  async getLandlordInvitations(landlordId: string): Promise<TenantInvitation[]> {
    return db.select().from(tenantInvitations).where(eq(tenantInvitations.landlordId, landlordId)).orderBy(desc(tenantInvitations.createdAt));
  }

  async acceptTenantInvitation(id: number, tenantId: string): Promise<TenantInvitation> {
    const [updated] = await db.update(tenantInvitations).set({ status: 'accepted', tenantId, acceptedAt: sql`NOW()`, updatedAt: sql`NOW()` }).where(eq(tenantInvitations.id, id)).returning();
    return updated;
  }

  async expireInvitation(id: number): Promise<void> {
    await db.update(tenantInvitations).set({ status: 'expired', updatedAt: sql`NOW()` }).where(eq(tenantInvitations.id, id));
  }

  // Landlord operations
  async getPropertyById(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    return property;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getLandlordTenants(landlordId: string): Promise<Array<{ tenant: User; property: Property; payments: RentPayment[] }>> {
    const landlordProperties = await db.select().from(properties).where(eq(properties.userId, landlordId));
    const results = [];
    for (const property of landlordProperties) {
      const payments = await db.select().from(rentPayments).where(eq(rentPayments.propertyId, property.id)).orderBy(desc(rentPayments.createdAt));
      if (payments.length > 0) {
        const tenant = await this.getUser(payments[0].userId);
        if (tenant) results.push({ tenant, property, payments });
      }
    }
    return results;
  }

  async getLandlordVerifications(landlordId: string): Promise<RentPayment[]> {
    const landlordProperties = await db.select().from(properties).where(eq(properties.userId, landlordId));
    const propertyIds = landlordProperties.map(p => p.id);
    if (propertyIds.length === 0) return [];
    return db.select().from(rentPayments).where(sql`${rentPayments.propertyId} = ANY(ARRAY[${sql.join(propertyIds.map(id => sql`${id}`), sql`, `)}])`).orderBy(desc(rentPayments.createdAt));
  }

  async getLandlordPendingRequests(landlordId: string): Promise<Array<{ type: string; id: number; tenant: User; property: Property; data: any }>> {
    const pendingPayments = await this.getLandlordVerifications(landlordId);
    const results = [];
    for (const payment of pendingPayments.filter(p => p.status === 'pending')) {
      const tenant = await this.getUser(payment.userId);
      const property = await this.getPropertyById(payment.propertyId);
      if (tenant && property) results.push({ type: 'payment_verification', id: payment.id, tenant, property, data: payment });
    }
    return results;
  }

  // Dashboard statistics
  async getUserStats(userId: string): Promise<DashboardStats> {
    const payments = await db
      .select()
      .from(rentPayments)
      .where(eq(rentPayments.userId, userId))
      .orderBy(desc(rentPayments.dueDate));

    const manualPaymentsData = await this.getUserManualPayments(userId);

    // Combine manual payments with rent payments for stats calculation
    const allPayments = [
      ...payments,
      ...manualPaymentsData.map(mp => ({
        id: mp.id,
        userId: mp.userId,
        propertyId: mp.propertyId,
        amount: mp.amount,
        dueDate: mp.paymentDate,
        paidDate: mp.paymentDate,
        status: mp.needsVerification ? 'pending' as const : 'paid' as const,
        paymentMethod: mp.paymentMethod || 'manual',
        transactionId: null,
        isVerified: !mp.needsVerification,
        createdAt: mp.createdAt,
        updatedAt: mp.updatedAt,
      }))
    ];

    // Delegate number crunching to the shared helper so tests can target the math directly.
    return computeDashboardStats(allPayments);
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

  // Get all properties (admin only)
  async getAllProperties(): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .orderBy(desc(properties.createdAt));
  }

  // Get all payments (admin only)
  async getAllPayments(): Promise<RentPayment[]> {
    return await db
      .select()
      .from(rentPayments)
      .orderBy(desc(rentPayments.createdAt));
  }

  // Get security logs with filtering (admin only)
  async getSecurityLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<SecurityLog[]> {
    let query = db.select().from(securityLogs);
    const conditions: any[] = [];

    if (filters?.userId) {
      conditions.push(eq(securityLogs.userId, filters.userId));
    }

    if (filters?.action) {
      conditions.push(eq(securityLogs.action, filters.action));
    }

    if (filters?.startDate) {
      conditions.push(gte(securityLogs.createdAt, new Date(filters.startDate)));
    }

    if (filters?.endDate) {
      conditions.push(lte(securityLogs.createdAt, new Date(filters.endDate)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query
      .orderBy(desc(securityLogs.createdAt))
      .limit(filters?.limit || 50);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  // Maintenance request operations
  async createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const [newRequest] = await db
      .insert(maintenanceRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async getMaintenanceRequests(filters?: {
    tenantId?: string;
    propertyId?: number;
    status?: string;
    landlordId?: string;
  }): Promise<MaintenanceRequest[]> {
    const conditions = [];

    if (filters?.tenantId) conditions.push(eq(maintenanceRequests.tenantId, filters.tenantId));
    if (filters?.propertyId) conditions.push(eq(maintenanceRequests.propertyId, filters.propertyId));
    if (filters?.status) conditions.push(eq(maintenanceRequests.status, filters.status as any));

    // If landlordId is provided, we need to find properties owned by this landlord
    if (filters?.landlordId) {
      const landlordProperties = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.userId, filters.landlordId));

      const propertyIds = landlordProperties.map(p => p.id);
      if (propertyIds.length > 0) {
        conditions.push(sql`${maintenanceRequests.propertyId} IN ${propertyIds}`);
      } else {
        return []; // Landlord has no properties, so no requests
      }
    }

    return await db
      .select()
      .from(maintenanceRequests)
      .where(and(...conditions))
      .orderBy(desc(maintenanceRequests.createdAt));
  }

  async updateMaintenanceRequest(id: number, updates: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const [updatedRequest] = await db
      .update(maintenanceRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(maintenanceRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async getUsersWithPreferences(): Promise<User[]> {
    return await db.query.users.findMany({
      with: {
        preferences: true
      }
    });
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

  async getManualPaymentById(id: number): Promise<ManualPayment | undefined> {
    const [payment] = await db
      .select()
      .from(manualPayments)
      .where(eq(manualPayments.id, id));
    return payment;
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

  // Moderation operations
  async getModerationItems(filters?: {
    status?: string;
    type?: string;
    priority?: string;
  }): Promise<ModerationItem[]> {
    let query = db.select().from(moderationItems);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(moderationItems.status, filters.status as "pending" | "reviewing" | "resolved" | "dismissed"));
    }
    if (filters?.type) {
      conditions.push(eq(moderationItems.type, filters.type as "user_report" | "content_violation" | "payment_dispute" | "spam"));
    }
    if (filters?.priority) {
      conditions.push(eq(moderationItems.priority, filters.priority as "low" | "medium" | "high" | "urgent"));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(moderationItems.createdAt));
  }

  async updateModerationItem(id: number, updates: Partial<ModerationItem>): Promise<ModerationItem> {
    const [updated] = await db
      .update(moderationItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(moderationItems.id, id))
      .returning();
    return updated;
  }

  // System settings operations
  /**
   * Retrieves all system settings as a key-value object
   * @returns Promise resolving to a record of setting keys and their values
   */
  async getSystemSettings(): Promise<Record<string, any>> {
    const settings = await db.select().from(systemSettings);
    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * Gets a single system setting by key
   * @param key - The setting key to retrieve
   * @returns Promise resolving to the setting value or undefined
   */
  async getSystemSetting(key: string): Promise<any> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return setting?.value;
  }

  /**
   * Updates multiple system settings atomically
   * @param settings - Object with key-value pairs of settings to update
   * @param updatedBy - User ID of the admin making the update
   */
  async updateSystemSettings(settings: Record<string, any>, updatedBy: string): Promise<void> {
    // Update each setting individually (upsert pattern)
    for (const [key, value] of Object.entries(settings)) {
      await db
        .insert(systemSettings)
        .values({
          key,
          value,
          updatedBy,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value,
            updatedBy,
            updatedAt: new Date(),
          },
        });
    }
  }

  // Disputes operations
  /**
   * Retrieves disputes with optional filtering
   * @param filters - Optional filters for status, type, and priority
   * @returns Promise resolving to array of disputes
   */
  async getDisputes(filters?: {
    status?: string;
    type?: string;
    priority?: string;
  }): Promise<Dispute[]> {
    let query = db.select().from(disputes);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(disputes.status, filters.status as "open" | "in_progress" | "resolved" | "closed"));
    }
    if (filters?.type) {
      conditions.push(eq(disputes.type, filters.type as "payment" | "verification" | "property" | "other"));
    }
    if (filters?.priority) {
      conditions.push(eq(disputes.priority, filters.priority as "low" | "medium" | "high" | "urgent"));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(disputes.createdAt));
  }

  /**
   * Creates a new dispute record
   * @param dispute - Dispute data to insert
   * @returns Promise resolving to the created dispute
   */
  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    const [created] = await db
      .insert(disputes)
      .values(dispute)
      .returning();
    return created;
  }

  /**
   * Updates an existing dispute
   * @param id - Dispute ID to update
   * @param updates - Partial dispute data to update
   * @returns Promise resolving to the updated dispute
   */
  async updateDispute(id: number, updates: Partial<Dispute>): Promise<Dispute> {
    const [updated] = await db
      .update(disputes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(disputes.id, id))
      .returning();
    return updated;
  }

  // Rent log operations
  async createRentLog(log: InsertRentLog): Promise<RentLog> {
    const [created] = await db.insert(rentLogs).values(log).returning();
    return created;
  }

  async getUserRentLogs(userId: string): Promise<RentLog[]> {
    return await db.select().from(rentLogs).where(eq(rentLogs.userId, userId)).orderBy(desc(rentLogs.submittedAt));
  }

  async getRentLog(id: number): Promise<RentLog | undefined> {
    const [log] = await db.select().from(rentLogs).where(eq(rentLogs.id, id));
    return log;
  }

  async updateRentLog(id: number, updates: Partial<InsertRentLog>): Promise<RentLog> {
    const [updated] = await db.update(rentLogs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rentLogs.id, id))
      .returning();
    return updated;
  }

  async deleteRentLog(id: number): Promise<void> {
    await db.delete(rentLogs).where(eq(rentLogs.id, id));
  }

  async getUnverifiedRentLogs(landlordId?: string): Promise<RentLog[]> {
    if (landlordId) {
      return await db.select().from(rentLogs)
        .where(and(eq(rentLogs.verified, false), eq(rentLogs.landlordId, landlordId)))
        .orderBy(desc(rentLogs.submittedAt));
    }
    return await db.select().from(rentLogs)
      .where(eq(rentLogs.verified, false))
      .orderBy(desc(rentLogs.submittedAt));
  }

  // Landlord-tenant link operations
  async createLandlordTenantLink(link: InsertLandlordTenantLink): Promise<LandlordTenantLink> {
    const [created] = await db.insert(landlordTenantLinks).values(link).returning();
    return created;
  }

  async getLandlordTenantLinks(landlordId: string): Promise<LandlordTenantLink[]> {
    return await db.select().from(landlordTenantLinks)
      .where(eq(landlordTenantLinks.landlordId, landlordId))
      .orderBy(desc(landlordTenantLinks.linkedAt));
  }

  async getTenantLandlordLinks(tenantId: string): Promise<LandlordTenantLink[]> {
    return await db.select().from(landlordTenantLinks)
      .where(eq(landlordTenantLinks.tenantId, tenantId))
      .orderBy(desc(landlordTenantLinks.linkedAt));
  }

  // Admin action operations
  async createAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    const [created] = await db.insert(adminActions).values(action).returning();
    return created;
  }

  async getAdminActions(adminId?: string): Promise<AdminAction[]> {
    if (adminId) {
      return await db.select().from(adminActions)
        .where(eq(adminActions.adminId, adminId))
        .orderBy(desc(adminActions.createdAt));
    }
    return await db.select().from(adminActions).orderBy(desc(adminActions.createdAt));
  }

  // Pending landlord operations
  async createPendingLandlord(pending: InsertPendingLandlord): Promise<PendingLandlord> {
    const [created] = await db.insert(pendingLandlords).values(pending).returning();
    return created;
  }

  async getPendingLandlord(email: string): Promise<PendingLandlord | undefined> {
    const [pending] = await db.select().from(pendingLandlords).where(eq(pendingLandlords.email, email));
    return pending;
  }

  async updatePendingLandlordStatus(email: string, status: string): Promise<void> {
    await db.update(pendingLandlords)
      .set({ status: status as any, registeredAt: status === 'registered' ? new Date() : undefined })
      .where(eq(pendingLandlords.email, email));
  }
}

export const storage = new DatabaseStorage();
