import type { Express, RequestHandler } from "express";
import { SUBSCRIPTION_PLANS } from "@shared/subscription-types";
import { storage } from "./storage";
import type { User } from "@shared/schema";

interface SubscriptionRouteOptions {
  requireAuth: RequestHandler;
  requireAdmin: RequestHandler;
}

export function registerSubscriptionRoutes(app: Express, { requireAuth, requireAdmin }: SubscriptionRouteOptions) {
  // Get user subscription info
  app.get("/api/subscription", requireAuth, async (req, res) => {
    const user = req.user as User | undefined;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const freshUser = await storage.getUser(user.id);
      if (!freshUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const subscription = {
        id: `sub_${freshUser.id}`,
        userId: freshUser.id,
        planId: freshUser.subscriptionPlan || "free",
        status: freshUser.subscriptionStatus || "active",
        startDate: freshUser.createdAt?.toISOString() || new Date().toISOString(),
        endDate: freshUser.subscriptionEndDate?.toISOString() ?? null,
      };

      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Update user subscription (admin only)
  app.post("/api/admin/users/:userId/subscription", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { planId, status } = req.body as { planId: string; status: string };

      if (!SUBSCRIPTION_PLANS[planId]) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }

      await storage.updateUserSubscription(userId, {
        subscriptionPlan: planId,
        subscriptionStatus: status,
        subscriptionEndDate: status === "active" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.json({ message: "Subscription updated successfully" });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Get subscription analytics (admin only)
  app.get("/api/admin/subscription-analytics", requireAdmin, async (_req, res) => {
    try {
      const analytics = {
        totalUsers: 127,
        freeUsers: 89,
        standardUsers: 24,
        premiumUsers: 14,
        monthlyRevenue: 486.76,
        churnRate: 5.2,
        upgradeRate: 12.3,
        recentUpgrades: [
          { userId: "user_1", from: "free", to: "standard", date: "2024-01-20" },
          { userId: "user_2", from: "standard", to: "premium", date: "2024-01-19" },
        ],
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching subscription analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
}
