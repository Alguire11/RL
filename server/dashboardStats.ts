import type { RentPayment } from "@shared/schema";
import type { DashboardStats, VerificationStatus } from "@shared/dashboard";

// Centralised calculator so dashboard statistics stay consistent and testable.
export function computeDashboardStats(
  payments: RentPayment[],
  now: Date = new Date(),
): DashboardStats {
  // Ensure deterministic ordering for streak calculations.
  const sorted = [...payments].sort((a, b) => {
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  const paidPayments = sorted.filter((p) => p.status === "paid");
  const onTimePayments = paidPayments.filter((p) => {
    if (!p.paidDate) return false;
    return new Date(p.paidDate).getTime() <= new Date(p.dueDate).getTime();
  });

  // Running totals for quick calculations.
  const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const onTimePercentage = paidPayments.length
    ? (onTimePayments.length / paidPayments.length) * 100
    : 0;

  // Payment streak counts consecutive on-time records from the latest backwards.
  let paymentStreak = 0;
  for (const payment of sorted) {
    if (
      payment.status === "paid" &&
      payment.paidDate &&
      new Date(payment.paidDate).getTime() <= new Date(payment.dueDate).getTime()
    ) {
      paymentStreak += 1;
      continue;
    }

    if (payment.status === "paid" || payment.status === "late") {
      break;
    }
  }

  // Upcoming payment is the soonest pending item.
  const nextPendingPayment = sorted
    .filter((p) => p.status === "pending")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const nextPaymentDue = nextPendingPayment
    ? new Date(nextPendingPayment.dueDate).toISOString()
    : null;

  // Credit score components mirror the UI weighting.
  const onTimeScore = (onTimePercentage / 100) * 600;
  const verifiedPayments = paidPayments.filter((p) => p.isVerified);
  const verificationRate = paidPayments.length
    ? verifiedPayments.length / paidPayments.length
    : 0;
  const verificationScore = verificationRate * 200;

  const consistencyFactor = paidPayments.length
    ? Math.min(paidPayments.length / 12, 1)
    : 0;
  const streakBonus = Math.min(paymentStreak / 12, 0.5);
  const rentToIncomeScore = (consistencyFactor * 0.5 + streakBonus) * 200;
  const creditScore = Math.round(onTimeScore + verificationScore + rentToIncomeScore);

  // Month specific aggregations for tenant-facing widgets.
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthlyRentPaid = paidPayments
    .filter((p) => {
      if (!p.paidDate) return false;
      const paidAt = new Date(p.paidDate).getTime();
      return paidAt >= monthStart.getTime() && paidAt < nextMonthStart.getTime();
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const verificationStatus: VerificationStatus = !paidPayments.length
    ? "unverified"
    : verifiedPayments.length === paidPayments.length
    ? "verified"
    : verifiedPayments.length > 0
    ? "partially_verified"
    : "unverified";

  const pendingVerificationCount = sorted.filter(
    (p) => p.status === "pending" && !p.isVerified,
  ).length;

  // Compare against the credit score at the end of the previous month.
  const previousMonthPayments = sorted.filter((p) => {
    return new Date(p.dueDate).getTime() < monthStart.getTime();
  });
  const previousCreditScore = previousMonthPayments.length
    ? computeDashboardStats(previousMonthPayments, new Date(now.getFullYear(), now.getMonth() - 1, 1)).creditScore
    : 0;
  const creditGrowth = creditScore - previousCreditScore;

  return {
    paymentStreak,
    totalPaid,
    onTimePercentage,
    nextPaymentDue,
    creditScore,
    onTimeScore: Math.round(onTimeScore),
    verificationScore: Math.round(verificationScore),
    rentToIncomeScore: Math.round(rentToIncomeScore),
    monthlyRentPaid,
    verificationStatus,
    verified: verifiedPayments.length,
    pendingVerificationCount,
    creditGrowth,
  };
}
