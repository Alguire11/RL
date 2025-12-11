import { db } from "./server/db";
import { rentPayments } from "@shared/schema";
import { isNull } from "drizzle-orm";

async function main() {
  const payments = await db.select().from(rentPayments).where(isNull(rentPayments.paymentMethod));
  
  console.log('=== Rent Payments with NULL paymentMethod ===');
  console.log('Total:', payments.length);
  console.log('');
  
  payments.forEach(p => {
    console.log(`ID: ${p.id}, User: ${p.userId}, Amount: £${p.amount}`);
    console.log(`  Status: ${p.status}, Verified: ${p.isVerified}`);
    console.log(`  Due: ${p.dueDate}, Paid: ${p.paidDate || 'N/A'}`);
    console.log(`  Created: ${p.createdAt}`);
    console.log('---');
  });
  
  process.exit(0);
}

main().catch(console.error);
