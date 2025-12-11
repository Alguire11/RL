import { db } from "./server/db";
import { emailVerificationTokens, users } from "@shared/schema";

async function main() {
  console.log("=== Checking Email Verification Tokens ===\n");
  
  const tokens = await db.select().from(emailVerificationTokens);
  console.log(`Total tokens in database: ${tokens.length}\n`);
  
  if (tokens.length > 0) {
    console.log("Recent tokens:");
    tokens.slice(-5).forEach(t => {
      console.log(`Token: ${t.token.substring(0, 10)}...`);
      console.log(`  User ID: ${t.userId}`);
      console.log(`  Used: ${t.used}`);
      console.log(`  Expires: ${t.expiresAt}`);
      console.log(`  Created: ${t.createdAt}`);
      console.log('---');
    });
  } else {
    console.log("❌ No verification tokens found in database!");
    console.log("This means tokens are not being created during signup.");
  }
  
  // Check recent users
  const recentUsers = await db.select().from(users).limit(5);
  console.log("\nRecent users:");
  recentUsers.forEach(u => {
    console.log(`${u.email} - Verified: ${u.emailVerified}`);
  });
  
  process.exit(0);
}

main().catch(console.error);
