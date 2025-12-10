
import { db } from "../server/db";
import { users, rentPayments, manualPayments, rentLogs } from "../shared/schema";
import { eq, or } from "drizzle-orm";

async function debugUserPayments() {
    const email = "socials@rentledger.co.uk";
    console.log(`Searching for user with email: ${email}`);

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        console.log("User not found!");
        process.exit(1);
    }

    console.log(`Found user: ${user.id} (${user.firstName} ${user.lastName})`);

    console.log("\n--- Standard Rent Payments ---");
    const standard = await db.select().from(rentPayments).where(eq(rentPayments.userId, user.id));
    console.log(`Count: ${standard.length}`);
    console.log(JSON.stringify(standard, null, 2));

    console.log("\n--- Manual Payments ---");
    const manual = await db.select().from(manualPayments).where(eq(manualPayments.userId, user.id));
    console.log(`Count: ${manual.length}`);
    console.log(JSON.stringify(manual, null, 2));

    console.log("\n--- Rent Logs ---");
    const logs = await db.select().from(rentLogs).where(eq(rentLogs.userId, user.id));
    console.log(`Count: ${logs.length}`);
    console.log(JSON.stringify(logs, null, 2));

    process.exit(0);
}

debugUserPayments().catch(console.error);
