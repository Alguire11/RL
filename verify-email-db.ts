
import { storage } from "./server/storage";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function verifyUser(email: string) {
    console.log(`Verifying user: ${email}`);
    try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
            console.error("User not found");
            process.exit(1);
        }

        await db.update(users)
            .set({ emailVerified: true })
            .where(eq(users.id, user.id));

        console.log("User verified successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error verifying user:", error);
        process.exit(1);
    }
}

const email = process.argv[2];
if (!email) {
    console.error("Please provide an email address");
    process.exit(1);
}

verifyUser(email);
