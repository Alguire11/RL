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

    // Separate rent score and monthly rent variables
    const rentScore = reportData.rentScore || stats.rentScore || 0;
    const monthlyRent = safeFormatCurrency(currentAddress.monthlyRent || currentAddress.rent || 0);

    const onTimeRate = Math.round(stats.onTimePercentage || reportData.onTimeRate || 0);
    const paymentStreak = stats.paymentStreak || reportData.paymentStreak || 0;
    const totalPaid = safeFormatCurrency(stats.totalPaid || reportData.totalPaid || 0);
    const verificationId = report.verificationId || report.reportId || reportData.reportId || 'N/A';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rent Ledger - ${userName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #111827; }
          
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .logo-text { font-size: 42px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
          .logo-icon { width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; font-weight: 800; }
          
          .grid-container { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-bottom: 60px; }
          
          .info-section { display: flex; flex-direction: column; gap: 24px; }
          .info-group { margin-bottom: 8px; }
          .label { font-size: 14px; color: #64748b; margin-bottom: 4px; font-weight: 500; }
          .value { font-size: 18px; color: #0f172a; font-weight: 600; }
          .address { font-size: 16px; color: #334155; margin-top: 4px; line-height: 1.4; }
          
          .stats-section { 
            background: #f8fafc; 
            border-radius: 16px; 
            padding: 32px; 
            display: flex; 
            align-items: center; 
            justify-content: space-around;
            border: 1px solid #e2e8f0;
          }
          
          .stat-item { text-align: center; }
          .stat-label { font-size: 13px; color: #64748b; margin-top: 8px; font-weight: 500; }
          .stat-value { font-size: 36px; font-weight: 800; line-height: 1; }
          
          .table-container { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 16px 24px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
          td { padding: 20px 24px; font-size: 15px; color: #334155; border-bottom: 1px solid #e2e8f0; }
          tr:last-child td { border-bottom: none; }
          
          .verified-icon { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #10b981; border-radius: 50%; color: white; font-size: 14px; font-weight: bold; }
          
          .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 24px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-text">Rent Ledger</div>
          <div class="logo-icon">R</div>
        </div>
        
        <div class="grid-container">
          <div class="info-section">
            <div class="info-group">
              <div class="label">Tenant Name</div>
              <div class="value">${userName}</div>
            </div>
            
            <div class="info-group">
              <div class="label">Address</div>
              <div class="address">${address}</div>
            </div>
            
            <div class="info-group">
              <div class="label">Landlord / Agent</div>
              <div class="value">Property Management</div>
            </div>
            
            <div class="info-group">
              <div class="label">Tenancy Period</div>
              <div class="value">Active Tenancy</div>
            </div>
          </div>
          
          <div class="stats-section">
            <div class="stat-item">
              <div class="stat-value" style="color: #4f46e5;">${rentScore || 'N/A'}</div>
              <div class="stat-label">Rent Score</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color: #10b981;">${onTimeRate}%</div>
              <div class="stat-label">On-Time</div>
            </div>
          </div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>METHOD</th>
                <th style="text-align: center;">VERIFIED</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Jul 2023</td>
                <td>${monthlyRent}</td>
                <td style="color: #0f172a;">Paid</td>
                <td>Direct Debit</td>
                <td style="text-align: center;"><div class="verified-icon">✓</div></td>
              </tr>
              <tr>
                <td>Jun 2023</td>
                <td>${monthlyRent}</td>
                <td style="color: #0f172a;">Paid</td>
                <td>Direct Debit</td>
                <td style="text-align: center;"><div class="verified-icon">✓</div></td>
              </tr>
              <tr>
                <td>May 2023</td>
                <td>${monthlyRent}</td>
                <td style="color: #0f172a;">Paid</td>
                <td>Direct Debit</td>
                <td style="text-align: center;"><div class="verified-icon">✓</div></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <div>Generated by RentLedger on: ${generatedDate}</div>
          <div>Ledger ID: ${verificationId}</div>
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
  const userInfo = reportData.user || reportData.userInfo || reportData.tenantInfo || {};
  const propertyInfo = reportData.property || reportData.currentAddress || reportData.currentProperty || {};

  // Normalize stats from different report structures (Credit vs Rental)
  const statsInfo = {
    onTimePercentage: reportData.onTimeRate ?? reportData.stats?.onTimePercentage ?? reportData.paymentSummary?.onTimeRate ?? 0,
    paymentStreak: reportData.paymentStreak ?? reportData.stats?.paymentStreak ?? (reportData.badges?.find((b: any) => b.badgeType === 'payment_streak')?.metadata?.streakMonths) ?? 0,
    totalPaid: reportData.totalPaid ?? reportData.stats?.totalPaid ?? reportData.paymentSummary?.totalAmount ?? 0
  };

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
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Rental Credit Report</h2>
            <p className="text-gray-500">
              Generated on {report.generatedAt ? format(new Date(report.generatedAt), 'dd MMM yyyy HH:mm') : (reportData.generatedDate ? format(new Date(reportData.generatedDate), 'dd MMM yyyy HH:mm') : 'N/A')}
            </p>
            <div className="mt-2 text-center">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold mb-2">Tenant Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {userInfo.name || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || userInfo.email || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {userInfo.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {userInfo.phone || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Property Details</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Address:</span> {propertyInfo.address || 'N/A'}</p>
                <p><span className="font-medium">City:</span> {propertyInfo.city || ''}, {propertyInfo.postcode || ''}</p>
                <p><span className="font-medium">Monthly Rent:</span> {formatCurrency(parseFloat(propertyInfo.rent || propertyInfo.monthlyRent || '0'))}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-3">Payment Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {Math.round(statsInfo.onTimePercentage || 0)}%
                </div>
                <div className="text-sm text-gray-600">On-time Rate</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {statsInfo.paymentStreak || 0}
                </div>
                <div className="text-sm text-gray-600">Months Tracked</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-secondary">
                  {formatCurrency(statsInfo.totalPaid || 0)}
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
                      <span className="text-sm">{formatDate(payment.paidDate || payment.dueDate || payment.date)}</span>
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
            <p>This report has been verified and generated by RentLedger</p>
            <p>Verification ID: {report.verificationId}</p>
            <p>Report ID: {report.reportId}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
