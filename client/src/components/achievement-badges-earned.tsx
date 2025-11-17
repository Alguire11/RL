import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { TenantAchievementsResponse, TenantAchievementBadge } from "@/types/api";

const badgeIcons = {
  Trophy: Trophy,
  Award: Trophy,
  Star: Trophy,
  Target: Trophy,
  TrendingUp: Trophy,
};

export function AchievementBadgesEarned() {
  const { data: achievements, isLoading } = useQuery<TenantAchievementsResponse | null>({
    queryKey: ["/api/achievements"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievement Badges</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const badges = achievements?.badges ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <span>Achievement Badges</span>
        </CardTitle>
        <CardDescription>
          {badges.length > 0 
            ? `You've earned ${badges.length} badge${badges.length !== 1 ? 's' : ''}!`
            : "Start making payments to earn your first badge"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No badges earned yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Make your first payment to earn the "First Payment" badge!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {badges.map((badge: TenantAchievementBadge) => {
              const IconComponent = badgeIcons[badge.iconName as keyof typeof badgeIcons] || Trophy;
              return (
                <div
                  key={badge.id}
                  className="flex items-center space-x-3 p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">{badge.title}</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">{badge.description}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      Earned {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

