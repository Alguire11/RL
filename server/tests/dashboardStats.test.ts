import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeDashboardStats } from "../dashboardStats";
import type { RentPayment } from "@shared/schema";

// Helper to quickly craft mock payments with sensible defaults.
function buildPayment(overrides: Partial<RentPayment>): RentPayment {
  const now = new Date();
  return {
    id: overrides.id ?? 999,
    userId: overrides.userId ?? "user-1",
    propertyId: overrides.propertyId ?? 1,
    amount: overrides.amount ?? "1000",
    dueDate: overrides.dueDate ?? now,
    paidDate: Object.prototype.hasOwnProperty.call(overrides, "paidDate")
      ? overrides.paidDate ?? null
      : now,
    status: overrides.status ?? "paid",
    paymentMethod: overrides.paymentMethod ?? "manual",
    transactionId: overrides.transactionId ?? "txn",
    isVerified: overrides.isVerified ?? false,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  } as RentPayment;
}

describe("computeDashboardStats", () => {
  it("calculates streaks, verification, and monthly totals", () => {
    const today = new Date("2024-06-15T00:00:00Z");
    const payments: RentPayment[] = [
      buildPayment({
        id: 1,
        amount: "1200",
        dueDate: new Date("2024-06-01T00:00:00Z"),
        paidDate: new Date("2024-06-01T00:00:00Z"),
        status: "paid",
        isVerified: true,
      }),
      buildPayment({
        id: 2,
        amount: "1200",
        dueDate: new Date("2024-05-01T00:00:00Z"),
        paidDate: new Date("2024-05-02T00:00:00Z"),
        status: "paid",
        isVerified: false,
      }),
      buildPayment({
        id: 3,
        amount: "1200",
        dueDate: new Date("2024-07-01T00:00:00Z"),
        status: "pending",
        paidDate: undefined,
        isVerified: false,
      }),
    ];

    const stats = computeDashboardStats(payments, today);

    assert.equal(stats.paymentStreak, 1);
    assert.equal(stats.verified, 1);
    assert.equal(stats.verificationStatus, "partially_verified");
    assert.equal(stats.monthlyRentPaid, 1200);
    assert.equal(stats.pendingVerificationCount, 1);
    assert.equal(stats.nextPaymentDue, "2024-07-01T00:00:00.000Z");
    assert.equal(typeof stats.rentScoreGrowth, "number");
  });

  it("handles empty payment histories without crashing", () => {
    const stats = computeDashboardStats([], new Date("2024-06-15T00:00:00Z"));

    assert.equal(stats.totalPaid, 0);
    assert.equal(stats.monthlyRentPaid, 0);
    assert.equal(stats.verificationStatus, "unverified");
    assert.equal(stats.rentScore, 0);
  });
});
