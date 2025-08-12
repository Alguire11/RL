import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Trophy, Award, Star, Target, TrendingUp } from "lucide-react";

const badgeIcons = {
  Trophy: Trophy,
  Award: Award,
  Star: Star,
  Target: Target,
  TrendingUp: TrendingUp,
};

export function AchievementBadges() {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ["/api/achievements"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Loading your achievements...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const badges = achievements?.badges || [];
  const streak = achievements?.streak || { currentStreak: 0, longestStreak: 0 };

  return (
    <div className="space-y-6">
      {/* Payment Streak Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Payment Streak</span>
          </CardTitle>
          <CardDescription>Your consecutive on-time payment record</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{streak.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{streak.longestStreak}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </div>
          </div>
          
          {/* Progress towards next milestone */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress to next badge</span>
              <span>{Math.min(streak.currentStreak, 3)}/3</span>
            </div>
            <Progress value={(Math.min(streak.currentStreak, 3) / 3) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {streak.currentStreak >= 3 
                ? "Keep going for the 6-month streak badge!" 
                : `${3 - streak.currentStreak} more payments for your first streak badge`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
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
              {badges.map((badge: any) => {
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

      {/* Upcoming Badges */}
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
            {!badges.some((b: any) => b.badgeType === 'first_payment') && (
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
            
            {!badges.some((b: any) => b.badgeType === 'streak_3') && streak.currentStreak < 3 && (
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

            {!badges.some((b: any) => b.badgeType === 'streak_6') && streak.currentStreak < 6 && (
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

            {!badges.some((b: any) => b.badgeType === 'streak_12') && streak.currentStreak < 12 && (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}