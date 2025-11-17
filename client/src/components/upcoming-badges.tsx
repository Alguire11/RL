import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, Target } from "lucide-react";
import type { TenantAchievementsResponse, TenantAchievementBadge } from "@/types/api";

export function UpcomingBadges() {
  const { data: achievements, isLoading } = useQuery<TenantAchievementsResponse | null>({
    queryKey: ["/api/achievements"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Badges</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const badges = achievements?.badges ?? [];
  const streak = achievements?.streak ?? { currentStreak: 0, longestStreak: 0 };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span>Upcoming Badges</span>
        </CardTitle>
        <CardDescription>Keep making payments to unlock these achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Show upcoming badges based on current progress */}
          {!badges.some((b: TenantAchievementBadge) => b.badgeType === 'first_payment') && (
            <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
              <div className="flex items-center space-x-3">
                <Trophy className="h-8 w-8 text-gray-400" />
                <div>
                  <h4 className="font-medium">First Payment</h4>
                  <p className="text-sm text-muted-foreground">Make your first rent payment</p>
                </div>
              </div>
              <Badge variant="outline">0/1</Badge>
            </div>
          )}
          
          {!badges.some((b: TenantAchievementBadge) => b.badgeType === 'streak_3') && streak.currentStreak < 3 && (
            <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
              <div className="flex items-center space-x-3">
                <Award className="h-8 w-8 text-gray-400" />
                <div>
                  <h4 className="font-medium">3-Month Streak</h4>
                  <p className="text-sm text-muted-foreground">3 consecutive on-time payments</p>
                </div>
              </div>
              <Badge variant="outline">{streak.currentStreak}/3</Badge>
            </div>
          )}

          {!badges.some((b: TenantAchievementBadge) => b.badgeType === 'streak_6') && streak.currentStreak < 6 && (
            <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
              <div className="flex items-center space-x-3">
                <Star className="h-8 w-8 text-gray-400" />
                <div>
                  <h4 className="font-medium">6-Month Streak</h4>
                  <p className="text-sm text-muted-foreground">6 consecutive on-time payments</p>
                </div>
              </div>
              <Badge variant="outline">{Math.min(streak.currentStreak, 6)}/6</Badge>
            </div>
          )}

          {!badges.some((b: TenantAchievementBadge) => b.badgeType === 'streak_12') && streak.currentStreak < 12 && (
            <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
              <div className="flex items-center space-x-3">
                <Trophy className="h-8 w-8 text-gray-400" />
                <div>
                  <h4 className="font-medium">1-Year Streak</h4>
                  <p className="text-sm text-muted-foreground">12 consecutive on-time payments</p>
                </div>
              </div>
              <Badge variant="outline">{Math.min(streak.currentStreak, 12)}/12</Badge>
            </div>
          )}

          {badges.some((b: TenantAchievementBadge) => b.badgeType === 'first_payment') && 
           badges.some((b: TenantAchievementBadge) => b.badgeType === 'streak_3') && 
           badges.some((b: TenantAchievementBadge) => b.badgeType === 'streak_6') && 
           badges.some((b: TenantAchievementBadge) => b.badgeType === 'streak_12') && (
            <div className="text-center py-4">
              <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All badges unlocked! Keep up the great work!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

