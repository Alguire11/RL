import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { CreditCard, Shield, CheckCircle } from "lucide-react";

interface ConnectBankProps {
  onComplete: () => void;
}

export function ConnectBank({ onComplete }: ConnectBankProps) {
  const { toast } = useToast();
  const [bankData, setBankData] = useState({
    bankName: "",
    accountNumber: "",
    sortCode: "",
  });

  const connectBankMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bank-connections", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bank Connected",
        description: "Your bank account has been connected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-connections"] });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to connect bank account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    if (!bankData.bankName || !bankData.accountNumber || !bankData.sortCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    connectBankMutation.mutate(bankData);
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Connect Your Bank</CardTitle>
          <p className="text-gray-600">
            Securely connect your bank account to automatically track rent payments
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Bank-Level Security</h4>
                <p className="text-sm text-blue-700">
                  Your banking information is protected with 256-bit encryption and is never stored on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Bank Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., Lloyds Bank"
                value={bankData.bankName}
                onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="12345678"
                value={bankData.accountNumber}
                onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="sortCode">Sort Code</Label>
              <Input
                id="sortCode"
                placeholder="12-34-56"
                value={bankData.sortCode}
                onChange={(e) => setBankData({ ...bankData, sortCode: e.target.value })}
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-semibold">What you'll get:</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Automatic rent payment tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Real-time payment verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Comprehensive payment history</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <GradientButton
              onClick={handleConnect}
              disabled={connectBankMutation.isPending}
              className="flex-1"
            >
              {connectBankMutation.isPending ? "Connecting..." : "Connect Bank Account"}
            </GradientButton>
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By connecting your bank account, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
