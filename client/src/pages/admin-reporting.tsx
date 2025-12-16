
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Download, FileText, CheckCircle, XCircle, Play } from "lucide-react";
import { format } from "date-fns";
import type { ReportingBatch } from "@shared/schema";

export default function AdminReporting() {
    const { user } = useAuth();
    const { toast } = useToast();

    // State for generation form
    const [generateMonth, setGenerateMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [includeUnverified, setIncludeUnverified] = useState<boolean>(false);
    const [onlyConsented, setOnlyConsented] = useState<boolean>(true);
    const [exportFormat, setExportFormat] = useState<string>('csv');

    // Fetch batches
    const { data: batches = [], isLoading } = useQuery<ReportingBatch[]>({
        queryKey: ["/api/admin/reporting/batches"],
    });

    // Generate mutation
    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/admin/reporting/batches", {
                month: generateMonth,
                includeUnverified,
                onlyConsented,
                format: exportFormat
            });
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Batch Generation Started",
                description: "The reporting batch is being generated.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/reporting/batches"] });
        },
        onError: (error: any) => {
            toast({
                title: "Generation Failed",
                description: error.message || "Failed to start batch generation",
                variant: "destructive",
            });
        }
    });

    const handleDownload = (batchId: string, month: string) => {
        // Direct download link
        window.location.href = `/api/admin/reporting/batches/${batchId}/download`;
    };

    if (!user || user.role !== 'admin') {
        return <div className="p-8">Access Denied</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Partner & Bureau Reporting</h1>
                    <p className="text-gray-600 mt-2">Generate monthly export packs for credit reference agencies and partners.</p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {/* Generator Panel */}
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Play className="w-5 h-5 mr-2 text-primary" />
                                    New Batch
                                </CardTitle>
                                <CardDescription>Configure and run a new export</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="month">Reporting Month</Label>
                                    <Input
                                        id="month"
                                        type="month"
                                        value={generateMonth}
                                        onChange={(e) => setGenerateMonth(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-4 border p-4 rounded-md bg-gray-50/50">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="onlyConsented" className="cursor-pointer">Only Consented</Label>
                                        <Switch
                                            id="onlyConsented"
                                            checked={onlyConsented}
                                            onCheckedChange={setOnlyConsented}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground -mt-3">
                                        Strictly filter tenants who have opted-in.
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="includeUnverified" className="cursor-pointer">Include Unverified</Label>
                                        <Switch
                                            id="includeUnverified"
                                            checked={includeUnverified}
                                            onCheckedChange={setIncludeUnverified}
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <Label htmlFor="format">Format</Label>
                                        <Select value={exportFormat} onValueChange={setExportFormat}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="csv">CSV (Standard)</SelectItem>
                                                <SelectItem value="json">JSON (API Schema)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={() => generateMutation.mutate()}
                                    disabled={generateMutation.isPending}
                                >
                                    {generateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Generate Batch
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* History Panel */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Batch History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                                ) : batches.length === 0 ? (
                                    <div className="text-center p-8 text-muted-foreground">No batches generated yet.</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Month</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Records</TableHead>
                                                <TableHead>Format</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {batches.map((batch) => (
                                                <TableRow key={batch.id}>
                                                    <TableCell className="font-medium">{batch.month}</TableCell>
                                                    <TableCell>{format(new Date(batch.createdAt!), 'MMM d, HH:mm')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            batch.status === 'ready' ? 'default' :
                                                                batch.status === 'failed' ? 'destructive' : 'secondary'
                                                        }>
                                                            {batch.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{batch.recordCount}</TableCell>
                                                    <TableCell className="uppercase">{batch.format}</TableCell>
                                                    <TableCell className="text-right">
                                                        {batch.status === 'ready' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownload(batch.id, batch.month)}
                                                            >
                                                                <Download className="w-4 h-4 mr-1" />
                                                                Download
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
