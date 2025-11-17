// Report Templates for RentLedger
// Defines the structure for 3 types of reports with rent score and badges

export interface UserInfo {
  name: string;
  rlid: string;
  email: string;
  phone: string;
}

export interface AddressInfo {
  fullAddress: string;
  city: string;
  postcode: string;
  moveInDate?: string;
}

export interface LandlordInfo {
  name: string;
  email: string;
  phone?: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

export interface PaymentHistoryItem {
  date: string;
  amount: number;
  status: 'verified' | 'awaiting-verification' | 'overdue' | 'paid';
  dueDate: string;
  paidDate?: string;
}

export interface Badge {
  type: string;
  level: number;
  name: string;
  earnedAt: string;
  description?: string;
}

export interface ReliabilityMetrics {
  rentScore: number; // 0-1000
  paymentStreak: number; // consecutive months
  totalPayments: number;
  totalPaid: number;
  onTimeRate: number; // percentage
  verificationRate: number; // percentage
}

// Template 1: Credit Building Report
export interface CreditBuildingReport {
  reportType: 'credit';
  reportId: string;
  generatedDate: string;
  expiresAt?: string;
  
  // User Information
  userInfo: UserInfo;
  currentAddress: AddressInfo;
  
  // Rent Score (replaces Credit Score)
  rentScore: number;
  rentScoreBreakdown: {
    paymentHistory: number; // 60% weight
    verification: number; // 20% weight
    streak: number; // 20% weight
  };
  
  // Payment Performance
  paymentStreak: number;
  totalPayments: number;
  totalPaid: number;
  onTimeRate: number;
  
  // Payment History (last 12 months)
  paymentHistory: PaymentHistoryItem[];
  
  // Achievements
  earnedBadges: Badge[];
  
  // Landlord Verification
  landlordVerification: LandlordInfo;
  
  // Additional Info
  tenantSince?: string;
  previousAddresses?: AddressInfo[];
}

// Template 2: Rental History Report
export interface RentalHistoryReport {
  reportType: 'rental';
  reportId: string;
  generatedDate: string;
  expiresAt?: string;
  
  // User Information
  userInfo: UserInfo;
  
  // Current Property
  currentProperty: AddressInfo & {
    monthlyRent: number;
    tenancyStartDate: string;
    tenancyEndDate?: string;
  };
  
  // Landlord Information
  landlordInfo: LandlordInfo;
  
  // Payment Summary
  paymentSummary: {
    totalPaid: number;
    paymentStreak: number;
    onTimeRate: number;
    averageMonthlyRent: number;
    firstPaymentDate: string;
    lastPaymentDate: string;
  };
  
  // Chronological Payment History
  paymentHistory: PaymentHistoryItem[];
  
  // Rent Score
  rentScore: number;
  
  // Badges and Achievements
  badges: Badge[];
  
  // Previous Addresses (if available)
  previousAddresses?: AddressInfo[];
  
  // Tenancy Notes
  tenancyNotes?: string;
}

// Template 3: Landlord Verification Report
export interface LandlordVerificationReport {
  reportType: 'landlord';
  reportId: string;
  generatedDate: string;
  expiresAt?: string;
  
  // Tenant Information
  tenantInfo: UserInfo;
  
  // Property Details
  propertyDetails: AddressInfo & {
    monthlyRent: number;
    tenancyStartDate: string;
    tenancyEndDate?: string;
  };
  
  // Verification Request
  verificationRequest: {
    landlordName: string;
    landlordEmail: string;
    status: 'verified' | 'pending' | 'unverified';
    requestedDate: string;
    verifiedDate?: string;
  };
  
  // Payment Records
  paymentRecords: PaymentHistoryItem[];
  
  // Reliability Metrics
  reliabilityMetrics: ReliabilityMetrics;
  
  // Payment Streak
  paymentStreak: number;
  
  // Additional Verification Info
  verificationNotes?: string;
  landlordComments?: string;
}

// Union type for all report types
export type Report = CreditBuildingReport | RentalHistoryReport | LandlordVerificationReport;

// Helper function to determine report type
export function getReportType(report: Report): 'credit' | 'rental' | 'landlord' {
  return report.reportType;
}

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

// Helper function to format date
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Helper function to calculate rent score
export function calculateRentScore(
  paymentHistoryScore: number,
  verificationScore: number,
  streakScore: number
): number {
  // Rent Score = Payment History (60%) + Verification (20%) + Streak (20%)
  const score = (paymentHistoryScore * 0.6) + (verificationScore * 0.2) + (streakScore * 0.2);
  return Math.round(Math.min(Math.max(score, 0), 1000)); // Clamp between 0-1000
}

// Helper function to get status badge color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'verified': '#10b981',
    'awaiting-verification': '#f59e0b',
    'overdue': '#ef4444',
    'due-today': '#f97316',
    'paid': '#10b981',
    'pending': '#f59e0b',
    'unverified': '#9ca3af'
  };
  return colors[status] || '#9ca3af';
}

