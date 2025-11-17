/**
 * Script to create admin account for Ismail
 * Run with: npx tsx scripts/create-admin-ismail.ts
 */

import { storage } from "../server/storage";
import { hashPassword } from "../server/passwords";
import { nanoid } from "nanoid";

async function createIsmailAdmin() {
  try {
    console.log("🔐 Creating admin account for Ismail...");

    const username = "Ismail";
    const password = "Jahbless101";
    const email = "ismail@enoikio.co.uk";
    const firstName = "Ismail";
    const lastName = "Admin";

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    
    if (existingUser) {
      console.log(`⚠️  User ${username} already exists. Updating to admin...`);
      
      // Update existing user to admin role
      const updatedUser = await storage.upsertUser({
        id: existingUser.id,
        email: email,
        username: username,
        password: await hashPassword(password),
        firstName: firstName,
        lastName: lastName,
        role: "admin",
        isActive: true,
        isOnboarded: true,
        emailVerified: true,
        subscriptionPlan: "premium",
        subscriptionStatus: "active",
        updatedAt: new Date(),
      });

      // Check if admin entry exists
      const existingAdmin = await storage.getAdminUser(updatedUser.id);
      if (!existingAdmin) {
        // Create admin user entry
        await storage.createAdminUser({
          userId: updatedUser.id,
          role: "admin",
          isActive: true,
          permissions: ["all"], // Full permissions
        });
        console.log(`✅ Admin entry created for existing user: ${username}`);
      } else {
        // Update admin entry
        await storage.updateAdminUser(updatedUser.id, {
          role: "admin",
          isActive: true,
          permissions: ["all"],
        });
        console.log(`✅ Admin entry updated for user: ${username}`);
      }

      console.log("\n✅ Admin account setup completed!");
      console.log(`\n📋 Account Details:`);
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log(`   Email: ${email}`);
      console.log(`   Role: admin`);
      console.log(`   Permissions: all (full access)`);
      console.log(`   User ID: ${updatedUser.id}`);
      
      return updatedUser;
    }

    // Create new user
    const userId = nanoid();
    const hashedPassword = await hashPassword(password);

    const newUser = await storage.upsertUser({
      id: userId,
      email: email,
      username: username,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
      role: "admin",
      isActive: true,
      isOnboarded: true,
      emailVerified: true,
      subscriptionPlan: "premium",
      subscriptionStatus: "active",
    });

    // Create admin user entry
    await storage.createAdminUser({
      userId: newUser.id,
      role: "admin",
      isActive: true,
      permissions: ["all"], // Full admin permissions
    });

    console.log("\n✅ Admin account created successfully!");
    console.log(`\n📋 Account Details:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: admin`);
    console.log(`   Permissions: all (full access)`);
    console.log(`   User ID: ${newUser.id}`);
    console.log(`\n🔗 Login URL: http://localhost:5000/admin-login`);
    console.log(`\n✨ You can now login with these credentials!`);

    return newUser;
  } catch (error) {
    console.error("❌ Error creating admin account:", error);
    throw error;
  }
}

// Run the script
createIsmailAdmin()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

