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
    HelpCircle,
    Clock,
    Calendar,
    AlertCircle
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
import { PaymentHistoryDialog } from "@/components/payment-history-dialog";

type CombinedPayment = RentPayment & {
    isManual?: boolean;
    needsVerification?: boolean;
    paymentDate?: string;
    landlordEmail?: string | null;
    landlordPhone?: string | null;
};

export default function RentScoreBuilder() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
    const [verifyingId, setVerifyingId] = useState<number | null>(null);

    const { data: payments = [], isLoading: paymentsLoading } = useQuery<RentPayment[]>({
        queryKey: ["/api/payments"],
        retry: false,
    });

    const { data: stats } = useQuery<DashboardStats | undefined>({
        queryKey: ["/api/dashboard/stats"],
        retry: false,
    });

    const { data: manualPayments = [], isLoading: manualPaymentsLoading } = useQuery<CombinedPayment[]>({
        queryKey: ["/api/manual-payments"],
        retry: false,
    });

    // Merge regular payments and manual payments
    const allPayments = useMemo(() => {
        // Filter out manual payments from the main payments list to avoid duplicates
        // We prefer the manualPayments list because it contains more details (email, phone)
        const regularPayments = payments.filter((p: any) => !p.isManualPayment);

        const manual: CombinedPayment[] = manualPayments.map(mp => ({
            ...mp,
            isManual: true,
            dueDate: mp.paymentDate || new Date().toISOString(),
            paidDate: mp.paymentDate,
            status: mp.needsVerification ? 'pending' : 'paid',
            verified: !mp.needsVerification,
            isVerified: !mp.needsVerification,
            propertyId: mp.propertyId || 0,
        }));

        return [...regularPayments, ...manual].sort((a, b) =>
            new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        );
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
    const rentScoreProgress = totalNeeded > 0 ? Math.min((verifiedCount / totalNeeded) * 100, 100) : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(amount);
    };

    const calculatePaymentStatus = (payment: CombinedPayment) => {
        const today = new Date();
        const dueDate = new Date(payment.dueDate);
        const paidDate = payment.paidDate ? new Date(payment.paidDate) : null;

        if (payment.verified || payment.isVerified) return 'verified';
        if (paidDate) return 'pending';
        if (today > dueDate) return 'overdue';
        return 'pending';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'text-green-600 bg-green-50 border-green-200';
            case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified': return <CheckCircle className="w-5 h-5" />;
            case 'pending': return <Clock className="w-5 h-5" />;
            case 'overdue': return <AlertCircle className="w-5 h-5" />;
            default: return <Calendar className="w-5 h-5" />;
        }
    };

    if (paymentsLoading || manualPaymentsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your payment history...</p>
                </div>
            </div>
        );
    }

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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Rent Score Builder</h1>
                    <p className="text-gray-600">
                        Build your Rent Score history by verifying your rent payments. Every verified payment strengthens your Rent Score portfolio.
                    </p>
                </div>

                {/* Rent Score Progress Section */}
                <Card className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl mb-2">
                                    {verifiedCount} of {totalNeeded} Payments Verified
                                </CardTitle>
                                <CardDescription>
                                    {verifiedCount >= totalNeeded
                                        ? "🎉 Congratulations! You've reached the minimum for Rent Score Reporting."
                                        : `Verify ${totalNeeded - verifiedCount} more payment${totalNeeded - verifiedCount !== 1 ? 's' : ''} to unlock Rent Score Reporting.`
                                    }
                                </CardDescription>
                            </div>
                            <TrendingUp className="h-12 w-12 text-blue-600 opacity-20" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-700">Rent Score Progress</span>
                                <span className="font-bold text-blue-600">{Math.round(rentScoreProgress)}%</span>
                            </div>
                            <Progress value={rentScoreProgress} className="h-3" />
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
                                                These verified payments count toward your Rent Score.
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
                                Verify another payment to boost your Rent Score
                            </div>
                        </div>
                    </Button>

                    <Button
                        onClick={() => window.open('/api/reports/sample', '_blank')}
                        variant="outline"
                        className="h-auto py-6 border-2"
                        size="lg"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        <div className="text-left">
                            <div className="font-semibold">See My Score History</div>
                            <div className="text-sm font-normal text-gray-600">
                                Download sample Rent Report
                            </div>
                        </div>
                    </Button>
                </div>

                {/* Payment History */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Payment History</CardTitle>
                                <CardDescription>
                                    Track your verified payments and see your Rent Score progress
                                </CardDescription>
                            </div>
                            {allPayments.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsPaymentHistoryOpen(true)}
                                >
                                    View All
                                </Button>
                            )}
                        </div>
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
                                            Start building your Rent Score by uploading your first rent receipt.
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
                                        const status = calculatePaymentStatus(payment);

                                        return (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(status).split(' ')[1]}`}>
                                                        <div className={getStatusColor(status).split(' ')[0]}>
                                                            {getStatusIcon(status)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="font-semibold text-gray-900">
                                                                {formatCurrency(Number(payment.amount))}
                                                            </h3>
                                                            <Badge variant="outline" className={`${getStatusColor(status)} border`}>
                                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                                            </Badge>
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
                                                {isManual && payment.needsVerification && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                            if (!payment.landlordEmail) {
                                                                toast({
                                                                    title: "Landlord Email Required",
                                                                    description: "Please add landlord contact information to send verification.",
                                                                });
                                                                setLocation('/manual-verify');
                                                                return;
                                                            }

                                                            setVerifyingId(payment.id);
                                                            try {
                                                                const response = await apiRequest("POST", `/api/manual-payments/${payment.id}/reverify`);
                                                                if (response.ok) {
                                                                    toast({
                                                                        title: "Verification Email Resent",
                                                                        description: "A new verification request has been sent to your landlord.",
                                                                    });
                                                                } else {
                                                                    const contentType = response.headers.get("content-type");
                                                                    if (contentType && contentType.indexOf("application/json") !== -1) {
                                                                        const error = await response.json();
                                                                        throw new Error(error.message);
                                                                    } else {
                                                                        const text = await response.text();
                                                                        console.error("Non-JSON response:", text);
                                                                        throw new Error("Server returned an invalid response. Please try again later.");
                                                                    }
                                                                }
                                                            } catch (error: any) {
                                                                toast({
                                                                    title: "Failed to Resend",
                                                                    description: error.message || "Could not resend verification email.",
                                                                    variant: "destructive",
                                                                });
                                                            } finally {
                                                                setVerifyingId(null);
                                                            }
                                                        }}
                                                        disabled={verifyingId === payment.id}
                                                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                                    >
                                                        {verifyingId === payment.id ? "Sending..." : "Reverify"}
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Boost Rent Score CTA */}
                {verifiedCount < totalNeeded && (
                    <Card className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Boost My Rent Score</h3>
                                    <p className="text-blue-100">
                                        Verify {totalNeeded - verifiedCount} more payment{totalNeeded - verifiedCount !== 1 ? 's' : ''} to unlock your complete rent report
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

            {/* Payment History Dialog */}
            <PaymentHistoryDialog
                isOpen={isPaymentHistoryOpen}
                onClose={() => setIsPaymentHistoryOpen(false)}
                payments={allPayments}
            />
        </div>
    );
}
