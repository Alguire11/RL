import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcryptjs";

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password using Node's scrypt implementation with a per-password salt.
 * The hashed value is stored as "hash.salt" so we can perform constant-time comparisons later.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compares a plaintext password with a stored hash.
 * Supports both scrypt (new format: "hash.salt") and bcrypt (legacy format) for backward compatibility.
 */
export async function verifyPassword(supplied: string, stored: string): Promise<boolean> {
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    // Legacy bcrypt hash
    return bcrypt.compare(supplied, stored);
  }

  // New scrypt hash format: "hash.salt"
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    throw new Error("Stored password hash is malformed");
  }

  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
