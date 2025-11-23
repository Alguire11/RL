import type { RequestHandler } from "express";

/**
 * Subscription tier hierarchy
 * Higher number = higher tier
 */
const TIER_HIERARCHY = {
    free: 0,
    professional: 1,
    enterprise: 2,
} as const;

export type SubscriptionTier = keyof typeof TIER_HIERARCHY;

/**
 * Feature limits by subscription tier
 */
export const SUBSCRIPTION_LIMITS = {
    free: {
        properties: 1,
        reportsPerMonth: 1,
        apiAccess: false,
        prioritySupport: false,
    },
    professional: {
        properties: 3,
        reportsPerMonth: Infinity,
        apiAccess: false,
        prioritySupport: true,
    },
    enterprise: {
        properties: Infinity,
        reportsPerMonth: Infinity,
        apiAccess: true,
        prioritySupport: true,
    },
} as const;

/**
 * Middleware to check if user has required subscription tier or higher
 * @param minTier - Minimum subscription tier required
 * @returns Express middleware
 */
export const requireSubscription = (minTier: SubscriptionTier): RequestHandler => {
    return async (req: any, res, next) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const user = req.user;
        const userTier = (user.subscriptionPlan || 'free') as SubscriptionTier;

        // Normalize legacy plan names
        const normalizedTier = normalizePlanName(userTier);

        if (TIER_HIERARCHY[normalizedTier] >= TIER_HIERARCHY[minTier]) {
            return next();
        }

        return res.status(403).json({
            message: `This feature requires ${minTier} plan or higher`,
            currentPlan: normalizedTier,
            requiredPlan: minTier,
            upgradeUrl: '/pricing',
        });
    };
};

/**
 * Get subscription limits for a user
 * @param tier - User's subscription tier
 * @returns Subscription limits object
 */
export function getSubscriptionLimits(tier: string) {
    const normalizedTier = normalizePlanName(tier);
    return SUBSCRIPTION_LIMITS[normalizedTier] || SUBSCRIPTION_LIMITS.free;
}

/**
 * Normalize legacy plan names to current naming convention
 * @param planName - Plan name to normalize
 * @returns Normalized plan name
 */
export function normalizePlanName(planName: string): SubscriptionTier {
    const normalized = planName?.toLowerCase() || 'free';

    // Map legacy names to current names
    if (normalized === 'standard') return 'professional';
    if (normalized === 'premium') return 'enterprise';

    // Validate and return
    if (normalized in TIER_HIERARCHY) {
        return normalized as SubscriptionTier;
    }

    return 'free';
}

/**
 * Check if user has access to a specific feature
 * @param userTier - User's subscription tier
 * @param feature - Feature to check
 * @returns Boolean indicating access
 */
export function hasFeatureAccess(
    userTier: string,
    feature: keyof typeof SUBSCRIPTION_LIMITS.free
): boolean {
    const normalizedTier = normalizePlanName(userTier);
    const limits = SUBSCRIPTION_LIMITS[normalizedTier];

    if (typeof limits[feature] === 'boolean') {
        return limits[feature] as boolean;
    }

    return true; // For numeric limits, access is always true (limits checked separately)
}
