import { db } from "./server/db";
import { rentPayments, manualPayments } from "@shared/schema";
import { isNull, isNotNull, sql } from "drizzle-orm";

async function debugPaymentBreakdown() {
  console.log("=== Payment Breakdown Debug ===\n");

  // Count all rentPayments
  const [allRentPayments] = await db
    .select({ count: sql<number>`count(*)` })
    .from(rentPayments);
  console.log(`Total rentPayments records: ${allRentPayments.count}`);

  // Count rentPayments by paymentMethod
  const [automatedPayments] = await db
    .select({ count: sql<number>`count(*)` })
    .from(rentPayments)
    .where(isNull(rentPayments.paymentMethod));
  console.log(`  - Automated (paymentMethod IS NULL): ${automatedPayments.count}`);

  const [manualRentPayments] = await db
    .select({ count: sql<number>`count(*)` })
    .from(rentPayments)
    .where(sql`${rentPayments.paymentMethod} = 'manual_upload'`);
  console.log(`  - Manual (paymentMethod = 'manual_upload'): ${manualRentPayments.count}`);

  // Count all manualPayments
  const [allManual] = await db
    .select({ count: sql<number>`count(*)` })
    .from(manualPayments);
  console.log(`\nTotal manualPayments records: ${allManual.count}`);

  // Count verified manualPayments
  const [verifiedManual] = await db
    .select({ count: sql<number>`count(*)` })
    .from(manualPayments)
    .where(isNotNull(manualPayments.verifiedBy));
  console.log(`  - Verified: ${verifiedManual.count}`);

  // Count pending manualPayments
  const [pendingManual] = await db
    .select({ count: sql<number>`count(*)` })
    .from(manualPayments)
    .where(isNull(manualPayments.verifiedBy));
  console.log(`  - Pending: ${pendingManual.count}`);

  console.log("\n=== Expected Dashboard Count ===");
  const expectedCount = Number(automatedPayments.count) + Number(verifiedManual.count);
  console.log(`Automated + Verified Manual = ${automatedPayments.count} + ${verifiedManual.count} = ${expectedCount}`);

  process.exit(0);
}

debugPaymentBreakdown().catch(console.error);
