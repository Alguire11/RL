import { describe, it } from "node:test";
import assert from "node:assert";
import { ExperianExportService, type ExperianSnapshotRow } from "../services/experian-export";

// Mocks
const mockUser = {
    id: "user1",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    // ... other fields mocked as needed or type casting
} as any;

const mockTenancy = {
    id: "tenancy1",
    tenancyRef: "REF123",
    startDate: "2023-01-01",
    monthlyRent: "500.00",
    outstandingBalance: "0",
    rentFrequency: "M"
} as any;

const mockProfile = {
    id: 1,
    userId: "user1",
    dateOfBirth: "1990-01-01",
    addressLine1: "123 Test St",
    postcode: "TE1 1ST",
    optOutReporting: false
} as any;

describe("ExperianExportService", () => {
    describe("generateHeader", () => {
        it("should generate a correct header", () => {
            const date = new Date("2023-10-01");
            const header = ExperianExportService.generateHeader(date);
            assert.strictEqual(header.startsWith("H"), true);
            assert.strictEqual(header.length, 80);
            assert.strictEqual(header.includes("RENTLEDGER"), true);
        });
    });

    describe("generateDetailRecord", () => {
        it("should generate a correct detail record for a standard row", () => {
            const row: ExperianSnapshotRow = {
                user: mockUser,
                tenancy: mockTenancy,
                profile: mockProfile,
                validationErrors: []
            };

            const line = ExperianExportService.generateDetailRecord(row);
            assert.strictEqual(line.startsWith("D"), true);
            assert.strictEqual(line.length, 300);
            assert.strictEqual(line.includes("Doe"), true);
            assert.strictEqual(line.includes("John"), true);
            assert.strictEqual(line.includes("123 Test St"), true);
            assert.strictEqual(line.includes("50000"), true); // 500.00 * 100
        });

        it("should handle arrears correctly", () => {
            const arrearsTenancy = { ...mockTenancy, outstandingBalance: "500.00" };
            const row: ExperianSnapshotRow = {
                user: mockUser,
                tenancy: arrearsTenancy,
                profile: mockProfile,
                validationErrors: []
            };
            const line = ExperianExportService.generateDetailRecord(row);
            // payment status at pos 261 (1-indexed) -> index 260
            assert.strictEqual(line.includes("50000"), true);
            assert.strictEqual(line.substring(260, 261), "1"); // Status '1' for arrears
        });
    });

    describe("validData", () => {
        it("should return errors for missing data", () => {
            const row: ExperianSnapshotRow = {
                user: { ...mockUser, lastName: "" },
                tenancy: mockTenancy,
                profile: mockProfile,
                validationErrors: []
            };

            const errors = ExperianExportService.validData(row);
            assert.strictEqual(errors.some(e => e.message === "Missing Surname"), true);
        });

        it("should return error for missing DOB", () => {
            const row: ExperianSnapshotRow = {
                user: mockUser,
                tenancy: mockTenancy,
                profile: { ...mockProfile, dateOfBirth: null },
                validationErrors: []
            };
            const errors = ExperianExportService.validData(row);
            assert.strictEqual(errors.some(e => e.message === "Missing DOB"), true);
        });
    });

    describe("generateTrailer", () => {
        it("should generate a correct trailer", () => {
            const trailer = ExperianExportService.generateTrailer(10, 5000);
            assert.strictEqual(trailer.startsWith("T"), true);
            assert.strictEqual(trailer.length, 80);
            assert.strictEqual(trailer.includes("0000000010"), true); // One count
            assert.strictEqual(trailer.includes("0000005000"), true); // Balance
        });
    });
});
