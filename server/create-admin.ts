/**
 * Script to create an admin user account
 * Usage: This can be run directly or called via an admin endpoint
 */

import { storage } from "./storage";
import { hashPassword } from "./passwords";
import { nanoid } from "nanoid";

export async function createAdminAccount(
  username: string,
  password: string,
  email?: string,
  firstName?: string,
  lastName?: string
) {
  try {
    console.log(`🔐 Creating admin account for: ${username}`);

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      console.log(`⚠️  User ${username} already exists. Updating to admin...`);
      
      // Update existing user to admin role
      const updatedUser = await storage.upsertUser({
        id: existingUser.id,
        email: email || existingUser.email || `${username}@enoikio.co.uk`,
        username: username,
        password: await hashPassword(password),
        firstName: firstName || existingUser.firstName || "Admin",
        lastName: lastName || existingUser.lastName || "User",
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
        // Update admin entry - check if updateAdminUser exists, otherwise recreate
        try {
          await storage.updateAdminUser(updatedUser.id, {
            role: "admin",
            isActive: true,
            permissions: ["all"],
          });
          console.log(`✅ Admin entry updated for user: ${username}`);
        } catch (e) {
          // If update fails, delete and recreate
          await storage.createAdminUser({
            userId: updatedUser.id,
            role: "admin",
            isActive: true,
            permissions: ["all"],
          });
          console.log(`✅ Admin entry recreated for user: ${username}`);
        }
      }

      return updatedUser;
    }

    // Create new user
    const userId = nanoid();
    const hashedPassword = await hashPassword(password);
    const userEmail = email || `${username}@enoikio.co.uk`;

    const newUser = await storage.upsertUser({
      id: userId,
      email: userEmail,
      username: username,
      password: hashedPassword,
      firstName: firstName || "Admin",
      lastName: lastName || "User",
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

    console.log(`✅ Admin account created successfully: ${username}`);
    console.log(`   Email: ${userEmail}`);
    console.log(`   User ID: ${newUser.id}`);
    console.log(`   Role: admin`);
    console.log(`   Permissions: all`);

    return newUser;
  } catch (error) {
    console.error("❌ Error creating admin account:", error);
    throw error;
  }
}

// If run directly (for testing)
if (require.main === module) {
  const username = process.argv[2] || "Ismail";
  const password = process.argv[3] || "Jahbless101";
  const email = process.argv[4];
  const firstName = process.argv[5];
  const lastName = process.argv[6];

  createAdminAccount(username, password, email, firstName, lastName)
    .then(() => {
      console.log("✅ Admin account creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed to create admin account:", error);
      process.exit(1);
    });
}

