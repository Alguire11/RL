import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Navigation } from "@/components/navigation";

interface ValidationResult {
    message: string;
    type: 'error' | 'warning';
}

interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
}

interface Tenancy {
    id: string;
    tenancyRef: string;
    startDate: string;
    monthlyRent: string;
}

interface TenantProfile {
    id: number;
}

interface ExperianSnapshotRow {
    user: User;
    tenancy: Tenancy;
    profile: TenantProfile | null;
    validationErrors: ValidationResult[];
}

export default function AdminExperianPreview() {
    const { toast } = useToast();
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

    const { data: rows, isLoading, isError } = useQuery<ExperianSnapshotRow[]>({
        queryKey: ['experian-preview', selectedMonth],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/superadmin/experian/preview?month=${selectedMonth}-01`);
            return res.json();
        }
    });

    const exportMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/superadmin/experian/export", {
                month: `${selectedMonth}-01`
            });

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rentledger_experian_${selectedMonth.replace('-', '')}.txt`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        },
        onSuccess: () => {
            toast({
                title: "Export Successful",
                description: "The Experian export file has been downloaded.",
            });
        },
        onError: (error) => {
            toast({
                title: "Export Failed",
                description: "Failed to generate the export file.",
                variant: "destructive",
            });
        }
    });

    // Calculate stats
    const totalRows = rows?.length || 0;
    const errorCount = rows?.filter(r => r.validationErrors.some(e => e.type === 'error')).length || 0;
    const warningCount = rows?.filter(r => r.validationErrors.some(e => e.type === 'warning')).length || 0;

    // Generate last 12 months for select
    const months = Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(new Date(), i);
        return format(d, 'yyyy-MM');
    });

    return (
        <div className="min-h-screen bg-light-gray font-outfit">
            <Navigation />
            <div className="p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Experian Rental Exchange</h1>
                            <p className="text-muted-foreground mt-1">Preview and export monthly rental data for Experian.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(m => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={() => exportMutation.mutate()}
                                disabled={isLoading || exportMutation.isPending || errorCount > 0}
                                className="gap-2"
                            >
                                {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Export File
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalRows}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Rows with Errors</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${errorCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{errorCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Rows with Warnings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${warningCount > 0 ? 'text-yellow-500' : 'text-green-500'}`}>{warningCount}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {errorCount > 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Validation Errors Detected</AlertTitle>
                            <AlertDescription>
                                You cannot export the file until all critical errors are resolved. Please review the table below.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Preview Data</CardTitle>
                            <CardDescription>
                                Review individual records before exporting.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : isError ? (
                                <div className="text-center p-8 text-red-500">Failed to load preview data.</div>
                            ) : rows?.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground">No records found for this month.</div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tenant</TableHead>
                                                <TableHead>Tenancy Ref</TableHead>
                                                <TableHead>Start Date</TableHead>
                                                <TableHead>Rent</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows?.map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        <div className="font-medium">{row.user.firstName} {row.user.lastName}</div>
                                                        <div className="text-xs text-muted-foreground">{row.user.email}</div>
                                                    </TableCell>
                                                    <TableCell>{row.tenancy.tenancyRef}</TableCell>
                                                    <TableCell>{format(new Date(row.tenancy.startDate), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell>£{row.tenancy.monthlyRent}</TableCell>
                                                    <TableCell>
                                                        {row.validationErrors.length === 0 ? (
                                                            <span className="flex items-center text-green-600 gap-1 text-sm"><CheckCircle className="h-3 w-3" /> Valid</span>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                {row.validationErrors.map((err, idx) => (
                                                                    <div key={idx} className={`text-xs flex items-center gap-1 ${err.type === 'error' ? 'text-red-500' : 'text-yellow-500'}`}>
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                        {err.message}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
