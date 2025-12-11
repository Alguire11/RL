import { db } from "./server/db";
import { rentPayments } from "@shared/schema";

async function checkRentPayments() {
  const payments = await db.select().from(rentPayments);
  
  console.log("=== All Rent Payments ===\n");
  payments.forEach(p => {
    console.log(`ID: ${p.id}`);
    console.log(`  User: ${p.userId}`);
    console.log(`  Amount: ${p.amount}`);
    console.log(`  Status: ${p.status}`);
    console.log(`  Payment Method: ${p.paymentMethod || 'NULL (automated?)'}`);
    console.log(`  Transaction ID: ${p.transactionId || 'NULL'}`);
    console.log(`  Created: ${p.createdAt}`);
    console.log('---');
  });
  
  process.exit(0);
}

checkRentPayments().catch(console.error);
