
import { storage } from "./storage";
import { db } from "./db";
import { tenancies, rentPayments } from "@shared/schema";
import { eq, and, sum } from "drizzle-orm";

/**
 * Recalculates and updates the outstanding balance for a tenancy.
 * Ideally should be called whenever a payment is made or rent is due.
 * 
 * Logic:
 * Balance = (Months passed * Monthly Rent) - Total Verified Payments
 * 
 * Note: This is an approximation. A true ledger needs explicit "Rent Due" transaction records.
 * Since we don't have explicit "Rent Due" records yet (only property.monthlyRent), 
 * we will calculate based on time elapsed since Start Date.
 */
export async function updateTenancyBalance(tenancyId: string) {
    console.log(`[BalanceEngine] Updating balance for tenancy ${tenancyId}`);

    const tenancy = await storage.getTenancy(tenancyId);
    if (!tenancy) {
        console.error(`[BalanceEngine] Tenancy ${tenancyId} not found`);
        return;
    }

    if (!tenancy.startDate) {
        console.warn(`[BalanceEngine] Tenancy ${tenancyId} has no start date, skipping balance calc`);
        return;
    }

    // 1. Calculate Total Rent Due
    const startDate = new Date(tenancy.startDate);
    const now = new Date();

    // Simple month diff calculation
    // verification: if start date is future, due is 0
    let totalDue = 0;

    if (now >= startDate) {
        // Calculate months elapsed
        // This is naive: assuming rent is due on the same day of month as start date
        // TODO: Refine with specific billing day if available
        const yearsDiff = now.getFullYear() - startDate.getFullYear();
        const monthsDiff = now.getMonth() - startDate.getMonth();
        const daysDiff = now.getDate() - startDate.getDate();

        let monthsElapsed = yearsDiff * 12 + monthsDiff;
        if (daysDiff >= 0) {
            // We passed the day of month, so this month is due 
            monthsElapsed += 1;
        }

        // Cap at end date if ended
        if (tenancy.endDate) {
            const endDate = new Date(tenancy.endDate);
            if (now > endDate) {
                const endYears = endDate.getFullYear() - startDate.getFullYear();
                const endMonths = endDate.getMonth() - startDate.getMonth();
                const endDays = endDate.getDate() - startDate.getDate();
                let endMonthsElapsed = endYears * 12 + endMonths;
                if (endDays >= 0) endMonthsElapsed += 1;

                monthsElapsed = Math.min(monthsElapsed, endMonthsElapsed);
            }
        }

        const monthlyRent = parseFloat(tenancy.monthlyRent);
        totalDue = monthsElapsed * monthlyRent;
    }

    // 2. Calculate Total Paid
    // Retrieve payments for this property and user (assuming single tenant link for now per tenancy logic)
    // We need to fetch tenants of this tenancy first to find payments from them?
    // Or better, we trust the `tenancies.propertyId` linkage.
    // Actually, payments are linked to property and user. 
    // We should sum up payments for the tenants of this tenancy, WITHIN the tenancy dates.

    // Get tenants
    const tenants = await storage.getTenancyTenants(tenancyId);
    const tenantIds = tenants.map(t => t.tenantId);

    if (tenantIds.length === 0) {
        console.warn(`[BalanceEngine] Tenancy ${tenancyId} has no tenants`);
        return;
    }

    // Sum payments
    const result = await db
        .select({ totalPaid: sum(rentPayments.amount) })
        .from(rentPayments)
        .where(and(
            eq(rentPayments.propertyId, tenancy.propertyId),
            // Filter by tenants
            // In Drizzle, `inArray`
            // inArray(rentPayments.userId, tenantIds) 
            // Filter by date range (>= start date)
            // gte(rentPayments.dueDate, tenancy.startDate)
        ));

    // Note: Drizzle inArray/gte imports needed in this file if using query builder directly
    // Or use SQL

    // Simplified: Let's iterate payments for accuracy in V1
    let totalPaid = 0;
    for (const tenantId of tenantIds) {
        const userPayments = await storage.getUserRentPayments(tenantId);
        // Filter by property and date
        // Only include VERIFIED or PAID payments? Experian usually wants what's been paid.
        // Usually "paid" status.
        const relevantPayments = userPayments.filter(p =>
            p.propertyId === tenancy.propertyId &&
            p.status === 'paid' &&
            new Date(p.dueDate) >= startDate &&
            (!tenancy.endDate || new Date(p.dueDate) <= new Date(tenancy.endDate))
        );

        const sum = relevantPayments.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
        totalPaid += sum;
    }

    const outstandingBalance = totalDue - totalPaid;

    console.log(`[BalanceEngine] Tenancy ${tenancyId}: Due ${totalDue}, Paid ${totalPaid}, Balance ${outstandingBalance}`);

    // 3. Update Tenancy
    await storage.updateTenancy(tenancyId, {
        outstandingBalance: outstandingBalance.toFixed(2)
    });
}
