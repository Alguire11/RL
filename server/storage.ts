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
  passwordResetTokens,
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
  landlordReviews,
  type LandlordReview,
  type InsertLandlordReview,
  supportTickets,
  type SupportTicket,
  type InsertSupportTicket,
  apiKeys,
  type ApiKey,
  type InsertApiKey,
  auditLogs,
  type AuditLog,
  type InsertAuditLog,
  emailVerificationTokens,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  emailEvents,
  type EmailEvent,
  type InsertEmailEvent,
  rentScoreHistory,
  type RentScoreHistory,
  type InsertRentScoreHistory,
  experianAuditLogs,
  type ExperianAuditLog,
  type InsertExperianAuditLog,
  consents,
  type Consent,
  type InsertConsent,
  reportingBatches,
  type ReportingBatch,
  type InsertReportingBatch,
  reportingRecords,
  type ReportingRecord,
  type InsertReportingRecord,
  tenancies,
  type Tenancy,
  type InsertTenancy,
  tenancyTenants,
  type TenancyTenant,
  type InsertTenancyTenant,
  tenantProfiles,
  type TenantProfile,
  type InsertTenantProfile,
} from "@shared/schema";
import type { DashboardStats } from "@shared/dashboard";
import { computeDashboardStats } from "./dashboardStats";
import { db, pool } from "./db";
import { and, eq, desc, or, isNull, isNotNull, gte, lt, sql, asc, lte, inArray } from "drizzle-orm";


export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  createUserWithRLID(user: UpsertUser, rolePrefix: 'TRLID-' | 'LRLID-'): Promise<User>;
  getUsersWithPreferences(): Promise<User[]>;
  getUsersBySubscriptionStatus(statuses: string[]): Promise<User[]>;

  // Property operations
  createProperty(property: InsertProperty): Promise<Property>;
  getUserProperties(userId: string): Promise<Property[]>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property>;
  deleteProperty(id: number): Promise<void>;

  // Tenancy operations
  getTenancy(id: string): Promise<Tenancy | undefined>;
  createTenancy(tenancy: InsertTenancy): Promise<Tenancy>;
  updateTenancy(id: string, updates: Partial<InsertTenancy>): Promise<Tenancy>;
  getUserTenancies(userId: string): Promise<Tenancy[]>;
  createTenancyTenant(record: InsertTenancyTenant): Promise<TenancyTenant>;
  updateTenancyTenant(tenancyId: string, tenantId: string, updates: Partial<InsertTenancyTenant>): Promise<TenancyTenant>;

  // Rent payment operations
  createRentPayment(payment: InsertRentPayment): Promise<RentPayment>;
  getRentPayment(id: number): Promise<RentPayment | undefined>;
  getManualPaymentById(id: number): Promise<ManualPayment | undefined>;
  getManualPaymentByToken(token: string): Promise<ManualPayment | undefined>;
  getUserRentPayments(userId: string): Promise<RentPayment[]>;
  getPropertyRentPayments(propertyId: number): Promise<RentPayment[]>;
  updateRentPayment(id: number, payment: Partial<InsertRentPayment>): Promise<RentPayment>;
  deleteRentPayment(id: number): Promise<void>;
  getAllManualPayments(): Promise<ManualPayment[]>;

  // Bank connection operations
  createBankConnection(connection: InsertBankConnection): Promise<BankConnection>;
  getBankConnection(id: number): Promise<BankConnection | undefined>;
  getUserBankConnections(userId: string): Promise<BankConnection[]>;
  updateBankConnection(id: number, connection: Partial<InsertBankConnection>): Promise<BankConnection>;
  deleteBankConnection(id: number): Promise<void>;

  // Credit report operations
  createCreditReport(report: InsertCreditReport): Promise<CreditReport>;
  getUserCreditReports(userId: string): Promise<CreditReport[]>;
  getAllCreditReports(): Promise<CreditReport[]>;
  getUserCreditReportsByMonth(userId: string, month: string): Promise<CreditReport[]>;
  getCreditReportByReportId(reportId: string): Promise<CreditReport | undefined>;
  updateCreditReport(id: number, report: Partial<InsertCreditReport>): Promise<CreditReport>;

  // Report share operations
  createReportShare(share: InsertReportShare): Promise<ReportShare>;
  getReportShares(reportId: number): Promise<ReportShare[]>;
  getUserReportShares(userId: string): Promise<ReportShare[]>;
  getReportShareByUrl(url: string): Promise<ReportShare | undefined>;
  incrementShareAccess(shareId: number): Promise<void>;

  // Landlord verification operations
  createLandlordVerification(verification: InsertLandlordVerification): Promise<LandlordVerification>;
  getLandlordVerification(token: string): Promise<LandlordVerification | undefined>;
  updateLandlordVerification(id: number, verification: Partial<InsertLandlordVerification>): Promise<LandlordVerification>;

  // Tenant invitation operations
  createTenantInvitation(invitation: InsertTenantInvitation): Promise<TenantInvitation>;
  getTenantInvitation(token: string): Promise<TenantInvitation | undefined>;
  getTenantInvitationByEmail(email: string, propertyId: number): Promise<TenantInvitation | undefined>;
  getLandlordInvitations(landlordId: string): Promise<TenantInvitation[]>;
  acceptTenantInvitation(id: number, tenantId: string): Promise<TenantInvitation>;
  expireInvitation(id: number): Promise<void>;

  // Landlord operations
  getPropertyById(id: number): Promise<Property | undefined>;
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
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
  createExperianAuditLog(log: InsertExperianAuditLog): Promise<ExperianAuditLog>;

  // Admin operations
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  getAdminUser(userId: string): Promise<AdminUser | undefined>;
  updateAdminUser(userId: string, updates: Partial<InsertAdminUser>): Promise<AdminUser>;
  deleteAdminUser(userId: string): Promise<void>;

  // Email verification token operations
  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  markEmailVerificationTokenAsUsed(token: string): Promise<void>;
  deleteExpiredEmailVerificationTokens(): Promise<void>;

  // Email event operations
  createEmailEvent(event: InsertEmailEvent): Promise<EmailEvent>;

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

  // API Key operations
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeys(userId?: string): Promise<ApiKey[]>;
  deleteApiKey(id: number): Promise<void>;

  // Support Ticket operations
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(filters?: { userId?: string; status?: string; assignedTo?: string }): Promise<SupportTicket[]>;
  updateSupportTicket(id: number, updates: Partial<InsertSupportTicket>): Promise<SupportTicket>;

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
  getPropertyTenantLinks(propertyId: number): Promise<LandlordTenantLink[]>;

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
  getUserDisputes(userId: string): Promise<Dispute[]>;
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

  // Landlord review operations
  createLandlordReview(review: InsertLandlordReview): Promise<LandlordReview>;
  getLandlordReviews(landlordId: string): Promise<LandlordReview[]>;
  updateLandlordReview(id: number, updates: Partial<LandlordReview>): Promise<LandlordReview>;

  // Support ticket operations
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(filters?: { status?: string; assignedTo?: string }): Promise<SupportTicket[]>;
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket>;

  // API key operations
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeys(): Promise<ApiKey[]>;
  getApiKey(key: string): Promise<ApiKey | undefined>;
  updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<void>;
  incrementApiKeyUsage(key: string): Promise<void>;

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

  // Rent Score History
  createRentScoreSnapshot(userId: string, score: number, change: number): Promise<RentScoreHistory>;
  getRentScoreHistory(userId: string): Promise<RentScoreHistory[]>;
  getPropertyByVerificationToken(token: string): Promise<Property | undefined>;
  getPropertyByVerificationToken(token: string): Promise<Property | undefined>;

  // Consents & Reporting
  createConsent(consent: InsertConsent): Promise<Consent>;
  getConsent(tenantId: string, scope: string): Promise<Consent | undefined>;
  getConsentByRef(tenantRef: string): Promise<Consent | undefined>;
  updateConsent(tenantId: string, scope: string, status: string, tenantRef?: string): Promise<Consent>;

  createReportingBatch(batch: InsertReportingBatch): Promise<ReportingBatch>;
  getReportingBatch(id: string): Promise<ReportingBatch | undefined>;
  getReportingBatches(): Promise<ReportingBatch[]>;
  updateReportingBatch(id: string, updates: Partial<ReportingBatch>): Promise<ReportingBatch>;

  createReportingRecords(records: InsertReportingRecord[]): Promise<void>;
  getReportingRecords(batchId: string): Promise<ReportingRecord[]>;
  getReportingRecordsByQuery(options: { month: string, verificationStatus?: string, limit?: number, offset?: number }): Promise<{ items: ReportingRecord[], total: number }>;

  // Partners
  getApiKey(key: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getAllApiKeys(): Promise<ApiKey[]>;
  revokeApiKey(id: number): Promise<void>;
  logApiKeyUsage(id: number): Promise<void>;

  // Tenancy operations
  createTenancy(tenancy: InsertTenancy): Promise<Tenancy>;
  getTenancy(id: string): Promise<Tenancy | undefined>;
  getTenancyByRef(ref: string): Promise<Tenancy | undefined>;
  getTenancyByPropertyAndUser(propertyId: number, userId: string): Promise<Tenancy | undefined>;
  updateTenancy(id: string, updates: Partial<InsertTenancy>): Promise<Tenancy>;

  createTenancyTenant(link: InsertTenancyTenant): Promise<TenancyTenant>;
  getTenancyTenants(tenancyId: string): Promise<TenancyTenant[]>;
  getUserTenancies(userId: string): Promise<Tenancy[]>;

  // Tenant Profile operations
  createTenantProfile(profile: InsertTenantProfile): Promise<TenantProfile>;
  getTenantProfile(userId: string): Promise<TenantProfile | undefined>;
  updateTenantProfile(userId: string, updates: Partial<InsertTenantProfile>): Promise<TenantProfile>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
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



  async createUserWithRLID(userData: UpsertUser, rolePrefix: 'TRLID-' | 'LRLID-'): Promise<User> {
    let retries = 3;
    while (retries > 0) {
      try {
        const randomNum = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        const rlid = `${rolePrefix}${randomNum}`;

        const [user] = await db
          .insert(users)
          .values({ ...userData, rlid })
          .returning();
        return user;
      } catch (error: any) {
        // Postgres unique violation code is 23505
        if (error.code === '23505' && error.detail?.includes('rlid')) {
          retries--;
          continue;
        }
        throw error;
      }
    }
    throw new Error("Failed to generate unique RLID after multiple attempts");
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

  async getRentPayment(id: number): Promise<RentPayment | undefined> {
    const [payment] = await db
      .select()
      .from(rentPayments)
      .where(eq(rentPayments.id, id));
    return payment;
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

  async getBankConnection(id: number): Promise<BankConnection | undefined> {
    const [connection] = await db
      .select()
      .from(bankConnections)
      .where(eq(bankConnections.id, id));
    return connection;
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
      .where(eq(creditReports.userId, userId))
      .orderBy(desc(creditReports.generatedAt));
  }

  async getAllCreditReports(): Promise<CreditReport[]> {
    return await db
      .select()
      .from(creditReports)
      .orderBy(desc(creditReports.generatedAt));
  }

  async getUserCreditReportsByMonth(userId: string, month: string): Promise<CreditReport[]> {
    // month format: YYYY-MM
    const startOfMonth = new Date(`${month}-01T00:00:00Z`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    return await db
      .select()
      .from(creditReports)
      .where(
        and(
          eq(creditReports.userId, userId),
          eq(creditReports.isActive, true),
          gte(creditReports.createdAt, startOfMonth),
          lt(creditReports.createdAt, endOfMonth)
        )
      )
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

  async getUserReportShares(userId: string): Promise<ReportShare[]> {
    // We need to join with creditReports to filter by userId
    // Since reportShares doesn't have userId directly, we link via reportId -> creditReports -> userId
    const shares = await db
      .select({
        id: reportShares.id,
        reportId: reportShares.reportId,
        recipientEmail: reportShares.recipientEmail,
        recipientType: reportShares.recipientType,
        shareUrl: reportShares.shareUrl,
        expiresAt: reportShares.expiresAt,
        accessCount: reportShares.accessCount,
        isActive: reportShares.isActive,
        createdAt: reportShares.createdAt
      })
      .from(reportShares)
      .innerJoin(creditReports, eq(reportShares.reportId, creditReports.id))
      .where(eq(creditReports.userId, userId))
      .orderBy(desc(reportShares.createdAt));

    return shares;
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

  async getTenantInvitationByEmail(email: string, propertyId: number): Promise<TenantInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(tenantInvitations)
      .where(and(
        eq(tenantInvitations.tenantEmail, email),
        eq(tenantInvitations.propertyId, propertyId),
        eq(tenantInvitations.status, 'pending')
      ))
      .limit(1);
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
      .from(rentPayments)
      .where(isNotNull(rentPayments.paymentMethod));

    const [manualPaymentStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(manualPayments);

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
      totalPayments: Number(paymentStats?.count || 0) + Number(manualPaymentStats?.count || 0),
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

  async getUsersBySubscriptionStatus(statuses: string[]): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(inArray(users.subscriptionStatus, statuses));
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
    const rentPaymentsData = await db
      .select()
      .from(rentPayments)
      .orderBy(desc(rentPayments.createdAt));

    const manualPaymentsData = await db
      .select()
      .from(manualPayments)
      .where(isNotNull(manualPayments.verifiedBy))
      .orderBy(desc(manualPayments.createdAt));

    // Map manual payments to RentPayment structure
    const mappedManualPayments: RentPayment[] = manualPaymentsData.map(mp => ({
      id: mp.id + 100000, // Offset ID to avoid collision (hacky but works for display)
      userId: mp.userId,
      propertyId: mp.propertyId,
      amount: mp.amount,
      dueDate: new Date(mp.paymentDate).toISOString(), // Map paymentDate to dueDate
      paidDate: new Date(mp.paymentDate).toISOString(),
      status: 'paid',
      paymentMethod: mp.paymentMethod || 'manual',
      transactionId: null,
      isVerified: true,
      createdAt: mp.createdAt,
      updatedAt: mp.updatedAt
    }));

    return [...rentPaymentsData, ...mappedManualPayments].sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
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

  async createExperianAuditLog(log: InsertExperianAuditLog): Promise<ExperianAuditLog> {
    const [entry] = await db.insert(experianAuditLogs).values(log).returning();
    return entry;
  }

  // Rent Score History
  async createRentScoreSnapshot(userId: string, score: number, change: number): Promise<RentScoreHistory> {
    const [snapshot] = await db
      .insert(rentScoreHistory)
      .values({
        userId,
        score,
        change,
        recordedAt: new Date()
      })
      .returning();
    return snapshot;
  }

  async getRentScoreHistory(userId: string): Promise<RentScoreHistory[]> {
    return await db
      .select()
      .from(rentScoreHistory)
      .where(eq(rentScoreHistory.userId, userId))
      .orderBy(asc(rentScoreHistory.recordedAt));
  }

  async getPropertyByVerificationToken(token: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.verificationToken, token));
    return property;
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
    const [updated] = await db
      .update(maintenanceRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(maintenanceRequests.id, id))
      .returning();
    return updated;
  }

  // Landlord review operations
  async createLandlordReview(review: InsertLandlordReview): Promise<LandlordReview> {
    const [created] = await db
      .insert(landlordReviews)
      .values(review)
      .returning();
    return created;
  }

  async getLandlordReviews(landlordId: string): Promise<LandlordReview[]> {
    return await db
      .select()
      .from(landlordReviews)
      .where(and(
        eq(landlordReviews.landlordId, landlordId),
        eq(landlordReviews.isVisible, true)
      ))
      .orderBy(desc(landlordReviews.createdAt));
  }

  async updateLandlordReview(id: number, updates: Partial<LandlordReview>): Promise<LandlordReview> {
    const [updated] = await db
      .update(landlordReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(landlordReviews.id, id))
      .returning();
    return updated;
  }

  // Support ticket operations
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [created] = await db
      .insert(supportTickets)
      .values(ticket)
      .returning();
    return created;
  }

  async getSupportTickets(filters?: { userId?: string; status?: string; assignedTo?: string }): Promise<SupportTicket[]> {
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(supportTickets.userId, filters.userId));
    }
    if (filters?.status) {
      conditions.push(eq(supportTickets.status, filters.status as any));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(supportTickets.assignedTo, filters.assignedTo));
    }

    return await db
      .select()
      .from(supportTickets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket;
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const [updated] = await db
      .update(supportTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return updated;
  }

  // API key operations
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [created] = await db
      .insert(apiKeys)
      .values(apiKey)
      .returning();
    return created;
  }

  async getApiKeys(userId?: string): Promise<ApiKey[]> {
    if (userId) {
      return await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.createdBy, userId), eq(apiKeys.isActive, true)))
        .orderBy(desc(apiKeys.createdAt));
    }
    return await db
      .select()
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));
  }

  async getApiKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, key));
    return apiKey;
  }

  async updateApiKey(id: number, updates: Partial<ApiKey>): Promise<ApiKey> {
    const [updated] = await db
      .update(apiKeys)
      .set(updates)
      .where(eq(apiKeys.id, id))
      .returning();
    return updated;
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async incrementApiKeyUsage(key: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({
        usageCount: sql`${apiKeys.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(apiKeys.key, key));
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

  async getAllManualPayments(): Promise<any[]> {
    return await db
      .select({
        id: manualPayments.id,
        userId: manualPayments.userId,
        amount: manualPayments.amount,
        paymentDate: manualPayments.paymentDate,
        paymentMethod: manualPayments.paymentMethod,
        verificationStatus: sql<string>`CASE WHEN ${manualPayments.needsVerification} THEN 'pending' ELSE 'verified' END`,
        verificationToken: manualPayments.verificationToken,
        notes: manualPayments.description,
        createdAt: manualPayments.createdAt,
        updatedAt: manualPayments.updatedAt,
        receiptUrl: manualPayments.receiptUrl,
        landlordEmail: manualPayments.landlordEmail,
        landlordPhone: manualPayments.landlordPhone,
        verifiedBy: manualPayments.verifiedBy,
        tenantName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        tenantEmail: users.email
      })
      .from(manualPayments)
      .leftJoin(users, eq(manualPayments.userId, users.id))
      .orderBy(desc(manualPayments.createdAt));
  }

  async updateManualPayment(id: number, updates: Partial<InsertManualPayment>): Promise<ManualPayment> {
    const [updatedPayment] = await db
      .update(manualPayments)
      .set(updates)
      .where(eq(manualPayments.id, id))
      .returning();
    return updatedPayment;
  }

  async getManualPaymentByToken(token: string): Promise<ManualPayment | undefined> {
    const [payment] = await db
      .select()
      .from(manualPayments)
      .where(eq(manualPayments.verificationToken, token));
    return payment;
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

  /**
   * Gets all disputes for a specific user
   * @param userId - User ID to fetch disputes for
   * @returns Promise resolving to array of disputes
   */
  async getUserDisputes(userId: string): Promise<Dispute[]> {
    return await db
      .select()
      .from(disputes)
      .where(eq(disputes.userId, userId))
      .orderBy(desc(disputes.createdAt));
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

  async getPropertyTenantLinks(propertyId: number): Promise<LandlordTenantLink[]> {
    return await db.select().from(landlordTenantLinks)
      .where(eq(landlordTenantLinks.propertyId, propertyId))
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

  // Email verification token operations
  async createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    const [created] = await db.insert(emailVerificationTokens).values(token).returning();
    return created;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const [result] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token));
    return result;
  }

  async markEmailVerificationTokenAsUsed(token: string): Promise<void> {
    await db
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.token, token));
  }

  async deleteExpiredEmailVerificationTokens(): Promise<void> {
    await db
      .delete(emailVerificationTokens)
      .where(lt(emailVerificationTokens.expiresAt, new Date()));
  }

  async createEmailEvent(event: InsertEmailEvent): Promise<EmailEvent> {
    const [created] = await db
      .insert(emailEvents)
      .values(event)
      .returning();
    return created;
  }

  // Consent operations
  async createConsent(consent: InsertConsent): Promise<Consent> {
    const [created] = await db.insert(consents).values(consent).returning();
    return created;
  }

  async getConsent(tenantId: string, scope: string): Promise<Consent | undefined> {
    const [consent] = await db
      .select()
      .from(consents)
      .where(and(eq(consents.tenantId, tenantId), eq(consents.scope, scope as any)));
    return consent;
  }

  async updateConsent(tenantId: string, scope: string, status: string, tenantRef?: string): Promise<Consent> {
    const existing = await this.getConsent(tenantId, scope);

    // If we have consent+tenantRef, update both
    const updateData: any = {
      status,
      updatedAt: new Date(),
      withdrawnAt: status === 'withdrawn' ? new Date() : null,
    };
    if (tenantRef) updateData.tenantRef = tenantRef;

    if (existing) {
      const [updated] = await db
        .update(consents)
        .set(updateData)
        .where(eq(consents.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(consents)
        .values({
          tenantId,
          scope: scope as "reporting_to_partners",
          status: status as "consented" | "withdrawn",
          tenantRef: tenantRef || null,
          capturedAt: new Date(),
          withdrawnAt: status === 'withdrawn' ? new Date() : null,
        })
        .returning();
      return created;
    }
  }

  async getConsentByRef(tenantRef: string): Promise<Consent | undefined> {
    const [consent] = await db.select().from(consents).where(eq(consents.tenantRef, tenantRef));
    return consent;
  }

  // Reporting Batch operations
  async createReportingBatch(batch: InsertReportingBatch): Promise<ReportingBatch> {
    const [created] = await db.insert(reportingBatches).values(batch).returning();
    return created;
  }

  async getReportingBatch(id: string): Promise<ReportingBatch | undefined> {
    const [batch] = await db.select().from(reportingBatches).where(eq(reportingBatches.id, id));
    return batch;
  }

  async getReportingBatches(): Promise<ReportingBatch[]> {
    return await db.select().from(reportingBatches).orderBy(desc(reportingBatches.createdAt));
  }

  async updateReportingBatch(id: string, updates: Partial<InsertReportingBatch>): Promise<ReportingBatch> {
    const [updated] = await db
      .update(reportingBatches)
      .set({ ...updates, readyAt: updates.status === 'ready' ? new Date() : undefined })
      .where(eq(reportingBatches.id, id))
      .returning();
    return updated;
  }

  // Reporting Records operations
  async createReportingRecords(records: InsertReportingRecord[]): Promise<void> {
    if (records.length === 0) return;
    // Batch insert
    await db.insert(reportingRecords).values(records);
  }

  async getReportingRecords(batchId: string): Promise<ReportingRecord[]> {
    return await db.select().from(reportingRecords).where(eq(reportingRecords.batchId, batchId));
  }

  async getReportingRecordsByQuery(options: {
    month: string,
    verificationStatus?: string,
    limit?: number,
    offset?: number
  }): Promise<{ items: ReportingRecord[], total: number }> {
    // 1. Find batches for the month
    const batches = await db.select({ id: reportingBatches.id }).from(reportingBatches).where(eq(reportingBatches.month, options.month));
    const batchIds = batches.map(b => b.id);

    if (batchIds.length === 0) return { items: [], total: 0 };

    // 2. Build query
    // 2. Build query
    const conditionList = [inArray(reportingRecords.batchId, batchIds)];
    if (options.verificationStatus) {
      conditionList.push(eq(reportingRecords.verificationStatus, options.verificationStatus));
    }
    const conditions = and(...conditionList);

    const records = await db.select()
      .from(reportingRecords)
      .where(conditions)
      .limit(options.limit || 50)
      .offset(options.offset || 0);

    // Count (approx)
    // For V1, simple count
    const [countRes] = await db.select({ count: sql<number>`count(*)` })
      .from(reportingRecords)
      .where(conditions);

    return { items: records, total: Number(countRes?.count || 0) };
  }


  async logApiKeyUsage(id: number): Promise<void> {
    await db.update(apiKeys)
      .set({ lastUsedAt: new Date(), usageCount: sql`${apiKeys.usageCount} + 1` })
      .where(eq(apiKeys.id, id));
  }

  // Tenancy operations
  async getAllApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async revokeApiKey(id: number): Promise<void> {
    await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.id, id));
  }
  async createTenancy(tenancy: InsertTenancy): Promise<Tenancy> {
    const [created] = await db.insert(tenancies).values(tenancy).returning();
    return created;
  }

  async getTenancy(id: string): Promise<Tenancy | undefined> {
    const [tenancy] = await db.select().from(tenancies).where(eq(tenancies.id, id));
    return tenancy;
  }

  async getTenancyByRef(ref: string): Promise<Tenancy | undefined> {
    const [tenancy] = await db.select().from(tenancies).where(eq(tenancies.tenancyRef, ref));
    return tenancy;
  }

  async getTenancyByPropertyAndUser(propertyId: number, userId: string): Promise<Tenancy | undefined> {
    // Find active tenancy for this property and user
    const result = await db
      .select({ tenancy: tenancies })
      .from(tenancies)
      .innerJoin(tenancyTenants, eq(tenancies.id, tenancyTenants.tenancyId))
      .where(and(
        eq(tenancies.propertyId, propertyId),
        eq(tenancyTenants.tenantId, userId),
        eq(tenancies.status, 'active')
      ))
      .limit(1);

    return result[0]?.tenancy;
  }

  async updateTenancy(id: string, updates: Partial<InsertTenancy>): Promise<Tenancy> {
    const [updated] = await db
      .update(tenancies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenancies.id, id))
      .returning();
    return updated;
  }

  async updateTenancyTenant(tenancyId: string, tenantId: string, updates: Partial<InsertTenancyTenant>): Promise<TenancyTenant> {
    const [updated] = await db
      .update(tenancyTenants)
      .set(updates)
      .where(and(
        eq(tenancyTenants.tenancyId, tenancyId),
        eq(tenancyTenants.tenantId, tenantId)
      ))
      .returning();
    return updated;
  }

  async createTenancyTenant(link: InsertTenancyTenant): Promise<TenancyTenant> {
    const [created] = await db.insert(tenancyTenants).values(link).returning();
    return created;
  }

  async getTenancyTenants(tenancyId: string): Promise<TenancyTenant[]> {
    return await db.select().from(tenancyTenants).where(eq(tenancyTenants.tenancyId, tenancyId));
  }

  async getUserTenancies(userId: string): Promise<Tenancy[]> {
    const records = await db
      .select({ tenancy: tenancies })
      .from(tenancies)
      .innerJoin(tenancyTenants, eq(tenancies.id, tenancyTenants.tenancyId))
      .where(eq(tenancyTenants.tenantId, userId));
    return records.map(r => r.tenancy);
  }

  // Tenant Profile operations
  async createTenantProfile(profile: InsertTenantProfile): Promise<TenantProfile> {
    const [created] = await db.insert(tenantProfiles).values(profile).returning();
    return created;
  }

  async getTenantProfile(userId: string): Promise<TenantProfile | undefined> {
    const [profile] = await db.select().from(tenantProfiles).where(eq(tenantProfiles.userId, userId));
    return profile;
  }

  async updateTenantProfile(userId: string, updates: Partial<InsertTenantProfile>): Promise<TenantProfile> {
    const existing = await this.getTenantProfile(userId);
    if (existing) {
      const [updated] = await db
        .update(tenantProfiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(tenantProfiles.id, existing.id)) // Use PK for update
        .returning();
      return updated;
    } else {
      // Create if not exists (upsert logic for profile)
      const [created] = await db
        .insert(tenantProfiles)
        .values({ userId, ...updates } as any) // Safety cast, assuming userId is in updates or handled
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
