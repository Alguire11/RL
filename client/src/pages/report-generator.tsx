import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FileText, Download, Calendar, Award, DollarSign, CheckCircle, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface GeneratedReport {
  reportId: string;
  downloadUrl: string;
  expiresAt: string;
  report: any;
}

export default function ReportGenerator() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [reportType, setReportType] = useState("credit");
  const [includePortfolio, setIncludePortfolio] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

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

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/generate-report", {
        reportType,
        includePortfolio,
      });
    },
    onSuccess: (data: any) => {
      setGeneratedReport(data);
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully and is ready for download.",
      });
    },
    onError: (error: any) => {
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
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  const downloadReport = () => {
    if (generatedReport) {
      // In a real app, this would trigger a PDF download
      // For demo purposes, we'll show the report data
      const dataStr = JSON.stringify(generatedReport.report, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `enoikio-report-${generatedReport.reportId}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: "Download Started",
        description: "Your report is being downloaded as a JSON file.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Generate Report</h1>
          <p className="text-gray-600">
            Generate comprehensive reports of your payment history and rental achievements to share with landlords, lenders, or agencies.
          </p>
        </div>

        {!generatedReport ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type */}
              <div>
                <Label className="text-base font-medium mb-4 block">Report Type</Label>
                <RadioGroup value={reportType} onValueChange={setReportType}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="credit" id="credit" />
                    <div className="flex-1">
                      <Label htmlFor="credit" className="font-medium cursor-pointer">
                        Credit Building Report
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Comprehensive report showing payment history, reliability metrics, and credit-building potential.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="rental" id="rental" />
                    <div className="flex-1">
                      <Label htmlFor="rental" className="font-medium cursor-pointer">
                        Rental History Report
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Focused on rental payment history and tenancy information for landlord applications.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="verification" id="verification" />
                    <div className="flex-1">
                      <Label htmlFor="verification" className="font-medium cursor-pointer">
                        Tenant Verification Report
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Official verification of tenancy and payment reliability for financial institutions.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Portfolio Integration */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="portfolio"
                    checked={includePortfolio}
                    onCheckedChange={(checked) => setIncludePortfolio(checked === true)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="portfolio" className="font-medium cursor-pointer">
                      Include Achievement Portfolio
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Add your earned badges and achievements to showcase your reliability and commitment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="border-t pt-6">
                <Button
                  onClick={() => generateReportMutation.mutate()}
                  disabled={generateReportMutation.isPending}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  size="lg"
                >
                  {generateReportMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-900">Report Generated Successfully</h3>
                    <p className="text-green-700 text-sm mt-1">
                      Your report has been generated and is ready for download.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Details */}
            <Card>
              <CardHeader>
                <CardTitle>Report Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Report ID</Label>
                    <p className="font-mono text-sm">{generatedReport.reportId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Generated</Label>
                    <p className="text-sm">{generatedReport.report?.generatedAt ? formatDate(generatedReport.report.generatedAt) : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Type</Label>
                    <Badge variant="outline" className="ml-2">
                      {reportType === 'credit' ? 'Credit Building' : 
                       reportType === 'rental' ? 'Rental History' : 'Tenant Verification'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Expires</Label>
                    <p className="text-sm">{formatDate(generatedReport.expiresAt)}</p>
                  </div>
                </div>

                {/* Report Summary */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Report Summary</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-900">
                        {generatedReport.report?.paymentSummary?.totalPayments || 0}
                      </div>
                      <p className="text-sm text-blue-700">Total Payments</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-900">
                        {generatedReport.report?.paymentSummary?.onTimePayments || 0}
                      </div>
                      <p className="text-sm text-green-700">On-Time Payments</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Award className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold text-purple-900">
                        {generatedReport.report?.badges?.length || 0}
                      </div>
                      <p className="text-sm text-purple-700">Achievement Badges</p>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <div className="border-t pt-4">
                  <Button onClick={downloadReport} className="w-full" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generate Another */}
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => setGeneratedReport(null)}
              >
                Generate Another Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}