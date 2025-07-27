export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  limits: {
    maxProperties?: number;
    maxReports?: number;
    reportFrequency?: 'monthly' | 'weekly' | 'daily';
    whatsappSharing?: boolean;
    advancedAnalytics?: boolean;
    prioritySupport?: boolean;
    openBankingIntegration?: boolean;
    customReminders?: boolean;
    landlordVerification?: boolean;
  };
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate?: string;
  stripeSubscriptionId?: string;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'GBP',
    features: [
      'Basic payment tracking',
      'Monthly credit reports',
      'Email reminders',
      'Basic dashboard'
    ],
    limits: {
      maxProperties: 1,
      maxReports: 1,
      reportFrequency: 'monthly',
      whatsappSharing: false,
      advancedAnalytics: false,
      prioritySupport: false,
      openBankingIntegration: false,
      customReminders: false,
      landlordVerification: false,
    }
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    price: 9.99,
    currency: 'GBP',
    features: [
      'Everything in Free',
      'Weekly credit reports',
      'WhatsApp sharing',
      'Advanced analytics',
      'SMS reminders',
      'Up to 3 properties'
    ],
    limits: {
      maxProperties: 3,
      maxReports: 4,
      reportFrequency: 'weekly',
      whatsappSharing: true,
      advancedAnalytics: true,
      prioritySupport: false,
      openBankingIntegration: false,
      customReminders: true,
      landlordVerification: true,
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    currency: 'GBP',
    features: [
      'Everything in Standard',
      'Daily reports available',
      'Open Banking integration',
      'Priority support',
      'Unlimited properties',
      'Custom reminder schedules',
      'Advanced export options'
    ],
    limits: {
      maxProperties: Infinity,
      maxReports: Infinity,
      reportFrequency: 'daily',
      whatsappSharing: true,
      advancedAnalytics: true,
      prioritySupport: true,
      openBankingIntegration: true,
      customReminders: true,
      landlordVerification: true,
    }
  }
};

export function getUserSubscriptionPlan(subscription?: UserSubscription): SubscriptionPlan {
  if (!subscription || subscription.status !== 'active') {
    return SUBSCRIPTION_PLANS.free;
  }
  return SUBSCRIPTION_PLANS[subscription.planId] || SUBSCRIPTION_PLANS.free;
}

export function hasFeatureAccess(subscription: UserSubscription | undefined, feature: keyof SubscriptionPlan['limits']): boolean {
  const plan = getUserSubscriptionPlan(subscription);
  return Boolean(plan.limits[feature]);
}