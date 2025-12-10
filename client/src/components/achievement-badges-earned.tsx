import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, CheckCircle, Clock, Star, Target, Award } from "lucide-react";
import type { TenantAchievementsResponse, TenantAchievementBadge } from "@/types/api";

const badgeIcons = {
  Trophy: Trophy,
  Award: Award,
  Star: Star,
  Target: Target,
  TrendingUp: TrendingUp,
  CheckCircle: CheckCircle,
  Clock: Clock,
};

export function AchievementBadgesEarned() {
  const { data: achievements, isLoading } = useQuery<TenantAchievementsResponse | null>({
    queryKey: ["/api/achievements"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Achievement Badges</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const badges = achievements?.badges ?? [];

  return (
    <Card className="border-none shadow-md bg-gradient-to-br from-white to-amber-50/30 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Achievement Badges</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            {badges.length} Earned
          </Badge>
        </div>
        <CardDescription className="mt-2">
          {badges.length > 0
            ? "Keep up the great work! You're building a strong rental history."
            : "Start making payments to earn your first badge"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-amber-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-amber-300" />
            </div>
            <p className="font-medium text-gray-900">No badges yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Make your first payment to unlock badges!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {badges.map((badge: TenantAchievementBadge) => {
              const IconComponent = badgeIcons[badge.iconName as keyof typeof badgeIcons] || Trophy;
              return (
                <div
                  key={badge.id}
                  className="group relative overflow-hidden rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white p-4 transition-all hover:shadow-md hover:border-amber-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="h-6 w-6 text-amber-700" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 mb-1">{badge.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{badge.description}</p>
                      <div className="mt-3 flex items-center text-xs font-medium text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-full">
                        Earned {new Date(badge.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
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

