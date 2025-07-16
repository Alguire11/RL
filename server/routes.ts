import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertPropertySchema, insertRentPaymentSchema, insertBankConnectionSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
