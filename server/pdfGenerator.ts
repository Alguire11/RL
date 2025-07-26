import { format } from "date-fns";

interface PDFReportData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  property: {
    address: string;
    city: string;
    postcode: string;
    monthlyRent: number;
  };
  payments: {
    id: number;
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: string;
  }[];
  reportId: string;
  generatedAt: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  landlordInfo?: {
    name: string;
    email: string;
    verifiedAt?: string;
  };
}

export function generatePDFReport(data: PDFReportData): string {
  const { user, property, payments, reportId, generatedAt, verificationStatus, landlordInfo } = data;
  
  // Calculate statistics
  const totalPayments = payments.length;
  const paidPayments = payments.filter(p => p.status === 'paid');
  const onTimePayments = paidPayments.filter(p => {
    if (!p.paidDate) return false;
    return new Date(p.paidDate) <= new Date(p.dueDate);
  });
  
  const onTimeRate = totalPayments > 0 ? (onTimePayments.length / totalPayments) * 100 : 0;
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const averagePayment = paidPayments.length > 0 ? totalPaid / paidPayments.length : 0;
  
  // Calculate payment streak
  let paymentStreak = 0;
  const sortedPayments = [...paidPayments].sort((a, b) => 
    new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  );
  
  for (const payment of sortedPayments) {
    if (payment.status === 'paid' && payment.paidDate) {
      const paidDate = new Date(payment.paidDate);
      const dueDate = new Date(payment.dueDate);
      if (paidDate <= dueDate) {
        paymentStreak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Generate HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rent Credit Report - ${user.firstName} ${user.lastName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #fff;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .header {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: white;
          padding: 40px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .header p {
          font-size: 1.1rem;
          opacity: 0.9;
        }
        
        .report-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }
        
        .report-id {
          font-size: 0.9rem;
          color: #64748b;
        }
        
        .generated-date {
          font-size: 0.9rem;
          color: #64748b;
        }
        
        .verification-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .verified {
          background: #dcfce7;
          color: #166534;
        }
        
        .pending {
          background: #fef3c7;
          color: #a16207;
        }
        
        .unverified {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .section {
          margin-bottom: 40px;
        }
        
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .info-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
        }
        
        .info-card h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 15px;
          color: #1e293b;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .info-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        
        .info-label {
          color: #64748b;
          font-weight: 500;
        }
        
        .info-value {
          color: #1e293b;
          font-weight: 600;
        }
        
        .payment-history {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .payment-history th,
        .payment-history td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .payment-history th {
          background: #f8fafc;
          font-weight: 600;
          color: #374151;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-paid {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-pending {
          background: #fef3c7;
          color: #a16207;
        }
        
        .status-overdue {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .footer {
          margin-top: 50px;
          padding: 30px;
          background: #f8fafc;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        
        .footer h3 {
          font-size: 1.2rem;
          margin-bottom: 10px;
          color: #1e293b;
        }
        
        .footer p {
          color: #64748b;
          margin-bottom: 5px;
        }
        
        .generated-by {
          margin-top: 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 0.875rem;
        }
        
        @media print {
          .container {
            padding: 20px;
          }
          
          .header {
            background: #2563eb !important;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>Rent Credit Report</h1>
          <p>${user.firstName} ${user.lastName} • Generated ${format(new Date(generatedAt), 'MMMM dd, yyyy')}</p>
        </div>
        
        <!-- Report Metadata -->
        <div class="report-meta">
          <div class="report-id">Report ID: ${reportId}</div>
          <div class="verification-badge ${verificationStatus}">
            ${verificationStatus === 'verified' ? '✓ Landlord Verified' : 
              verificationStatus === 'pending' ? '⏳ Verification Pending' : 
              '⚠ Unverified'}
          </div>
          <div class="generated-date">Generated: ${format(new Date(generatedAt), 'dd/MM/yyyy HH:mm')}</div>
        </div>
        
        <!-- Payment Statistics -->
        <div class="section">
          <h2 class="section-title">Payment Performance</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value" style="color: #059669;">${Math.round(onTimeRate)}%</div>
              <div class="stat-label">On-Time Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #2563eb;">${paymentStreak}</div>
              <div class="stat-label">Payment Streak</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #7c2d12;">£${totalPaid.toLocaleString()}</div>
              <div class="stat-label">Total Paid</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #6366f1;">${totalPayments}</div>
              <div class="stat-label">Total Payments</div>
            </div>
          </div>
        </div>
        
        <!-- Property & Tenant Information -->
        <div class="section">
          <h2 class="section-title">Property & Tenant Information</h2>
          <div class="info-grid">
            <div class="info-card">
              <h3>Tenant Details</h3>
              <div class="info-item">
                <span class="info-label">Full Name</span>
                <span class="info-value">${user.firstName} ${user.lastName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${user.email}</span>
              </div>
              ${user.phone ? `
              <div class="info-item">
                <span class="info-label">Phone</span>
                <span class="info-value">${user.phone}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="info-card">
              <h3>Property Details</h3>
              <div class="info-item">
                <span class="info-label">Address</span>
                <span class="info-value">${property.address}</span>
              </div>
              <div class="info-item">
                <span class="info-label">City</span>
                <span class="info-value">${property.city}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Postcode</span>
                <span class="info-value">${property.postcode}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Monthly Rent</span>
                <span class="info-value">£${property.monthlyRent.toLocaleString()}</span>
              </div>
            </div>
            
            ${landlordInfo ? `
            <div class="info-card">
              <h3>Landlord Verification</h3>
              <div class="info-item">
                <span class="info-label">Landlord</span>
                <span class="info-value">${landlordInfo.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${landlordInfo.email}</span>
              </div>
              ${landlordInfo.verifiedAt ? `
              <div class="info-item">
                <span class="info-label">Verified</span>
                <span class="info-value">${format(new Date(landlordInfo.verifiedAt), 'dd/MM/yyyy')}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Payment History -->
        <div class="section">
          <h2 class="section-title">Payment History</h2>
          <table class="payment-history">
            <thead>
              <tr>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Paid Date</th>
                <th>Status</th>
                <th>Days Early/Late</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(payment => {
                const dueDate = new Date(payment.dueDate);
                const paidDate = payment.paidDate ? new Date(payment.paidDate) : null;
                const daysDiff = paidDate ? Math.ceil((dueDate.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
                
                return `
                  <tr>
                    <td>${format(dueDate, 'dd/MM/yyyy')}</td>
                    <td>£${payment.amount.toLocaleString()}</td>
                    <td>${paidDate ? format(paidDate, 'dd/MM/yyyy') : '-'}</td>
                    <td>
                      <span class="status-badge status-${payment.status}">
                        ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      ${daysDiff !== null ? 
                        (daysDiff > 0 ? `${daysDiff} days early` : 
                         daysDiff < 0 ? `${Math.abs(daysDiff)} days late` : 
                         'On time') : '-'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <h3>Report Verification</h3>
          <p>This report has been generated by Enoíkio and contains verified rent payment data.</p>
          <p>Report ID: ${reportId}</p>
          <p>Generated: ${format(new Date(generatedAt), 'dd MMMM yyyy \'at\' HH:mm')}</p>
          ${verificationStatus === 'verified' ? 
            '<p style="color: #059669; font-weight: 600;">✓ This report has been verified by the landlord</p>' : 
            '<p style="color: #d97706;">⏳ Landlord verification pending</p>'}
        </div>
        
        <div class="generated-by">
          <p>Generated by Enoíkio - Rent Credit Building Platform</p>
          <p>Visit enoikio.com to learn more</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
}

// Convert HTML to PDF using a headless browser approach
export async function convertHtmlToPdf(html: string): Promise<Buffer> {
  // In a real implementation, you would use puppeteer or similar
  // For now, we'll return the HTML as a buffer for demonstration
  // This would typically use: puppeteer.launch() -> page.setContent(html) -> page.pdf()
  
  try {
    // Simulated PDF conversion - in production, use puppeteer
    const pdfBuffer = Buffer.from(html, 'utf8');
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
}

export async function generateCreditReportPDF(data: PDFReportData): Promise<Buffer> {
  const html = generatePDFReport(data);
  return convertHtmlToPdf(html);
}