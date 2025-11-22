import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { hashPassword, verifyPassword } from "./passwords";
import { storage } from "./storage";
import { pool } from "./db";
import { User as SelectUser } from "@shared/schema";
import { nanoid } from "nanoid";

// Helper function to generate unique RLID (RentLedger ID)
async function generateRLID(role: string): Promise<string> {
  const prefix = role === 'landlord' ? 'LRLID-' : 'TRLID-';
  let rlid: string;
  let exists = true;
  
  // Keep generating until we find a unique ID
  while (exists) {
    const randomNum = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    rlid = `${prefix}${randomNum}`;
    
    // Check if this RLID already exists
    const allUsers = await storage.getAllUsers();
    exists = allUsers.some(user => user.rlid === rlid);
  }
  
  return rlid!;
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const PgSessionStore = connectPgSimple(session);
  const isProduction = process.env.NODE_ENV === "production";

  const sessionSettings: session.SessionOptions = {
    store: new PgSessionStore({
      pool,
      tableName: "sessions",
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Standard email/password login strategy
  passport.use(
    "local-email",
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await verifyPassword(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Username/password login strategy for admin/landlord
  passport.use(
    "local-username",
    new LocalStrategy(
      { usernameField: "username", passwordField: "password" },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user || !user.password || !(await verifyPassword(password, user.password))) {
            return done(null, false, { message: "Invalid username or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        // User not found - session is stale, return null to force re-login
        return done(null, null);
      }
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      // On error, return null instead of propagating error to force re-login
      done(null, null);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const rlid = await generateRLID('user'); // Generate TRLID for tenants
      const user = await storage.upsertUser({
        id: nanoid(),
        rlid,
        email,
        username: email, // Use email as username for consistency
        password: hashedPassword,
        firstName,
        lastName,
        role: 'tenant', // Explicitly set role to tenant
        isOnboarded: false,
        emailVerified: false,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ ...user, password: undefined });
      });
    } catch (error) {
      next(error);
    }
  });

  // Standard email/password login endpoint
  app.post("/api/login", passport.authenticate("local-email"), (req, res) => {
    const user = req.user as SelectUser;
    res.json({ ...user, password: undefined });
  });

  // Admin/Landlord username login endpoint
  app.post("/api/admin-login", async (req, res, next) => {
    passport.authenticate("local-username", async (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      // Check if user is admin or landlord
      if (user.role !== "admin" && user.role !== "landlord") {
        return res.status(403).json({ message: "Admin or landlord access required" });
      }

      // For admins, check if they have admin record
      if (user.role === "admin") {
        try {
          const adminUser = await storage.getAdminUser(user.id);
          if (!adminUser || !adminUser.isActive) {
            return res.status(403).json({ message: "Admin access denied" });
          }
        } catch (error) {
          return res.status(500).json({ message: "Failed to verify admin status" });
        }
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({ ...user, password: undefined });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = req.user as SelectUser;
    res.json({ ...user, password: undefined });
  });
}