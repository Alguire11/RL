import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Award, Star, Crown, Shield, Clock, TrendingUp, CheckCircle } from "lucide-react";

interface UserBadge {
  id: number;
  badgeType: string;
  level: number;
  earnedAt: string;
  metadata: any;
  isActive: boolean;
}

interface BadgeSystemProps {
  userId: string;
  showHeader?: boolean;
}

const BADGE_CONFIG = {
  payment_streak: {
    name: "Payment Streak",
    description: "Consistent on-time payments",
    icon: Clock,
    color: "bg-blue-500",
    levels: {
      1: { name: "Starter", months: 3, stars: 1 },
      2: { name: "Reliable", months: 6, stars: 2 },
      3: { name: "Consistent", months: 12, stars: 3 },
      4: { name: "Dependable", months: 24, stars: 4 },
      5: { name: "Platinum", months: 36, stars: 5 },
    }
  },
  reliable_tenant: {
    name: "Reliable Tenant",
    description: "Excellent payment history",
    icon: Shield,
    color: "bg-green-500",
    levels: {
      1: { name: "Bronze", payments: 12, stars: 1 },
      2: { name: "Silver", payments: 24, stars: 2 },
      3: { name: "Gold", payments: 48, stars: 3 },
      4: { name: "Platinum", payments: 72, stars: 4 },
      5: { name: "Diamond", payments: 120, stars: 5 },
    }
  },
  early_payer: {
    name: "Early Payer",
    description: "Consistently pays before due date",
    icon: TrendingUp,
    color: "bg-purple-500",
    levels: {
      1: { name: "Prompt", earlyPayments: 6, stars: 1 },
      2: { name: "Punctual", earlyPayments: 12, stars: 2 },
      3: { name: "Proactive", earlyPayments: 24, stars: 3 },
      4: { name: "Exceptional", earlyPayments: 48, stars: 4 },
      5: { name: "Outstanding", earlyPayments: 72, stars: 5 },
    }
  },
  long_term_tenant: {
    name: "Long-term Tenant",
    description: "Extended tenancy duration",
    icon: Crown,
    color: "bg-yellow-500",
    levels: {
      1: { name: "Settled", years: 1, stars: 1 },
      2: { name: "Established", years: 2, stars: 2 },
      3: { name: "Committed", years: 3, stars: 3 },
      4: { name: "Devoted", years: 5, stars: 4 },
      5: { name: "Legendary", years: 7, stars: 5 },
    }
  },
  verified_tenant: {
    name: "Verified Tenant",
    description: "Completed verification process",
    icon: CheckCircle,
    color: "bg-indigo-500",
    levels: {
      1: { name: "Verified", stars: 1 },
    }
  }
};

const getBadgeIcon = (badgeType: string) => {
  const config = BADGE_CONFIG[badgeType as keyof typeof BADGE_CONFIG];
  const Icon = config?.icon || Award;
  return Icon;
};

const getBadgeColor = (badgeType: string) => {
  const config = BADGE_CONFIG[badgeType as keyof typeof BADGE_CONFIG];
  return config?.color || "bg-gray-500";
};

const getBadgeLevel = (badgeType: string, level: number) => {
  const config = BADGE_CONFIG[badgeType as keyof typeof BADGE_CONFIG];
  return config?.levels?.[level as keyof typeof config.levels] || { name: "Unknown", stars: level };
};

const StarRating = ({ level, maxStars = 5 }: { level: number; maxStars?: number }) => {
  return (
    <div className="flex space-x-1">
      {[...Array(maxStars)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < level 
              ? "text-yellow-400 fill-yellow-400" 
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

export function BadgeSystem({ userId, showHeader = true }: BadgeSystemProps) {
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);

  const { data: badges = [], isLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/user/badges", userId],
    retry: false,
  });

  const activeBadges = badges.filter(badge => badge.isActive);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Achievement Badges</h3>
            <p className="text-sm text-gray-600 mb-4">
              Earn badges by maintaining excellent payment history and building trust with landlords.
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg p-4 h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Achievement Badges</h3>
          <p className="text-sm text-gray-600 mb-4">
            Earn badges by maintaining excellent payment history and building trust with landlords.
          </p>
        </div>
      )}

      {activeBadges.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No badges yet</h3>
            <p className="text-gray-500">
              Make your first rent payment to start earning achievement badges!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {activeBadges.map((badge) => {
            const Icon = getBadgeIcon(badge.badgeType);
            const badgeColor = getBadgeColor(badge.badgeType);
            const levelInfo = getBadgeLevel(badge.badgeType, badge.level);
            const config = BADGE_CONFIG[badge.badgeType as keyof typeof BADGE_CONFIG];

            return (
              <Dialog key={badge.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-full ${badgeColor} flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-medium text-sm mb-1">{config?.name || badge.badgeType}</h4>
                      <div className="flex justify-center mb-2">
                        <StarRating level={badge.level} />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {levelInfo.name}
                      </Badge>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-12 h-12 rounded-full ${badgeColor} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <DialogTitle>{config?.name || badge.badgeType}</DialogTitle>
                        <div className="flex items-center space-x-2">
                          <StarRating level={badge.level} />
                          <Badge variant="outline">{levelInfo.name}</Badge>
                        </div>
                      </div>
                    </div>
                    <DialogDescription>
                      {config?.description}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Badge Details</h4>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Level:</span>
                          <span className="font-medium">{badge.level}/5</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Earned:</span>
                          <span className="font-medium">
                            {new Date(badge.earnedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {badge.metadata && (
                          <>
                            {badge.metadata.streakMonths && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Payment Streak:</span>
                                <span className="font-medium">{badge.metadata.streakMonths} months</span>
                              </div>
                            )}
                            {badge.metadata.totalPayments && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Payments:</span>
                                <span className="font-medium">{badge.metadata.totalPayments}</span>
                              </div>
                            )}
                            {badge.metadata.earlyPaymentCount && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Early Payments:</span>
                                <span className="font-medium">{badge.metadata.earlyPaymentCount}</span>
                              </div>
                            )}
                            {badge.metadata.tenancyYears && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tenancy Duration:</span>
                                <span className="font-medium">{badge.metadata.tenancyYears} years</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {badge.level < 5 && (
                      <div>
                        <h4 className="font-medium mb-2">Next Level</h4>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-blue-600">Progress to {getBadgeLevel(badge.badgeType, badge.level + 1).name}</span>
                            <StarRating level={badge.level + 1} maxStars={5} />
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(badge.level / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      )}
    </div>
  );
}