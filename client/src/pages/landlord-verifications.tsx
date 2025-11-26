import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, CheckCircle, MapPin, FileText, Award, XCircle, Clock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { Logo } from "@/components/logo";

export default function LandlordVerifications() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { plan } = useSubscription();

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'landlord') {
            setLocation('/landlord-login');
        }
    }, [authLoading, isAuthenticated, user, setLocation]);

    const handleLogout = async () => {
        try {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
            };

            const csrfToken = getCookie('XSRF-TOKEN');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (csrfToken) {
                headers['X-XSRF-TOKEN'] = csrfToken;
            }

            await fetch('/api/logout', {
                method: 'POST',
                headers,
                credentials: 'include',
            });
            toast({
                title: "Logged Out",
                description: "You have been logged out successfully.",
            });
            setLocation('/landlord-login');
        } catch (error) {
            console.error('Logout error:', error);
            setLocation('/landlord-login');
        }
    };

    const { data: verificationRequests, isLoading: verificationsLoading } = useQuery({
        queryKey: ['/api/landlord/verification-requests'],
    }) as { data: any[]; isLoading: boolean };

    const verifyPaymentMutation = useMutation({
        mutationFn: async ({ paymentId, status, notes }: { paymentId: number; status: 'approved' | 'rejected'; notes?: string }) => {
            const response = await apiRequest("POST", `/api/payments/${paymentId}/verify`, { status, notes });
            if (!response.ok) throw new Error('Failed to verify payment');
            return response.json();
        },
        onSuccess: () => {
            toast({ title: "Payment Verified", description: "Payment status updated successfully." });
            queryClient.invalidateQueries({ queryKey: ['/api/landlord/verification-requests'] });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to verify payment.", variant: "destructive" });
        },
    });

    const handleVerify = (paymentId: number, status: 'approved' | 'rejected') => {
        verifyPaymentMutation.mutate({ paymentId, status });
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header - Same as Dashboard */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <Logo />
                        </div>

                        <nav className="flex space-x-1 mx-8">
                            <Button
                                variant="ghost"
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-none border-b-2 border-transparent hover:border-blue-200"
                                onClick={() => setLocation('/landlord-dashboard')}
                            >
                                <Building className="h-4 w-4 mr-2" />
                                Dashboard
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-none border-b-2 border-transparent hover:border-blue-200"
                                onClick={() => setLocation('/landlord-properties')}
                            >
                                <MapPin className="h-4 w-4 mr-2" />
                                Properties
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-none border-b-2 border-transparent hover:border-blue-200"
                                onClick={() => setLocation('/landlord-dashboard')}
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Tenants
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-blue-600 border-b-2 border-blue-600 rounded-none hover:bg-blue-50 hover:text-blue-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verifications
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-none border-b-2 border-transparent hover:border-blue-200"
                                onClick={() => setLocation('/landlord-dashboard')}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Reports
                            </Button>
                        </nav>

                        <div className="flex-1"></div>

                        <div className="flex items-center space-x-4">
                            {plan && (
                                <Badge variant="outline" className="bg-white text-blue-700 border-blue-200 font-semibold">
                                    {plan.name} Plan
                                </Badge>
                            )}

                            <Button variant="ghost" size="icon" className="relative">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                        <Avatar>
                                            <AvatarFallback className="bg-blue-600 text-white">
                                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setLocation('/landlord-verifications')}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        <span>Verifications</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLocation('/settings')}>
                                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Payment Verifications</h1>
                    <p className="text-gray-600 mt-2">Review and verify tenant payment records</p>
                </div>

                {verificationsLoading ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading verification requests...</p>
                        </CardContent>
                    </Card>
                ) : !verificationRequests || verificationRequests.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment verifications to review</h3>
                            <p className="text-gray-600">When tenants submit payments for verification, they will appear here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {verificationRequests.map((request: any) => (
                            <Card key={request.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <Avatar>
                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                        {request.tenantName?.[0] || 'T'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{request.tenantName || 'Tenant'}</h3>
                                                    <p className="text-sm text-gray-600">{request.propertyAddress}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Amount</p>
                                                    <p className="font-semibold text-gray-900">£{request.amount?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Payment Date</p>
                                                    <p className="font-semibold text-gray-900">
                                                        {new Date(request.paymentDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Method</p>
                                                    <p className="font-semibold text-gray-900 capitalize">{request.method || 'Bank Transfer'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Status</p>
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                </div>
                                            </div>

                                            {request.notes && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                                                    <p className="text-sm text-gray-700">{request.notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col space-y-2 ml-6">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleVerify(request.id, 'approved')}
                                                disabled={verifyPaymentMutation.isPending}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => handleVerify(request.id, 'rejected')}
                                                disabled={verifyPaymentMutation.isPending}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
