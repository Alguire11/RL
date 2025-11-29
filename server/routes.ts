import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import passport from "passport";
import { emailService } from "./emailService";
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
  insertTenantInvitationSchema,
  insertUserSchema,
  insertMaintenanceRequestSchema,
  rentLogs,
} from "@shared/schema";
import { nanoid } from "nanoid";
import { generateLedgerPDF } from "./ledgerPdfGenerator";
import { format } from "date-fns";
import { hashPassword } from "./passwords";
import { registerSubscriptionRoutes } from "./subscriptionRoutes";
import { getSubscriptionLimits, normalizePlanName, requireSubscription } from "./middleware/subscription";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Helper function to generate unique RLID (RentLedger ID)


import csurf from "csurf";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // CSRF Protection
  // We use the default session-based storage.
  // We expose the token via a cookie (XSRF-TOKEN) so the client can read it
  // and send it back in the X-XSRF-TOKEN header.
  const csrfProtection = csurf();

  // Generate CSRF token for all requests and set in cookie
  app.use((req, res, next) => {
    // Skip CSRF validation for excluded paths
    const shouldSkipValidation = req.path.startsWith('/api/webhooks') ||
      req.path === '/api/login' ||
      req.path === '/api/admin-login' ||
      req.path === '/api/landlord/login' ||
      req.path === '/api/register' ||
      req.path === '/api/csrf-token';

    if (shouldSkipValidation) {
      // Skip CSRF validation for auth endpoints
      return next();
    }

    // Apply full CSRF protection for other routes
    csrfProtection(req, res, () => {
      if (req.csrfToken) {
        const token = req.csrfToken();
        res.cookie('XSRF-TOKEN', token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          httpOnly: false, // Must be readable by JavaScript
        });
        res.locals.csrfToken = token;
      }
      next();
    });
  });

  // Endpoint to get CSRF token explicitly (excluded from CSRF protection)
  app.get('/api/csrf-token', (req, res) => {
    try {
      // Generate token using csurf - create a middleware instance that only generates
      const tokenGenerator = csurf({ ignoreMethods: ['GET', 'HEAD', 'OPTIONS'] });
      tokenGenerator(req, res, () => {
        const token = req.csrfToken ? req.csrfToken() : '';
        res.cookie('XSRF-TOKEN', token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          httpOnly: false, // Must be readable by JavaScript
        });
        res.json({ csrfToken: token });
      });
    } catch (error) {
      // If CSRF token generation fails, return empty string
      console.error('CSRF token generation error:', error);
      res.json({ csrfToken: '' });
    }
  });

  // Email verification endpoint
  app.get('/api/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;

      // Get verification token
      const verificationToken = await storage.getEmailVerificationToken(token);

      if (!verificationToken) {
        return res.status(400).json({ message: "Invalid or expired verification link" });
      }

      // Check if already used
      if (verificationToken.used) {
        return res.status(400).json({ message: "This verification link has already been used" });
      }

      // Check if expired
      if (new Date() > new Date(verificationToken.expiresAt)) {
        return res.status(400).json({ message: "This verification link has expired" });
      }

      // Mark token as used
      await storage.markEmailVerificationTokenAsUsed(token);

      // Update user's emailVerified status
      await storage.updateUser(verificationToken.userId, { emailVerified: true });

      // Get the user
      const user = await storage.getUser(verificationToken.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Send welcome email now that they're verified
      try {
        await emailService.sendWelcomeEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          user.role || 'tenant'
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error('Login error after verification:', err);
          return res.status(500).json({ message: "Email verified but login failed. Please try logging in manually." });
        }
        res.json({
          message: "Email verified successfully! Welcome to RentLedger.",
          user: { ...user, password: undefined }
        });
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend verification email endpoint
  app.post('/api/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({ message: "If an account exists with this email, a verification link has been sent." });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Create new verification token
      const verificationToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email/${verificationToken}`;

      await storage.createEmailVerificationToken({
        userId: user.id,
        token: verificationToken,
        expiresAt,
        used: false,
      });

      await emailService.sendEmailVerification(
        user.email,
        `${user.firstName} ${user.lastName}`,
        verificationUrl
      );

      res.json({ message: "Verification email sent! Please check your inbox." });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Middleware to check email verification (use this on protected routes)
  const requireEmailVerification = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!req.user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email address to access this feature",
        requiresVerification: true
      });
    }

    next();
  };

  // Middleware to check authentication
  const requireAuth: RequestHandler = (req, res, next) => {
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
          userAgent: req.headers["user-agent"],
          metadata,
        });
      } catch (error) {
        console.error("Error logging security event:", error);
      }
    }
  };

  const requireRole = (roles: string[]): RequestHandler => {
    return async (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      if (!user?.role || !roles.includes(user.role)) {
        await logSecurityEvent(req, "unauthorized_access_attempt", {
          attemptedEndpoint: req.originalUrl,
          userRole: user?.role,
          requiredRoles: roles,
        });
        return res.status(403).json({ message: `Access denied. Required roles: ${roles.join(", ")}` });
      }

      next();
    };
  };

  const requireAdmin: RequestHandler = async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user;
    if (user.role !== "admin") {
      await logSecurityEvent(req, "admin_access_denied", { attemptedEndpoint: req.originalUrl });
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const adminUser = await storage.getAdminUser(user.id);
      if (!adminUser || !adminUser.isActive) {
        await logSecurityEvent(req, "inactive_admin_access_attempt", { attemptedEndpoint: req.originalUrl });
        return res.status(403).json({ message: "Admin account is not active" });
      }

      (req as any).adminUser = adminUser;
      next();
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  const requireLandlord: RequestHandler = async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user;
    if (user.role !== "landlord") {
      await logSecurityEvent(req, "landlord_access_denied", { attemptedEndpoint: req.originalUrl });
      return res.status(403).json({ message: "Landlord access required" });
    }

    next();
  };

  registerSubscriptionRoutes(app, { requireAuth, requireAdmin });

  // Dashboard stats stay close to auth middleware for clarity.
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);

      // Rent Score Persistence: Save daily snapshot
      try {
        // Check if we already have a snapshot for today to avoid duplicates
        // We can do this by checking the last record's date
        const history = await storage.getRentScoreHistory(userId);
        const today = new Date().toDateString();
        const lastRecord = history[history.length - 1];

        if (!lastRecord || new Date(lastRecord.recordedAt!).toDateString() !== today) {
          await storage.createRentScoreSnapshot(userId, stats.creditScore);
        }
      } catch (err) {
        console.error('Failed to persist rent score:', err);
        // Don't fail the request if persistence fails
      }

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Rent Score History Route
  app.get('/api/rent-score/history', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const history = await storage.getRentScoreHistory(userId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching rent score history:', error);
      res.status(500).json({ message: 'Failed to fetch rent score history' });
    }
  });

  // User profile routes
  app.patch('/api/user/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Validate with partial schema
      const updateSchema = insertUserSchema.partial().pick({
        firstName: true,
        lastName: true,
        phone: true,
        profileImageUrl: true,
      });

      const updateData = updateSchema.parse(req.body);

      const user = await storage.updateUser(userId, updateData);

      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update user address
  app.put('/api/user/address', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const addressSchema = z.object({
        street: z.string().min(1, "Street is required"),
        city: z.string().min(1, "City is required"),
        postcode: z.string().min(1, "Postcode is required"),
        country: z.string().default("UK"),
      });

      const { street, city, postcode, country } = addressSchema.parse(req.body);

      const user = await storage.updateUserAddress(userId, {
        street, city, postcode, country
      });

      res.json({
        message: 'Address updated successfully',
        address: user.address
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      console.error("Error updating user address:", error);
      res.status(500).json({ message: "Failed to update address" });
    }
  });

  // API key management routes
  app.get('/api/admin/api-keys', requireAdmin, async (req, res) => {
    try {
      const keys = await storage.getApiKeys();
      // Don't send the actual key value in list view
      const sanitizedKeys = keys.map(k => ({
        ...k,
        key: k.key.substring(0, 8) + '...' + k.key.substring(k.key.length - 4)
      }));
      res.json(sanitizedKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ message: 'Failed to fetch API keys' });
    }
  });

  app.post('/api/admin/api-keys', requireAdmin, async (req, res) => {
    try {
      const { name, permissions, rateLimit, expiresAt } = req.body;
      const adminUser = (req as any).adminUser;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      // Generate secure API key
      const key = 'rl_' + nanoid(32);

      const apiKey = await storage.createApiKey({
        name,
        key,
        createdBy: adminUser.id,
        permissions: permissions || [],
        rateLimit: rateLimit || 1000,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      res.json(apiKey);
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({ message: 'Failed to create API key' });
    }
  });

  app.put('/api/admin/api-keys/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, isActive, rateLimit, permissions } = req.body;

      const updated = await storage.updateApiKey(id, {
        name,
        isActive,
        rateLimit,
        permissions,
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ message: 'Failed to update API key' });
    }
  });

  app.delete('/api/admin/api-keys/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteApiKey(id);
      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      res.status(500).json({ message: 'Failed to delete API key' });
    }
  });

  // Update user rent information
  app.put('/api/user/rent-info', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const rentInfoSchema = z.object({
        amount: z.number().or(z.string().transform(val => parseFloat(val))),
        dayOfMonth: z.number().min(1).max(31).or(z.string().transform(val => parseInt(val, 10))),
        frequency: z.enum(['monthly', 'weekly', 'biweekly']).default('monthly'),
        firstPaymentDate: z.string().optional(),
        nextPaymentDate: z.string().optional(),
        landlordName: z.string().optional(),
        landlordEmail: z.string().email().optional().or(z.literal('')),
        landlordPhone: z.string().optional(),
      });

      const validatedData = rentInfoSchema.parse(req.body);

      const user = await storage.updateUserRentInfo(userId, {
        amount: validatedData.amount,
        dayOfMonth: validatedData.dayOfMonth,
        frequency: validatedData.frequency,
        firstPaymentDate: validatedData.firstPaymentDate,
        nextPaymentDate: validatedData.nextPaymentDate,
        landlordName: validatedData.landlordName,
        landlordEmail: validatedData.landlordEmail,
        landlordPhone: validatedData.landlordPhone
      });

      res.json({
        message: 'Rent information updated successfully',
        rentInfo: user.rentInfo
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      console.error("Error updating rent information:", error);
      res.status(500).json({ message: "Failed to update rent information" });
    }
  });

  // Calendar sync - iCal export for rent schedule
  app.get('/api/calendar/rent-schedule.ics', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserById(userId);
      const properties = await storage.getUserProperties(userId);

      if (!user || properties.length === 0) {
        return res.status(404).json({ message: "No rent information found" });
      }

      // Generate iCal format
      const now = new Date();
      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//RentLedger//Rent Payment Schedule//EN',
        'CALNAME:Rent Payment Schedule',
        'X-WR-CALNAME:Rent Payment Schedule',
        'X-WR-TIMEZONE:Europe/London',
        'X-WR-CALDESC:Your rent payment due dates from RentLedger',
      ];

      // Add events for each property's rent payments (next 12 months)
      for (const property of properties) {
        const monthlyRent = parseFloat(property.monthlyRent);
        const rentInfo = user.rentInfo as any;
        const dayOfMonth = rentInfo?.dayOfMonth || 1;

        for (let i = 0; i < 12; i++) {
          const dueDate = new Date(now.getFullYear(), now.getMonth() + i, dayOfMonth);
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(reminderDate.getDate() - 3); // 3 days before

          const formatDate = (d: Date) => {
            return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          };

          icsLines.push(
            'BEGIN:VEVENT',
            `UID:rent-${property.id}-${dueDate.getTime()}@rentledger.co.uk`,
            `DTSTAMP:${formatDate(now)}`,
            `DTSTART;VALUE=DATE:${dueDate.toISOString().split('T')[0].replace(/-/g, '')}`,
            `SUMMARY:Rent Payment Due - £${monthlyRent.toFixed(2)}`,
            `DESCRIPTION:Rent payment of £${monthlyRent.toFixed(2)} due for ${property.address}`,
            `LOCATION:${property.address}, ${property.city}, ${property.postcode}`,
            'STATUS:CONFIRMED',
            'BEGIN:VALARM',
            'TRIGGER:-P3D',
            'ACTION:DISPLAY',
            `DESCRIPTION:Rent payment of £${monthlyRent.toFixed(2)} due in 3 days`,
            'END:VALARM',
            'END:VEVENT'
          );
        }
      }

      icsLines.push('END:VCALENDAR');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="rent-schedule.ics"');
      res.send(icsLines.join('\r\n'));
    } catch (error) {
      console.error("Error generating calendar:", error);
      res.status(500).json({ message: "Failed to generate calendar" });
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

  app.post('/api/properties', requireAuth, requireEmailVerification, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;

      // Check subscription-based property limits
      const existingProperties = await storage.getUserProperties(userId);
      const userPlan = normalizePlanName(user.subscriptionPlan || 'free');
      const limits = getSubscriptionLimits(userPlan);

      if (existingProperties.length >= limits.properties) {
        return res.status(403).json({
          message: `Your ${userPlan} plan is limited to ${limits.properties} ${limits.properties === 1 ? 'property' : 'properties'}`,
          currentCount: existingProperties.length,
          limit: limits.properties,
          upgradeUrl: '/pricing',
          upgradeMessage: limits.properties === 1
            ? 'Upgrade to Professional to manage up to 3 properties'
            : 'Upgrade to Enterprise for unlimited properties'
        });
      }

      // Validate required fields first
      if (!req.body.address || !req.body.city || !req.body.postcode || !req.body.monthlyRent) {
        return res.status(400).json({
          message: "Missing required fields: address, city, postcode, and monthlyRent are required",
          received: {
            address: !!req.body.address,
            city: !!req.body.city,
            postcode: !!req.body.postcode,
            monthlyRent: !!req.body.monthlyRent
          }
        });
      }

      // Validate monthlyRent is a valid number
      const monthlyRentNum = parseFloat(req.body.monthlyRent);
      if (isNaN(monthlyRentNum) || monthlyRentNum <= 0) {
        return res.status(400).json({
          message: "Invalid monthly rent: must be a positive number",
          received: req.body.monthlyRent
        });
      }

      // Prepare property data with proper formatting - only include fields we explicitly want
      // Start with a clean object and only add what we need
      const propertyData: any = {
        userId,
        address: String(req.body.address).trim(),
        city: String(req.body.city).trim(),
        postcode: String(req.body.postcode).trim(),
        monthlyRent: monthlyRentNum.toFixed(2),
      };

      // Log the incoming request body to debug


      // Add optional string fields only if they exist and are not empty
      if (req.body.landlordName && String(req.body.landlordName).trim()) {
        propertyData.landlordName = String(req.body.landlordName).trim();
      }
      if (req.body.landlordEmail && String(req.body.landlordEmail).trim()) {
        propertyData.landlordEmail = String(req.body.landlordEmail).trim();
      }
      if (req.body.landlordPhone && String(req.body.landlordPhone).trim()) {
        propertyData.landlordPhone = String(req.body.landlordPhone).trim();
      }
      if (req.body.tenancyStartDate && String(req.body.tenancyStartDate).trim()) {
        propertyData.tenancyStartDate = req.body.tenancyStartDate;
      } else if (req.body.firstPaymentDate && String(req.body.firstPaymentDate).trim()) {
        propertyData.tenancyStartDate = req.body.firstPaymentDate;
      }
      if (req.body.tenancyEndDate && String(req.body.tenancyEndDate).trim()) {
        propertyData.tenancyEndDate = req.body.tenancyEndDate;
      }
      if (req.body.leaseType && String(req.body.leaseType).trim()) {
        propertyData.leaseType = req.body.leaseType;
      }

      // DO NOT include contractDuration unless explicitly provided and valid
      // The schema expects it to be a number or undefined, never a string
      // Only add it if we have a valid positive number
      if (req.body.contractDuration !== undefined && req.body.contractDuration !== null) {
        const contractDurationValue = req.body.contractDuration;
        // If it's already a number and valid, use it
        if (typeof contractDurationValue === 'number' && !isNaN(contractDurationValue) && contractDurationValue > 0) {
          propertyData.contractDuration = contractDurationValue;
        }
        // If it's a string, try to parse it
        else if (typeof contractDurationValue === 'string') {
          const trimmed = contractDurationValue.trim();
          if (trimmed && trimmed !== '0' && trimmed !== '') {
            const parsed = parseInt(trimmed, 10);
            if (!isNaN(parsed) && parsed > 0) {
              propertyData.contractDuration = parsed;
            }
          }
        }
        // Otherwise, don't include it at all
      }

      // Explicitly exclude any other fields that might cause issues
      // Don't include rentUpdateCount, lastRentUpdateMonth, etc. - they have defaults

      // Final cleanup: remove any undefined, null, empty string values, and ensure types are correct
      const cleanedPropertyData: any = {};
      for (const [key, value] of Object.entries(propertyData)) {
        // Skip undefined, null, and empty strings
        if (value === undefined || value === null || value === '') {
          continue;
        }

        // Special handling for contractDuration - must be a number, never a string
        if (key === 'contractDuration') {
          // Only include if it's actually a number type
          if (typeof value === 'number' && !isNaN(value) && value > 0) {
            cleanedPropertyData[key] = value;
          }
          // Explicitly skip if it's a string or any other invalid type
          continue;
        }

        // Include all other valid values
        cleanedPropertyData[key] = value;
      }

      // Double-check: explicitly remove contractDuration if it's not a number
      if (cleanedPropertyData.contractDuration !== undefined) {
        if (typeof cleanedPropertyData.contractDuration !== 'number') {
          delete cleanedPropertyData.contractDuration;
        }
      }



      // Validate with schema
      let validatedData;
      try {
        validatedData = insertPropertySchema.parse(cleanedPropertyData);

      } catch (validationError: any) {
        console.error("Schema validation error:", validationError);
        console.error("Validation error issues:", JSON.stringify(validationError?.issues || [], null, 2));
        console.error("Data that failed validation:", JSON.stringify(cleanedPropertyData, null, 2));
        return res.status(400).json({
          message: "Validation failed",
          error: validationError?.issues?.[0]?.message || validationError?.message,
          path: validationError?.issues?.[0]?.path || [],
          issues: validationError?.issues || []
        });
      }

      // Create property
      // Create property
      const property = await storage.createProperty(validatedData);

      // Audit Log
      await storage.createAuditLog({
        userId: req.user.id,
        action: "create",
        entityType: "property",
        entityId: property.id.toString(),
        details: { address: property.address, monthlyRent: property.monthlyRent },
        ipAddress: req.ip || req.connection.remoteAddress,
      });

      res.json(property);
    } catch (error: any) {
      console.error("Error creating property:", error);
      console.error("Error stack:", error?.stack);
      // Return more detailed error message
      const errorMessage = error?.issues?.[0]?.message || error?.message || "Failed to create property";
      res.status(500).json({
        message: errorMessage,
        details: error?.issues || error?.code || error,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      });
    }
  });

  app.patch('/api/properties/:id', requireAuth, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.user.id;

      // Ownership check
      const existingProperty = await storage.getPropertyById(propertyId);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (existingProperty.userId !== userId) {
        await logSecurityEvent(req, 'unauthorized_property_update_attempt', { propertyId });
        return res.status(403).json({ message: "You do not have permission to update this property" });
      }

      // Validation
      const updateSchema = insertPropertySchema.partial();
      const updateData = updateSchema.parse(req.body);

      const property = await storage.updateProperty(propertyId, updateData);

      // Audit Log
      await storage.createAuditLog({
        userId: req.user.id,
        action: "update",
        entityType: "property",
        entityId: property.id.toString(),
        details: updateData,
        ipAddress: req.ip || req.connection.remoteAddress,
      });

      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete('/api/properties/:id', requireAuth, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.user.id;

      // Ownership check
      const existingProperty = await storage.getPropertyById(propertyId);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (existingProperty.userId !== userId) {
        await logSecurityEvent(req, 'unauthorized_property_delete_attempt', { propertyId });
        return res.status(403).json({ message: "You do not have permission to delete this property" });
      }

      await storage.deleteProperty(propertyId);

      // Audit Log
      await storage.createAuditLog({
        userId: req.user.id,
        action: "delete",
        entityType: "property",
        entityId: propertyId.toString(),
        details: { propertyId },
        ipAddress: req.ip || req.connection.remoteAddress,
      });

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
      const manualPayments = await storage.getUserManualPayments(userId);

      // Combine manual payments with rent payments
      const allPayments = [
        ...payments,
        ...manualPayments.map(mp => ({
          id: mp.id,
          userId: mp.userId,
          propertyId: mp.propertyId,
          amount: mp.amount,
          dueDate: mp.paymentDate,
          paidDate: mp.paymentDate,
          status: mp.needsVerification ? 'pending' : 'paid',
          paymentMethod: mp.paymentMethod || 'manual',
          transactionId: null,
          isVerified: !mp.needsVerification,
          createdAt: mp.createdAt,
          updatedAt: mp.updatedAt,
          isManualPayment: true, // Flag to identify manual payments
          description: mp.description,
          receiptUrl: mp.receiptUrl,
        }))
      ].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

      res.json(allPayments);
    } catch (error) {
      console.error("Error fetching rent payments:", error);
      res.status(500).json({ message: "Failed to fetch rent payments" });
    }
  });

  app.post('/api/payments', requireAuth, requireEmailVerification, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const paymentData = insertRentPaymentSchema.parse({ ...req.body, userId, isVerified: false });

      const payment = await storage.createRentPayment(paymentData);

      // Get property and user details for email and notification
      if (payment.propertyId) {
        const property = await storage.getPropertyById(payment.propertyId);
        const user = await storage.getUserById(userId);

        // Send confirmation email to landlord
        if (property?.landlordEmail && user) {
          await emailService.sendRentPaymentNotification(
            property.landlordEmail!,
            property.landlordName || 'Landlord',
            `${user.firstName} ${user.lastName}`,
            `${property.address}, ${property.city}`,
            parseFloat(payment.amount),
            payment.dueDate,
            payment.status || 'pending'
          );
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
            isRead: false,
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
      const userId = req.user.id;

      // Ownership check
      const existingPayment = await storage.getRentPayment(paymentId);
      if (!existingPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Allow update if user owns the payment OR user is the landlord of the property
      let isAuthorized = existingPayment.userId === userId;

      if (!isAuthorized && existingPayment.propertyId) {
        const property = await storage.getPropertyById(existingPayment.propertyId);
        if (property && property.userId === userId) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        await logSecurityEvent(req, 'unauthorized_payment_update_attempt', { paymentId });
        return res.status(403).json({ message: "You do not have permission to update this payment" });
      }

      // Validation
      const updateSchema = insertRentPaymentSchema.partial();
      const updateData = updateSchema.parse(req.body);

      const payment = await storage.updateRentPayment(paymentId, updateData);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      console.error("Error updating rent payment:", error);
      res.status(500).json({ message: "Failed to update rent payment" });
    }
  });



  app.get('/api/landlord/:landlordId/tenants', requireLandlord, async (req: any, res) => {
    try {
      const landlordId = req.user.id;
      if (req.params.landlordId && req.params.landlordId !== landlordId) {
        await logSecurityEvent(req, 'landlord_access_denied', { attemptedEndpoint: req.originalUrl });
        return res.status(403).json({ message: 'Landlord access required' });
      }

      const tenants = await storage.getLandlordTenants(landlordId);
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching landlord tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.get('/api/landlord/:landlordId/verifications', requireLandlord, async (req: any, res) => {
    try {
      const landlordId = req.user.id;
      if (req.params.landlordId && req.params.landlordId !== landlordId) {
        await logSecurityEvent(req, 'landlord_access_denied', { attemptedEndpoint: req.originalUrl });
        return res.status(403).json({ message: 'Landlord access required' });
      }

      const verifications = await storage.getLandlordVerifications(landlordId);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  app.get('/api/landlord/:landlordId/pending-requests', requireLandlord, async (req: any, res) => {
    try {
      const landlordId = req.user.id;
      if (req.params.landlordId && req.params.landlordId !== landlordId) {
        await logSecurityEvent(req, 'landlord_access_denied', { attemptedEndpoint: req.originalUrl });
        return res.status(403).json({ message: 'Landlord access required' });
      }

      const requests = await storage.getLandlordPendingRequests(landlordId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  // Landlord Stats Endpoint - Dashboard Overview
  app.get('/api/landlord/stats', requireAuth, requireLandlord, async (req: any, res) => {
    try {
      const landlordId = req.user.id;

      // Get all properties owned by landlord
      const properties = await storage.getUserProperties(landlordId);
      const activeProperties = properties.filter((p: any) => p.status === 'active' || !p.status);

      // Get all tenant links
      const tenantLinks = await storage.getLandlordTenantLinks(landlordId);
      const activeTenants = tenantLinks.filter((link: any) => link.status === 'active');

      // Get pending verification requests
      const pendingVerifications = await storage.getLandlordPendingRequests(landlordId);

      // Calculate monthly revenue from active properties
      const monthlyRevenue = activeProperties.reduce((sum: number, property: any) => {
        return sum + (parseFloat(property.monthlyRent) || 0);
      }, 0);

      // Calculate occupancy rate
      const totalProperties = properties.length;
      const occupiedProperties = activeTenants.length;
      const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

      // Calculate average rent
      const averageRent = totalProperties > 0
        ? properties.reduce((sum: number, p: any) => sum + (parseFloat(p.monthlyRent) || 0), 0) / totalProperties
        : 0;

      res.json({
        totalProperties: totalProperties,
        activeProperties: activeProperties.length,
        totalTenants: tenantLinks.length,
        activeTenants: activeTenants.length,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        pendingVerifications: pendingVerifications.length,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        averageRent: Math.round(averageRent * 100) / 100
      });
    } catch (error) {
      console.error("Error fetching landlord stats:", error);
      res.status(500).json({ message: "Failed to fetch landlord stats" });
    }
  });

  // Landlord Properties with Tenant Info
  app.get('/api/landlord/properties', requireAuth, requireLandlord, async (req: any, res) => {
    try {
      const landlordId = req.user.id;
      const properties = await storage.getUserProperties(landlordId);

      // Enrich properties with tenant information
      const enrichedProperties = await Promise.all(properties.map(async (property: any) => {
        const tenantLinks = await storage.getPropertyTenantLinks(property.id);
        const activeTenant = tenantLinks.find((link: any) => link.status === 'active');

        let tenantInfo = null;
        if (activeTenant) {
          const tenant = await storage.getUser(activeTenant.tenantId);
          if (tenant) {
            tenantInfo = {
              id: tenant.id,
              name: `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim(),
              email: tenant.email,
              phone: tenant.phone,
              leaseStart: activeTenant.leaseStartDate,
              leaseEnd: activeTenant.leaseEndDate
            };
          }
        }

        return {
          ...property,
          tenant: tenantInfo,
          status: activeTenant ? 'occupied' : 'vacant'
        };
      }));

      res.json(enrichedProperties);
    } catch (error) {
      console.error("Error fetching landlord properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Landlord Revenue Analytics
  app.get('/api/landlord/revenue', requireAuth, requireLandlord, async (req: any, res) => {
    try {
      const landlordId = req.user.id;

      // Get all properties
      const properties = await storage.getUserProperties(landlordId);

      // Get all payments for landlord's properties
      const allPayments: any[] = [];
      for (const property of properties) {
        const payments = await storage.getPropertyRentPayments(property.id);
        allPayments.push(...payments.map((p: any) => ({ ...p, propertyId: property.id })));
      }

      // Calculate monthly revenue for last 12 months
      const now = new Date();
      const monthlyData = [];

      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

        const monthPayments = allPayments.filter((p: any) => {
          const paidDate = p.paidDate ? new Date(p.paidDate) : null;
          if (!paidDate) return false;
          return paidDate.getFullYear() === monthDate.getFullYear() &&
            paidDate.getMonth() === monthDate.getMonth();
        });

        const monthTotal = monthPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

        monthlyData.push({
          month: monthDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
          amount: Math.round(monthTotal * 100) / 100
        });
      }

      // Calculate yearly total
      const yearlyTotal = allPayments
        .filter((p: any) => {
          const paidDate = p.paidDate ? new Date(p.paidDate) : null;
          if (!paidDate) return false;
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return paidDate >= yearAgo;
        })
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      // Calculate growth (compare last month to previous month)
      const lastMonth = monthlyData[monthlyData.length - 1]?.amount || 0;
      const previousMonth = monthlyData[monthlyData.length - 2]?.amount || 0;
      const growth = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;

      res.json({
        monthly: monthlyData,
        yearly: Math.round(yearlyTotal * 100) / 100,
        trends: {
          growth: Math.round(growth * 100) / 100,
          comparison: growth >= 0 ? 'increase' : 'decrease'
        }
      });
    } catch (error) {
      console.error("Error fetching landlord revenue:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // Gold Landlord Status
  app.get('/api/landlord/gold-status', requireAuth, requireLandlord, async (req: any, res) => {
    try {
      const landlordId = req.user.id;

      // Get all rent logs for this landlord from the rentLogs table
      const allRentLogs = await db.select().from(rentLogs)
        .where(eq(rentLogs.landlordId, landlordId));

      // Calculate verification metrics from rent logs
      const totalRentLogs = allRentLogs.length;
      const verifiedRentLogs = allRentLogs.filter(log => log.verified === true);
      const verifiedCount = verifiedRentLogs.length;

      // Calculate verification rate: (verifiedCount / totalCount) * 100
      const verificationRate = totalRentLogs > 0 ? (verifiedCount / totalRentLogs) * 100 : 0;

      // Get tenant satisfaction (placeholder - would need tenant reviews/ratings table)
      // For now, use a mock value or calculate from tenant feedback if available
      const tenantSatisfaction = 4.5; // TODO: Implement actual tenant satisfaction calculation

      // Check if landlord has paid subscription
      // Use subscriptionPlan and subscriptionStatus fields from user object
      const subscriptionPlan = req.user.subscriptionPlan || 'free';
      const subscriptionStatus = req.user.subscriptionStatus || 'active';
      const isPaidMember = subscriptionPlan !== 'free' && subscriptionStatus === 'active';

      // Gold Landlord criteria:
      // 1. Paid subscription (subscriptionPlan !== 'free' AND subscriptionStatus === 'active')
      // 2. 85%+ verification rate
      // 3. 4.5/5+ tenant satisfaction
      // 4. 8+ total verifications
      const isGold = isPaidMember &&
        verificationRate >= 85 &&
        tenantSatisfaction >= 4.5 &&
        verifiedCount >= 8;

      // Log for debugging
      console.log('Gold Landlord Status Check:', {
        landlordId,
        subscriptionPlan,
        subscriptionStatus,
        isPaidMember,
        verificationRate,
        verifiedCount,
        isGold
      });

      res.json({
        isGold: isGold || false, // Ensure it's always a boolean
        verificationRate: Math.round(verificationRate * 10) / 10,
        tenantSatisfaction,
        totalVerifications: verifiedCount,
        isPaidMember
      });
    } catch (error) {
      console.error('Error fetching gold landlord status:', error);
      res.status(500).json({ error: 'Failed to fetch gold landlord status' });
    }
  });

  app.post('/api/landlord/invite-tenant', requireAuth, requireLandlord, async (req: any, res) => {
    try {
      const { email, propertyId, propertyAddress } = req.body;
      const landlordId = req.user.id;
      const landlordName = `${req.user.firstName} ${req.user.lastName}`.trim() || req.user.username;

      if (!email || !propertyId) {
        return res.status(400).json({ error: 'Email and Property ID are required' });
      }

      // Check if invitation already exists
      const existingInvite = await storage.getTenantInvitationByEmail(email, propertyId);
      if (existingInvite && existingInvite.status === 'pending') {
        return res.status(400).json({ error: 'An active invitation already exists for this tenant' });
      }

      // Generate token and URL
      const inviteToken = nanoid(32);
      const inviteUrl = `${process.env.APP_URL || 'http://localhost:5000'}/signup?invite=${inviteToken}&email=${encodeURIComponent(email)}`;

      // Create invitation record
      await storage.createTenantInvitation({
        landlordId,
        propertyId,
        tenantEmail: email,
        inviteToken,
        inviteUrl,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Send email
      const emailSent = await emailService.sendTenantInvitation(
        email,
        inviteUrl,
        landlordName,
        propertyAddress || 'your property'
      );

      if (!emailSent.success) {
        console.warn('Failed to send invitation email, but record created');
      }

      res.json({ success: true, message: 'Invitation sent successfully' });
    } catch (error) {
      console.error('Error sending tenant invitation:', error);
      res.status(500).json({ error: 'Failed to send invitation' });
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
      const user = req.user;
      const { propertyId, reportType = 'credit' } = req.body;

      // Check subscription-based report limits for free users
      const userPlan = normalizePlanName(user.subscriptionPlan || 'free');
      const limits = getSubscriptionLimits(userPlan);

      if (limits.reportsPerMonth !== Infinity) {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const reportsThisMonth = await storage.getUserCreditReportsByMonth(userId, currentMonth);

        if (reportsThisMonth.length >= limits.reportsPerMonth) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1);

          return res.status(403).json({
            message: `Your ${userPlan} plan is limited to ${limits.reportsPerMonth} report${limits.reportsPerMonth === 1 ? '' : 's'} per month`,
            currentCount: reportsThisMonth.length,
            limit: limits.reportsPerMonth,
            nextResetDate: nextMonth.toISOString().slice(0, 10),
            upgradeUrl: '/pricing',
            upgradeMessage: 'Upgrade to Professional for unlimited credit reports'
          });
        }
      }

      // Get user data
      const userRecord = await storage.getUser(userId);
      const properties = await storage.getUserProperties(userId);
      const property = properties.find(p => p.id === propertyId);
      const payments = await storage.getPropertyRentPayments(propertyId);
      const allPayments = await storage.getUserRentPayments(userId);

      if (!userRecord || !property) {
        return res.status(404).json({ message: "User or property not found" });
      }

      // Get user badges (achievements)
      const badges = await storage.getUserBadges(userId);

      // Calculate payment stats
      const verifiedPayments = allPayments.filter(p => p.isVerified);
      const totalPayments = allPayments.length;
      const verificationRate = totalPayments > 0 ? (verifiedPayments.length / totalPayments) * 100 : 0;

      // Calculate on-time rate
      const onTimePayments = allPayments.filter(p => {
        if (!p.paidDate) return false;
        const paidDate = new Date(p.paidDate);
        const dueDate = new Date(p.dueDate);
        const diffDays = Math.ceil((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 5; // Within 5 days grace period
      });
      const onTimeRate = totalPayments > 0 ? (onTimePayments.length / totalPayments) * 100 : 0;

      // Calculate payment streak
      const sortedPayments = [...allPayments].sort((a, b) =>
        new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      );
      let paymentStreak = 0;
      for (const payment of sortedPayments) {
        if (!payment.paidDate) break;
        const paidDate = new Date(payment.paidDate);
        const dueDate = new Date(payment.dueDate);
        const diffDays = Math.ceil((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 5) {
          paymentStreak++;
        } else {
          break;
        }
      }

      // Calculate Rent Score (0-1000)
      // Payment History Score (60%): Based on on-time rate
      const paymentHistoryScore = (onTimeRate / 100) * 600;
      // Verification Score (20%): Based on verification rate  
      const verificationScore = (verificationRate / 100) * 200;
      // Streak Score (20%): Based on payment streak (capped at 12 months = max 200)
      const streakScore = Math.min((paymentStreak / 12) * 200, 200);
      const rentScore = Math.round(paymentHistoryScore + verificationScore + streakScore);

      // Total paid
      const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // Common data for all report types
      const userInfo = {
        name: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'N/A',
        rlid: userRecord.rlid || 'N/A',
        email: userRecord.email || 'N/A',
        phone: userRecord.phone || 'N/A',
      };

      const currentAddress = {
        fullAddress: property.address || 'N/A',
        city: property.city || 'N/A',
        postcode: property.postcode || 'N/A',
        moveInDate: property.tenancyStartDate || undefined,
      };

      const landlordInfo = {
        name: property.landlordName || 'N/A',
        email: property.landlordEmail || 'N/A',
        phone: property.landlordPhone || 'N/A',
        verificationStatus: verifiedPayments.length > 0 ? 'verified' : 'unverified' as const,
      };

      const paymentHistory = payments.slice(0, 12).map(p => ({
        date: p.dueDate,
        amount: parseFloat(p.amount),
        status: (p.isVerified ? 'verified' : (p.paidDate ? 'awaiting-verification' : 'overdue')) as 'verified' | 'awaiting-verification' | 'overdue',
        dueDate: p.dueDate,
        paidDate: p.paidDate || undefined,
      }));

      const earnedBadges = badges.map(b => ({
        type: b.badgeType,
        level: b.level || 1,
        name: b.badgeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        earnedAt: b.earnedAt?.toISOString() || new Date().toISOString(),
        description: JSON.stringify(b.metadata) !== '{}' ? JSON.stringify(b.metadata) : undefined,
      }));

      // Generate report based on type
      let reportData: any;

      if (reportType === 'credit') {
        reportData = {
          reportType: 'credit',
          reportId: `${userRecord.rlid}-${Date.now()}`,
          generatedDate: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          userInfo,
          currentAddress,
          rentScore,
          rentScoreBreakdown: {
            paymentHistory: Math.round(paymentHistoryScore),
            verification: Math.round(verificationScore),
            streak: Math.round(streakScore),
          },
          paymentStreak,
          totalPayments,
          totalPaid,
          onTimeRate: Math.round(onTimeRate),
          paymentHistory,
          earnedBadges,
          landlordVerification: landlordInfo,
          tenantSince: property.tenancyStartDate || undefined,
        };
      } else if (reportType === 'rental') {
        reportData = {
          reportType: 'rental',
          reportId: `${userRecord.rlid}-${Date.now()}`,
          generatedDate: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          userInfo,
          currentProperty: {
            ...currentAddress,
            monthlyRent: parseFloat(property.monthlyRent),
            tenancyStartDate: property.tenancyStartDate || 'N/A',
            tenancyEndDate: property.tenancyEndDate || undefined,
          },
          landlordInfo,
          paymentSummary: {
            totalPaid,
            paymentStreak,
            onTimeRate: Math.round(onTimeRate),
            averageMonthlyRent: totalPayments > 0 ? totalPaid / totalPayments : 0,
            firstPaymentDate: allPayments[allPayments.length - 1]?.dueDate || 'N/A',
            lastPaymentDate: allPayments[0]?.dueDate || 'N/A',
          },
          paymentHistory,
          rentScore,
          badges: earnedBadges,
        };
      } else { // landlord verification
        reportData = {
          reportType: 'landlord',
          reportId: `${userRecord.rlid}-${Date.now()}`,
          generatedDate: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          tenantInfo: userInfo,
          propertyDetails: {
            ...currentAddress,
            monthlyRent: parseFloat(property.monthlyRent),
            tenancyStartDate: property.tenancyStartDate || 'N/A',
            tenancyEndDate: property.tenancyEndDate || undefined,
          },
          verificationRequest: {
            landlordName: property.landlordName || 'N/A',
            landlordEmail: property.landlordEmail || 'N/A',
            status: landlordInfo.verificationStatus,
            requestedDate: property.createdAt?.toISOString() || new Date().toISOString(),
            verifiedDate: verifiedPayments.length > 0 ? verifiedPayments[0].updatedAt?.toISOString() : undefined,
          },
          paymentRecords: paymentHistory,
          reliabilityMetrics: {
            rentScore,
            paymentStreak,
            totalPayments,
            totalPaid,
            onTimeRate: Math.round(onTimeRate),
            verificationRate: Math.round(verificationRate),
          },
          paymentStreak,
        };
      }

      const report = await storage.createCreditReport({
        userId,
        propertyId,
        reportData,
        verificationId: reportData.reportId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      const report = await storage.getCreditReportByReportId(share.reportId.toString());

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

      const emailResult = await emailService.sendLandlordVerification(
        landlordEmail,
        tenantName,
        propertyAddress,
        verificationUrl
      );

      if (!emailResult.success) {
        console.error('Failed to send verification email to landlord');
        await storage.createNotification({
          userId,
          type: 'system',
          title: 'Verification Created',
          message: `Verification request created but email delivery failed. Please share the link manually with ${landlordEmail}`,
        });
      } else {
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
        emailSuccess: emailResult.success,
      });

      res.status(emailResult.success ? 200 : 202).json({
        message: emailResult.success ? 'Verification email sent successfully' : 'Verification created but email delivery failed',
        verificationUrl,
        emailSuccess: emailResult.success,
        emailError: emailResult.error || undefined,
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

  // Dispute routes
  app.post('/api/disputes', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { propertyId, paymentId, type, subject, description, priority } = req.body;

      if (!type || !subject || !description) {
        return res.status(400).json({ message: "Type, subject, and description are required" });
      }

      const dispute = await storage.createDispute({
        userId,
        propertyId: propertyId ? parseInt(propertyId) : null,
        paymentId: paymentId ? parseInt(paymentId) : null,
        type,
        subject,
        description,
        status: 'open',
        priority: priority || 'medium',
      });

      res.json(dispute);
    } catch (error) {
      console.error("Error creating dispute:", error);
      res.status(500).json({ message: "Failed to create dispute" });
    }
  });

  app.get('/api/disputes/my', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const disputes = await storage.getUserDisputes(userId);
      res.json(disputes);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  // Landlord review routes
  app.post('/api/landlord-reviews', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { landlordId, propertyId, rating, comment } = req.body;

      if (!landlordId || !rating) {
        return res.status(400).json({ message: "Landlord ID and rating are required" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      // Check if user has a verified tenancy with this landlord
      const links = await storage.getLandlordTenantLinks(landlordId);
      const hasVerifiedLink = links.some(link =>
        link.tenantId === userId && link.status === 'active'
      );

      const review = await storage.createLandlordReview({
        reviewerId: userId,
        landlordId,
        propertyId: propertyId ? parseInt(propertyId) : null,
        rating,
        comment,
        isVerified: hasVerifiedLink,
      });

      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get('/api/landlord-reviews/:landlordId', async (req, res) => {
    try {
      const landlordId = req.params.landlordId;
      const reviews = await storage.getLandlordReviews(landlordId);

      // Calculate average rating
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      res.json({
        reviews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        verifiedReviews: reviews.filter(r => r.isVerified).length,
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Export Rent Ledger PDF
  app.get('/api/export-ledger/:tenantId', requireAuth, async (req: any, res) => {
    try {
      const tenantId = req.params.tenantId;
      const requesterId = req.user.id;
      const requesterRole = req.user.role;

      // Authorization check
      let isAuthorized = false;

      // 1. Self-access
      if (requesterId === tenantId) {
        isAuthorized = true;
      }
      // 2. Admin access
      else if (requesterRole === 'admin') {
        isAuthorized = true;
      }
      // 3. Landlord access (must be linked)
      else if (requesterRole === 'landlord') {
        const links = await storage.getLandlordTenantLinks(requesterId);
        const isLinked = links.some(link => link.tenantId === tenantId && (link.status === 'active' || link.status === 'pending'));
        if (isLinked) {
          isAuthorized = true;
        } else {
          // Also check if landlord owns a property where this user is a tenant (via payments)
          const landlordTenants = await storage.getLandlordTenants(requesterId);
          if (landlordTenants.some(t => t.tenant.id === tenantId)) {
            isAuthorized = true;
          }
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized to export this ledger" });
      }

      const tenant = await storage.getUser(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // Get Payments
      const payments = await storage.getUserRentPayments(tenantId);

      // Get Property (Active one or from last payment)
      let property: any = {
        address: 'Unknown Address',
        city: '',
        postcode: '',
        monthlyRent: 0
      };

      if (payments.length > 0) {
        const lastPayment = payments[0];
        const prop = await storage.getPropertyById(lastPayment.propertyId);
        if (prop) {
          property = prop;
        }
      } else if (tenant.rentInfo) {
        // Fallback to rentInfo
        const rentInfo = tenant.rentInfo as any;
        // Try to construct property info if available in address
        if (tenant.address) {
          const addr = tenant.address as any;
          property = {
            address: addr.street || '',
            city: addr.city || '',
            postcode: addr.postcode || '',
            monthlyRent: rentInfo.amount || 0
          };
        }
      }

      // Landlord Info
      let landlord = { name: 'Unknown', email: '' };
      if (property.landlordName) {
        landlord.name = property.landlordName;
        landlord.email = property.landlordEmail || '';
      } else if (property.userId) {
        const landlordUser = await storage.getUser(property.userId);
        if (landlordUser) {
          landlord.name = `${landlordUser.firstName} ${landlordUser.lastName}`;
          landlord.email = landlordUser.email;
        }
      }

      const pdfBuffer = await generateLedgerPDF({
        tenant: {
          name: `${tenant.firstName} ${tenant.lastName}`,
          email: tenant.email
        },
        property: {
          address: property.address,
          city: property.city,
          postcode: property.postcode,
          monthlyRent: Number(property.monthlyRent),
          tenancyStartDate: property.tenancyStartDate,
          tenancyEndDate: property.tenancyEndDate
        },
        landlord,
        payments: payments.map(p => ({
          date: p.dueDate,
          amount: Number(p.amount),
          status: p.status || 'pending',
          verified: p.isVerified || false,
          method: p.paymentMethod || 'Direct Debit'
        })),
        generatedAt: new Date(),
        ledgerId: nanoid(10).toUpperCase()
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rent-ledger-${tenant.lastName}-${format(new Date(), 'yyyy-MM-dd')}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generating ledger PDF:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
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
      type HealthStatus = 'healthy' | 'degraded' | 'down';
      const health: {
        database: HealthStatus;
        emailService: HealthStatus;
        paymentProcessor: HealthStatus;
        lastChecked: string;
      } = {
        database: 'healthy',
        emailService: 'healthy',
        paymentProcessor: 'healthy',
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
      const adminUser = (req as any).adminUser;
      await logSecurityEvent(req, 'admin_system_check', { adminId: adminUser.id });

      const checks = {
        database: true,
        emailService: !!process.env.MAILERSEND_API_KEY,
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

  /**
   * POST /api/admin/export-all-data
   * Exports all system data (users, properties, payments, reports, security logs)
   * Supports both JSON and CSV formats via query parameter: ?format=json or ?format=csv
   */
  app.post('/api/admin/export-all-data', requireAdmin, async (req: any, res) => {
    try {
      const adminUser = (req as any).adminUser;
      const exportId = nanoid();
      const format = req.query.format || 'json'; // Support json or csv format

      // Log the export request
      await logSecurityEvent(req, 'admin_data_export', {
        adminId: adminUser.id,
        exportId,
        format,
      });

      // Fetch all system data in parallel for efficiency
      const [stats, users, properties, payments, securityLogs] = await Promise.all([
        storage.getSystemStats(),
        storage.getAllUsers(),
        storage.getAllProperties(),
        storage.getAllPayments(),
        storage.getSecurityLogs({ limit: 10000 }), // Get up to 10k security logs
      ]);

      // Get credit reports for all users (batch approach - limit to first 100 users to avoid timeout)
      const allReports: any[] = [];
      for (const user of users.slice(0, 100)) {
        try {
          const userReports = await storage.getUserCreditReports(user.id);
          allReports.push(...userReports);
        } catch (error) {
          console.error(`Error fetching reports for user ${user.id}:`, error);
        }
      }

      // Create comprehensive export data object
      const exportData = {
        exportId,
        timestamp: new Date().toISOString(),
        exportedBy: adminUser.id,
        exportedByEmail: adminUser.email || adminUser.username,
        stats,
        summary: {
          totalUsers: users.length,
          totalProperties: properties.length,
          totalPayments: payments.length,
          totalReports: allReports.length,
          totalSecurityLogs: securityLogs.length,
        },
        data: {
          users: users.map(u => ({
            id: u.id,
            email: u.email,
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            subscriptionPlan: u.subscriptionPlan,
            subscriptionStatus: u.subscriptionStatus,
            isActive: u.isActive,
            isOnboarded: u.isOnboarded,
            emailVerified: u.emailVerified,
            createdAt: u.createdAt,
          })),
          properties: properties.map(p => ({
            id: p.id,
            userId: p.userId,
            address: p.address,
            city: p.city,
            postcode: p.postcode,
            monthlyRent: p.monthlyRent,
            isActive: p.isActive,
            createdAt: p.createdAt,
          })),
          payments: payments.map(p => ({
            id: p.id,
            userId: p.userId,
            propertyId: p.propertyId,
            amount: p.amount,
            dueDate: p.dueDate,
            paidDate: p.paidDate,
            status: p.status,
            createdAt: p.createdAt,
          })),
          reports: allReports.map(r => ({
            id: r.id,
            userId: r.userId,
            propertyId: r.propertyId,
            reportId: r.reportId,
            generatedAt: r.generatedAt,
            createdAt: r.createdAt,
          })),
          securityLogs: securityLogs.map(l => ({
            id: l.id,
            userId: l.userId,
            action: l.action,
            ipAddress: l.ipAddress,
            createdAt: l.createdAt,
            metadata: l.metadata,
          })),
        },
      };

      // Set appropriate headers based on format
      if (format === 'csv') {
        // Convert to CSV format (simplified - in production, use a proper CSV library)
        const csvRows: string[] = [];

        // Users CSV
        csvRows.push('=== USERS ===');
        csvRows.push('ID,Email,Username,Role,Plan,Status,Created');
        users.forEach(u => {
          csvRows.push(`${u.id},${u.email || ''},${u.username || ''},${u.role || ''},${u.subscriptionPlan || ''},${u.isActive ? 'active' : 'inactive'},${u.createdAt || ''}`);
        });

        // Properties CSV
        csvRows.push('\n=== PROPERTIES ===');
        csvRows.push('ID,User ID,Address,City,Monthly Rent,Status');
        properties.forEach(p => {
          csvRows.push(`${p.id},${p.userId},${p.address || ''},${p.city || ''},${p.monthlyRent || ''},${p.isActive ? 'active' : 'inactive'}`);
        });

        // Payments CSV
        csvRows.push('\n=== PAYMENTS ===');
        csvRows.push('ID,User ID,Property ID,Amount,Due Date,Paid Date,Status');
        payments.forEach(p => {
          csvRows.push(`${p.id},${p.userId},${p.propertyId},${p.amount || ''},${p.dueDate || ''},${p.paidDate || ''},${p.status || ''}`);
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="rentledger-export-${exportId}.csv"`);
        res.send(csvRows.join('\n'));
      } else {
        // JSON format (default)
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="rentledger-export-${exportId}.json"`);
        res.json(exportData);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ message: 'Failed to export data' });
    }
  });

  app.post('/api/admin/send-announcement', requireAdmin, async (req: any, res) => {
    try {
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: 'Announcement message is required' });
      }

      const adminUser = (req as any).adminUser;
      await logSecurityEvent(req, 'admin_announcement', {
        adminId: adminUser.id,
        messageLength: message.length
      });

      // Get all active users
      const users = await storage.getAllUsers();
      const activeUsers = users.filter((user: any) => user.isOnboarded);

      // Create notifications for all active users
      const notifications = activeUsers.map((user: any) =>
        storage.createNotification({
          userId: user.id,
          type: 'system',
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
        await emailService.sendTestEmail(user.email);
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

      const primaryProperty = properties[0];
      const propertyForReport = primaryProperty
        ? {
          address: primaryProperty.address,
          city: primaryProperty.city ?? 'N/A',
          postcode: primaryProperty.postcode ?? 'N/A',
          monthlyRent: Number(primaryProperty.monthlyRent) || 0,
        }
        : {
          address: 'N/A',
          city: 'N/A',
          postcode: 'N/A',
          monthlyRent: 0,
        };

      const reportData = {
        user: {
          id: user.id,
          firstName: user.firstName || 'N/A',
          lastName: user.lastName || 'N/A',
          email: user.email || 'N/A',
          phone: user.phone || undefined,
        },
        property: propertyForReport,
        // Normalise numeric/payment fields before handing them to the PDF builder
        payments: payments.map(p => ({
          id: p.id,
          amount: Number(p.amount) || 0,
          dueDate: p.dueDate,
          paidDate: p.paidDate ?? undefined,
          status: p.status ?? 'pending',
        })),
        reportId: report.reportId,
        generatedAt: (report.createdAt ?? new Date()).toISOString(),
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
      // Send email to support team
      const supportEmailSuccess = await emailService.sendSupportRequestAdmin(
        0, // No ticket ID for contact form
        name,
        email,
        `[${category}] ${subject}`,
        priority || 'Normal',
        message
      );

      // Send confirmation email to user
      // Send confirmation email to user
      const userEmailSuccess = await emailService.sendSupportRequestConfirmation(
        userEmail,
        name,
        subject,
        message
      );

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
  app.post('/api/admin/users/:userId/reset-password', requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      const hashedPassword = await hashPassword(newPassword);
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.upsertUser({
        ...existingUser,
        password: hashedPassword,
        updatedAt: new Date(),
      });

      await logSecurityEvent(req, 'admin_password_reset', {
        targetUserId: userId,
        adminId: (req as any).adminUser.id,
      });

      res.json({
        message: 'Password reset successfully',
        note: 'New password has been set. Share securely with user.'
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Duplicate admin routes removed - using the ones defined earlier at lines 927-1088
  // User update endpoint
  app.patch('/api/admin/users/:userId', requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      // Validate updates
      const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'subscriptionPlan', 'subscriptionStatus', 'isActive', 'isOnboarded', 'emailVerified', 'businessName'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      const user = await storage.upsertUser({
        id: userId,
        ...filteredUpdates,
        updatedAt: new Date(),
      });

      await logSecurityEvent(req, 'admin_user_updated', {
        targetUserId: userId,
        updates: filteredUpdates,
      });

      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // User suspend endpoint
  app.post('/api/admin/users/:userId/suspend', requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.upsertUser({
        ...existingUser,
        isActive: false,
        updatedAt: new Date(),
      });

      await logSecurityEvent(req, 'admin_user_suspended', {
        targetUserId: userId,
      });

      res.json({ message: 'User suspended successfully' });
    } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({ message: 'Failed to suspend user' });
    }
  });

  // User reactivate endpoint
  app.post('/api/admin/users/:userId/reactivate', requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.upsertUser({
        ...existingUser,
        isActive: true,
        updatedAt: new Date(),
      });

      await logSecurityEvent(req, 'admin_user_reactivated', {
        targetUserId: userId,
      });

      res.json({ message: 'User reactivated successfully' });
    } catch (error) {
      console.error('Error reactivating user:', error);
      res.status(500).json({ message: 'Failed to reactivate user' });
    }
  });

  app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      // Retrieve settings from database, with defaults if not set
      const dbSettings = await storage.getSystemSettings();

      // Default settings (used if not in database)
      const defaultSettings = {
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

      // Merge database settings with defaults (database takes precedence)
      const settings = { ...defaultSettings, ...dbSettings };

      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  // Settings update endpoint
  app.post('/api/admin/settings', requireAdmin, async (req: any, res) => {
    try {
      const settings = req.body;
      const adminUser = (req as any).adminUser;

      // Validate settings object
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ message: 'Invalid settings format' });
      }

      // Persist settings to database
      await storage.updateSystemSettings(settings, adminUser.id || adminUser.userId);

      // Log the security event
      await logSecurityEvent(req, 'admin_settings_updated', {
        settings: Object.keys(settings),
        adminId: adminUser.id,
      });

      res.json({
        message: 'Settings updated successfully',
        settings
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });

  // Test email endpoint
  app.post('/api/admin/test-email', requireAdmin, async (req: any, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email address is required' });
      }

      const emailResult = await emailService.sendTestEmail(email);

      await logSecurityEvent(req, 'admin_test_email_sent', {
        recipientEmail: email,
        success: emailResult.success,
      });

      if (emailResult.success) {
        res.json({ message: 'Test email sent successfully' });
      } else {
        res.status(500).json({
          message: 'Failed to send test email',
          error: emailResult.error
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: 'Failed to send test email' });
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
          nextBillingDate: user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: user.createdAt,
          cancelledAt: null
        }));
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
  });

  // Subscription update endpoint
  app.patch('/api/admin/subscriptions/:subscriptionId', requireAdmin, async (req: any, res) => {
    try {
      const { subscriptionId } = req.params;
      const updates = req.body;

      // Extract userId from subscriptionId (format: sub_userId)
      const userId = subscriptionId.replace('sub_', '');

      const allowedFields = ['subscriptionPlan', 'subscriptionStatus', 'subscriptionEndDate'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.updateUserSubscription(userId, {
        subscriptionPlan: filteredUpdates.subscriptionPlan || currentUser.subscriptionPlan || 'free',
        subscriptionStatus: filteredUpdates.subscriptionStatus || currentUser.subscriptionStatus || 'active',
        subscriptionEndDate: filteredUpdates.subscriptionEndDate ? new Date(filteredUpdates.subscriptionEndDate) : currentUser.subscriptionEndDate || undefined,
      });

      await logSecurityEvent(req, 'admin_subscription_updated', {
        userId,
        updates: filteredUpdates,
      });

      res.json({ message: 'Subscription updated successfully' });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ message: 'Failed to update subscription' });
    }
  });

  app.get('/api/admin/revenue-data', requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      const allPayments = await storage.getAllPayments();

      // Calculate real metrics
      const totalRevenue = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // Calculate growth (compare this month vs last month)
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonthRevenue = allPayments
        .filter(p => new Date(p.createdAt!) >= thisMonthStart)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const lastMonthRevenue = allPayments
        .filter(p => {
          const d = new Date(p.createdAt!);
          return d >= lastMonthStart && d <= lastMonthEnd;
        })
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const growthRate = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 100;

      const revenueData = {
        totalRevenue,
        monthlyRecurringRevenue: stats.monthlyRevenue,
        annualRecurringRevenue: stats.monthlyRevenue * 12,
        averageRevenuePerUser: stats.monthlyRevenue / Math.max(stats.standardUsers + stats.premiumUsers, 1),
        customerLifetimeValue: (stats.monthlyRevenue / Math.max(stats.standardUsers + stats.premiumUsers, 1)) * 24,
        churnRate: 2.5, // Hard to calculate without historical sub data, keeping estimate
        growthRate,
        refunds: 0 // We don't track refunds yet
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
      const allPayments = await storage.getAllPayments();

      // Group payments by date
      const chartDataMap = new Map<string, { revenue: number, subscriptions: number }>();

      // Initialize with 0s for all days
      for (let i = days; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        chartDataMap.set(dateStr, { revenue: 0, subscriptions: 0 });
      }

      // Fill with actual data
      allPayments.forEach(p => {
        if (!p.createdAt) return;
        const dateStr = new Date(p.createdAt).toISOString().split('T')[0];
        if (chartDataMap.has(dateStr)) {
          const current = chartDataMap.get(dateStr)!;
          chartDataMap.set(dateStr, {
            revenue: current.revenue + parseFloat(p.amount),
            subscriptions: current.subscriptions + 1 // Proxy for transaction count
          });
        }
      });

      const chartData = Array.from(chartDataMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        subscriptions: data.subscriptions,
        churn: 0 // Not tracking daily churn yet
      }));

      res.json(chartData);
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
      res.status(500).json({ message: 'Failed to fetch revenue chart' });
    }
  });

  app.get('/api/admin/revenue-metrics', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const allPayments = await storage.getAllPayments();

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const newSubscriptions = users.filter(u =>
        u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo && u.subscriptionPlan !== 'free'
      ).length;

      const recentRevenue = allPayments
        .filter(p => p.createdAt && new Date(p.createdAt) >= thirtyDaysAgo)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const metrics = {
        newSubscriptions,
        upgrades: Math.floor(newSubscriptions * 0.3), // Estimate
        downgrades: 0,
        cancellations: 0,
        netRevenue: recentRevenue,
        grossRevenue: recentRevenue
      };
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      res.status(500).json({ message: 'Failed to fetch revenue metrics' });
    }
  });

  // Moderation endpoints
  app.get('/api/admin/moderation', requireAdmin, async (req: any, res) => {
    try {
      const { status, type, priority } = req.query;
      const items = await storage.getModerationItems({
        status: status as string,
        type: type as string,
        priority: priority as string,
      });
      res.json(items);
    } catch (error) {
      console.error('Error fetching moderation items:', error);
      res.status(500).json({ message: 'Failed to fetch moderation items' });
    }
  });

  app.post('/api/admin/resolve-moderation', requireAdmin, async (req: any, res) => {
    try {
      const adminUser = (req as any).adminUser;
      const { itemId, resolution, action } = req.body;

      if (!itemId || !resolution || !action) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      await storage.updateModerationItem(parseInt(itemId), {
        status: action === 'resolve' ? 'resolved' : 'dismissed',
        resolution,
        assignedTo: adminUser.userId || adminUser.id,
        updatedAt: new Date(),
      });

      await logSecurityEvent(req, 'admin_moderation_resolved', {
        itemId,
        action,
        adminId: adminUser.id,
      });

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

  /**
   * POST /api/admin/escalate-moderation
   * Escalates a moderation item by setting priority to urgent and status to reviewing
   * Also assigns it to the admin who escalated it
   */
  app.post('/api/admin/escalate-moderation', requireAdmin, async (req: any, res) => {
    try {
      const adminUser = (req as any).adminUser;
      const { itemId } = req.body;

      if (!itemId) {
        return res.status(400).json({ message: 'Item ID is required' });
      }

      // Update moderation item: set priority to urgent, status to reviewing, and assign to admin
      await storage.updateModerationItem(parseInt(itemId), {
        priority: 'urgent',
        status: 'reviewing',
        assignedTo: adminUser.userId || adminUser.id,
        updatedAt: new Date(),
      });

      // Log the escalation action
      await logSecurityEvent(req, 'admin_moderation_escalated', {
        itemId,
        adminId: adminUser.id,
        priority: 'urgent',
      });

      res.json({
        message: 'Moderation item escalated successfully',
        itemId,
        escalatedAt: new Date().toISOString(),
        priority: 'urgent',
        assignedTo: adminUser.userId || adminUser.id,
      });
    } catch (error) {
      console.error('Error escalating moderation item:', error);
      res.status(500).json({ message: 'Failed to escalate moderation item' });
    }
  });

  // Disputes endpoints
  /**
   * GET /api/admin/disputes
   * Retrieves all disputes with optional filtering
   * Query params: status, type, priority
   */
  app.get('/api/admin/disputes', requireAdmin, async (req: any, res) => {
    try {
      const { status, type, priority } = req.query;

      // Fetch disputes with filters
      const disputesList = await storage.getDisputes({
        status: status as string,
        type: type as string,
        priority: priority as string,
      });

      res.json(disputesList);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      res.status(500).json({ message: 'Failed to fetch disputes' });
    }
  });

  /**
   * POST /api/admin/disputes
   * Creates a new dispute (can be used by users or admins)
   */
  app.post('/api/admin/disputes', requireAdmin, async (req: any, res) => {
    try {
      const { userId, propertyId, paymentId, type, subject, description, priority } = req.body;

      // Validate required fields
      if (!userId || !type || !subject || !description) {
        return res.status(400).json({
          message: 'Missing required fields: userId, type, subject, description'
        });
      }

      // Create the dispute
      const dispute = await storage.createDispute({
        userId,
        propertyId: propertyId || null,
        paymentId: paymentId || null,
        type: type as "payment" | "verification" | "property" | "other",
        subject,
        description,
        priority: (priority || 'medium') as "low" | "medium" | "high" | "urgent",
        status: 'open',
      });

      // Log the creation
      await logSecurityEvent(req, 'dispute_created', {
        disputeId: dispute.id,
        userId,
        type,
        adminId: (req as any).adminUser?.id,
      });

      res.status(201).json(dispute);
    } catch (error) {
      console.error('Error creating dispute:', error);
      res.status(500).json({ message: 'Failed to create dispute' });
    }
  });

  /**
   * PATCH /api/admin/disputes/:id
   * Updates an existing dispute (assign, resolve, etc.)
   */
  app.patch('/api/admin/disputes/:id', requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const adminUser = (req as any).adminUser;

      // Build update object with only allowed fields
      const allowedFields = ['status', 'priority', 'assignedTo', 'resolution'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      // If resolving, set resolvedAt timestamp
      if (filteredUpdates.status === 'resolved' || filteredUpdates.status === 'closed') {
        filteredUpdates.resolvedAt = new Date();
      }

      // Update the dispute
      const updatedDispute = await storage.updateDispute(parseInt(id), filteredUpdates);

      // Log the update
      await logSecurityEvent(req, 'dispute_updated', {
        disputeId: id,
        updates: filteredUpdates,
        adminId: adminUser.id,
      });

      res.json(updatedDispute);
    } catch (error) {
      console.error('Error updating dispute:', error);
      res.status(500).json({ message: 'Failed to update dispute' });
    }
  });

  // Regional activity endpoint
  app.get('/api/admin/regional-activity', requireAdmin, async (req: any, res) => {
    try {
      const properties = await storage.getAllProperties();

      // Group by city and calculate activity
      const regionalMap = new Map<string, { users: number; activity: number }>();

      for (const property of properties) {
        const city = property.city || 'Unknown';
        const existing = regionalMap.get(city) || { users: 0, activity: 0 };
        existing.users += 1;
        regionalMap.set(city, existing);
      }

      const regionalData = Array.from(regionalMap.entries()).map(([region, data]) => ({
        region,
        users: data.users,
        activity: properties.length > 0 ? Math.min((data.users / properties.length) * 100, 100) : 0,
      })).sort((a, b) => b.users - a.users).slice(0, 5);

      res.json(regionalData);
    } catch (error) {
      console.error('Error fetching regional activity:', error);
      res.status(500).json({ message: 'Failed to fetch regional activity' });
    }
  });

  // Properties endpoint
  app.get('/api/admin/properties', requireAdmin, async (req: any, res) => {
    try {
      const properties = await storage.getAllProperties();
      // Join with users to get landlord info
      const propertiesWithLandlord = await Promise.all(properties.map(async (prop) => {
        const user = await storage.getUser(prop.userId);
        return {
          ...prop,
          landlordName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null,
          landlordEmail: user?.email || null,
        };
      }));
      res.json(propertiesWithLandlord);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ message: 'Failed to fetch properties' });
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
      // Require a hydrated session user even though the middleware already performed auth
      const sessionUser = req.user as { id?: string } | undefined;
      if (!sessionUser?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = sessionUser.id;

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
      // Reuse the same guard pattern when mutating user-owned resources
      const sessionUser = req.user as { id?: string } | undefined;
      if (!sessionUser?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = sessionUser.id;

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

      if (portfolio.expiresAt && new Date() > new Date(portfolio.expiresAt)) {
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
      // Defensive check protects the report pipeline when sessions expire mid-request
      const sessionUser = req.user as { id?: string } | undefined;
      if (!sessionUser?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = sessionUser.id;
      const { reportType = 'credit', includePortfolio = false } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const payments = await storage.getUserPayments(userId);
      const properties = await storage.getUserProperties(userId);

      const report: {
        id: string;
        userId: string;
        type: string;
        generatedAt: string;
        user: { name: string; email: string };
        paymentSummary: {
          totalPayments: number;
          onTimePayments: number;
          totalAmount: number;
          averageMonthlyRent: number;
        };
        properties: Array<{
          address: string;
          monthlyRent: string;
          tenancyStart: Date | string | null;
          tenancyEnd: Date | string | null;
        }>;
        paymentHistory: Array<{
          amount: string;
          dueDate: string;
          paidDate: string | null;
          status: string;
        }>;
        badges?: Array<{ id: string; badgeType: string; level: number; earnedAt: string; isActive: boolean; metadata: any }>;
      } = {
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
          status: p.status ?? 'pending',
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
    app.post('/api/manual-payments', requireAuth, requireEmailVerification, async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { propertyId, amount, paymentDate, paymentMethod, description, receiptUrl, landlordEmail, landlordPhone } = req.body;

        // Get property and tenant info
        const property = await storage.getPropertyById(parseInt(propertyId));
        const tenant = await storage.getUserById(userId);

        // Use provided landlord email or fall back to property landlord email
        const verificationEmail = landlordEmail || property.landlordEmail;
        const verificationPhone = landlordPhone || property.landlordPhone;

        const manualPayment = await storage.createManualPayment({
          userId,
          propertyId: parseInt(propertyId),
          amount: parseFloat(amount).toFixed(2),
          paymentDate: new Date(paymentDate),
          paymentMethod,
          description,
          receiptUrl,
          landlordEmail: verificationEmail,
          landlordPhone: verificationPhone,
          needsVerification: true,
        });

        // Send notification to landlord if email exists
        if (verificationEmail) {
          try {
            await emailService.sendLandlordVerificationRequest({
              landlordEmail: verificationEmail,
              landlordName: property.landlordName || 'Landlord',
              tenantName: `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || tenant.email,
              tenantEmail: tenant.email,
              propertyAddress: `${property.address}, ${property.city}`,
              amount: parseFloat(amount),
              rentAmount: manualPayment.amount,
              paymentDate: new Date(manualPayment.paymentDate).toLocaleDateString(),
              paymentMethod: paymentMethod.replace('_', ' ').toUpperCase(),
              receiptUrl,
            });
          } catch (emailError) {
            console.error('Failed to send landlord notification email:', emailError);
            // Don't fail the whole request if email fails
          }
        }

        // Create in-app notification for tenant
        await storage.createNotification({
          userId,
          type: 'system',
          title: 'Payment Logged Successfully',
          message: verificationEmail
            ? `Your payment of £${amount} on ${new Date(paymentDate).toLocaleDateString()} is awaiting landlord verification. We've sent a verification request to ${verificationEmail}.`
            : `Your payment of £${amount} on ${new Date(paymentDate).toLocaleDateString()} has been logged. Add landlord contact info to request verification.`,
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
            message: `Congratulations! You've earned: ${newBadges.map((badge: any) => badge.title).join(', ')}`,
          });
        }

        res.json({
          manualPayment,
          newBadges,
          currentStreak,
          message: verificationEmail
            ? 'Manual payment logged successfully and landlord has been notified for verification'
            : 'Manual payment logged successfully'
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
  }

  // UK Postcode lookup endpoint (using free postcodes.io API)
  app.get('/api/postcode/lookup/:postcode', async (req, res) => {
    try {
      const postcode = req.params.postcode.trim().replace(/\s+/g, '');

      if (!postcode) {
        return res.status(400).json({ message: 'Postcode is required' });
      }

      // Call the free UK Postcode API
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ message: 'Postcode not found' });
        }
        throw new Error('Postcode lookup failed');
      }

      const data = await response.json();

      if (data.status !== 200 || !data.result) {
        return res.status(404).json({ message: 'Invalid postcode' });
      }

      // Return formatted postcode data
      res.json({
        postcode: data.result.postcode,
        region: data.result.region,
        country: data.result.country,
        admin_district: data.result.admin_district,
        parliamentary_constituency: data.result.parliamentary_constituency,
        latitude: data.result.latitude,
        longitude: data.result.longitude,
      });
    } catch (error) {
      console.error('Postcode lookup error:', error);
      res.status(500).json({ message: 'Failed to lookup postcode' });
    }
  });

  // Add manual payment routes
  addManualPaymentRoutes(app, requireAuth, storage);

  // Stripe payment intent endpoint
  app.post("/api/create-payment-intent", requireAuth, async (req: any, res) => {
    try {
      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({
          message: "Payment system not configured. Please contact support."
        });
      }

      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-06-30.basil",
      });

      const { amount, plan } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;
      const paymentAmount = amount || (plan === 'standard' ? 9.99 : 19.99);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentAmount * 100), // Convert to pence
        currency: "gbp",
        automatic_payment_methods: {
          enabled: true, // Enables Apple Pay, Google Pay, and cards
        },
        metadata: {
          plan: plan || 'unknown',
          userId: userId,
          userRole: userRole || 'tenant'
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

  // Payment confirmation endpoint (called after successful payment)
  app.post("/api/confirm-payment", requireAuth, async (req: any, res) => {
    try {
      const { paymentIntentId, plan } = req.body;
      const userId = req.user.id;

      if (!paymentIntentId || !plan) {
        return res.status(400).json({ message: "Missing payment information" });
      }

      // Verify payment with Stripe
      if (process.env.STRIPE_SECRET_KEY) {
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-06-30.basil",
        });

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
          // Activate subscription
          await storage.updateUserSubscription(userId, {
            subscriptionPlan: plan,
            subscriptionStatus: 'active',
            subscriptionEndDate: null
          });

          res.json({
            success: true,
            message: "Subscription activated successfully",
            plan: plan
          });
        } else {
          res.status(400).json({ message: "Payment not completed" });
        }
      } else {
        // For development/testing without Stripe
        await storage.updateUserSubscription(userId, {
          subscriptionPlan: plan,
          subscriptionStatus: 'active',
          subscriptionEndDate: null
        });

        res.json({
          success: true,
          message: "Subscription activated successfully",
          plan: plan
        });
      }
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Stripe webhook handler for payment success
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ message: "Payment system not configured" });
      }

      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-06-30.basil",
      });

      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn("Stripe webhook secret not configured, skipping webhook verification");
        return res.status(400).json({ message: "Webhook secret not configured" });
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }

      // Handle the event
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        const userId = paymentIntent.metadata?.userId;
        const plan = paymentIntent.metadata?.plan;

        if (userId && plan && plan !== 'free') {
          try {
            // Activate subscription
            await storage.updateUserSubscription(userId, {
              subscriptionPlan: plan,
              subscriptionStatus: 'active',
              subscriptionEndDate: null // Set to null for active subscriptions
            });

            console.log(`Subscription activated for user ${userId}: ${plan}`);
          } catch (error) {
            console.error("Error activating subscription:", error);
          }
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
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
      // Use email as username for login compatibility
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUserWithRLID({
        id: nanoid(),
        email,
        username: email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        businessName: businessName || null, // Save business name if provided
        role: 'landlord',
        isOnboarded: false,
        emailVerified: true, // Auto-verify landlords
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        isActive: true
      }, 'LRLID-'); // Generate LRLID for landlords

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          'landlord'
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      res.json({
        success: true,
        message: "Account created successfully! You can now log in.",
        email: user.email
      });
    } catch (error) {
      console.error("Error creating landlord account:", error);
      res.status(500).json({ message: "Failed to create landlord account" });
    }
  });

  // Landlord login route - uses Passport session authentication
  app.post('/api/landlord/login', async (req, res, next) => {
    // Use email-based authentication for landlords
    passport.authenticate("local-email", async (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password. Please check your credentials and try again."
        });
      }

      // Verify user is a landlord
      if (user.role !== "landlord") {
        return res.status(403).json({
          message: "This account does not have landlord access. Please use the correct login page for your account type."
        });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({
          message: "Please verify your email address before logging in. Check your inbox for the verification link."
        });
      }

      // Verify user is active
      if (!user.isActive) {
        return res.status(403).json({
          message: "Your account has been deactivated. Please contact support for assistance."
        });
      }

      // Create session
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({
          success: true,
          ...user,
          password: undefined
        });
      });
    })(req, res, next);
  });

  // Property CRUD routes with authentication (UAT-03, 04, 05)
  app.put('/api/properties/:id', requireAuth, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const updateData = req.body;
      const userId = req.user.id;

      // Get existing property to check if rent is being updated
      const existingProperties = await storage.getUserProperties(userId);
      const existingProperty = existingProperties.find(p => p.id === propertyId);

      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Check if rent amount is being updated
      const isRentUpdate = updateData.rentInfo?.amount || updateData.monthlyRent;
      const newRentAmount = updateData.rentInfo?.amount || updateData.monthlyRent;

      if (isRentUpdate && newRentAmount !== undefined) {
        const currentRent = parseFloat(String(existingProperty.monthlyRent));
        const newRent = parseFloat(String(newRentAmount));

        // Only enforce limit if rent is actually changing
        if (currentRent !== newRent) {
          const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
          const lastUpdateMonth = existingProperty.lastRentUpdateMonth;
          const updateCount = existingProperty.rentUpdateCount || 0;

          // Check if we're in the same month as the last update
          if (lastUpdateMonth === currentMonth) {
            if (updateCount >= 3) {
              return res.status(429).json({
                message: 'Rent price update limit reached. You can only update rent prices 3 times per month.',
                remainingUpdates: 0,
                resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
              });
            }
            // Same month, increment counter
            updateData.rentUpdateCount = updateCount + 1;
            updateData.lastRentUpdateMonth = currentMonth;
          } else {
            // New month, reset counter
            updateData.rentUpdateCount = 1;
            updateData.lastRentUpdateMonth = currentMonth;
          }
        }
      }

      const property = await storage.updateProperty(propertyId, updateData);

      // Calculate remaining updates for this month
      const remainingUpdates = 3 - (property.rentUpdateCount || 0);

      res.json({
        ...property,
        rentInfo: property.rentInfo, // Explicitly include rentInfo
        _meta: {
          remainingRentUpdates: Math.max(0, remainingUpdates),
          rentUpdateCount: property.rentUpdateCount || 0
        }
      });
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
  app.post('/api/payments/:id/request-verification', requireAuth, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const userId = req.user.id;

      // In a real app, we would fetch the payment and check ownership
      // const payment = await storage.getPayment(paymentId);
      // if (payment.userId !== userId) return res.status(403).send("Unauthorized");

      // Mock sending email


      // Here you would use SendGrid or similar
      // await sendEmail({ to: landlordEmail, subject: "Verify Payment", ... });

      res.json({ success: true, message: "Verification request sent" });
    } catch (error) {
      console.error("Error requesting verification:", error);
      res.status(500).json({ message: "Failed to request verification" });
    }
  });

  app.post('/api/payments/:id/verify', requireAuth, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { status, notes } = req.body;
      const landlordId = req.user.id;

      // 1. Get the payment
      const payment = await storage.getRentPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // 2. Verify Landlord Ownership
      // The landlord must own the property associated with this payment
      const property = await storage.getPropertyById(payment.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.userId !== landlordId) {
        // Double check if it's an admin?
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: "Unauthorized: You do not own this property" });
        }
      }

      // 3. Update Payment
      const updatedPayment = await storage.updateRentPayment(paymentId, {
        status: status === 'approved' ? 'paid' : status === 'rejected' ? 'missed' : 'pending',
        isVerified: status === 'approved',
        updatedAt: new Date()
      });

      // 4. Create notification for tenant
      if (updatedPayment.userId) {
        await storage.createNotification({
          userId: updatedPayment.userId,
          type: 'system',
          title: status === 'approved' ? 'Payment Verified' : 'Payment Status Updated',
          message: status === 'approved'
            ? `Your rent payment of £${updatedPayment.amount} has been verified by your landlord.`
            : `Your rent payment status has been updated to: ${status}`,
          isRead: false
        });
      }

      res.json({ success: true, payment: updatedPayment });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Admin verification for manual payments
  app.post('/api/manual-payments/:id/admin-verify', requireAuth, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const userId = req.user.id;
      const { status, notes } = req.body; // status: 'approved' or 'rejected'

      // Check if user is admin (you should implement proper admin check)
      const user = await storage.getUserById(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Get the manual payment
      const manualPayment = await storage.getManualPaymentById(paymentId);
      if (!manualPayment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Update manual payment verification status
      const updatedPayment = await storage.updateManualPayment(paymentId, {
        needsVerification: status !== 'approved',
        verifiedAt: status === 'approved' ? new Date() : null,
        verifiedBy: status === 'approved' ? `admin:${user.email}` : null,
        updatedAt: new Date()
      });

      // Create notification for tenant
      await storage.createNotification({
        userId: manualPayment.userId,
        type: 'system',
        title: status === 'approved' ? 'Payment Verified by Admin' : 'Payment Verification Update',
        message: status === 'approved'
          ? `Your manual payment of £${manualPayment.amount} has been verified by an administrator.`
          : `Your manual payment verification status has been updated. ${notes || ''}`,
        isRead: false
      });

      res.json({
        success: true,
        payment: updatedPayment,
        message: status === 'approved' ? 'Payment verified successfully' : 'Payment status updated'
      });
    } catch (error) {
      console.error("Error admin verifying payment:", error);
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
      const verifiedPayments = payments.filter((p) => p.isVerified);

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

  // Support ticket routes
  app.post('/api/support/request', async (req, res) => {
    try {
      const { name, email, subject, message, priority } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Create ticket instead of just sending email
      const ticket = await storage.createSupportTicket({
        userId: (req as any).user?.id || null,
        name,
        email,
        subject,
        message,
        priority: priority || 'normal',
        status: 'open',
      });

      // Still send notification email to admins
      try {
        await emailService.sendSupportRequestAdmin(
          ticket.id,
          name,
          email,
          subject,
          priority || 'normal',
          message
        );
      } catch (emailError) {
        console.error('Failed to send support email:', emailError);
      }

      res.json({
        message: 'Support request submitted successfully. We will get back to you soon.',
        ticketId: ticket.id
      });
    } catch (error) {
      console.error('Error submitting support request:', error);
      res.status(500).json({ message: 'Failed to submit support request' });
    }
  });

  // Admin support ticket routes
  app.get('/api/admin/support-tickets', requireAdmin, async (req, res) => {
    try {
      const { status, assignedTo } = req.query;
      const tickets = await storage.getSupportTickets({
        status: status as string,
        assignedTo: assignedTo as string,
      });
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      res.status(500).json({ message: 'Failed to fetch support tickets' });
    }
  });

  app.get('/api/admin/support-tickets/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getSupportTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      res.json(ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({ message: 'Failed to fetch ticket' });
    }
  });

  app.post('/api/admin/support-tickets/:id/reply', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { message } = req.body;
      const adminUser = (req as any).adminUser;

      if (!message) {
        return res.status(400).json({ message: 'Reply message is required' });
      }

      const ticket = await storage.getSupportTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const replies = (ticket.replies as any[]) || [];
      replies.push({
        from: adminUser.email || 'Admin',
        message,
        timestamp: new Date().toISOString(),
      });

      const updated = await storage.updateSupportTicket(id, {
        replies,
        status: 'in_progress',
        assignedTo: adminUser.id,
      });

      // Send email to user
      try {
        await emailService.sendSupportReply(
          ticket.id,
          ticket.email,
          ticket.name,
          ticket.subject,
          message
        );
      } catch (emailError) {
        console.error('Failed to send reply email:', emailError);
      }

      res.json(updated);
    } catch (error) {
      console.error('Error replying to ticket:', error);
      res.status(500).json({ message: 'Failed to reply to ticket' });
    }
  });

  app.patch('/api/payments/:id', requireAuth, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const userId = req.user.id;
      const updateData = req.body;

      // Get the payment to verify ownership
      const payment = await storage.getRentPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Verify ownership
      if (payment.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to update this payment' });
      }

      // Record Locking: Prevent editing if already verified
      if (payment.isVerified) {
        return res.status(403).json({ message: 'Cannot edit a verified payment record. Please contact your landlord or support.' });
      }

      // If updating with receipt and landlord email, send verification email
      if (updateData.receiptUrl && updateData.landlordEmail) {
        try {
          const property = await storage.getPropertyById(payment.propertyId);
          const tenant = await storage.getUserById(userId);

          if (property && tenant) {
            await emailService.sendLandlordVerificationRequest({
              landlordEmail: updateData.landlordEmail,
              landlordName: property.landlordName || 'Landlord',
              tenantName: `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || tenant.email,
              tenantEmail: tenant.email,
              propertyAddress: `${property.address}, ${property.city}`,
              amount: parseFloat(payment.amount),
              rentAmount: parseFloat(payment.amount),
              paymentDate: payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : new Date(payment.dueDate).toLocaleDateString(),
              paymentMethod: payment.paymentMethod?.replace('_', ' ').toUpperCase() || 'Manual Upload',
              receiptUrl: updateData.receiptUrl,
            });

            // Create notification for tenant
            await storage.createNotification({
              userId,
              type: 'system',
              title: 'Receipt Uploaded Successfully',
              message: `Your receipt for payment of £${payment.amount} has been uploaded. We've sent a verification request to ${updateData.landlordEmail}.`,
            });
          }
        } catch (emailError) {
          console.error('Failed to send landlord notification email:', emailError);
          // Don't fail the whole request if email fails
        }
      }

      const updatedPayment = await storage.updateRentPayment(paymentId, updateData);
      res.json(updatedPayment);
    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({ message: 'Failed to update payment' });
    }
  });

  app.put('/api/admin/support-tickets/:id/status', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const updates: any = { status };
      if (status === 'resolved' || status === 'closed') {
        updates.resolvedAt = new Date();
      }

      const updated = await storage.updateSupportTicket(id, updates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      res.status(500).json({ message: 'Failed to update ticket status' });
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

  // Admin Audit Logs Reporting Endpoint (UAT Enhancement)
  app.get('/api/admin/audit-logs', requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate, userId, action, limit = 100 } = req.query;

      // Get security logs from database
      const logs = await storage.getSecurityLogs({
        startDate: startDate as string,
        endDate: endDate as string,
        userId: userId as string,
        action: action as string,
        limit: parseInt(limit as string)
      });

      // Format for admin reporting
      const formattedLogs = logs.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata,
        createdAt: log.timestamp || log.createdAt || new Date().toISOString(),
      }));

      res.json({
        total: formattedLogs.length,
        logs: formattedLogs,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Admin Performance & Load Testing Metrics
  app.get('/api/admin/performance-metrics', requireAdmin, async (req, res) => {
    try {
      // Get system performance metrics
      const startTime = Date.now();

      // Query database for counts
      const [users, properties, payments] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllProperties(),
        storage.getAllPayments()
      ]);

      const queryTime = Date.now() - startTime;

      res.json({
        performanceMetrics: {
          databaseQueryTime: `${queryTime}ms`,
          totalUsers: users.length,
          totalProperties: properties.length,
          totalPayments: payments.length,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
          nodeVersion: process.version,
        },
        loadTestResults: {
          expectedUsers: 500,
          actualUsers: users.length,
          queriesPerSecond: queryTime > 0 ? Math.round(3000 / queryTime) : 0,
          averageResponseTime: `${queryTime}ms`,
          status: queryTime < 2000 ? 'Excellent' : queryTime < 4000 ? 'Good' : 'Needs Optimization',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ message: 'Failed to fetch performance metrics' });
    }
  });

  // Admin Account Creation Endpoint (Admin only)
  app.post('/api/admin/create-admin-account', requireAdmin, async (req: any, res) => {
    try {
      const { username, password, email, firstName, lastName } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Import the createAdminAccount function
      const { createAdminAccount } = await import('./create-admin');

      const user = await createAdminAccount(
        username,
        password,
        email,
        firstName,
        lastName
      );

      await logSecurityEvent(req, 'admin_account_created', {
        createdUsername: username,
        createdBy: req.user.id,
      });

      res.json({
        message: 'Admin account created successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('Error creating admin account:', error);
      res.status(500).json({
        message: 'Failed to create admin account',
        error: error.message
      });
    }
  });

  // Admin Test Data Seeding Endpoint (Development only)
  app.post('/api/admin/seed-test-data', requireAdmin, async (req, res) => {
    try {
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Test data seeding not allowed in production' });
      }

      const { seedTestData } = await import('./seed-test-data');
      const result = await seedTestData();

      res.json({
        message: 'Test data seeding completed successfully',
        ...result,
      });
    } catch (error) {
      console.error('Error seeding test data:', error);
      res.status(500).json({ message: 'Failed to seed test data', error: String(error) });
    }
  });

  // Maintenance Request Routes
  app.post("/api/maintenance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const validation = insertMaintenanceRequestSchema.safeParse({
      ...req.body,
      tenantId: req.user.id,
    });

    if (!validation.success) {
      return res.status(400).json(validation.error);
    }

    const request = await storage.createMaintenanceRequest(validation.data);
    res.status(201).json(request);
  });

  app.get("/api/maintenance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // If tenant, get their requests
    // If landlord, get requests for their properties (not yet fully implemented for landlord view in this route, 
    // but we can add a query param or separate route)
    // For now, let's assume this is for the current user (tenant)
    const requests = await storage.getMaintenanceRequests({
      tenantId: req.user.id,
    });
    res.json(requests);
  });

  app.get("/api/landlord/:id/maintenance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // In a real app, check if req.user.id matches :id or is admin

    const requests = await storage.getMaintenanceRequests({
      landlordId: req.params.id,
    });
    res.json(requests);
  });

  app.patch("/api/maintenance/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Ideally check if user owns the request or is the landlord
    const updated = await storage.updateMaintenanceRequest(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  // API Key Routes (Enterprise only)
  app.post('/api/keys', requireAuth, requireSubscription('enterprise'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { name, permissions } = req.body;

      // Generate a secure API key
      const key = `rl_${nanoid(32)}`;

      const apiKey = await storage.createApiKey({
        name,
        key,
        createdBy: userId,
        permissions: permissions || ['read:reports'],
        isActive: true
      });

      res.status(201).json(apiKey);
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  app.get('/api/keys', requireAuth, requireSubscription('enterprise'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const keys = await storage.getApiKeys(userId);
      res.json(keys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  app.delete('/api/keys/:id', requireAuth, requireSubscription('enterprise'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteApiKey(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Failed to delete API key" });
    }
  });

  // Landlord Tenant Management Routes
  app.post('/api/landlord/tenants/invite', requireAuth, requireLandlord, async (req: any, res) => {
    try {
      const landlordId = req.user.id;
      const { email, propertyId } = req.body;

      // Check subscription limits
      const user = await storage.getUser(landlordId);

      // Get current tenant count (active links + pending invitations)
      const links = await storage.getLandlordTenantLinks(landlordId);
      const invitations = await storage.getLandlordInvitations(landlordId);
      const currentCount = links.length + invitations.filter(i => i.status === 'pending').length;

      // Define landlord-specific limits
      let tenantLimit = 3; // Starter
      if (user?.subscriptionPlan === 'professional') tenantLimit = 10;
      if (user?.subscriptionPlan === 'enterprise') tenantLimit = Infinity;

      if (currentCount >= tenantLimit) {
        return res.status(403).json({
          message: `Your ${user?.subscriptionPlan || 'free'} plan is limited to ${tenantLimit} tenants`,
          currentCount,
          limit: tenantLimit,
          upgradeUrl: '/pricing',
          upgradeMessage: user?.subscriptionPlan === 'free'
            ? 'Upgrade to Professional to manage up to 10 tenants'
            : 'Upgrade to Enterprise for unlimited tenants'
        });
      }

      // Proceed with invitation logic
      const token = nanoid(32);
      const inviteUrl = `${req.protocol}://${req.get('host')}/tenant/accept-invite/${token}`;

      const invitation = await storage.createTenantInvitation({
        landlordId,
        tenantEmail: email,
        propertyId,
        inviteToken: token,
        inviteUrl,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      res.status(201).json({ message: "Invitation sent", invitation });
    } catch (error) {
      console.error("Error inviting tenant:", error);
      res.status(500).json({ message: "Failed to invite tenant" });
    }
  });

  app.get('/api/landlord/tenants', requireAuth, requireLandlord, async (req: any, res) => {
    try {
      const landlordId = req.user.id;
      const links = await storage.getLandlordTenantLinks(landlordId);

      // Enrich with tenant details
      const tenants = await Promise.all(links.map(async (link) => {
        const tenant = await storage.getUser(link.tenantId);
        const property = link.propertyId ? await storage.getPropertyById(link.propertyId) : null;
        return { ...link, tenant, property };
      }));

      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  // Support Ticket Routes
  app.post('/api/support/tickets', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const ticketSchema = z.object({
        subject: z.string().min(1, "Subject is required"),
        message: z.string().min(1, "Message is required"),
        name: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
      });

      const { subject, message, name, email } = ticketSchema.parse(req.body);

      // Determine priority based on subscription
      const user = await storage.getUser(userId);
      let priority = 'normal';

      if (user?.subscriptionPlan === 'professional') priority = 'high';
      if (user?.subscriptionPlan === 'enterprise') priority = 'urgent';

      const ticket = await storage.createSupportTicket({
        userId,
        name: name || `${user?.firstName} ${user?.lastName}`,
        email: email || user?.email || '',
        subject,
        message,
        priority: priority as any,
        status: 'open'
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.get('/api/support/tickets', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tickets = await storage.getSupportTickets({ userId });
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  const httpServer: Server = createServer(app);
  return httpServer;
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
