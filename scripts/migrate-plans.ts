
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function migratePlanNames() {
    console.log("Starting plan name migration...");

    try {
        // Migrate 'standard' to 'professional'
        const standardResult = await db
            .update(users)
            .set({ subscriptionPlan: "professional" })
            .where(eq(users.subscriptionPlan, "standard"))
            .returning({ id: users.id });

        console.log(`Migrated ${standardResult.length} users from 'standard' to 'professional'.`);

        // Migrate 'premium' to 'enterprise'
        const premiumResult = await db
            .update(users)
            .set({ subscriptionPlan: "enterprise" })
            .where(eq(users.subscriptionPlan, "premium"))
            .returning({ id: users.id });

        console.log(`Migrated ${premiumResult.length} users from 'premium' to 'enterprise'.`);

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migratePlanNames();
