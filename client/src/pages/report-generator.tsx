import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  FileText, 
  Download, 
  Share2, 
  CheckCircle, 
  Calendar, 
  PoundSterling,
  Mail,
  MessageSquare,
  Eye,
  Link2,
  Star,
  Shield
} from "lucide-react";
import { WhatsAppShare } from "@/components/whatsapp-share";
import { format } from "date-fns";

export default function ReportGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/credit-reports"],
    retry: false,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["/api/payments"],
    retry: false,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
    retry: false,
  });

  const generateReportMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const response = await apiRequest("POST", "/api/credit-reports/generate", { propertyId });
      if (!response.ok) throw new Error("Failed to generate report");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-reports"] });
      toast({
        title: "Report Generated",
        description: "Your rent credit report has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const shareReportMutation = useMutation({
    mutationFn: async (data: { reportId: string; email: string; message?: string }) => {
      const response = await apiRequest("POST", "/api/credit-reports/share", data);
      if (!response.ok) throw new Error("Failed to share report");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Shared",
        description: "Your credit report has been shared successfully.",
      });
      setShareEmail("");
      setShareMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Share Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest("GET", `/api/credit-reports/${reportId}/download`);
      if (!response.ok) throw new Error("Failed to download report");
      return response.blob();
    },
    onSuccess: (blob, reportId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rent-credit-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Downloaded",
        description: "Your PDF report has been downloaded successfully.",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const calculatePaymentStats = (propertyId?: number) => {
    const relevantPayments = propertyId 
      ? payments.filter((p: any) => p.propertyId === propertyId)
      : payments;
    
    const paidPayments = relevantPayments.filter((p: any) => p.status === 'paid');
    const totalPayments = relevantPayments.length;
    const onTimeRate = totalPayments > 0 ? (paidPayments.length / totalPayments) * 100 : 0;
    const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const streak = calculateStreak(relevantPayments);
    
    return { onTimeRate, totalPaid, streak, totalPayments: paidPayments.length };
  };

  const calculateStreak = (payments: any[]) => {
    const sortedPayments = payments
      .filter((p: any) => p.status === 'paid')
      .sort((a: any, b: any) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
    
    let streak = 0;
    for (const payment of sortedPayments) {
      if (payment.status === 'paid') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getVerificationStatus = (report: any) => {
    return report.verificationId ? 'verified' : 'pending';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Reports</h1>
          <p className="text-gray-600">Generate and share your rent payment history as a credit report</p>
        </div>

        {/* Generate New Report */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Generate New Report
            </CardTitle>
            <CardDescription>
              Create a comprehensive credit report based on your rent payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {properties.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
                  <p className="text-gray-600 mb-4">Add a property to start generating credit reports</p>
                  <Button>Add Property</Button>
                </div>
              ) : (
                properties.map((property: any) => {
                  const stats = calculatePaymentStats(property.id);
                  return (
                    <Card key={property.id} className="border-2 hover:border-blue-200 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{property.address}</h3>
                            <p className="text-sm text-gray-600">{property.city}, {property.postcode}</p>
                          </div>
                          <Badge variant="outline">{formatCurrency(property.monthlyRent)}/month</Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Payments Made:</span>
                            <span className="font-medium">{stats.totalPayments}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">On-Time Rate:</span>
                            <span className="font-medium text-green-600">{Math.round(stats.onTimeRate)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Payment Streak:</span>
                            <span className="font-medium">{stats.streak} months</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Paid:</span>
                            <span className="font-medium">{formatCurrency(stats.totalPaid)}</span>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full"
                          onClick={() => generateReportMutation.mutate(property.id)}
                          disabled={generateReportMutation.isPending || stats.totalPayments === 0}
                        >
                          {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Existing Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Your Credit Reports</CardTitle>
            <CardDescription>
              View, share, and manage your generated credit reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-gray-300 rounded w-20"></div>
                      <div className="h-8 bg-gray-300 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Generated</h3>
                <p className="text-gray-600">Generate your first credit report to start sharing your rent history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report: any) => {
                  const property = properties.find((p: any) => p.id === report.propertyId);
                  const verificationStatus = getVerificationStatus(report);
                  
                  return (
                    <div key={report.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {property?.address || 'Credit Report'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Generated: {format(new Date(report.generatedAt), 'MMM dd, yyyy')}</span>
                            <span>Shares: {report.shareCount || 0}</span>
                            <Badge 
                              variant={verificationStatus === 'verified' ? 'default' : 'secondary'}
                              className={verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {verificationStatus === 'verified' ? (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  Landlord Verified
                                </>
                              ) : (
                                'Pending Verification'
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowPreview(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReportMutation.mutate(report.reportId)}
                          disabled={downloadReportMutation.isPending}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Share2 className="h-4 w-4 mr-1" />
                              Share
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Share Credit Report</DialogTitle>
                              <DialogDescription>
                                Share your credit report with landlords, lenders, or property agents
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="shareEmail">Recipient Email</Label>
                                <Input
                                  id="shareEmail"
                                  type="email"
                                  placeholder="landlord@example.com"
                                  value={shareEmail}
                                  onChange={(e) => setShareEmail(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="shareMessage">Message (Optional)</Label>
                                <Textarea
                                  id="shareMessage"
                                  placeholder="Hi, I'm sharing my rent credit report for your review..."
                                  value={shareMessage}
                                  onChange={(e) => setShareMessage(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => shareReportMutation.mutate({
                                    reportId: report.reportId,
                                    email: shareEmail,
                                    message: shareMessage
                                  })}
                                  disabled={!shareEmail || shareReportMutation.isPending}
                                  className="flex-1"
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  {shareReportMutation.isPending ? "Sending..." : "Send Email"}
                                </Button>
                                <WhatsAppShare 
                                  reportUrl={`${window.location.origin}/report/${report.reportId}`}
                                  reportTitle={property?.address || 'Credit Report'}
                                >
                                  <Button variant="outline" className="flex-1">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    WhatsApp
                                  </Button>
                                </WhatsAppShare>
                              </div>
                              <div className="border-t pt-4">
                                <Label className="text-sm text-gray-600">Shareable Link</Label>
                                <div className="flex mt-2">
                                  <Input
                                    value={`${window.location.origin}/report/${report.reportId}`}
                                    readOnly
                                    className="flex-1"
                                  />
                                  <Button
                                    variant="outline"
                                    className="ml-2"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`${window.location.origin}/report/${report.reportId}`);
                                      toast({ title: "Link copied to clipboard" });
                                    }}
                                  >
                                    <Link2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report Preview</DialogTitle>
              <DialogDescription>
                Preview your rent credit report before sharing
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-6 max-h-96 overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                  <h2 className="text-2xl font-bold mb-2">Rent Credit Report</h2>
                  <p className="opacity-90">
                    {user?.firstName} {user?.lastName} • Generated on {format(new Date(selectedReport.generatedAt), 'MMMM dd, yyyy')}
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Payment Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Payments:</span>
                          <span className="font-medium">12</span>
                        </div>
                        <div className="flex justify-between">
                          <span>On-Time Rate:</span>
                          <span className="font-medium text-green-600">100%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Streak:</span>
                          <span className="font-medium">12 months</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Verification Status</h3>
                      <div className="flex items-center space-x-2">
                        {getVerificationStatus(selectedReport) === 'verified' ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-600 font-medium">Landlord Verified</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-5 w-5 text-yellow-600" />
                            <span className="text-yellow-600 font-medium">Pending Verification</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}