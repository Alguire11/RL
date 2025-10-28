export interface ApiPropertyRentInfo {
  amount?: number;
  dayOfMonth?: number;
  frequency?: string;
  firstPaymentDate?: string;
  nextPaymentDate?: string;
}

export interface ApiProperty {
  id: number;
  address: string;
  city: string;
  postcode?: string | null;
  monthlyRent: number | string;
  depositAmount?: number | string | null;
  landlordName?: string | null;
  landlordEmail?: string | null;
  landlordPhone?: string | null;
  tenancyStartDate?: string | null;
  tenancyEndDate?: string | null;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
  notes?: string | null;
  isActive?: boolean;
  rentInfo?: ApiPropertyRentInfo | null;
}

export type PaymentStatus = "pending" | "paid" | "late" | "missed";

export interface RentPayment {
  id: number;
  propertyId: number;
  amount: number | string;
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string | null;
  description?: string | null;
  isVerified?: boolean;
  verified?: boolean;
}

export interface ManualPayment {
  id: number;
  propertyId?: number;
  amount: number | string;
  paymentDate: string;
  description?: string | null;
  receiptUrl?: string | null;
  needsVerification?: boolean;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  reminderDays: number;
  reminderTime: string;
  overdueReminders: boolean;
  weeklySummary: boolean;
  landlordUpdates: boolean;
}

export interface NotificationPayload {
  id: number;
  type: "payment_reminder" | "report_generated" | "landlord_verified" | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface TenantAchievementBadge {
  id: number;
  title: string;
  description: string;
  earnedAt: string;
  iconName?: string;
  badgeType?: string;
}

export interface TenantAchievementsResponse {
  badges: TenantAchievementBadge[];
  streak: {
    currentStreak: number;
    longestStreak: number;
  };
}

export interface LandlordVerificationDetails {
  property: ApiProperty & {
    depositAmount?: number | string | null;
  };
  tenant: {
    fullName: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string | null;
    rentAmount: number;
    rentFrequency: string;
    tenancyStart: string;
    tenancyEnd?: string | null;
    paymentHistory: Array<{
      month: string;
      status: string;
      paidDate?: string | null;
    }>;
    paymentSummary?: {
      totalPaid: number;
      onTimeRate: number;
      longestStreak: number;
    };
    references?: Array<{
      name: string;
      relationship: string;
      contact: string;
    }>;
  };
  verificationStatus: "pending" | "approved" | "rejected";
  verificationNotes?: string | null;
}

export interface BankConnection {
  id: number;
  bankName: string;
  accountNumber?: string | null;
  sortCode?: string | null;
  status?: string | null;
  connectedAt?: string | null;
}

export interface LandlordVerificationRequestSummary {
  id: number;
  landlordEmail: string;
  propertyId: number;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}
