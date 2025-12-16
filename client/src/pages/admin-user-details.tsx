import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, Calendar, Shield, CreditCard, Building, FileText, Activity, AlertTriangle, Check, X, User, MoreVertical, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface AdminUserDetail {
    user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        role: string;
        subscriptionPlan: string;
        subscriptionStatus: string;
        isOnboarded: boolean;
        emailVerified: boolean;
        isActive: boolean;
        createdAt: string;
        businessName: string | null;
        rentInfo?: any;
        address?: any;
    };
    properties: any[];
    payments: any[];
    manualPayments: any[];
    rentLogs: any[];
    reports: any[];
    reportShares: any[];
    securityLogs: any[];
}

export default function AdminUserDetails() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [match, params] = useRoute("/admin/users/:id");
    const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
    const queryClient = useQueryClient();

    const userId = params?.id;

    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editFormData, setEditFormData] = useState<any>({});

    // Check auth
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || currentUser?.role !== 'admin') {
            setLocation('/admin-login');
        }
    }, [authLoading, isAuthenticated, currentUser, setLocation]);

    const { data: userDetails, isLoading, error } = useQuery<AdminUserDetail>({
        queryKey: [`/api/admin/users/${userId}`],
        enabled: !!userId && isAuthenticated && currentUser?.role === 'admin',
        retry: false
    });

    // reusing mutations from admin-users logic
    const updateUserMutation = useMutation({
        mutationFn: (userData: { userId: string; updates: any }) =>
            fetch(`/api/admin/users/${userData.userId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData.updates),
            }).then(res => {
                if (!res.ok) throw new Error('Failed to update user');
                return res.json();
            }),
        onSuccess: () => {
            toast({
                title: "User Updated",
                description: "User information has been updated successfully",
            });
            setShowEditDialog(false);
            queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
        },
        onError: () => {
            toast({
                title: "Update Failed",
                description: "Failed to update user information",
                variant: "destructive",
            });
        }
    });

    const suspendUserMutation = useMutation({
        mutationFn: (userId: string) =>
            fetch(`/api/admin/users/${userId}/suspend`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(res => {
                if (!res.ok) throw new Error('Failed to suspend user');
                return res.json();
            }),
        onSuccess: () => {
            toast({
                title: "User Status Updated",
                description: "User status has been updated successfully",
            });
            queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
        },
        onError: () => {
            toast({
                title: "Action Failed",
                description: "Failed to update user status",
                variant: "destructive",
            });
        }
    });

    const verifyPaymentMutation = useMutation({
        mutationFn: async ({ id, type }: { id: number, type: 'Manual' | 'Log' }) => {
            const endpoint = type === 'Manual'
                ? `/api/admin/manual-payments/${id}/verify`
                : `/api/admin/rent-logs/${id}/verify`;
            const res = await fetch(endpoint, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to verify payment');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
            toast({ title: "Payment Verified", description: "Payment has been marked as verified" });
        }
    });

    const unverifyPaymentMutation = useMutation({
        mutationFn: async ({ id, type }: { id: number, type: 'Manual' | 'Log' }) => {
            const endpoint = type === 'Manual'
                ? `/api/admin/manual-payments/${id}/unverify`
                : `/api/admin/rent-logs/${id}/unverify`;
            const res = await fetch(endpoint, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to unverify payment');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
            toast({ title: "Payment Unverified", description: "Payment verification has been removed" });
        }
    });

    const deletePaymentMutation = useMutation({
        mutationFn: async ({ id, type }: { id: number, type: 'Manual' | 'Log' }) => {
            const endpoint = type === 'Manual'
                ? `/api/admin/manual-payments/${id}`
                : `/api/admin/rent-logs/${id}`;
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete payment');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
            toast({ title: "Payment Deleted", description: "Payment record has been removed" });
        }
    });

    const handleVerifyPayment = (payment: any) => {
        const rawId = parseInt(payment.id.split('-')[1]);
        if (isNaN(rawId)) return;
        verifyPaymentMutation.mutate({ id: rawId, type: payment.type });
    };

    const handleUnverifyPayment = (payment: any) => {
        const rawId = parseInt(payment.id.split('-')[1]);
        if (isNaN(rawId)) return;
        unverifyPaymentMutation.mutate({ id: rawId, type: payment.type });
    };

    const handleDeletePayment = (payment: any) => {
        if (!confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) return;
        const rawId = parseInt(payment.id.split('-')[1]);
        if (isNaN(rawId)) return;
        deletePaymentMutation.mutate({ id: rawId, type: payment.type });
    };

    const handleEditClick = () => {
        if (userDetails?.user) {
            setEditFormData({
                firstName: userDetails.user.firstName,
                lastName: userDetails.user.lastName,
                email: userDetails.user.email,
                businessName: userDetails.user.businessName,
                subscriptionPlan: userDetails.user.subscriptionPlan,
                role: userDetails.user.role
            });
            setShowEditDialog(true);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setEditFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const formatDate = (dateString: string | null) => {
        try {
            if (!dateString) return 'N/A';
            return format(new Date(dateString), 'dd MMM yyyy HH:mm');
        } catch {
            return 'Invalid Date';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    if (error || !userDetails) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <Button variant="ghost" onClick={() => setLocation('/admin/users')} className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Users
                    </Button>
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                <p>Error loading user details. The user may not exist.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const { user: userData, properties, payments, manualPayments = [], rentLogs = [], reports, reportShares = [], securityLogs } = userDetails;

    // Combine all payment transactions into one timeline
    const allPayments = [
        ...payments.map((p: any) => ({
            id: `p-${p.id}`,
            date: p.dueDate,
            amount: p.amount,
            status: p.status,
            method: p.paymentMethod || 'Manual',
            type: 'Standard'
        })),
        ...manualPayments.map((p: any) => ({
            id: `m-${p.id}`,
            date: p.paymentDate,
            amount: p.amount,
            status: p.needsVerification ? 'pending' : 'verified',
            method: `${p.paymentMethod || 'Manual'} (Logged)`,
            type: 'Manual'
        })),
        ...rentLogs.map((l: any) => ({
            id: `l-${l.id}`,
            date: l.submittedAt,
            amount: l.amount,
            status: l.verified ? 'verified' : 'pending',
            method: 'Verification Log',
            type: 'Log'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Button variant="ghost" onClick={() => setLocation('/admin/users')} className="mb-4 pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Users
                    </Button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                {userData.firstName?.[0]}{userData.lastName?.[0]}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {userData.firstName} {userData.lastName}
                                </h1>
                                <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center">
                                        <Mail className="w-3 h-3 mr-1" />
                                        {userData.email}
                                    </span>
                                    {userData.role === 'landlord' && userData.businessName && (
                                        <span className="flex items-center">
                                            <Building className="w-3 h-3 mr-1" />
                                            {userData.businessName}
                                        </span>
                                    )}
                                    <span className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Joined {formatDate(userData.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleEditClick}>
                                Edit User
                            </Button>
                            <Button
                                variant={userData.isActive ? "destructive" : "default"}
                                onClick={() => {
                                    if (confirm(`Are you sure you want to ${userData.isActive ? 'suspend' : 'activate'} this user?`)) {
                                        suspendUserMutation.mutate(userData.id);
                                    }
                                }}
                            >
                                {userData.isActive ? 'Suspend User' : 'Activate User'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Info Columns */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Badges / Quick Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm text-gray-500 mb-1">Status</div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold capitalize">{userData.isActive ? 'Active' : 'Suspended'}</span>
                                        {userData.isActive ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm text-gray-500 mb-1">Email Verified</div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">{userData.emailVerified ? 'Yes' : 'No'}</span>
                                        {userData.emailVerified ? <Check className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-orange-500" />}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm text-gray-500 mb-1">Plan</div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold capitalize">{userData.subscriptionPlan}</span>
                                        <CreditCard className="h-4 w-4 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabs for detailed data */}
                        <Tabs defaultValue="payments" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="payments">Payments</TabsTrigger>
                                <TabsTrigger value="properties">Properties</TabsTrigger>
                                <TabsTrigger value="reports">Reports</TabsTrigger>
                                <TabsTrigger value="logs">Logs</TabsTrigger>
                            </TabsList>

                            <TabsContent value="payments" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Payment History</CardTitle>
                                        <CardDescription>All rent payments and manual entries.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Method</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {allPayments.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">No payment history</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    allPayments.slice(0, 10).map((payment: any) => (
                                                        <TableRow key={payment.id}>
                                                            <TableCell>{formatDate(payment.date)}</TableCell>
                                                            <TableCell>£{payment.amount}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={payment.status === 'paid' || payment.status === 'verified' ? 'default' : 'secondary'}
                                                                    className={payment.status === 'paid' || payment.status === 'verified' ? 'bg-green-100 text-green-800' : ''}>
                                                                    {payment.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>{payment.method}</TableCell>
                                                            <TableCell>
                                                                {(payment.type === 'Manual' || payment.type === 'Log') && (
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                                <MoreVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                            {payment.status === 'pending' || payment.status === 'needsVerification' ? (
                                                                                <DropdownMenuItem onClick={() => handleVerifyPayment(payment)}>
                                                                                    <CheckCircle className="mr-2 h-4 w-4" /> Verify
                                                                                </DropdownMenuItem>
                                                                            ) : (
                                                                                <DropdownMenuItem onClick={() => handleUnverifyPayment(payment)}>
                                                                                    <XCircle className="mr-2 h-4 w-4" /> Unverify
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleDeletePayment(payment)}
                                                                                className="text-red-600 focus:text-red-600"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {(payment.type === 'Manual' || payment.type === 'Log') && (
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                                <MoreVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                            {payment.status === 'pending' || payment.status === 'needsVerification' ? (
                                                                                <DropdownMenuItem onClick={() => handleVerifyPayment(payment)}>
                                                                                    <CheckCircle className="mr-2 h-4 w-4" /> Verify
                                                                                </DropdownMenuItem>
                                                                            ) : (
                                                                                <DropdownMenuItem onClick={() => handleUnverifyPayment(payment)}>
                                                                                    <XCircle className="mr-2 h-4 w-4" /> Unverify
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleDeletePayment(payment)}
                                                                                className="text-red-600 focus:text-red-600"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="properties" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Properties</CardTitle>
                                        <CardDescription>Associated properties.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {properties.length === 0 ? (
                                            <p className="text-gray-500 text-center py-4">No properties found</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {properties.map((property: any) => (
                                                    <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <Building className="h-8 w-8 text-gray-400" />
                                                            <div>
                                                                <p className="font-medium">{property.address}</p>
                                                                <p className="text-sm text-gray-500">{property.city}, {property.postcode}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold">£{property.monthlyRent}/mo</p>
                                                            <Badge variant="outline">{property.isVerified ? 'Verified' : 'Pending'}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="reports" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Generated Reports</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>ID</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reports.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center py-4 text-gray-500">No reports generated</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    reports.map((report: any) => (
                                                        <TableRow key={report.id}>
                                                            <TableCell>{formatDate(report.createdAt)}</TableCell>
                                                            <TableCell className="capitalize">{report.reportData?.reportType || 'Credit Report'}</TableCell>
                                                            <TableCell className="font-mono text-xs">{report.reportId}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                                <Card className="mt-6">
                                    <CardHeader>
                                        <CardTitle>Shared Reports History</CardTitle>
                                        <CardDescription>Reports shared with landlords/agents.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Recipient</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Link</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reportShares.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">No reports shared</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    reportShares.map((share: any) => (
                                                        <TableRow key={share.id}>
                                                            <TableCell>{formatDate(share.createdAt)}</TableCell>
                                                            <TableCell className="font-medium">{share.recipientEmail}</TableCell>
                                                            <TableCell className="capitalize">{share.recipientType}</TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col gap-1">
                                                                    <Badge variant={share.isActive ? "default" : "secondary"}>
                                                                        {share.isActive ? 'Active' : 'Inactive'}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">{share.accessCount} views</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <a
                                                                    href={share.shareUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline text-xs"
                                                                >
                                                                    View Link
                                                                </a>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="logs" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Security Logs</CardTitle>
                                        <CardDescription>Recent account activity.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[300px]">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Time</TableHead>
                                                        <TableHead>Action</TableHead>
                                                        <TableHead>IP Address</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {securityLogs.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="text-center py-4 text-gray-500">No logs available</TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        securityLogs.map((log: any) => (
                                                            <TableRow key={log.id}>
                                                                <TableCell className="text-xs">{formatDate(log.createdAt)}</TableCell>
                                                                <TableCell className="text-xs font-mono">{log.action}</TableCell>
                                                                <TableCell className="text-xs text-gray-500">{log.ipAddress}</TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-gray-500">Role</Label>
                                    <div className="font-medium capitalize flex items-center mt-1">
                                        {userData.role === 'admin' && <Shield className="w-4 h-4 mr-2 text-blue-600" />}
                                        {userData.role}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Subscription</Label>
                                    <div className="font-medium capitalize mt-1">
                                        {userData.subscriptionPlan}
                                        <span className="text-xs text-gray-400 ml-2">({userData.subscriptionStatus || 'active'})</span>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <Label className="text-gray-500">Contact</Label>
                                    <div className="mt-1 space-y-1">
                                        <div className="text-sm">{userData.email}</div>
                                        <div className="text-sm">{userData.phone || 'No phone'}</div>
                                    </div>
                                </div>
                                {userData.rentInfo && (
                                    <>
                                        <Separator />
                                        <div>
                                            <Label className="text-gray-500">Rent Info</Label>
                                            <div className="mt-1 text-sm">
                                                Rent: £{userData.rentInfo.amount}<br />
                                                Due: {userData.rentInfo.dayOfMonth}{getOrdinalSuffix(userData.rentInfo.dayOfMonth)}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Profile</DialogTitle>
                        <DialogDescription>
                            Modify basic user information.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={editFormData.firstName || ''}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={editFormData.lastName || ''}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editFormData.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                        </div>
                        {userData.role === 'landlord' && (
                            <div>
                                <Label htmlFor="businessName">Business Name</Label>
                                <Input
                                    id="businessName"
                                    value={editFormData.businessName || ''}
                                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="plan">Plan</Label>
                                <Select
                                    value={editFormData.subscriptionPlan}
                                    onValueChange={(value) => handleInputChange('subscriptionPlan', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={editFormData.role}
                                    onValueChange={(value) => handleInputChange('role', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">Tenant</SelectItem>
                                        <SelectItem value="landlord">Landlord</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                        <Button onClick={() => {
                            if (userId) updateUserMutation.mutate({ userId, updates: editFormData });
                        }}>Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getOrdinalSuffix(i: number) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return "st";
    }
    if (j == 2 && k != 12) {
        return "nd";
    }
    if (j == 3 && k != 13) {
        return "rd";
    }
    return "th";
}
