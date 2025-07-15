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
import { Download, Share2, FileText, Calendar, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedReport, setSelectedReport] = useState<any>(null);
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

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
    retry: false,
  });

  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
    retry: false,
  });

  const generateReportMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const response = await apiRequest("POST", "/api/reports/generate", { propertyId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "Your credit report has been generated successfully",
      });
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
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateReport = (propertyId: number) => {
    generateReportMutation.mutate(propertyId);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getStatusColor = (isActive: boolean, expiresAt: string | null) => {
    if (!isActive) return 'secondary';
    if (expiresAt && new Date(expiresAt) < new Date()) return 'destructive';
    return 'default';
  };

  const getStatusText = (isActive: boolean, expiresAt: string | null) => {
    if (!isActive) return 'Inactive';
    if (expiresAt && new Date(expiresAt) < new Date()) return 'Expired';
    return 'Active';
  };

  if (isLoading || reportsLoading) {
    return (
      <div className="min-h-screen bg-light-gray">
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
    <div className="min-h-screen bg-light-gray">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Reports</h1>
          <p className="text-gray-600">Generate and share professional rental credit reports</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Report Preview */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <ReportPreview 
                report={selectedReport} 
                onShare={() => setShowShareDialog(true)}
              />
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Report Selected</h3>
                    <p className="text-gray-600 mb-6">Select a report from the list or generate a new one</p>
                    {properties && properties.length > 0 && (
                      <Button 
                        onClick={() => handleGenerateReport(properties[0].id)}
                        disabled={generateReportMutation.isPending}
                        className="gradient-primary text-white"
                      >
                        {generateReportMutation.isPending ? 'Generating...' : 'Generate New Report'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Report Actions */}
          <div className="space-y-6">
            {/* Generate New Report */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Generate Report</CardTitle>
              </CardHeader>
              <CardContent>
                {properties && properties.length > 0 ? (
                  <div className="space-y-3">
                    {properties.map((property: any) => (
                      <Button
                        key={property.id}
                        onClick={() => handleGenerateReport(property.id)}
                        disabled={generateReportMutation.isPending}
                        className="w-full justify-start text-left h-auto p-4"
                        variant="outline"
                      >
                        <div>
                          <p className="font-medium">{property.address}</p>
                          <p className="text-sm text-gray-600">{property.city}, {property.postcode}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">No properties found</p>
                    <Button variant="outline" size="sm">
                      Add Property
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Report History</CardTitle>
              </CardHeader>
              <CardContent>
                {reports && reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.map((report: any) => (
                      <div
                        key={report.id}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedReport?.id === report.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-sm">
                            {formatDate(report.generatedAt)}
                          </p>
                          <Badge variant={getStatusColor(report.isActive, report.expiresAt) as any}>
                            {getStatusText(report.isActive, report.expiresAt)}
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
