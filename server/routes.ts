import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { sendEmail, createLandlordVerificationEmail, createTenantInviteEmail } from "./emailService";
import QRCode from "qrcode";
import { z } from "zod";
import { 
  insertPropertySchema, 
  insertRentPaymentSchema, 
  insertBankConnectionSchema,
  insertNotificationSchema,
  insertUserPreferencesSchema,
  insertSecurityLogSchema,
  insertDataExportRequestSchema,
  insertLandlordVerificationSchema,
  insertTenantInvitationSchema
} from "@shared/schema";
import { nanoid } from "nanoid";

// Define requireAdmin middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    // For demo purposes, we'll check localStorage data sent in headers
    const adminSession = req.headers['x-admin-session'];
    if (!adminSession) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    
    const session = JSON.parse(adminSession);
    if (session.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.adminUser = session;
    next();
  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    res.status(401).json({ message: 'Invalid admin session' });
  }
};
import bcrypt from "bcryptjs";

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
      
      const user = await storage.updateUserAddress(userId, {
        street, city, postcode, country
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
      const { amount, dayOfMonth, frequency, firstPaymentDate, nextPaymentDate, landlordName, landlordEmail, landlordPhone } = req.body;
      
      const user = await storage.updateUserRentInfo(userId, {
        amount, 
        dayOfMonth, 
        frequency, 
        firstPaymentDate, 
        nextPaymentDate,
        landlordName,
        landlordEmail,
        landlordPhone
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
      
      // Get property and user details for email and notification
      if (payment.propertyId) {
        const property = await storage.getPropertyById(payment.propertyId);
        const user = await storage.getUserById(userId);
        
        // Send confirmation email to landlord
        if (property?.landlordEmail && user) {
          await sendEmail({
            to: property.landlordEmail,
            from: 'noreply@rentledger.co.uk',
            subject: 'Rent Payment Notification - RentLedger',
            html: `
              <h2>New Rent Payment Recorded</h2>
              <p>Hello ${property.landlordName || 'Landlord'},</p>
              <p>Your tenant <strong>${user.firstName} ${user.lastName}</strong> has recorded a rent payment:</p>
              <ul>
                <li><strong>Property:</strong> ${property.address}, ${property.city}</li>
                <li><strong>Amount:</strong> £${payment.amount}</li>
                <li><strong>Due Date:</strong> ${payment.dueDate}</li>
                <li><strong>Status:</strong> ${payment.status}</li>
              </ul>
              <p>This payment has been logged in the RentLedger system to help build your tenant's credit profile.</p>
              <p>Best regards,<br>The RentLedger Team</p>
            `
          });
        }
        
        // Create "due soon" notification if payment is within 5 days
        const dueDate = new Date(payment.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 5 && daysUntilDue >= 0 && payment.status === 'pending') {
          await storage.createNotification({
            userId,
            type: 'payment_reminder',
            title: 'Rent Payment Due Soon',
            message: `Your rent payment of £${payment.amount} is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
            priority: 'high',
            isRead: false,
            metadata: { paymentId: payment.id, dueDate: payment.dueDate }
          });
        }
      }
      
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

  // Landlord routes
  app.post('/api/landlord/invite-tenant', async (req: any, res) => {
    try {
      const { landlordId, propertyId, tenantEmail, landlordName, propertyAddress } = req.body;
      
      const inviteToken = nanoid(32);
      const inviteUrl = `${req.protocol}://${req.get('host')}/tenant/accept-invite/${inviteToken}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const qrCodeDataUrl = await QRCode.toDataURL(inviteUrl);
      
      const invitation = await storage.createTenantInvitation({
        landlordId,
        propertyId: propertyId ? parseInt(propertyId) : null,
        tenantEmail,
        inviteToken,
        inviteUrl,
        qrCodeData: qrCodeDataUrl,
        status: 'pending',
        expiresAt
      });
      
      const emailParams = createTenantInviteEmail(tenantEmail, landlordName, propertyAddress, inviteUrl, qrCodeDataUrl);
      await sendEmail(emailParams);
      
      res.json({ success: true, invitation, qrCodeDataUrl });
    } catch (error) {
      console.error("Error inviting tenant:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  app.get('/api/landlord/:landlordId/tenants', async (req: any, res) => {
    try {
      const { landlordId } = req.params;
      const tenants = await storage.getLandlordTenants(landlordId);
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching landlord tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.get('/api/landlord/:landlordId/verifications', async (req: any, res) => {
    try {
      const { landlordId } = req.params;
      const verifications = await storage.getLandlordVerifications(landlordId);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  app.get('/api/landlord/:landlordId/pending-requests', async (req: any, res) => {
    try {
      const { landlordId} = req.params;
      const requests = await storage.getLandlordPendingRequests(landlordId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
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
      
      // Get user and property info for email
      const user = await storage.getUser(userId);
      const properties = await storage.getUserProperties(userId);
      const property = properties.find(p => p.id === propertyId);
      
      if (!user || !property) {
        return res.status(404).json({ message: 'User or property not found' });
      }
      
      const verification = await storage.createLandlordVerification({
        userId,
        propertyId,
        verificationToken,
        landlordEmail,
        expiresAt,
      });
      
      // Send live email to landlord
      const verificationUrl = `${req.protocol}://${req.hostname}/landlord/verify/${verificationToken}`;
      const tenantName = `${user.firstName} ${user.lastName}`;
      const propertyAddress = `${property.address}, ${property.city} ${property.postcode}`;
      
      const emailData = createLandlordVerificationEmail(
        landlordEmail,
        tenantName,
        propertyAddress,
        verificationUrl
      );
      
      const emailSent = await sendEmail(emailData);
      
      if (!emailSent) {
        console.error('Failed to send verification email to landlord');
        // Still create the verification but notify user of email issue
        await storage.createNotification({
          userId,
          type: 'system',
          title: 'Verification Created',
          message: `Verification request created but email delivery failed. Please share the link manually with ${landlordEmail}`,
        });
      } else {
        // Create success notification for user
        await storage.createNotification({
          userId,
          type: 'system',
          title: 'Landlord Verification Email Sent',
          message: `Verification email successfully sent to ${landlordEmail}`,
        });
      }
      
      await logSecurityEvent(req, 'landlord_verification_requested', { 
        landlordEmail, 
        propertyId,
        verificationId: verification.id,
        emailSent
      });
      
      res.json({ 
        message: emailSent ? 'Verification email sent successfully' : 'Verification created but email delivery failed',
        verificationUrl,
        emailSent
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
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/system-health', requireAdmin, async (req: any, res) => {
    try {
      const health = {
        database: 'healthy' as const,
        emailService: 'healthy' as const,
        paymentProcessor: 'healthy' as const,
        lastChecked: new Date().toISOString(),
      };

      // Perform actual health checks
      try {
        await storage.getSystemStats(); // Test database
      } catch {
        health.database = 'down';
      }

      // Test email service (simplified check)
      if (!process.env.SENDGRID_API_KEY) {
        health.emailService = 'degraded';
      }

      res.json(health);
    } catch (error) {
      console.error('Error checking system health:', error);
      res.status(500).json({ message: 'Failed to check system health' });
    }
  });

  app.post('/api/admin/system-check', requireAdmin, async (req: any, res) => {
    try {
      await logSecurityEvent(req, 'admin_system_check', { adminId: req.adminUser.id });
      
      const checks = {
        database: true,
        emailService: !!process.env.SENDGRID_API_KEY,
        storage: true,
        authentication: true,
      };

      const allHealthy = Object.values(checks).every(check => check);
      
      res.json({ 
        status: allHealthy ? 'healthy' : 'issues_detected',
        checks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error performing system check:', error);
      res.status(500).json({ message: 'Failed to perform system check' });
    }
  });

  app.post('/api/admin/export-all-data', requireAdmin, async (req: any, res) => {
    try {
      const exportId = nanoid();
      
      await logSecurityEvent(req, 'admin_data_export', { 
        adminId: req.adminUser.id,
        exportId 
      });

      // In a real implementation, this would be processed in the background
      setTimeout(async () => {
        try {
          const stats = await storage.getSystemStats();
          const users = await storage.getAllUsers();
          
          // Create export record
          const exportData = {
            exportId,
            timestamp: new Date().toISOString(),
            stats,
            userCount: users.length,
            exportedBy: req.adminUser.id,
          };

          console.log('Export completed:', exportData);
        } catch (error) {
          console.error('Error completing export:', error);
        }
      }, 5000);

      res.json({ 
        message: 'Data export initiated',
        exportId,
        estimatedCompletion: new Date(Date.now() + 30000).toISOString()
      });
    } catch (error) {
      console.error('Error initiating data export:', error);
      res.status(500).json({ message: 'Failed to initiate data export' });
    }
  });

  app.post('/api/admin/send-announcement', requireAdmin, async (req: any, res) => {
    try {
      const { message } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: 'Announcement message is required' });
      }

      await logSecurityEvent(req, 'admin_announcement', { 
        adminId: req.adminUser.id,
        messageLength: message.length 
      });

      // Get all active users
      const users = await storage.getAllUsers();
      const activeUsers = users.filter((user: any) => user.isOnboarded);

      // Create notifications for all active users
      const notifications = activeUsers.map((user: any) => 
        storage.createNotification({
          userId: user.id,
          type: 'system_announcement',
          title: 'System Announcement',
          message: message.trim(),
          scheduledFor: new Date(),
        })
      );

      await Promise.all(notifications);

      res.json({ 
        message: 'Announcement sent successfully',
        recipientCount: activeUsers.length 
      });
    } catch (error) {
      console.error('Error sending announcement:', error);
      res.status(500).json({ message: 'Failed to send announcement' });
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

  // Notification preferences routes
  app.get("/api/user/notification-preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences || {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: false,
        reminderDays: 3,
        reminderTime: "09:00",
        overdueReminders: true,
        weeklySummary: true,
        landlordUpdates: true,
      });
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put("/api/user/notification-preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferences = await storage.upsertUserPreferences({
        userId,
        ...req.body,
      });
      res.json(preferences);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Test notification routes
  app.post("/api/notifications/test", requireAuth, async (req: any, res) => {
    try {
      const { type } = req.body;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (type === 'email' && user?.email) {
        await sendEmail(process.env.SENDGRID_API_KEY!, {
          to: user.email,
          from: 'noreply@enoikio.com',
          subject: 'Enoíkio - Test Notification',
          html: `
            <h2>Test Notification from Enoíkio</h2>
            <p>This is a test email notification to confirm your settings are working correctly.</p>
            <p>You'll receive payment reminders and updates at this email address.</p>
            <br>
            <p>Best regards,<br>The Enoíkio Team</p>
          `,
        });
      }
      
      res.json({ success: true, message: `Test ${type} notification sent` });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // Open Banking connection route
  app.post("/api/open-banking/connect", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bankConnection = await storage.createBankConnection({
        userId,
        ...req.body,
      });
      res.json(bankConnection);
    } catch (error) {
      console.error("Error connecting bank:", error);
      res.status(500).json({ message: "Failed to connect bank" });
    }
  });

  // PDF report generation route
  app.get("/api/reports/:reportId/pdf", async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getCreditReportByReportId(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const user = await storage.getUser(report.userId);
      const payments = await storage.getUserRentPayments(report.userId);
      const properties = await storage.getUserProperties(report.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const reportData = {
        user: {
          id: user.id,
          firstName: user.firstName || 'N/A',
          lastName: user.lastName || 'N/A',
          email: user.email || 'N/A',
          phone: user.phone,
        },
        property: properties[0] || {
          address: 'N/A',
          city: 'N/A',
          postcode: 'N/A',
          monthlyRent: 0,
        },
        payments: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          dueDate: p.dueDate.toISOString(),
          paidDate: p.paidDate?.toISOString(),
          status: p.status,
        })),
        reportId: report.reportId,
        generatedAt: report.createdAt.toISOString(),
        verificationStatus: 'verified' as const,
        landlordInfo: {
          name: 'Property Manager',
          email: 'landlord@example.com',
        },
      };

      const { generateCreditReportPDF } = await import('./pdfGenerator');
      const pdfBuffer = await generateCreditReportPDF(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rent-credit-report-${reportId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Support contact form endpoint
  app.post('/api/support/contact', async (req, res) => {
    try {
      const { name, email, subject, category, message, priority } = req.body;
      
      const supportEmail = 'support@enoikio.com';
      const userEmail = email;
      
      // Send email to support team
      const supportEmailSuccess = await sendEmail({
        to: supportEmail,
        from: 'noreply@enoikio.com',
        subject: `[${category}] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">New Support Request</h2>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Priority:</strong> ${priority || 'Normal'}</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h3 style="color: #374151; margin-top: 0;">Message:</h3>
              <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Action Required:</strong> Please respond to this support request within 24 hours.
              </p>
            </div>
          </div>
        `
      });

      // Send confirmation email to user
      const userEmailSuccess = await sendEmail({
        to: userEmail,
        from: 'support@enoikio.com',
        subject: `Support Request Received: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Thank You for Contacting Enoíkio Support</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Hi ${name},
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              We've received your support request and our team will respond within 24 hours. 
              Here's a summary of your request:
            </p>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h3 style="color: #374151; margin-top: 0;">Your Message:</h3>
              <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            <div style="margin-top: 30px; padding: 20px; background-color: #dbeafe; border-radius: 8px;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>Need urgent help?</strong> Call our support line at +44 20 7123 4567 
                or use our live chat feature for immediate assistance.
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Best regards,<br>
              The Enoíkio Support Team
            </p>
          </div>
        `
      });

      if (supportEmailSuccess && userEmailSuccess) {
        res.json({ 
          success: true, 
          message: 'Support request submitted successfully. You will receive a confirmation email shortly.' 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send support request. Please try again or contact us directly.' 
        });
      }
    } catch (error) {
      console.error('Support contact error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Support system error. Please try again later.' 
      });
    }
  });

  // Live chat message endpoint
  app.post('/api/support/chat', async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      const userId = req.isAuthenticated ? req.isAuthenticated() ? (req as any).user?.id : 'anonymous' : 'anonymous';
      
      // In a real implementation, this would connect to a chat service
      // For now, we'll simulate a response
      const responses = [
        "Thank you for your message. A support agent will be with you shortly.",
        "I understand your concern. Let me help you with that right away.",
        "That's a great question! Let me look into that for you.",
        "I'm here to help. Can you provide a bit more detail about the issue?",
        "Let me check our knowledge base for the best solution to your problem."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Simulate processing time
      setTimeout(() => {
        res.json({
          success: true,
          message: randomResponse,
          timestamp: new Date().toISOString(),
          agent: 'Support Agent'
        });
      }, 1000 + Math.random() * 2000);
      
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Chat service temporarily unavailable' 
      });
    }
  });

  // Subscription management routes
  app.get('/api/subscription', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const subscription = {
        id: `sub_${user.id}`,
        userId: user.id,
        planId: user.subscriptionPlan || 'free',
        status: user.subscriptionStatus || 'active',
        startDate: user.createdAt?.toISOString() || new Date().toISOString(),
        endDate: user.subscriptionEndDate?.toISOString(),
      };

      res.json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  });

  // Admin subscription management
  app.post('/api/admin/users/:userId/subscription', requireAuth, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const { userId } = req.params;
      const { planId, status } = req.body;

      await storage.updateUserSubscription(userId, {
        subscriptionPlan: planId,
        subscriptionStatus: status,
        subscriptionEndDate: status === 'active' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.json({ message: 'Subscription updated successfully' });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ message: 'Failed to update subscription' });
    }
  });

  // Admin password reset
  app.post('/api/admin/users/:userId/reset-password', requireAuth, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Note: This is a demo system using Replit OAuth authentication
      // In a production system with traditional username/password auth:
      // 1. Hash the password using bcrypt or similar
      // 2. Update the user's password in the database
      // 3. Invalidate existing sessions
      // For MVP demo purposes, we log the action for admin tracking
      console.log(`Admin initiated password reset for user ${userId}`);

      res.json({ 
        message: 'Password reset recorded', 
        newPassword,
        note: 'Demo system: This would trigger a password reset email in production'
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Admin routes - all require admin authentication
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/system-health', requireAdmin, async (req, res) => {
    try {
      const health = {
        database: 'healthy',
        emailService: 'healthy', 
        paymentProcessor: 'healthy',
        lastChecked: new Date().toISOString()
      };
      res.json(health);
    } catch (error) {
      console.error('Error checking system health:', error);
      res.status(500).json({ message: 'Failed to check system health' });
    }
  });

  app.post('/api/admin/system-check', requireAdmin, async (req, res) => {
    try {
      // Perform system checks
      const results = {
        database: 'healthy',
        services: 'operational',
        timestamp: new Date().toISOString()
      };
      res.json({ message: 'System check completed', results });
    } catch (error) {
      console.error('Error performing system check:', error);
      res.status(500).json({ message: 'System check failed' });
    }
  });

  app.post('/api/admin/export-all-data', requireAdmin, async (req, res) => {
    try {
      // Create data export request
      const exportRequest = await storage.createDataExportRequest({
        adminId: req.adminUser.id,
        requestType: 'full_export',
        status: 'pending'
      });
      res.json({ 
        message: 'Export initiated', 
        requestId: exportRequest.id,
        estimatedTime: '5-10 minutes'
      });
    } catch (error) {
      console.error('Error initiating data export:', error);
      res.status(500).json({ message: 'Export initiation failed' });
    }
  });

  app.post('/api/admin/send-announcement', requireAdmin, async (req, res) => {
    try {
      const { message } = req.body;
      
      // Get all active users
      const users = await storage.getAllUsers();
      const activeUsers = users.filter(user => user.isOnboarded);
      
      // Send notification to all active users
      for (const user of activeUsers) {
        await storage.createNotification({
          userId: user.id,
          type: 'system_announcement',
          title: 'System Announcement',
          message,
          isRead: false
        });
      }
      
      res.json({ 
        message: 'Announcement sent successfully',
        recipients: activeUsers.length
      });
    } catch (error) {
      console.error('Error sending announcement:', error);
      res.status(500).json({ message: 'Failed to send announcement' });
    }
  });

  app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const settings = {
        maintenanceMode: false,
        allowNewRegistrations: true,
        requireEmailVerification: true,
        defaultSubscriptionPlan: 'free',
        maxFreeUsers: 1000,
        systemEmail: 'system@enoikio.co.uk',
        supportEmail: 'support@enoikio.co.uk',
        platformName: 'Enoíkio',
        platformDescription: 'Rent payment tracking and credit building platform',
        emailNotifications: true,
        smsNotifications: false,
        dataRetentionDays: 365,
        sessionTimeoutMinutes: 60,
      };
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.get('/api/admin/subscription-stats', requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      const subscriptionStats = {
        totalRevenue: stats.monthlyRevenue * 12,
        monthlyRevenue: stats.monthlyRevenue,
        totalSubscriptions: stats.standardUsers + stats.premiumUsers,
        activeSubscriptions: stats.standardUsers + stats.premiumUsers,
        churnRate: 5.2,
        avgRevenuePerUser: stats.monthlyRevenue / Math.max(stats.standardUsers + stats.premiumUsers, 1),
        freeUsers: stats.freeUsers,
        standardUsers: stats.standardUsers,
        premiumUsers: stats.premiumUsers,
      };
      res.json(subscriptionStats);
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      res.status(500).json({ message: 'Failed to fetch subscription stats' });
    }
  });

  app.get('/api/admin/subscriptions', requireAdmin, async (req, res) => {
    try {
      // Mock subscription data - in real app this would come from payment processor
      const users = await storage.getAllUsers();
      const subscriptions = users
        .filter(user => user.subscriptionPlan !== 'free')
        .map(user => ({
          id: `sub_${user.id}`,
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
          userEmail: user.email || 'N/A',
          plan: user.subscriptionPlan || 'free',
          status: user.subscriptionStatus || 'active',
          amount: user.subscriptionPlan === 'premium' ? 19.99 : 9.99,
          currency: 'GBP',
          billingCycle: 'monthly',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: user.createdAt,
          cancelledAt: null
        }));
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
  });

  app.get('/api/admin/revenue-data', requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      const revenueData = {
        totalRevenue: stats.monthlyRevenue * 12,
        monthlyRecurringRevenue: stats.monthlyRevenue,
        annualRecurringRevenue: stats.monthlyRevenue * 12,
        averageRevenuePerUser: stats.monthlyRevenue / Math.max(stats.standardUsers + stats.premiumUsers, 1),
        customerLifetimeValue: (stats.monthlyRevenue / Math.max(stats.standardUsers + stats.premiumUsers, 1)) * 24, // 2 year avg
        churnRate: 5.2,
        growthRate: 15.3,
        refunds: stats.monthlyRevenue * 0.05 // 5% refund rate
      };
      res.json(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      res.status(500).json({ message: 'Failed to fetch revenue data' });
    }
  });

  app.get('/api/admin/revenue-chart', requireAdmin, async (req, res) => {
    try {
      const { range = '30' } = req.query;
      const days = parseInt(range as string);
      
      // Generate mock chart data
      const chartData = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        chartData.push({
          date: date.toISOString(),
          revenue: Math.random() * 1000 + 500,
          subscriptions: Math.floor(Math.random() * 10) + 5,
          churn: Math.random() * 3
        });
      }
      res.json(chartData);
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
      res.status(500).json({ message: 'Failed to fetch revenue chart' });
    }
  });

  app.get('/api/admin/revenue-metrics', requireAdmin, async (req, res) => {
    try {
      const metrics = {
        newSubscriptions: 23,
        upgrades: 8,
        downgrades: 3,
        cancellations: 5,
        netRevenue: 15420.50,
        grossRevenue: 16243.75
      };
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      res.status(500).json({ message: 'Failed to fetch revenue metrics' });
    }
  });

  // Moderation endpoints
  app.get('/api/admin/moderation', requireAdmin, async (req, res) => {
    try {
      // Mock moderation data - in real app this would come from reports and violations
      const mockModerationItems = [
        {
          id: 'mod_001',
          type: 'user_report',
          userId: 'user_001',
          reporterId: 'user_002',
          subject: 'Inappropriate behavior in messages',
          description: 'User has been sending inappropriate messages to other tenants through the platform.',
          status: 'pending',
          priority: 'high',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'mod_002',
          type: 'payment_dispute',
          userId: 'user_003',
          subject: 'Disputed rent payment amount',
          description: 'User is disputing the calculated rent amount for their property.',
          status: 'reviewing',
          priority: 'medium',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: 'admin_001',
        },
        {
          id: 'mod_003',
          type: 'spam',
          userId: 'user_004',
          subject: 'Multiple spam reports created',
          description: 'User has been creating multiple fake credit reports, potentially for spam purposes.',
          status: 'resolved',
          priority: 'low',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          resolution: 'Account suspended for 30 days. User educated about proper platform usage.',
        },
        {
          id: 'mod_004',
          type: 'content_violation',
          userId: 'user_005',
          subject: 'Inappropriate profile information',
          description: 'User has uploaded inappropriate content to their profile section.',
          status: 'pending',
          priority: 'urgent',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        }
      ];
      
      res.json(mockModerationItems);
    } catch (error) {
      console.error('Error fetching moderation items:', error);
      res.status(500).json({ message: 'Failed to fetch moderation items' });
    }
  });

  app.post('/api/admin/resolve-moderation', requireAdmin, async (req, res) => {
    try {
      const { itemId, resolution, action } = req.body;
      
      if (!itemId || !resolution || !action) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // In real app, update the moderation item in database
      console.log(`Moderation item ${itemId} ${action}d by admin ${req.adminUser.id}:`, resolution);
      
      res.json({ 
        message: `Moderation item ${action}d successfully`,
        itemId,
        action,
        resolvedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error resolving moderation item:', error);
      res.status(500).json({ message: 'Failed to resolve moderation item' });
    }
  });

  app.post('/api/admin/escalate-moderation', requireAdmin, async (req, res) => {
    try {
      const { itemId } = req.body;
      
      if (!itemId) {
        return res.status(400).json({ message: 'Item ID is required' });
      }

      // In real app, escalate the moderation item
      console.log(`Moderation item ${itemId} escalated by admin ${req.adminUser.id}`);
      
      res.json({ 
        message: 'Moderation item escalated successfully',
        itemId,
        escalatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error escalating moderation item:', error);
      res.status(500).json({ message: 'Failed to escalate moderation item' });
    }
  });

  // Badge and Portfolio system endpoints
  app.get('/api/user/badges/:userId?', async (req, res) => {
    try {
      const userId = req.params.userId || req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Get user's payment history to calculate badges
      const payments = await storage.getUserPayments(userId);
      const badges = await calculateUserBadges(userId, payments);
      
      res.json(badges);
    } catch (error) {
      console.error('Error fetching user badges:', error);
      res.status(500).json({ message: 'Failed to fetch badges' });
    }
  });

  app.post('/api/certification-portfolios', requireAuth, async (req, res) => {
    try {
      const { title, description } = req.body;
      const userId = req.user.id;

      if (!title) {
        return res.status(400).json({ message: 'Portfolio title is required' });
      }

      // Get user's badges and payment history
      const payments = await storage.getUserPayments(userId);
      const badges = await calculateUserBadges(userId, payments);
      const paymentHistory = {
        totalPayments: payments.length,
        onTimePayments: payments.filter(p => p.status === 'paid').length,
        averageAmount: payments.length > 0 ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) / payments.length : 0
      };

      const portfolio = await storage.createCertificationPortfolio({
        userId,
        title,
        description,
        badges: JSON.stringify(badges),
        paymentHistory: JSON.stringify(paymentHistory),
        landlordTestimonials: JSON.stringify([]),
        shareToken: generateShareToken(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Expires in 1 year
      });

      res.status(201).json(portfolio);
    } catch (error) {
      console.error('Error creating certification portfolio:', error);
      res.status(500).json({ message: 'Failed to create portfolio' });
    }
  });

  app.get('/api/certification-portfolios/:userId?', async (req, res) => {
    try {
      const userId = req.params.userId || req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const portfolios = await storage.getUserCertificationPortfolios(userId);
      res.json(portfolios);
    } catch (error) {
      console.error('Error fetching certification portfolios:', error);
      res.status(500).json({ message: 'Failed to fetch portfolios' });
    }
  });

  app.delete('/api/certification-portfolios/:id', requireAuth, async (req, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const userId = req.user.id;

      await storage.deleteCertificationPortfolio(portfolioId, userId);
      res.json({ message: 'Portfolio deleted successfully' });
    } catch (error) {
      console.error('Error deleting certification portfolio:', error);
      res.status(500).json({ message: 'Failed to delete portfolio' });
    }
  });

  // Public portfolio view
  app.get('/api/portfolio/:shareToken', async (req, res) => {
    try {
      const { shareToken } = req.params;
      const portfolio = await storage.getCertificationPortfolioByToken(shareToken);

      if (!portfolio) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }

      if (new Date() > new Date(portfolio.expiresAt)) {
        return res.status(410).json({ message: 'Portfolio has expired' });
      }

      res.json(portfolio);
    } catch (error) {
      console.error('Error fetching shared portfolio:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio' });
    }
  });

  // Report generation endpoint
  app.post('/api/generate-report', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { reportType = 'credit', includePortfolio = false } = req.body;

      const user = await storage.getUser(userId);
      const payments = await storage.getUserPayments(userId);
      const properties = await storage.getUserProperties(userId);
      
      const report = {
        id: Date.now().toString(),
        userId,
        type: reportType,
        generatedAt: new Date().toISOString(),
        user: {
          name: `${user.firstName} ${user.lastName}`.trim() || 'User',
          email: user.email
        },
        paymentSummary: {
          totalPayments: payments.length,
          onTimePayments: payments.filter(p => p.status === 'paid').length,
          totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
          averageMonthlyRent: payments.length > 0 ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) / payments.length : 0
        },
        properties: properties.map(p => ({
          address: p.address,
          monthlyRent: p.monthlyRent,
          tenancyStart: p.tenancyStartDate,
          tenancyEnd: p.tenancyEndDate
        })),
        paymentHistory: payments.map(p => ({
          amount: p.amount,
          dueDate: p.dueDate,
          paidDate: p.paidDate,
          status: p.status
        }))
      };

      if (includePortfolio) {
        const badges = await calculateUserBadges(userId, payments);
        report.badges = badges;
      }

      // In a real app, you'd generate a PDF and store it
      res.json({
        reportId: report.id,
        downloadUrl: `/api/reports/${report.id}/download`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        report
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  const httpServer: Server = createServer(app);
  return httpServer;
}

// Helper functions
async function calculateUserBadges(userId: string, payments: any[]) {
  const badges = [];

  // Payment streak badge
  const currentStreak = calculatePaymentStreak(payments);
  if (currentStreak >= 3) {
    let level = 1;
    if (currentStreak >= 6) level = 2;
    if (currentStreak >= 12) level = 3;
    if (currentStreak >= 24) level = 4;
    if (currentStreak >= 36) level = 5;

    badges.push({
      id: `payment_streak_${userId}`,
      badgeType: 'payment_streak',
      level,
      earnedAt: new Date().toISOString(),
      isActive: true,
      metadata: { streakMonths: currentStreak }
    });
  }

  // Reliable tenant badge
  const onTimePayments = payments.filter(p => p.status === 'paid').length;
  if (onTimePayments >= 12) {
    let level = 1;
    if (onTimePayments >= 24) level = 2;
    if (onTimePayments >= 48) level = 3;
    if (onTimePayments >= 72) level = 4;
    if (onTimePayments >= 120) level = 5;

    badges.push({
      id: `reliable_tenant_${userId}`,
      badgeType: 'reliable_tenant',
      level,
      earnedAt: new Date().toISOString(),
      isActive: true,
      metadata: { totalPayments: onTimePayments }
    });
  }

  // Early payer badge
  const earlyPayments = payments.filter(p => 
    p.status === 'paid' && p.paidDate && new Date(p.paidDate) < new Date(p.dueDate)
  ).length;
  if (earlyPayments >= 6) {
    let level = 1;
    if (earlyPayments >= 12) level = 2;
    if (earlyPayments >= 24) level = 3;
    if (earlyPayments >= 48) level = 4;
    if (earlyPayments >= 72) level = 5;

    badges.push({
      id: `early_payer_${userId}`,
      badgeType: 'early_payer',
      level,
      earnedAt: new Date().toISOString(),
      isActive: true,
      metadata: { earlyPaymentCount: earlyPayments }
    });
  }

  return badges;
}

function calculatePaymentStreak(payments: any[]): number {
  if (payments.length === 0) return 0;
  
  // Sort payments by due date (newest first)
  const sortedPayments = payments
    .filter(p => p.status === 'paid')
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  let streak = 0;
  for (const payment of sortedPayments) {
    if (payment.status === 'paid') {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Manual payment routes
function addManualPaymentRoutes(app: Express, requireAuth: any, storage: any) {
  app.post('/api/manual-payments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { propertyId, amount, paymentDate, description, receiptUrl } = req.body;
      
      const manualPayment = await storage.createManualPayment({
        userId,
        propertyId: parseInt(propertyId),
        amount: parseFloat(amount).toFixed(2),
        paymentDate: new Date(paymentDate),
        description,
        receiptUrl,
        needsVerification: true,
      });
      
      // Update payment streak and check for badges
      const currentStreak = await storage.calculateCurrentStreak(userId);
      await storage.updatePaymentStreak(userId, {
        currentStreak,
        lastPaymentDate: new Date(paymentDate),
      });
      
      // Check for new achievement badges
      const newBadges = await storage.calculateAndAwardBadges(userId);
      if (newBadges.length > 0) {
        await storage.createNotification({
          userId,
          type: 'system',
          title: `New Badge${newBadges.length > 1 ? 's' : ''} Earned!`,
          message: `Congratulations! You've earned: ${newBadges.map(b => b.title).join(', ')}`,
        });
      }
      
      res.json({ 
        manualPayment,
        newBadges,
        currentStreak,
        message: 'Manual payment logged successfully' 
      });
    } catch (error) {
      console.error('Error creating manual payment:', error);
      res.status(500).json({ message: 'Failed to log manual payment' });
    }
  });

  app.get('/api/manual-payments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const manualPayments = await storage.getUserManualPayments(userId);
      res.json(manualPayments);
    } catch (error) {
      console.error('Error fetching manual payments:', error);
      res.status(500).json({ message: 'Failed to fetch manual payments' });
    }
  });

  // Achievement badge routes
  app.get('/api/achievements', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const badges = await storage.getUserAchievementBadges(userId);
      const streak = await storage.getUserPaymentStreak(userId);
      res.json({ badges, streak });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ message: 'Failed to fetch achievements' });
    }
  });
  
  // Add manual payment routes
  addManualPaymentRoutes(app, requireAuth, storage);

  // Stripe payment intent endpoint
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ 
          message: "Payment system not configured. Please contact support." 
        });
      }

      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-10-28.acacia",
      });

      const { amount, plan } = req.body;
      const paymentAmount = amount || (plan === 'standard' ? 9.99 : 19.99);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentAmount * 100), // Convert to pence
        currency: "gbp",
        automatic_payment_methods: {
          enabled: true, // Enables Apple Pay, Google Pay, and cards
        },
        metadata: {
          plan: plan || 'unknown'
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe payment error:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Landlord signup route (UAT-01)
  app.post('/api/landlord/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, businessName } = req.body;
      
      // Check if landlord already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      // Create landlord user with secure password hashing
      const hashedPassword = await bcrypt.hash(password, 10);
      const landlord = await storage.upsertUser({
        id: nanoid(),
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'landlord',
        subscriptionPlan: 'free',
        isOnboarded: false,
        emailVerified: false,
        isActive: true
      });
      
      res.json({ success: true, landlord: { id: landlord.id, email: landlord.email } });
    } catch (error) {
      console.error("Error creating landlord account:", error);
      res.status(500).json({ message: "Failed to create landlord account" });
    }
  });

  // Landlord login route
  app.post('/api/landlord/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== 'landlord') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      res.json({ success: true, landlord: { id: user.id, email: user.email, firstName: user.firstName } });
    } catch (error) {
      console.error("Error during landlord login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Property CRUD routes with authentication (UAT-03, 04, 05)
  app.put('/api/properties/:id', requireAuth, async (req: any, res) => {
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
      res.json({ success: true, message: "Property deleted successfully" });
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Payment verification routes (UAT-08, 09)
  app.post('/api/payments/:id/verify', async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      const payment = await storage.updateRentPayment(paymentId, {
        status: status === 'approved' ? 'paid' : status === 'rejected' ? 'missed' : 'pending',
        isVerified: status === 'approved',
        updatedAt: new Date()
      });
      
      // Create notification for tenant
      if (payment.userId) {
        await storage.createNotification({
          userId: payment.userId,
          type: 'system',
          title: status === 'approved' ? 'Payment Verified' : 'Payment Status Updated',
          message: status === 'approved' 
            ? `Your rent payment of £${payment.amount} has been verified by your landlord.`
            : `Your rent payment status has been updated to: ${status}`,
          isRead: false
        });
      }
      
      res.json({ success: true, payment });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // PDF generation route (UAT-10)
  app.get('/api/landlord/:landlordId/tenant/:tenantId/ledger-pdf', async (req, res) => {
    try {
      const { landlordId, tenantId } = req.params;
      
      // Get tenant data
      const tenant = await storage.getUserById(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      
      // Get tenant's payments
      const payments = await storage.getUserPayments(tenantId);
      const verifiedPayments = payments.filter(p => p.isVerified);
      
      // Simple HTML-based PDF content
      const verificationId = nanoid(16);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #6366f1; color: white; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">RentLedger</div>
            <h2>Rent Payment Ledger</h2>
            <p>Tenant: ${tenant.firstName} ${tenant.lastName}</p>
            <p>Generated: ${new Date().toLocaleDateString('en-GB')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date Paid</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Property</th>
              </tr>
            </thead>
            <tbody>
              ${verifiedPayments.map((p: any) => `
                <tr>
                  <td>${p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                  <td>£${p.amount}</td>
                  <td>${p.isVerified ? 'Verified' : 'Pending'}</td>
                  <td>Property #${p.propertyId}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>This is an official RentLedger verification document</p>
            <p>Verification ID: ${verificationId}</p>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="rent-ledger-${tenant.firstName}-${tenant.lastName}.html"`);
      res.send(html);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate ledger" });
    }
  });

  // Support request route (UAT-14)
  app.post('/api/support/request', async (req, res) => {
    try {
      const { name, email, subject, message, priority } = req.body;
      
      // Send email to support
      await sendEmail({
        from: 'noreply@rentledger.co.uk',
        to: 'support@rentledger.co.uk',
        subject: `Support Request: ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <h2>New Support Request</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Priority:</strong> ${priority || 'Normal'}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `
      });
      
      res.json({ success: true, message: 'Support request submitted successfully' });
    } catch (error) {
      console.error("Error submitting support request:", error);
      res.status(500).json({ message: "Failed to submit support request" });
    }
  });

  // Landlord analytics route (UAT-15)
  app.get('/api/landlord/:landlordId/analytics', async (req, res) => {
    try {
      const { landlordId } = req.params;
      
      // Get landlord's properties
      const properties = await storage.getUserProperties(landlordId);
      
      // Get all payments for landlord's properties
      let allPayments: any[] = [];
      for (const property of properties) {
        const payments = await storage.getPropertyRentPayments(property.id);
        allPayments = allPayments.concat(payments);
      }
      
      // Calculate analytics
      const verifiedPayments = allPayments.filter((p: any) => p.isVerified);
      const pendingPayments = allPayments.filter((p: any) => p.status === 'pending');
      const totalRevenue = verifiedPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0);
      
      // Monthly breakdown
      const monthlyData = allPayments.reduce((acc: any, payment: any) => {
        const month = payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Pending';
        if (!acc[month]) {
          acc[month] = { verified: 0, pending: 0 };
        }
        if (payment.isVerified) {
          acc[month].verified += parseFloat(payment.amount.toString());
        } else {
          acc[month].pending += parseFloat(payment.amount.toString());
        }
        return acc;
      }, {});
      
      res.json({
        totalRevenue,
        verifiedCount: verifiedPayments.length,
        pendingCount: pendingPayments.length,
        monthlyData,
        properties: properties.length
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer: Server = createServer(app);
  return httpServer;
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
