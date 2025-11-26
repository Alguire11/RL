// Load environment variables from .env file FIRST, before any other imports
import { config } from "dotenv";
config(); // Load .env file into process.env

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerWebhookRoutes } from "./routes/webhooks";
import { setupVite, serveStatic, log } from "./vite";
import { printEnvironmentStatus, validateEnvironment } from "./env-validation";
import { startScheduler } from "./services/scheduler";

// Validate environment variables before starting
const envValidation = printEnvironmentStatus();
if (!envValidation.isValid) {
  console.error('\n❌ FATAL: Required environment variables are missing.');
  console.error('   Please set all required environment variables before starting the server.');
  console.error('   See PRODUCTION_DEPLOYMENT_GUIDE.md for details.\n');
  process.exit(1);
}

const app = express();

// Security Middleware
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? false : true, // Strict origin in prod (configure as needed)
  credentials: true,
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 10000, // limit each IP to 100 requests per windowMs in production, 10000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later",
}));

import pino from "pino";

// Structured Logging
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  } : undefined,
});

app.use(pinoHttp({
  logger,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
}));

app.use(express.json({ limit: '10mb' })); // Reduced from 50mb
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

(async () => {
  startScheduler();

  // Register webhook routes BEFORE CSRF protection (webhooks don't use CSRF)
  registerWebhookRoutes(app);

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error but don't crash
    console.error(err);

    // In production, don't leak stack traces
    const response = process.env.NODE_ENV === "production"
      ? { message }
      : { message, stack: err.stack };

    res.status(status).json(response);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port} `);
  });
})();
