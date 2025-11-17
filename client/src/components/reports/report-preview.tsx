import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { Logo } from "@/components/logo";
import { Download, Share2, CheckCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ReportPreviewProps {
  report: any;
  onShare: () => void;
}

export function ReportPreview({ report, onShare }: ReportPreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'dd MMM yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const handleDownload = () => {
    // Create a printable version of the report
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const reportHtml = generateReportHtml(report);
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateReportHtml = (report: any) => {
    const reportData = report.reportData || {};
    const userInfo = reportData.userInfo || reportData.user || {};
    const currentAddress = reportData.currentAddress || reportData.property || {};
    const stats = reportData.stats || {};
    
    // Safe date formatting for HTML generation
    const safeFormatDate = (dateValue: any) => {
      if (!dateValue) return 'N/A';
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'N/A';
        return format(date, 'dd MMM yyyy');
      } catch {
        return 'N/A';
      }
    };
    
    // Safe currency formatting
    const safeFormatCurrency = (amount: any) => {
      if (amount === null || amount === undefined || isNaN(Number(amount))) return '£0.00';
      return formatCurrency(Number(amount));
    };
    
    const generatedDate = safeFormatDate(reportData.generatedDate || reportData.generatedAt || report.createdAt);
    const userName = userInfo.name || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'N/A';
    const userEmail = userInfo.email || 'N/A';
    const userPhone = userInfo.phone || 'Not provided';
    const address = currentAddress.fullAddress || currentAddress.address || 'N/A';
    const city = currentAddress.city || 'N/A';
    const postcode = currentAddress.postcode || 'N/A';
    const rent = safeFormatCurrency(reportData.rentScore || currentAddress.monthlyRent || stats.totalPaid || 0);
    const onTimeRate = Math.round(stats.onTimePercentage || reportData.onTimeRate || 0);
    const paymentStreak = stats.paymentStreak || reportData.paymentStreak || 0;
    const totalPaid = safeFormatCurrency(stats.totalPaid || reportData.totalPaid || 0);
    const verificationId = report.verificationId || report.reportId || reportData.reportId || 'N/A';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rental Credit Report - ${userName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #3B82F6; }
          .section { margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; }
          .stat-card { padding: 15px; border: 1px solid #E5E7EB; border-radius: 8px; }
          .verification { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Enoíkio</div>
          <h1>Rental Credit Report</h1>
          <p>Generated on ${generatedDate}</p>
        </div>
        
        <div class="grid">
          <div class="section">
            <h3>Tenant Information</h3>
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Phone:</strong> ${userPhone}</p>
          </div>
          
          <div class="section">
            <h3>Property Details</h3>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>City:</strong> ${city}</p>
            <p><strong>Postcode:</strong> ${postcode}</p>
            <p><strong>Monthly Rent:</strong> ${rent}</p>
          </div>
        </div>
        
        <div class="section">
          <h3>Payment Summary</h3>
          <div class="stats">
            <div class="stat-card">
              <div style="font-size: 24px; font-weight: bold; color: #10B981;">${onTimeRate}%</div>
              <div>On-time Rate</div>
            </div>
            <div class="stat-card">
              <div style="font-size: 24px; font-weight: bold; color: #3B82F6;">${paymentStreak}</div>
              <div>Months Tracked</div>
            </div>
            <div class="stat-card">
              <div style="font-size: 24px; font-weight: bold; color: #8B5CF6;">${totalPaid}</div>
              <div>Total Paid</div>
            </div>
          </div>
        </div>
        
        <div class="verification">
          <p>This report has been verified and generated by Enoíkio</p>
          <p>Verification ID: ${verificationId}</p>
        </div>
      </body>
      </html>
    `;
  };

  if (!report || !report.reportData) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-12">
            <p className="text-gray-600">No report data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const reportData = report.reportData;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Rental Credit Report</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <GradientButton
            size="sm"
            onClick={onShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </GradientButton>
        </div>
      </CardHeader>
      <CardContent>
        {/* Report Preview */}
        <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="text-center mb-6">
            <Logo className="mb-2" />
            <h3 className="text-lg font-semibold">Rental Credit Report</h3>
            <p className="text-sm text-gray-600">Generated on {formatDate(reportData.generatedAt)}</p>
            <Badge variant="outline" className="mt-2">
              {report.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold mb-2">Tenant Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {reportData.user.name}</p>
                <p><span className="font-medium">Email:</span> {reportData.user.email}</p>
                <p><span className="font-medium">Phone:</span> {reportData.user.phone || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Property Details</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Address:</span> {reportData.property.address}</p>
                <p><span className="font-medium">City:</span> {reportData.property.city}, {reportData.property.postcode}</p>
                <p><span className="font-medium">Monthly Rent:</span> {formatCurrency(parseFloat(reportData.property.rent))}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Payment Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {Math.round(reportData.stats.onTimePercentage)}%
                </div>
                <div className="text-sm text-gray-600">On-time Rate</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {reportData.stats.paymentStreak}
                </div>
                <div className="text-sm text-gray-600">Months Tracked</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-secondary">
                  {formatCurrency(reportData.stats.totalPaid)}
                </div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {reportData.payments && reportData.payments.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Recent Payment History</h4>
              <div className="space-y-2">
                {reportData.payments.slice(0, 5).map((payment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">{formatDate(payment.date)}</span>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(parseFloat(payment.amount))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p>This report has been verified and generated by Enoíkio</p>
            <p>Verification ID: {report.verificationId}</p>
            <p>Report ID: {report.reportId}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
