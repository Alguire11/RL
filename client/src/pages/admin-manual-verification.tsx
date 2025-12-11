
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Eye, Calendar, User, Building, FileText, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getQueryFn, apiRequest } from "@/lib/queryClient";

interface ManualPayment {
    id: number;
    userId: string;
    propertyId: number;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    description: string;
    receiptUrl: string | null;
    landlordEmail: string | null;
    needsVerification: boolean;
    verifiedAt: string | null;
    verifiedBy: string | null;
    createdAt: string;
    tenantName?: string; // These might need to be joined from backend or fetched separately if not in response
    tenantEmail?: string;
}

export default function AdminManualVerification() {
    const [, setLocation] = useLocation();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [actionNote, setActionNote] = useState("");

    // Redirect if not admin
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
        setLocation('/admin-login');
    }

    // Fetch all manual payments (we might need a specific admin endpoint for ALL payments if 'getManualPayments' is user-scoped)
    // Currently assuming `getManualPayments` is user scoped. We likely need a new endpoint or update existing one.
    // Wait, I checked routes.ts and there isn't a "get all manual payments" for admin. 
    // I will use a new endpoint `/api/admin/manual-payments` which I should have created or will create.
    // Actually, let's stick to the plan. The plan didn't explicitly mention creating a GET endpoint, but it's implied.
    // Let's assume for now I will use `/api/admin/manual-payments` and if it fails I'll add it.

    const { data: payments = [], isLoading } = useQuery<ManualPayment[]>({
        queryKey: ['/api/admin/manual-payments'],
        queryFn: getQueryFn({ on401: "throw" }),
        enabled: !!user && user.role === 'admin'
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [filterPeriod, setFilterPeriod] = useState("all");

    const filteredPayments = payments.filter(p => {
        const matchesSearch =
            (p.userId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (p.tenantName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (p.tenantEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (p.landlordEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            p.amount.toString().includes(searchTerm);

        const periodMatch = filterPeriod === "all" ? true :
            filterPeriod === "today" ? new Date(p.paymentDate).toDateString() === new Date().toDateString() :
                filterPeriod === "week" ? new Date(p.paymentDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) :
                    true; // can expand for months

        return matchesSearch && periodMatch;
    });

    const pendingPayments = filteredPayments.filter(p => p.needsVerification);
    const historyPayments = filteredPayments.filter(p => !p.needsVerification).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());


    const verifyMutation = useMutation({
        mutationFn: async ({ id, status, notes }: { id: number, status: 'approved' | 'rejected', notes?: string }) => {
            const res = await apiRequest("POST", `/api/manual-payments/${id}/admin-verify`, { status, notes });
            return res.json();
        },
        onSuccess: (data, variables) => {
            toast({
                title: variables.status === 'approved' ? "Payment Verified" : "Payment Rejected",
                description: data.message,
                variant: variables.status === 'approved' ? "default" : "destructive",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/manual-payments'] });
            setIsPreviewOpen(false);
            setSelectedPayment(null);
        },
        onError: (error: Error) => {
            toast({
                title: "Action Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const handleReview = (payment: ManualPayment) => {
        setSelectedPayment(payment);
        setIsPreviewOpen(true);
    };

    const handleVerify = (status: 'approved' | 'rejected') => {
        if (!selectedPayment) return;
        verifyMutation.mutate({ id: selectedPayment.id, status, notes: actionNote });
    };

    if (authLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navigation />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" onClick={() => setLocation('/admin')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Admin
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Manual Payment Verifications</h1>
                            <p className="text-gray-500 mt-1">Review tenant payment proofs and verify transaction validity</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search tenant, email, amount..."
                            className="w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="All Time" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
                        <TabsTrigger value="history">Approved ({historyPayments.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Verifications</CardTitle>
                                <CardDescription>Requests waiting for administrative review</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="py-8 text-center flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                                ) : pendingPayments.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500">
                                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                                        <p className="text-lg font-medium">All caught up!</p>
                                        <p>No pending manual payments to verify.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Tenant</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead>Receipt</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingPayments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                            {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{payment.tenantName || 'Unknown Tenant'}</span>
                                                            <span className="text-xs text-gray-500">{payment.tenantEmail || payment.userId}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-bold">£{Number(payment.amount).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">{payment.paymentMethod}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {payment.receiptUrl ? (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                                                Yes
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm italic">No</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" onClick={() => handleReview(payment)}>
                                                            Review
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Verification History</CardTitle>
                                <CardDescription>Past verification requests and their outcomes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Tenant</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Verified At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historyPayments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                        {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{payment.tenantName || 'Unknown Tenant'}</span>
                                                        <span className="text-xs text-gray-500">{payment.tenantEmail || payment.userId}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold">£{Number(payment.amount).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {payment.verifiedBy ? (
                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Verified</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Unverified</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {payment.verifiedAt ? format(new Date(payment.verifiedAt), "MMM d, HH:mm") : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleReview(payment)}>
                                                        View Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {historyPayments.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                                    No history available
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Preview Dialog */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Review Payment</DialogTitle>
                            <DialogDescription>
                                Verify the details below against the attached proof.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedPayment && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Amount</span>
                                        <p className="text-xl font-bold text-gray-900">£{Number(selectedPayment.amount).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Date</span>
                                        <p className="font-medium text-gray-900">{format(new Date(selectedPayment.paymentDate), "MMMM d, yyyy")}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Method</span>
                                        <p className="font-medium text-gray-900 capitalize">{selectedPayment.paymentMethod}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Landlord Contact</span>
                                        <p className="font-medium text-gray-900 truncate">{selectedPayment.landlordEmail}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-sm font-medium text-gray-500">Tenant Description</span>
                                        <p className="text-sm text-gray-700 bg-white p-2 rounded border mt-1">
                                            {selectedPayment.description || "No description provided."}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3 flex items-center">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Receipt Proof
                                    </h4>
                                    {selectedPayment.receiptUrl ? (
                                        <div className="rounded-lg border overflow-hidden bg-gray-100 flex justify-center items-center min-h-[300px]">
                                            {/* Handle both images and potentially PDFs if we iframe or standard img */}
                                            <img
                                                src={selectedPayment.receiptUrl}
                                                alt="Payment Receipt"
                                                className="max-w-full max-h-[500px] object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    // Could show fallback or link
                                                }}
                                            />
                                            {/* Fallback button if image fails or for better UX */}
                                            <div className="absolute bottom-4 right-4">
                                                <Button variant="secondary" size="sm" asChild>
                                                    <a href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                        Open Original <Eye className="h-3 w-3 ml-2" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-32 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 border border-dashed">
                                            No receipt attached
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-6 items-center sm:justify-between">

                                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                                        {!selectedPayment.needsVerification ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">
                                                    Status: <span className="font-semibold capitalize">{selectedPayment.verifiedBy ? 'Verified' : 'Rejected'}</span>
                                                </span>
                                                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                                                    Close
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => handleVerify('rejected')}
                                                    disabled={verifyMutation.isPending}
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleVerify('approved')}
                                                    disabled={verifyMutation.isPending}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    Verify & Approve
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
