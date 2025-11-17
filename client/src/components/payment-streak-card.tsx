import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import type { TenantAchievementsResponse } from "@/types/api";

export function PaymentStreakCard() {
  const { data: achievements, isLoading } = useQuery<TenantAchievementsResponse | null>({
    queryKey: ["/api/achievements"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Streak</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const streak = achievements?.streak ?? { currentStreak: 0, longestStreak: 0 };

  return (
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
  );
}

