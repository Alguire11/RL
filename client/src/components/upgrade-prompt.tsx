import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Star, Crown } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@shared/subscription-types";

interface UpgradePromptProps {
  feature: string;
  requiredPlan: 'standard' | 'premium';
  description?: string;
}

export function UpgradePrompt({ feature, requiredPlan, description }: UpgradePromptProps) {
  const plan = SUBSCRIPTION_PLANS[requiredPlan];
  
  const handleUpgrade = () => {
    // Navigate to subscription page
    window.location.href = '/subscribe';
  };

  return (
    <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          {requiredPlan === 'premium' ? (
            <Crown className="h-6 w-6 text-purple-600" />
          ) : (
            <Star className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="h-5 w-5 text-gray-500" />
          {feature} - Premium Feature
        </CardTitle>
        <CardDescription>
          {description || `This feature requires a ${plan.name} subscription to access.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-4">
          <Badge variant="outline" className="mb-2">
            {plan.name} Plan
          </Badge>
          <div className="text-2xl font-bold text-gray-900">
            £{plan.price}<span className="text-sm text-gray-500">/month</span>
          </div>
        </div>
        <div className="space-y-2 mb-6">
          {plan.features.map((feature, index) => (
            <div key={index} className="text-sm text-gray-600 flex items-center justify-center">
              <Star className="h-4 w-4 text-green-500 mr-2" />
              {feature}
            </div>
          ))}
        </div>
        <Button onClick={handleUpgrade} className="w-full">
          Upgrade to {plan.name}
        </Button>
      </CardContent>
    </Card>
  );
}