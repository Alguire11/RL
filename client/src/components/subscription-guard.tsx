import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "./upgrade-prompt";
import type { SubscriptionPlan } from "@shared/subscription-types";

interface SubscriptionGuardProps {
  feature: keyof SubscriptionPlan['limits'];
  requiredPlan?: 'standard' | 'premium';
  fallback?: ReactNode;
  children?: ReactNode;
}

export function SubscriptionGuard({ 
  feature, 
  requiredPlan = 'standard', 
  fallback, 
  children 
}: SubscriptionGuardProps) {
  const { hasFeature, plan } = useSubscription();
  
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const featureNames: Record<keyof SubscriptionPlan['limits'], string> = {
    maxProperties: 'Multiple Properties',
    maxReports: 'Unlimited Reports',
    reportFrequency: 'Frequent Reports',
    whatsappSharing: 'WhatsApp Sharing',
    advancedAnalytics: 'Advanced Analytics',
    prioritySupport: 'Priority Support',
    openBankingIntegration: 'Open Banking',
    customReminders: 'Custom Reminders',
    landlordVerification: 'Landlord Verification',
    enhancedExports: 'Enhanced Data Export'
  };

  return (
    <UpgradePrompt
      feature={featureNames[feature]}
      requiredPlan={requiredPlan}
      description={`Upgrade to ${requiredPlan} plan to access ${featureNames[feature]} and more premium features.`}
    />
  );
}