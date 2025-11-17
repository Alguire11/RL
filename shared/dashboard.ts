// Shared dashboard metric contracts so the client and server stay in sync.
export type VerificationStatus = "verified" | "partially_verified" | "unverified";

export interface DashboardStats {
  paymentStreak: number;
  totalPaid: number;
  totalAwaiting: number;
  awaitingVerificationCount: number;
  onTimePercentage: number;
  nextPaymentDue: string | null;
  creditScore: number;
  onTimeScore: number;
  verificationScore: number;
  rentToIncomeScore: number;
  monthlyRentPaid: number;
  verificationStatus: VerificationStatus;
  verified: number;
  pendingVerificationCount: number;
  creditGrowth: number;
}
