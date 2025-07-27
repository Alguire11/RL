import { useQuery } from "@tanstack/react-query";
import { SUBSCRIPTION_PLANS, getUserSubscriptionPlan, hasFeatureAccess, type UserSubscription, type SubscriptionPlan } from "@shared/subscription-types";

export function useSubscription() {
  const { data: subscription, isLoading } = useQuery<UserSubscription>({
    queryKey: ["/api/subscription"],
    retry: false,
  });

  const plan = getUserSubscriptionPlan(subscription);
  
  const hasFeature = (feature: keyof SubscriptionPlan['limits']) => {
    return hasFeatureAccess(subscription, feature);
  };

  const canAccessFeature = (feature: keyof SubscriptionPlan['limits'], showUpgrade = true) => {
    const hasAccess = hasFeature(feature);
    if (!hasAccess && showUpgrade) {
      // Could trigger upgrade modal here
      console.log(`Feature ${feature} requires upgrade`);
    }
    return hasAccess;
  };

  const isFreePlan = plan.id === 'free';
  const isStandardPlan = plan.id === 'standard';
  const isPremiumPlan = plan.id === 'premium';

  return {
    subscription,
    plan,
    isLoading,
    hasFeature,
    canAccessFeature,
    isFreePlan,
    isStandardPlan,
    isPremiumPlan,
    SUBSCRIPTION_PLANS,
  };
}