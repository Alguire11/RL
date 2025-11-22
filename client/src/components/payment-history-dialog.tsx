import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle, Calendar, AlertCircle, Clock } from "lucide-react";
import type { RentPayment } from "@/types/api";

interface PaymentHistoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    payments: RentPayment[];
}

export function PaymentHistoryDialog({ isOpen, onClose, payments }: PaymentHistoryDialogProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'text-green-600 bg-green-50 border-green-200';
            case 'awaiting-verification': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
            case 'due-today': return 'text-orange-600 bg-orange-50 border-orange-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified': return <CheckCircle className="w-4 h-4" />;
            case 'awaiting-verification': return <Clock className="w-4 h-4" />;
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

    const calculatePaymentStatus = (payment: RentPayment) => {
        const today = new Date();
        const dueDate = new Date(payment.dueDate);
        const paidDate = payment.paidDate ? new Date(payment.paidDate) : null;

        if (payment.verified || payment.isVerified) return 'verified';
        if (paidDate) return 'awaiting-verification';
        if (today > dueDate) return 'overdue';
        if (today.toDateString() === dueDate.toDateString()) return 'due-today';
        return 'upcoming';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Payment History</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-4 py-4">
                        {payments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No payment history found</p>
                            </div>
                        ) : (
                            payments.map((payment) => {
                                const status = calculatePaymentStatus(payment);
                                const statusStyle = getStatusColor(status);

                                return (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-4 rounded-xl border bg-white hover:shadow-sm transition-shadow"
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
                                                            <span>Paid {format(new Date(payment.paidDate), 'dd MMM')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <Badge variant="outline" className={`${statusStyle} border`}>
                                            {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
