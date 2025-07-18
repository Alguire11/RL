import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertPropertySchema, 
  insertRentPaymentSchema, 
  insertBankConnectionSchema,
  insertNotificationSchema,
  insertUserPreferencesSchema,
  insertSecurityLogSchema,
  insertDataExportRequestSchema,
  insertLandlordVerificationSchema
} from "@shared/schema";
import { nanoid } from "nanoid";
import { createHash } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Security logging middleware
  const logSecurityEvent = async (req: any, action: string, metadata: any = {}) => {
    if (req.isAuthenticated()) {
      try {
        await storage.createSecurityLog({
          userId: req.user.id,
          action,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata,
        });
      } catch (error) {
        console.error('Error logging security event:', error);
      }
    }
  };

  // Admin middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const adminUser = await storage.getAdminUser(req.user.id);
      if (!adminUser || !adminUser.isActive) {
        await logSecurityEvent(req, 'admin_access_denied', { attemptedEndpoint: req.originalUrl });
        return res.status(403).json({ message: "Admin access required" });
      }
      
      req.adminUser = adminUser;
      next();
    } catch (error) {
      console.error('Error checking admin status:', error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // User profile routes
  app.patch('/api/user/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      const user = await storage.upsertUser({
        id: userId,
        ...updateData,
        updatedAt: new Date(),
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update user address
  app.put('/api/user/address', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { street, city, postcode, country } = req.body;
      
      const user = await storage.upsertUser({
        id: userId,
        address: { street, city, postcode, country },
        updatedAt: new Date(),
      });
      
      res.json({ 
        message: 'Address updated successfully',
        address: user.address 
      });
    } catch (error) {
      console.error("Error updating user address:", error);
      res.status(500).json({ message: "Failed to update address" });
    }
  });

  // Update user rent information
  app.put('/api/user/rent-info', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount, dayOfMonth, frequency, firstPaymentDate, nextPaymentDate } = req.body;
      
      const user = await storage.upsertUser({
        id: userId,
        rentInfo: { amount, dayOfMonth, frequency, firstPaymentDate, nextPaymentDate },
        updatedAt: new Date(),
      });
      
      res.json({ 
        message: 'Rent information updated successfully',
        rentInfo: user.rentInfo 
      });
    } catch (error) {
      console.error("Error updating rent information:", error);
      res.status(500).json({ message: "Failed to update rent information" });
    }
  });

  // Property routes
  app.get('/api/properties', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const properties = await storage.getUserProperties(userId);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.post('/api/properties', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const propertyData = insertPropertySchema.parse({ ...req.body, userId });
      
      const property = await storage.createProperty(propertyData);
      res.json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.patch('/api/properties/:id', requireAuth, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const updateData = req.body;
      
      const property = await storage.updateProperty(propertyId, updateData);
      res.json(property);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete('/api/properties/:id', requireAuth, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      await storage.deleteProperty(propertyId);
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Rent payment routes
  app.get('/api/payments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payments = await storage.getUserRentPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching rent payments:", error);
      res.status(500).json({ message: "Failed to fetch rent payments" });
    }
  });

  app.post('/api/payments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const paymentData = insertRentPaymentSchema.parse({ ...req.body, userId });
      
      const payment = await storage.createRentPayment(paymentData);
      res.json(payment);
    } catch (error) {
      console.error("Error creating rent payment:", error);
      res.status(500).json({ message: "Failed to create rent payment" });
    }
  });

  app.patch('/api/payments/:id', requireAuth, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const updateData = req.body;
      
      const payment = await storage.updateRentPayment(paymentId, updateData);
      res.json(payment);
    } catch (error) {
      console.error("Error updating rent payment:", error);
      res.status(500).json({ message: "Failed to update rent payment" });
    }
  });

  // Bank connection routes
  app.get('/api/bank-connections', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const connections = await storage.getUserBankConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching bank connections:", error);
      res.status(500).json({ message: "Failed to fetch bank connections" });
    }
  });

  app.post('/api/bank-connections', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const connectionData = insertBankConnectionSchema.parse({ ...req.body, userId });
      
      const connection = await storage.createBankConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating bank connection:", error);
      res.status(500).json({ message: "Failed to create bank connection" });
    }
  });

  app.delete('/api/bank-connections/:id', requireAuth, async (req: any, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      await storage.deleteBankConnection(connectionId);
      res.json({ message: "Bank connection deleted successfully" });
    } catch (error) {
      console.error("Error deleting bank connection:", error);
      res.status(500).json({ message: "Failed to delete bank connection" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Credit report routes
  app.get('/api/reports', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reports = await storage.getUserCreditReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching credit reports:", error);
      res.status(500).json({ message: "Failed to fetch credit reports" });
    }
  });

  app.post('/api/reports/generate', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { propertyId } = req.body;
      
      // Get user data
      const user = await storage.getUser(userId);
      const properties = await storage.getUserProperties(userId);
      const property = properties.find(p => p.id === propertyId);
      const payments = await storage.getPropertyRentPayments(propertyId);
      
      if (!user || !property) {
        return res.status(404).json({ message: "User or property not found" });
      }
      
      // Generate report data
      const reportData = {
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
        },
        property: {
          address: property.address,
          city: property.city,
          postcode: property.postcode,
          rent: property.monthlyRent,
        },
        payments: payments.map(p => ({
          date: p.dueDate,
          amount: p.amount,
          status: p.status,
          paidDate: p.paidDate,
        })),
        stats: await storage.getUserStats(userId),
        generatedAt: new Date().toISOString(),
      };
      
      const report = await storage.createCreditReport({
        userId,
        propertyId,
        reportData,
        verificationId: `ENO-${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      
      res.json(report);
    } catch (error) {
      console.error("Error generating credit report:", error);
      res.status(500).json({ message: "Failed to generate credit report" });
    }
  });

  app.post('/api/reports/:id/share', requireAuth, async (req: any, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const { recipientEmail, recipientType } = req.body;
      
      const shareUrl = `https://${req.hostname}/shared-report/${Date.now()}-${reportId}`;
      
      const share = await storage.createReportShare({
        reportId,
        recipientEmail,
        recipientType,
        shareUrl,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      
      res.json(share);
    } catch (error) {
      console.error("Error sharing report:", error);
      res.status(500).json({ message: "Failed to share report" });
    }
  });

  // Public route for viewing shared reports
  app.get('/api/shared-report/:url', async (req, res) => {
    try {
      const shareUrl = `https://${req.hostname}/shared-report/${req.params.url}`;
      const share = await storage.getReportShareByUrl(shareUrl);
      
      if (!share || !share.isActive) {
        return res.status(404).json({ message: "Report not found or expired" });
      }
      
      if (share.expiresAt && new Date() > share.expiresAt) {
        return res.status(410).json({ message: "Report has expired" });
      }
      
      // Increment access count
      await storage.incrementShareAccess(share.id);
      
      // Get the actual report
      const reports = await storage.getUserCreditReports(''); // This needs to be updated for public access
      const report = reports.find(r => r.id === share.reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json({ report: report.reportData, share });
    } catch (error) {
      console.error("Error accessing shared report:", error);
      res.status(500).json({ message: "Failed to access shared report" });
    }
  });

  // Notifications routes
  app.get('/api/notifications', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications/:id/read', requireAuth, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // User preferences routes
  app.get('/api/user/preferences', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences || { 
        paymentReminders: true,
        emailNotifications: true,
        smsNotifications: false,
        reminderDays: 3 
      });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ message: 'Failed to fetch preferences' });
    }
  });

  app.post('/api/user/preferences', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferencesData = { ...req.body, userId };
      const preferences = await storage.upsertUserPreferences(preferencesData);
      await logSecurityEvent(req, 'preferences_updated', { preferences: preferencesData });
      res.json(preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ message: 'Failed to update preferences' });
    }
  });

  // Landlord verification routes
  app.post('/api/landlord/verify-request', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { propertyId, landlordEmail } = req.body;
      
      const verificationToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const verification = await storage.createLandlordVerification({
        userId,
        propertyId,
        verificationToken,
        landlordEmail,
        expiresAt,
      });
      
      // Create notification for user
      await storage.createNotification({
        userId,
        type: 'system',
        title: 'Landlord Verification Requested',
        message: `Verification request sent to ${landlordEmail}`,
      });
      
      await logSecurityEvent(req, 'landlord_verification_requested', { 
        landlordEmail, 
        propertyId,
        verificationId: verification.id 
      });
      
      res.json({ 
        message: 'Verification request sent successfully',
        verificationUrl: `${req.protocol}://${req.hostname}/landlord/verify/${verificationToken}`
      });
    } catch (error) {
      console.error('Error requesting landlord verification:', error);
      res.status(500).json({ message: 'Failed to request verification' });
    }
  });

  // Public landlord verification route
  app.get('/api/landlord/verify/:token', async (req, res) => {
    try {
      const token = req.params.token;
      const verification = await storage.getLandlordVerification(token);
      
      if (!verification) {
        return res.status(404).json({ message: 'Verification not found' });
      }
      
      if (verification.expiresAt && new Date() > verification.expiresAt) {
        return res.status(410).json({ message: 'Verification link has expired' });
      }
      
      if (verification.isVerified) {
        return res.status(400).json({ message: 'Already verified' });
      }
      
      // Get user and property info for display
      const user = await storage.getUser(verification.userId);
      const properties = await storage.getUserProperties(verification.userId);
      const property = properties.find(p => p.id === verification.propertyId);
      
      if (!user || !property) {
        return res.status(404).json({ message: 'User or property not found' });
      }
      
      res.json({
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        property: {
          address: property.address,
          city: property.city,
          postcode: property.postcode,
          monthlyRent: property.monthlyRent,
        },
        verification: {
          id: verification.id,
          token: verification.verificationToken,
        }
      });
    } catch (error) {
      console.error('Error retrieving verification:', error);
      res.status(500).json({ message: 'Failed to retrieve verification' });
    }
  });

  app.post('/api/landlord/verify/:token/confirm', async (req, res) => {
    try {
      const token = req.params.token;
      const verification = await storage.getLandlordVerification(token);
      
      if (!verification) {
        return res.status(404).json({ message: 'Verification not found' });
      }
      
      if (verification.expiresAt && new Date() > verification.expiresAt) {
        return res.status(410).json({ message: 'Verification link has expired' });
      }
      
      if (verification.isVerified) {
        return res.status(400).json({ message: 'Already verified' });
      }
      
      // Mark as verified
      await storage.updateLandlordVerification(verification.id, {
        isVerified: true,
        verifiedAt: new Date(),
      });
      
      // Create notification for user
      await storage.createNotification({
        userId: verification.userId,
        type: 'landlord_verified',
        title: 'Landlord Verification Confirmed',
        message: 'Your landlord has confirmed your rent payment history',
      });
      
      res.json({ message: 'Verification confirmed successfully' });
    } catch (error) {
      console.error('Error confirming verification:', error);
      res.status(500).json({ message: 'Failed to confirm verification' });
    }
  });

  // Data export routes
  app.get('/api/user/export-requests', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getUserDataExportRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching export requests:', error);
      res.status(500).json({ message: 'Failed to fetch export requests' });
    }
  });

  app.post('/api/user/export-data', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { dataType = 'all' } = req.body;
      
      const exportRequest = await storage.createDataExportRequest({
        userId,
        dataType,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      
      await logSecurityEvent(req, 'data_export_requested', { 
        dataType,
        requestId: exportRequest.id 
      });
      
      // TODO: Implement actual data export processing
      // For now, mark as completed immediately
      setTimeout(async () => {
        try {
          await storage.updateDataExportRequest(exportRequest.id, {
            status: 'completed',
            completedAt: new Date(),
            downloadUrl: `${req.protocol}://${req.hostname}/api/user/export-data/${exportRequest.id}/download`,
          });
          
          await storage.createNotification({
            userId,
            type: 'system',
            title: 'Data Export Ready',
            message: 'Your data export is ready for download',
          });
        } catch (error) {
          console.error('Error completing data export:', error);
        }
      }, 2000);
      
      res.json({ 
        message: 'Data export request submitted successfully',
        requestId: exportRequest.id
      });
    } catch (error) {
      console.error('Error requesting data export:', error);
      res.status(500).json({ message: 'Failed to request data export' });
    }
  });

  app.get('/api/user/export-data/:id/download', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestId = parseInt(req.params.id);
      
      const requests = await storage.getUserDataExportRequests(userId);
      const exportRequest = requests.find(r => r.id === requestId);
      
      if (!exportRequest) {
        return res.status(404).json({ message: 'Export request not found' });
      }
      
      if (exportRequest.status !== 'completed') {
        return res.status(400).json({ message: 'Export not ready' });
      }
      
      if (exportRequest.expiresAt && new Date() > exportRequest.expiresAt) {
        return res.status(410).json({ message: 'Export has expired' });
      }
      
      // Get user data
      const user = await storage.getUser(userId);
      const properties = await storage.getUserProperties(userId);
      const payments = await storage.getUserRentPayments(userId);
      const reports = await storage.getUserCreditReports(userId);
      const bankConnections = await storage.getUserBankConnections(userId);
      
      const exportData = {
        user: { ...user, password: undefined },
        properties,
        payments,
        reports,
        bankConnections: bankConnections.map(conn => ({
          ...conn,
          accountNumber: conn.accountNumber.slice(-4).padStart(conn.accountNumber.length, '*')
        })),
        exportedAt: new Date().toISOString(),
      };
      
      await logSecurityEvent(req, 'data_export_downloaded', { 
        requestId: exportRequest.id,
        dataType: exportRequest.dataType
      });
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="enoikio-data-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error('Error downloading export:', error);
      res.status(500).json({ message: 'Failed to download export' });
    }
  });

  // Security logs route
  app.get('/api/user/security-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const logs = await storage.getUserSecurityLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching security logs:', error);
      res.status(500).json({ message: 'Failed to fetch security logs' });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
  });

  app.get('/api/admin/users', requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats.recentUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Payment reminder system (would be called by a cron job)
  app.post('/api/system/send-payment-reminders', async (req, res) => {
    try {
      // This would typically be called by a cron job or scheduled task
      const { authToken } = req.body;
      
      // Simple auth check for system endpoints
      if (authToken !== process.env.SYSTEM_TOKEN) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Get all users with payment reminders enabled
      const stats = await storage.getSystemStats();
      const users = stats.recentUsers; // This would be all users in a real implementation
      
      let remindersSent = 0;
      
      for (const user of users) {
        try {
          const preferences = await storage.getUserPreferences(user.id);
          if (!preferences?.paymentReminders) continue;
          
          const payments = await storage.getUserRentPayments(user.id);
          const upcomingPayments = payments.filter(p => {
            if (p.status !== 'pending') return false;
            const dueDate = new Date(p.dueDate);
            const today = new Date();
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilDue === (preferences.reminderDays || 3);
          });
          
          for (const payment of upcomingPayments) {
            await storage.createNotification({
              userId: user.id,
              type: 'payment_reminder',
              title: 'Rent Payment Due Soon',
              message: `Your rent payment of £${payment.amount} is due in ${preferences.reminderDays || 3} days`,
              scheduledFor: new Date(),
            });
            remindersSent++;
          }
        } catch (error) {
          console.error(`Error sending reminder for user ${user.id}:`, error);
        }
      }
      
      res.json({ 
        message: `Sent ${remindersSent} payment reminders`,
        remindersSent 
      });
    } catch (error) {
      console.error('Error sending payment reminders:', error);
      res.status(500).json({ message: 'Failed to send payment reminders' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
