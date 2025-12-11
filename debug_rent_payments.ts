
import { db } from "./server/db";
import { rentPayments } from "@shared/schema";

async function checkRentPayments() {
    const payments = await db.select().from(rentPayments);
    console.log("Rent Payments:", JSON.stringify(payments, null, 2));
    process.exit(0);
}

checkRentPayments();
