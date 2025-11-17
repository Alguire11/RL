// Load environment variables from .env file if not already loaded
// This ensures db.ts can be imported before index.ts loads dotenv
import { config } from 'dotenv';
if (!process.env.DATABASE_URL) {
  config(); // Load .env file synchronously
}

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });