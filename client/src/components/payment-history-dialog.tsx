import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { CheckCircle, Calendar, AlertCircle, Clock, Search, Download, FileText, ArrowUpDown, X } from "lucide-react";
import type { RentPayment } from "@/types/api";

interface PaymentHistoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    payments: RentPayment[];
}

type PaymentStatus = "all" | "verified" | "pending" | "overdue";
type SortBy = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function PaymentHistoryDialog({ isOpen, onClose, payments }: PaymentHistoryDialogProps) {
    const [statusFilter, setStatusFilter] = useState<PaymentStatus>("all");
    const [sortBy, setSortBy] = useState<SortBy>("date-desc");
    const [searchQuery, setSearchQuery] = useState("");

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
            case 'verified': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'overdue': return <AlertCircle className="w-4 h-4" />;
            default: return <Calendar className="w-4 h-4" />;
        }
    };

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(Number(amount));
    };

    const calculatePaymentStatus = (payment: RentPayment): PaymentStatus => {
        const today = new Date();
        const dueDate = new Date(payment.dueDate);
        const paidDate = payment.paidDate ? new Date(payment.paidDate) : null;

        if (payment.verified || payment.isVerified) return 'verified';
        if (paidDate) return 'pending';
        if (today > dueDate) return 'overdue';
        return 'pending';
    };

    // Filter and sort payments
    const filteredPayments = useMemo(() => {
        let filtered = [...payments];

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(
                (p) => calculatePaymentStatus(p) === statusFilter
            );
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    formatCurrency(p.amount).toLowerCase().includes(query) ||
                    format(new Date(p.dueDate), "dd MMM yyyy").toLowerCase().includes(query)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "date-desc":
                    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
                case "date-asc":
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                case "amount-desc":
                    return Number(b.amount) - Number(a.amount);
                case "amount-asc":
                    return Number(a.amount) - Number(b.amount);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [payments, statusFilter, searchQuery, sortBy]);

    const exportToCSV = () => {
        const headers = ["Date Due", "Date Paid", "Amount", "Status"];
        const rows = filteredPayments.map((p) => [
            format(new Date(p.dueDate), "yyyy-MM-dd"),
            p.paidDate ? format(new Date(p.paidDate), "yyyy-MM-dd") : "N/A",
            Number(p.amount).toFixed(2),
            calculatePaymentStatus(p),
        ]);

        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payment-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col [&>button]:hidden">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold">Payment History</DialogTitle>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={exportToCSV}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export to CSV
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 rounded-full hover:bg-gray-100"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 py-4 border-b">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by amount or date..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PaymentStatus)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-desc">Newest First</SelectItem>
                            <SelectItem value="date-asc">Oldest First</SelectItem>
                            <SelectItem value="amount-desc">Highest Amount</SelectItem>
                            <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Results count */}
                <div className="text-sm text-gray-600">
                    Showing {filteredPayments.length} of {payments.length} payment{payments.length !== 1 ? 's' : ''}
                </div>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-3 py-2">
                        {filteredPayments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">No payments found</p>
                                <p className="text-sm mt-1">
                                    {searchQuery || statusFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : "No payment history available"}
                                </p>
                            </div>
                        ) : (
                            filteredPayments.map((payment) => {
                                const status = calculatePaymentStatus(payment);
                                const statusStyle = getStatusColor(status);

                                return (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-4 rounded-xl border bg-white hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-full ${statusStyle.split(' ')[1]}`}>
                                                <div className={statusStyle.split(' ')[0]}>
                                                    {getStatusIcon(status)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-lg">
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                                    <span>Due {format(new Date(payment.dueDate), 'dd MMM yyyy')}</span>
                                                    {payment.paidDate && (
                                                        <>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            <span>Paid {format(new Date(payment.paidDate), 'dd MMM yyyy')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <Badge variant="outline" className={`${statusStyle} border`}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Badge>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
