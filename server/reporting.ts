
import crypto from "crypto";
import { storage } from "./storage";
import { format } from "date-fns";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";
import type { InsertReportingRecord } from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { ExperianExportService, ExperianSnapshotRow } from "./services/experian-export";
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
    });
    console.log(`Batch ${batch.id} created.`);

    try {
        // 2. Fetch data
        const rawRows = await db.execute(sql`
            SELECT 
                tt.joint_indicator, tt.primary_tenant,
                t.id as tenancy_id, t.tenancy_ref, t.start_date, t.end_date, t.monthly_rent, t.outstanding_balance as current_balance,
                u.id as user_id, u.rlid as tenant_rlid, u.first_name, u.last_name, u.email,
                p.id as property_id, p.postcode, p.address as property_address, p.city as property_city,
                c.status as consent_status, c.captured_at as consent_timestamp,
                tp.title, tp.middle_name, tp.date_of_birth, tp.previous_address, tp.gone_away, tp.eviction_flag, tp.opt_out_reporting
            FROM tenancies t
            JOIN tenancy_tenants tt ON t.id = tt.tenancy_id
            JOIN users u ON tt.tenant_id = u.id
            JOIN properties p ON t.property_id = p.id
            LEFT JOIN consents c ON u.id = c.tenant_id AND c.scope = 'reporting_to_partners'
            LEFT JOIN tenant_profiles tp ON u.id = tp.user_id
            WHERE 
                (t.status = 'active' OR (t.status = 'ended' AND t.outstanding_balance > 0))
        `);

        const rows = rawRows.rows || rawRows;
        console.log(`Fetched ${rows.length} potential records.`);

        // 3. Filter and Map
        const recordsToInsert: InsertReportingRecord[] = [];
        const fileLines: string[] = [];
        let totalBalancePence = 0;

        // Add Header
        if (options.format === 'csv') {
            const header = ExperianExportService.generateHeader(new Date());
            fileLines.push(header);
        }

        for (const row of rows) {
            const rowData = row as any;

            // Filter: Verification (Assume verified if in tenancy for now, unless strict)
            // Filter: Consent
            const hasConsent = rowData.consent_status === 'consented';
            if (options.onlyConsented && !hasConsent) {
                continue;
            }

            const isOptOut = !!rowData.opt_out_reporting;

            // Construct Experian Snapshot Row (Partial objects to satisfy interface)
            const snapshotRow: ExperianSnapshotRow = {
                user: {
                    id: rowData.user_id,
                    firstName: rowData.first_name,
                    lastName: rowData.last_name,
                } as any,
                tenancy: {
                    id: rowData.tenancy_id,
                    tenancyRef: rowData.tenancy_ref,
                    startDate: rowData.start_date,
                    endDate: rowData.end_date,
                    monthlyRent: rowData.monthly_rent,
                    outstandingBalance: rowData.current_balance,
                    rentFrequency: 'monthly',
                } as any,
                profile: {
                    userId: rowData.user_id,
                    title: rowData.title,
                    middleName: rowData.middle_name,
                    dateOfBirth: rowData.date_of_birth,
                    addressLine1: rowData.property_address,
                    addressLine2: rowData.property_city,
                    postcode: rowData.postcode,
                    previousAddress: rowData.previous_address,
                    goneAway: rowData.gone_away,
                    evictionFlag: rowData.eviction_flag,
                    optOutReporting: isOptOut
                } as any,
                validationErrors: []
            };

            // Validate using Service
            const validationErrors = ExperianExportService.validData(snapshotRow);

            // Calculate Balance for Trailer
            if (!snapshotRow.validationErrors.length) { // Only sum valid rows? Or all? Usually valid only.
                // Re-calculating same way service does
                const bal = Math.round(parseFloat(rowData.current_balance || '0') * 100);
                totalBalancePence += bal;
            }

            // Map to Reporting Record (Database Log)
            recordsToInsert.push({
                batchId: batch.id,
                tenantRef: hashReference(rowData.user_id),
                landlordRef: hashReference(rowData.property_id.toString()),
                propertyRef: hashReference(rowData.property_id.toString()),
                postcodeOutward: rowData.postcode ? rowData.postcode.split(' ')[0] : null,
                rentAmountPence: Math.round(parseFloat(rowData.monthly_rent || '0') * 100),
                rentFrequency: 'monthly',
                periodStart: new Date(`${month}-01`),
                periodEnd: new Date(`${month}-28`),
                dueDate: new Date(`${month}-01`),
                paidDate: null,
                paymentStatus: 'unknown',
                verificationStatus: 'verified',
                verificationMethod: 'landlord_portal',
                consentStatus: rowData.consent_status || 'not_consented',
                consentTimestamp: rowData.consent_timestamp ? new Date(rowData.consent_timestamp) : null,
                auditRef: uuidv4(),
                metadata: {
                    user: { firstName: rowData.first_name, lastName: rowData.last_name },
                    tenancy: {
                        tenancyRef: rowData.tenancy_ref,
                        monthlyRent: rowData.monthly_rent,
                        outstandingBalance: rowData.current_balance,
                        startDate: rowData.start_date,
                        endDate: rowData.end_date
                    },
                    profile: { ...snapshotRow.profile },
                    validationErrors,
                    sourceData: rowData
                }
            } as any);

            // Generate Line
            if (options.format === 'csv') {
                try {
                    const line = ExperianExportService.generateDetailRecord(snapshotRow);
                    fileLines.push(line);
                } catch (e) {
                    console.error("Error generating line for user " + rowData.user_id, e);
                }
            }
        }

        // Trailer
        if (options.format === 'csv') {
            fileLines.push(ExperianExportService.generateTrailer(recordsToInsert.length, totalBalancePence));
        }

        console.log(`Processing ${recordsToInsert.length} records...`);

        // 4. Batch Insert
        await storage.createReportingRecords(recordsToInsert);

        // 5. Generate Content
        const fileContent = options.format === 'json'
            ? JSON.stringify(recordsToInsert)
            : fileLines.join('\n');

        const checksum = (crypto as any).createHash('sha256').update(fileContent).digest('hex');

        // 6. Update Batch
        await storage.updateReportingBatch(batch.id, {
            status: 'ready',
            recordCount: recordsToInsert.length,
            checksumSha256: checksum,
        });

        console.log(`[Reporting] Batch ${batch.id} completed.`);
        return { success: true, batchId: batch.id, count: recordsToInsert.length };

    } catch (error) {
        console.error(`[Reporting] Batch generation failed: `, error);
        await storage.updateReportingBatch(batch.id, {
            status: 'failed',
            failedReason: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
