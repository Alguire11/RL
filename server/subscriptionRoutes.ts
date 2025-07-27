import type { Express } from "express";
import { getUserSubscriptionPlan, SUBSCRIPTION_PLANS } from "@shared/subscription-types";
import { storage } from "./storage";

export function registerSubscriptionRoutes(app: Express) {
  // Get user subscription info
  app.get('/api/subscription', async (req, res) => {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const user = await storage.getUser(req.session.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Mock subscription data for demo
      const subscription = {
        id: `sub_${user.id}`,
        userId: user.id,
        planId: user.subscriptionPlan || 'free',
        status: user.subscriptionStatus || 'active',
        startDate: user.createdAt?.toISOString() || new Date().toISOString(),
        endDate: user.subscriptionEndDate?.toISOString(),
      };

      res.json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  });

  // Update user subscription (admin only)
  app.post('/api/admin/users/:userId/subscription', async (req, res) => {
    if (!req.session?.user?.role || req.session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const { userId } = req.params;
      const { planId, status } = req.body;

      if (!SUBSCRIPTION_PLANS[planId]) {
        return res.status(400).json({ message: 'Invalid subscription plan' });
      }

      await storage.updateUserSubscription(userId, {
        subscriptionPlan: planId,
        subscriptionStatus: status,
        subscriptionEndDate: status === 'active' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      res.json({ message: 'Subscription updated successfully' });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ message: 'Failed to update subscription' });
    }
  });

  // Get subscription analytics (admin only)
  app.get('/api/admin/subscription-analytics', async (req, res) => {
    if (!req.session?.user?.role || req.session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      // Mock subscription analytics for demo
      const analytics = {
        totalUsers: 127,
        freeUsers: 89,
        standardUsers: 24,
        premiumUsers: 14,
        monthlyRevenue: 486.76,
        churnRate: 5.2,
        upgradeRate: 12.3,
        recentUpgrades: [
          { userId: 'user_1', from: 'free', to: 'standard', date: '2024-01-20' },
          { userId: 'user_2', from: 'standard', to: 'premium', date: '2024-01-19' }
        ]
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });
}