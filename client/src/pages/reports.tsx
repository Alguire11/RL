import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { ReportPreview } from "@/components/reports/report-preview";
import { ShareDialog } from "@/components/reports/share-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Download, Share2, FileText, Calendar, Clock, CheckCircle, Lock, Plus } from "lucide-react";
import { format } from "date-fns";
import type { CreditReport, Property } from "@shared/schema";
import { useSubscription } from "@/hooks/useSubscription";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedReport, setSelectedReport] = useState<CreditReport | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: reports = [], isLoading: reportsLoading } = useQuery<CreditReport[]>({
    queryKey: ["/api/reports"],
    retry: false,
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    retry: false,
  });

  const generateReportMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      // Use the unified endpoint that includes manual payments
      const response = await apiRequest("POST", "/api/generate-report", {
        includePortfolio: true,
        reportType: 'credit'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: "Your credit report has been generated successfully",
      });
      setSelectedReport(data.report); // Update selected report with response
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to generate rent report",
        variant: "destructive",
      });
    },
  });

  const { plan } = useSubscription();

  const handleGenerateReport = (propertyId: number) => {
    if (plan.id === 'free') {
      toast({
        title: "Premium Feature",
        description: "Upgrade to Standard or Premium to generate professional rent reports.",
        variant: "default",
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/subscribe'}>
            Upgrade
          </Button>
        ),
      });
      return;
    }
    generateReportMutation.mutate(propertyId);
  };

  const formatDate = (value: string | Date | null | undefined) => {
    // Gracefully fall back when the backend has not populated a date yet
    if (!value) {
      return 'Pending';
    }

    const parsed = typeof value === 'string' ? new Date(value) : value;
    return format(parsed, 'dd MMM yyyy');
  };

  type BadgeVariant = "default" | "secondary" | "destructive";

  const getStatusColor = (isActive: boolean, expiresAt: string | Date | null): BadgeVariant => {
    if (!isActive) return "secondary";
    if (expiresAt) {
      const expiry = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
      if (expiry < new Date()) {
        return "destructive";
      }
    }
    return "default";
  };

  const getStatusText = (isActive: boolean, expiresAt: string | Date | null) => {
    if (!isActive) return 'Inactive';

    const normalizedExpiry =
      typeof expiresAt === 'string'
        ? expiresAt
        : expiresAt?.toISOString() ?? null;

    if (normalizedExpiry && new Date(normalizedExpiry) < new Date()) {
      return 'Expired';
    }

    return 'Active';
  };

  if (isLoading || reportsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-xl h-96"></div>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl h-48"></div>
                <div className="bg-white p-6 rounded-xl h-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rent Reports</h1>
          <p className="text-gray-600">Generate and share professional rental ledger</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Report Preview */}
          <div className="lg:col-span-2">
            {selectedReport && selectedReport.reportData ? (
              <ReportPreview
                report={selectedReport}
                onShare={() => setShowShareDialog(true)}
              />
            ) : selectedReport && !selectedReport.reportData ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Report Data Unavailable</h3>
                    <p className="text-gray-600 mb-6">This report does not have complete data. Try generating a new one.</p>
                    {properties.length > 0 && (
                      <Button
                        onClick={() => handleGenerateReport(properties[0].id)}
                        disabled={generateReportMutation.isPending}
                        className="gradient-primary text-white"
                      >
                        {generateReportMutation.isPending ? 'Generating...' : plan.id === 'free' ? 'Unlock Reports' : 'Generate New Report'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Report Selected</h3>
                    <p className="text-gray-600 mb-6">Select a report from the list or generate a new one</p>
                    {properties.length > 0 && (
                      <Button
                        onClick={() => handleGenerateReport(properties[0].id)}
                        disabled={generateReportMutation.isPending}
                        className="gradient-primary text-white"
                      >
                        {generateReportMutation.isPending ? 'Generating...' : plan.id === 'free' ? 'Unlock Reports' : 'Generate New Report'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Report Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full h-12 bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  onClick={() => window.location.href = '/manual-verify'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Record
                </Button>

                {properties.map((property) => (
                  <Button
                    key={property.id}
                    onClick={() => handleGenerateReport(property.id)}
                    disabled={generateReportMutation.isPending}
                    className="w-full h-12 bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm relative"
                  >
                    {plan.id === 'free' && <Lock className="w-3 h-3 absolute top-1 right-1" />}
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Rent Report
                  </Button>
                ))}

                <Button
                  onClick={() => window.location.href = '/portfolio'}
                  className="w-full h-12 bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Portfolio
                </Button>
              </CardContent>
            </Card>

            {/* Report History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Ledger History</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${selectedReport?.id === report.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-sm">
                            {formatDate(report.generatedAt)}
                          </p>
                          <Badge variant={getStatusColor(report.isActive ?? false, report.expiresAt)}>
                            {getStatusText(report.isActive ?? false, report.expiresAt)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          ID: {report.verificationId}
                        </p>
                        <p className="text-xs text-gray-600">
                          Shares: {report.shareCount}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No reports yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Share Dialog */}
        {showShareDialog && selectedReport && (
          <ShareDialog
            report={selectedReport}
            onClose={() => setShowShareDialog(false)}
          />
        )}
      </div>
    </div>
  );
}
