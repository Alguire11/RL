
import { storage } from "../storage";
import { hashPassword } from "../passwords";
import { nanoid } from "nanoid";
import { db } from "../db";
import { adminUsers } from "@shared/schema";

async function createFounderAdmin() {
    const email = "founder@rentledger.app";
    const password = "SecureFounderPassword123!"; // This should be changed after first login

    console.log(`Creating founder admin account for ${email}...`);

    try {
        // 1. Create the base user
        const hashedPassword = await hashPassword(password);

        // Check if user exists first
        const existingUser = await storage.getUserByUsername(email);
        if (existingUser) {
            console.log("User already exists. Promoting to admin if not already.");
            // Logic to promote would go here, but for now let's just warn
            // We'll assume we want to create a fresh one or fail
        }

        const user = await storage.upsertUser({
            id: nanoid(),
            email,
            username: email,
            password: hashedPassword,
            firstName: "Founder",
            lastName: "Admin",
            role: "admin",
            isOnboarded: true,
            emailVerified: true,
            subscriptionPlan: "free", // Admins don't need a plan usually, or 'enterprise'
            subscriptionStatus: "active",
            isActive: true
        });

        console.log(`User created with ID: ${user.id}`);

        // 2. Create the admin entry
        // Check if admin entry exists
        const existingAdmin = await storage.getAdminUser(user.id);
        if (!existingAdmin) {
            await db.insert(adminUsers).values({
                userId: user.id,
                role: "admin",
                permissions: ["all"],
                isActive: true
            });
            console.log("Admin privileges granted.");
        } else {
            console.log("User already has admin privileges.");
        }

        console.log("\n✅ Founder Admin Created Successfully!");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log("⚠️  Please change this password immediately after logging in.");

        process.exit(0);
    } catch (error) {
        console.error("Error creating founder admin:", error);
        process.exit(1);
    }
}

createFounderAdmin();
