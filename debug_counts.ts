
import { db } from "./server/db";
import { rentPayments, manualPayments } from "@shared/schema";
import { sql, isNotNull } from "drizzle-orm";

async function checkCounts() {
    const [rp] = await db.select({ count: sql<number>`count(*)` }).from(rentPayments);
    const [mp] = await db.select({ count: sql<number>`count(*)` }).from(manualPayments);
    const [mpVerified] = await db.select({ count: sql<number>`count(*)` }).from(manualPayments).where(isNotNull(manualPayments.verifiedBy));

    console.log("RentPayments Count:", rp.count);
    console.log("ManualPayments Total:", mp.count);
    console.log("ManualPayments Verified:", mpVerified.count);

    process.exit(0);
}

checkCounts();
