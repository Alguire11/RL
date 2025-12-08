import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Building, User, MapPin, PoundSterling, Shield, Calendar, CreditCard, FileText } from "lucide-react";
import { Logo } from "@/components/logo";

interface VerificationData {
    payment: {
        id: number;
        amount: string;
        date: string;
        receiptUrl?: string;
        description?: string;
    };
    tenant: {
        name: string;
        email: string;
    };
    property: {
        address: string;
        city: string;
        postcode: string;
    };
    isVerified?: boolean;
    message?: string;
}

export default function LandlordVerifyPayment() {
    const [, params] = useRoute("/landlord/verify-payment/:token");
    const [isConfirmed, setIsConfirmed] = useState(false);
    const { toast } = useToast();

    const { data: verificationData, isLoading, error } = useQuery<VerificationData>({
        queryKey: [`/api/landlord/verify-payment/${params?.token}`],
        retry: false,
        enabled: !!params?.token,
    });

    useEffect(() => {
        if (verificationData?.isVerified) {
            setIsConfirmed(true);
        }
    }, [verificationData]);

    const confirmMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("POST", `/api/landlord/verify-payment/${params?.token}/confirm`);
            return response.json();
        },
        onSuccess: () => {
            setIsConfirmed(true);
            toast({
                title: "Payment Verified",
                description: "Thank you for verifying this payment.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Verification Failed",
                description: error.message || "Failed to verify payment. Please try again.",
                variant: "destructive",
            });
        },
    });

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(parseFloat(amount));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payment details...</p>
                </div>
            </div>
        );
    }

    if (error || !verificationData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Logo className="mx-auto h-12 w-12 mb-4" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Verification</h1>
                    </div>

                    <Alert variant="destructive">
                        <AlertDescription>
                            {error?.message || "Verification link not found or has expired. Please contact the tenant for a new verification link."}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    if (isConfirmed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Logo className="mx-auto h-12 w-12 mb-4" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Complete</h1>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    Thank You!
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    You have successfully verified this rent payment.
                                </p>
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                    Verified
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <Logo className="mx-auto h-12 w-12 mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Rent Payment</h1>
                    <p className="text-gray-600">
                        Please verify the following rent payment from your tenant
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Payment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <PoundSterling className="h-5 w-5" />
                                <span>Payment Details</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Amount</label>
                                <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(verificationData.payment.amount)}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Date</label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <p className="text-gray-900">
                                        {new Date(verificationData.payment.date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                            {verificationData.payment.receiptUrl && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Receipt</label>
                                    <div className="mt-2">
                                        <a
                                            href={verificationData.payment.receiptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm text-primary hover:underline"
                                        >
                                            <FileText className="h-4 w-4 mr-1" />
                                            View Receipt
                                        </a>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tenant & Property Details */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="h-5 w-5" />
                                    <span>Tenant</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <p className="font-medium text-gray-900">{verificationData.tenant.name}</p>
                                    <p className="text-sm text-gray-500">{verificationData.tenant.email}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Building className="h-5 w-5" />
                                    <span>Property</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <p className="text-gray-900">
                                        {verificationData.property.address}, {verificationData.property.city}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Alert className="my-6">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        By verifying this payment, you confirm that you have received the specified amount for rent.
                    </AlertDescription>
                </Alert>

                <Button
                    onClick={() => confirmMutation.mutate()}
                    disabled={confirmMutation.isPending}
                    className="w-full h-12 text-lg"
                    size="lg"
                >
                    {confirmMutation.isPending ? "Verifying..." : "Verify Payment Received"}
                </Button>
            </div>
        </div>
    );
}
