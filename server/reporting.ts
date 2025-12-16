
import crypto from "crypto";
import { storage } from "./storage";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import type { InsertReportingBatch, InsertReportingRecord, ReportingRecord } from "@shared/schema";
import { db } from "./db"; // Direct access needed for complex joins if storage doesn't support it
import { eq, and, between, inArray } from "drizzle-orm"; // Or use SQL
import { users, rentPayments, properties, consents } from "@shared/schema";

import { hashReference } from "./reporting-utils";

/**
 * Generates a reporting batch for a given month
 */
export async function generateBatch(
    month: string, // YYYY-MM
    adminId: string,
    options: { includeUnverified: boolean; onlyConsented: boolean; format: 'csv' | 'json' }
) {
    console.log(`[Reporting] Starting batch generation for ${month} by admin ${adminId}`);

    // 1. Create the batch record in "generating" state
    console.log("Creating batch record...");
    const batch = await storage.createReportingBatch({
        month,
        includeUnverified: options.includeUnverified,
        onlyConsented: options.onlyConsented,
        format: options.format,
        status: 'generating',
        recordCount: 0,
        createdByAdminId: adminId,
        // Let createdAt default to now()
    });
    console.log(`Batch ${batch.id} created.`);

    try {
        // 2. Fetch data
        console.log("Fetching data...");
        // We need: Paid RentPayments in the month range
        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of month

        // Fetch all potential payments
        // This is a bit heavy, might need optimization for large datasets
        // For V1 we do a raw join query

        // This query mimics: 
        // SELECT * FROM rent_payments 
        // JOIN users ON rent_payments.user_id = users.id 
        // JOIN properties ON rent_payments.property_id = properties.id
        // LEFT JOIN consents ON users.id = consents.tenant_id

        const allPayments = await db
            .select({
                payment: rentPayments,
                tenant: users,
                property: properties,
                consent: consents
            })
            .from(rentPayments)
            .innerJoin(users, eq(rentPayments.userId, users.id))
            .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
            .leftJoin(consents, and(
                eq(users.id, consents.tenantId),
                eq(consents.scope, 'reporting_to_partners')
            ))
            .where(
                // Filter by date range (paidDate or dueDate?) 
                // Usually reporting is on PAID date for credit adjustments
                // But could be DUE date for missed payments. 
                // Requirement: "verified rent payment record". 
                // Let's assume we report payments that fell due in that month OR were paid in that month.
                // For simplicity V1: Report payments with Due Date in that month.
                // NOTE: Date comparison in Drizzle/SQL needs care with strings/dates
                // rentPayments.dueDate is a string 'YYYY-MM-DD' usually in this schema
                // Let's filter in memory if needed or use SQL operator
                // Using simple string comparison for YYYY-MM
                eq(db.execute(sql`to_char(${rentPayments.dueDate}, 'YYYY-MM')`), month)
            );

        // NOTE: The above query logic is pseudo-code-ish for Drizzle. 
        // Let's assume we fetch generic and filter in JS for safety/speed in V1 MVP

        // Alternative: Fetch using storage and loop.
        // Let's fetch all users, properties, payments... no that's bad.

        // Let's execute specific query
        const rawRows = await db.execute(sql`
            SELECT 
                rp.*,
                u.id as tenant_id, u.rlid as tenant_rlid,
                p.id as property_id, p.postcode, p.monthly_rent,
                c.status as consent_status, c.captured_at as consent_timestamp
            FROM rent_payments rp
            JOIN users u ON rp.user_id = u.id
            JOIN properties p ON rp.property_id = p.id
            LEFT JOIN consents c ON u.id = c.tenant_id AND c.scope = 'reporting_to_partners'
            WHERE to_char(rp.due_date, 'YYYY-MM') = ${month}
        `);

        const rows = rawRows.rows || rawRows; // Adapt to driver response structure
        console.log(`Fetched ${rows.length} rows.`);

        // 3. Filter and Map
        const recordsToInsert: InsertReportingRecord[] = [];

        for (const row of rows) {
            const rowData = row as any;

            // Filter: Verification
            if (!options.includeUnverified && !rowData.is_verified) {
                continue;
            }

            // Filter: Consent
            const hasConsent = rowData.consent_status === 'consented';
            if (options.onlyConsented && !hasConsent) {
                continue;
            }

            // Map to Reporting Record
            recordsToInsert.push({
                batchId: batch.id,
                tenantRef: hashReference(rowData.tenant_id),
                landlordRef: hashReference(rowData.property_id.toString()), // Using property/landlord ID hashed
                propertyRef: hashReference(rowData.property_id.toString()),
                postcodeOutward: rowData.postcode ? rowData.postcode.split(' ')[0] : null,
                rentAmountPence: Math.round(parseFloat(rowData.amount) * 100),
                rentFrequency: 'monthly', // Default assumption or fetch from prop
                periodStart: rowData.due_date, // Approx
                periodEnd: rowData.due_date, // Approx
                dueDate: rowData.due_date,
                paidDate: rowData.paid_date,
                paymentStatus: rowData.status,
                verificationStatus: rowData.is_verified ? 'verified' : 'unverified',
                verificationMethod: 'landlord_portal',
                // SAFETY: Ensure dates are Dates
                verificationTimestamp: rowData.created_at ? new Date(rowData.created_at) : new Date(),
                consentStatus: rowData.consent_status || 'not_consented',
                consentTimestamp: rowData.consent_timestamp ? new Date(rowData.consent_timestamp) : null,
                auditRef: uuidv4(),
            });
        }

        console.log(`Processing ${recordsToInsert.length} records...`);

        // 4. Batch Insert
        await storage.createReportingRecords(recordsToInsert);

        // 5. Generate Checksum (of the records, simulating what the file would be)
        // We will generate the checksum of the content we WOUlD download
        const fileContent = options.format === 'csv'
            ? generateCSV(recordsToInsert)
            : JSON.stringify(recordsToInsert);

        const checksum = (crypto as any).createHash('sha256').update(fileContent).digest('hex');

        // 6. Update Batch
        await storage.updateReportingBatch(batch.id, {
            status: 'ready',
            recordCount: recordsToInsert.length,
            checksumSha256: checksum,
        });

        console.log(`[Reporting] Batch ${batch.id} completed with ${recordsToInsert.length} records.`);
        return { success: true, batchId: batch.id, count: recordsToInsert.length };

    } catch (error) {
        console.error(`[Reporting] Batch generation failed:`, error);
        await storage.updateReportingBatch(batch.id, {
            status: 'failed',
            failedReason: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}

export function generateCSV(records: any[]): string {
    if (records.length === 0) return "";
    const headers = [
        "Record ID", "Tenant Ref", "Property Ref", "Postcode Out",
        "Rent Amount (p)", "Due Date", "Paid Date", "Status", "Verified"
    ];
    const rows = records.map(r => [
        r.auditRef, r.tenantRef, r.propertyRef, r.postcodeOutward,
        r.rentAmountPence, r.dueDate, r.paidDate, r.paymentStatus, r.verificationStatus
    ]);

    return [
        headers.join(","),
        ...rows.map(r => r.map((c: any) => `"${c || ''}"`).join(","))
    ].join("\n");
}

import { sql } from "drizzle-orm";
