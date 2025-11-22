import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  TrendingUp,
  CheckCircle,
  Upload,
  ArrowLeft,
  Download,
  FileText,
  HelpCircle
} from "lucide-react";
import { format } from "date-fns";
import type { RentPayment, ApiProperty } from "@/types/api";
import type { DashboardStats } from "@shared/dashboard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CombinedPayment = RentPayment & {
  isManual?: boolean;
  needsVerification?: boolean;
  paymentDate?: string;
};

export default function CreditBuilder() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<RentPayment[]>({
    queryKey: ["/api/payments"],
    retry: false,
  });

  const { data: manualPayments = [] } = useQuery<any[]>({
    queryKey: ["/api/manual-payments"],
    retry: false,
  });

  const { data: stats } = useQuery<DashboardStats | undefined>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Merge and sort payments with deduplication
  const allPayments = useMemo(() => {
    const combined = [...payments];

    // Add manual payments only if they don't match an existing payment (by date and amount)
    manualPayments.forEach(mp => {
      const isDuplicate = combined.some(p =>
        Number(p.amount) === Number(mp.amount) &&
        new Date(p.dueDate).toDateString() === new Date(mp.paymentDate).toDateString()
      );

      if (!isDuplicate) {
        combined.push({
          ...mp,
          id: `manual-${mp.id}`,
          dueDate: mp.paymentDate,
          paidDate: mp.paymentDate,
          status: mp.needsVerification ? 'pending' : 'paid',
          isVerified: !mp.needsVerification,
          isManual: true
        });
      }
    });

    return combined.sort((a: CombinedPayment, b: CombinedPayment) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [payments, manualPayments]);

  // Calculate stats based on merged payments
  const today = new Date();
  const validPayments = allPayments.filter((p: CombinedPayment) => {
    const paymentDate = new Date(p.paidDate || p.dueDate);
    return paymentDate <= today; // Only count payments up to today
  });

  const verifiedPayments = validPayments.filter((p: CombinedPayment) => p.status === 'paid' && (p.isVerified || p.verified));
  const awaitingVerification = validPayments.filter((p: CombinedPayment) =>
    (p.status === 'paid' || p.isManual) && !(p.isVerified || p.verified)
  );
  const totalPaidPayments = validPayments.filter((p: CombinedPayment) => p.status === 'paid' || p.isManual);

  const verifiedCount = verifiedPayments.length;
  const awaitingCount = awaitingVerification.length;
  const totalNeeded = 6; // Target for credit building
  const creditProgress = totalNeeded > 0 ? Math.min((verifiedCount / totalNeeded) * 100, 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Builder</h1>
          <p className="text-gray-600">
            Build your credit history by verifying your rent payments. Every verified payment strengthens your credit profile.
          </p>
        </div>

        {/* Credit Progress Section */}
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">
                  {verifiedCount} of {totalNeeded} Payments Verified
                </CardTitle>
                <CardDescription>
                  {verifiedCount >= totalNeeded
                    ? "🎉 Congratulations! You've reached the minimum for credit reporting."
                    : `Verify ${totalNeeded - verifiedCount} more payment${totalNeeded - verifiedCount !== 1 ? 's' : ''} to unlock credit reporting.`
                  }
                </CardDescription>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Credit Progress</span>
                <span className="font-bold text-blue-600">{Math.round(creditProgress)}%</span>
              </div>
              <Progress value={creditProgress} className="h-3" />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Verified: {verifiedCount}</span>
                <span>•</span>
                <span>Total Paid: {totalPaidPayments.length}</span>
                <span>•</span>
                <span className="text-amber-600">Awaiting Verification: {awaitingCount}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Verified payments are those confirmed by your landlord or through uploaded receipts.
                        These verified payments count toward your credit score.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => setLocation('/manual-verify')}
            className="h-auto py-6 bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-semibold">Upload Next Rent Receipt</div>
              <div className="text-sm font-normal opacity-90">
                Verify another payment to boost your credit
              </div>
            </div>
          </Button>

          <Button
            onClick={() => window.open('/mock-credit-report.pdf', '_blank')}
            variant="outline"
            className="h-auto py-6 border-2"
            size="lg"
          >
            <Download className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-semibold">See My Score History</div>
              <div className="text-sm font-normal text-gray-600">
                Download sample credit report
              </div>
            </div>
          </Button>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Track your verified payments and see your credit-building progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {allPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start building your credit by uploading your first rent receipt.
                    </p>
                    <Button onClick={() => setLocation('/manual-verify')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Rent Proof
                    </Button>
                  </div>
                ) : (
                  allPayments.map((payment: CombinedPayment) => {
                    const isVerified = payment.isVerified || payment.verified;
                    const isManual = payment.isManual;

                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isVerified ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                            {isVerified ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <FileText className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">
                                {formatCurrency(Number(payment.amount))}
                              </h3>
                              {isVerified ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                              {isManual && (
                                <Badge variant="outline" className="text-xs">Manual</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {payment.paidDate
                                ? `Paid: ${format(new Date(payment.paidDate), 'MMM dd, yyyy')}`
                                : `Due: ${format(new Date(payment.dueDate), 'MMM dd, yyyy')}`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {!isVerified && isManual && (
                            <span className="text-xs text-gray-500">Awaiting Verification</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Boost Credit CTA */}
        {verifiedCount < totalNeeded && (
          <Card className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Boost My Credit</h3>
                  <p className="text-blue-100">
                    Verify {totalNeeded - verifiedCount} more payment{totalNeeded - verifiedCount !== 1 ? 's' : ''} to unlock your credit report
                  </p>
                </div>
                <Button
                  onClick={() => setLocation('/manual-verify')}
                  variant="secondary"
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Log My Rent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

