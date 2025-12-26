import { format } from "date-fns";
import { type User, type Tenancy, type TenantProfile, tenancies, users, tenantProfiles, properties, tenancyTenants } from "@shared/schema";
import { db } from "../db";
import { eq, and, lte, gte } from "drizzle-orm";

export interface ValidationResult {
    message: string;
    type: 'error' | 'warning';
}

export interface ExperianSnapshotRow {
    user: User;
    tenancy: Tenancy;
    profile: TenantProfile | null;
    validationErrors: ValidationResult[];
}

export class ExperianExportService {
    private static ORG_NAME = "RentLedger Ltd";
    // Placeholder Org ID - to be replaced by env var or config
    private static ORG_ID = "RENTLEDGER";

    /**
     * Fetches data for a specific month and builds snapshot rows.
     */
    static async getSnapshotData(month: Date): Promise<ExperianSnapshotRow[]> {
        // 1. Find all tenancies active in this month
        // Simplified: Find tenancies where startDate <= end of month AND (endDate >= start of month OR endDate is null)

        // For now, grabbing all active tenancies and filtering in memory or simple query
        // Optimisation: Join tables

        const allTenancies = await db.query.tenancies.findMany({
            with: {
                property: true,
            }
        });

        const rows: ExperianSnapshotRow[] = [];

        for (const tenancy of allTenancies) {
            // Find tenants for this tenancy
            const links = await db.query.tenancyTenants.findMany({
                where: eq(tenancyTenants.tenancyId, tenancy.id),
                with: {
                    tenant: true
                }
            });

            for (const link of links) {
                if (!link.tenant) continue;

                // Gating: Only Paid users can share data
                // Assuming 'standard' and 'premium' are paid plans. 'free' is default.
                if (!link.tenant.subscriptionPlan || link.tenant.subscriptionPlan === 'free') {
                    continue;
                }

                const profile = await db.query.tenantProfiles.findFirst({
                    where: eq(tenantProfiles.userId, link.tenant.id)
                });

                // Build row
                const row: ExperianSnapshotRow = {
                    user: link.tenant,
                    tenancy: tenancy,
                    profile: profile || null,
                    validationErrors: []
                };

                // Validate
                row.validationErrors = this.validData(row);
                rows.push(row);
            }
        }

        // Also include 'Legacy' style tenants linked via property but not tenancy table if needed?
        // Requirement says "Ensure ledger/payments link to tenancy if not already".
        // Assuming we use the robust 'tenancies' table for this.

        return rows;
    }

    /**
     * Generates the complete fixed-width content for the export file.
     */
    static generateExportContent(rows: ExperianSnapshotRow[], month: Date): string {
        const validRows = rows.filter(r => r.validationErrors.filter(e => e.type === 'error').length === 0 && !r.profile?.optOutReporting);

        // Sort logic could go here if needed

        const header = this.generateHeader(month);
        const details = validRows.map(row => this.generateDetailRecord(row));

        const totalBalance = validRows.reduce((sum, row) => {
            // Balance is in pence
            const bal = Math.round(Number(row.tenancy.outstandingBalance || 0) * 100);
            return sum + bal;
        }, 0);

        const trailer = this.generateTrailer(validRows.length, totalBalance);

        return [header, ...details, trailer].join("\r\n");
    }

    static generateHeader(date: Date): string {
        // Pos 1: Record Type 'H'
        // Pos 2-11: Org ID (10)
        // Pos 12-41: Org Name (30)
        // Pos 42-49: Creation Date YYYYMMDD
        // Pos 50-55: Creation Time HHMMSS
        // Pos 56-61: File Sequence (6) - Mocking '000001'
        // Pos 62-80: Filler (19)

        const now = new Date();
        const creationDate = format(now, "yyyyMMdd");
        const creationTime = format(now, "HHmmss");

        return [
            "H",
            this.pad(this.ORG_ID, 10),
            this.pad(this.ORG_NAME, 30),
            creationDate, // 8 chars
            creationTime, // 6 chars
            "000001",     // 6 chars
            this.pad("", 19)
        ].join("");
    }

    static generateDetailRecord(row: ExperianSnapshotRow): string {
        const { user, tenancy, profile } = row;

        // Mapping inputs
        const surname = user.lastName || "";
        const forename = user.firstName || "";
        const middle = profile?.middleName || "";
        const dob = profile?.dateOfBirth ? format(new Date(profile.dateOfBirth), "yyyyMMdd") : "";

        const addr1 = profile?.addressLine1 || "";
        const addr2 = profile?.addressLine2 || "";
        const addr3 = profile?.addressLine3 || "";
        const addr4 = profile?.addressLine4 || "";
        const postcode = profile?.postcode || "";

        const start = tenancy.startDate ? format(new Date(tenancy.startDate), "yyyyMMdd") : "";
        const end = tenancy.endDate ? format(new Date(tenancy.endDate), "yyyyMMdd") : ""; // Blank if active? Layout says "YYYYMMDD or spaces"

        // Monetary in pence
        const rentAmount = Math.round(Number(tenancy.monthlyRent || 0) * 100);
        const balance = Math.round(Number(tenancy.outstandingBalance || 0) * 100);

        // Rent Freq: Defaults to 'M'
        const freq = tenancy.rentFrequency ? tenancy.rentFrequency.charAt(0).toUpperCase() : "M";

        // Payment Status calculation
        // 0 = up to date, 1 = arrears (simplified as per spec "0 if balance=0, 1 if balance>0")
        // Spec also mentions 1-6 for arrears months, but layout notes say "0=up to date, 1=arrears". 
        // Sticking to layout notes: "0 if balance = 0, 1 if balance > 0"
        let payStatus = "0";
        if (balance > 0) payStatus = "1";

        // Flags
        const goneAway = profile?.goneAway ? "Y" : "N";
        const arrange = profile?.arrangementToPay ? "Y" : "N";
        const query = profile?.query ? "Y" : "N";
        const deceased = profile?.deceased ? "Y" : "N";
        const thirdParty = profile?.thirdPartyPaid ? "Y" : "N";
        const evicted = profile?.evictionFlag ? "Y" : "N"; // layout calls it "Evicted"
        const evictionDate = profile?.evictionDate ? format(new Date(profile.evictionDate), "yyyyMMdd") : "";

        const accRef = tenancy.tenancyRef || "";

        return [
            "D",                                      // 1
            this.pad(surname, 30),                    // 2-31
            this.pad(forename, 30),                   // 32-61
            this.pad(middle, 30),                     // 62-91
            this.pad(dob, 8),                         // 92-99
            this.pad(addr1, 30),                      // 100-129
            this.pad(addr2, 30),                      // 130-159
            this.pad(addr3, 30),                      // 160-189
            this.pad(addr4, 30),                      // 190-219
            this.pad(postcode, 8),                    // 220-227
            this.pad(start, 8),                       // 228-235
            this.pad(end, 8),                         // 236-243
            this.padNumber(rentAmount, 8),            // 244-251
            this.pad(freq, 1),                        // 252
            this.padNumber(balance, 8),               // 253-260 (Balance len 8 in layout? Wrapper says 8: "253-260")
            payStatus,                                // 261
            goneAway,                                 // 262
            arrange,                                  // 263
            query,                                    // 264
            deceased,                                 // 265
            thirdParty,                               // 266
            evicted,                                  // 267
            this.pad(evictionDate, 8),                // 268-275
            this.pad(accRef, 10),                     // 276-285
            this.pad("", 15)                          // 286-300
        ].join("");
    }

    static generateTrailer(recordCount: number, totalBalance: number): string {
        // Pos 1: T
        // Pos 2-11: Org ID (10)
        // Pos 12-21: Record Count (10)
        // Pos 22-31: Total Balance (10)
        // Pos 32-80: Filler (49)

        return [
            "T",
            this.pad(this.ORG_ID, 10),
            this.padNumber(recordCount, 10),
            this.padNumber(totalBalance, 10),
            this.pad("", 49)
        ].join("");
    }

    static validData(row: ExperianSnapshotRow): ValidationResult[] {
        const errors: ValidationResult[] = [];
        const { user, profile, tenancy } = row;

        if (!user.lastName) errors.push({ message: "Missing Surname", type: 'error' });
        if (!profile?.dateOfBirth) errors.push({ message: "Missing DOB", type: 'error' });
        if (!profile?.addressLine1) errors.push({ message: "Missing Address Line 1", type: 'error' });
        if (!profile?.postcode) errors.push({ message: "Missing Postcode", type: 'error' });
        if (!tenancy.startDate) errors.push({ message: "Missing Tenancy Start Date", type: 'error' });
        if (!tenancy.monthlyRent || Number(tenancy.monthlyRent) < 0) errors.push({ message: "Invalid Rent Amount", type: 'error' });

        return errors;
    }

    // --- Helpers ---

    private static pad(val: string, len: number): string {
        if (!val) return " ".repeat(len);
        if (val.length > len) return val.substring(0, len);
        return val.padEnd(len, " ");
    }

    private static padNumber(val: number, len: number): string {
        const s = Math.floor(val).toString();
        if (s.length > len) return s.substring(0, len); // Should ideally warn if overflow
        return s.padStart(len, "0");
    }
}
