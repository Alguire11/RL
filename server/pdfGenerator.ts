import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Define types for better type safety
interface ReportData {
  reportType?: 'credit' | 'rental' | 'landlord';
  reportId: string;
  generatedDate?: string;
  generatedAt?: string;
  user?: { firstName?: string; lastName?: string; email?: string; phone?: string; name?: string };
  userInfo?: { name: string; email: string; phone?: string; rlid?: string };
  property?: { address: string; city: string; postcode: string; monthlyRent: number | string };
  currentAddress?: { fullAddress: string; city: string; postcode: string; moveInDate?: string };
  currentProperty?: { fullAddress: string; city: string; postcode: string; moveInDate?: string; monthlyRent: number };
  tenantInfo?: { name: string; email: string };
  propertyDetails?: { fullAddress: string; monthlyRent: number };
  landlordInfo?: { name: string; email: string; verificationStatus: string; verifiedAt?: string };
  payments?: any[];
  paymentHistory?: any[];
  paymentRecords?: any[];
  rentScore?: number;
  onTimeRate?: number;
  totalPaid?: number;
  paymentSummary?: { totalPaid: number; onTimeRate: number; totalPayments: number };
  reliabilityMetrics?: { rentScore: number; onTimeRate: number; totalPaid: number };
  badges?: any[];
  earnedBadges?: any[];
}

export const sampleData = {
  user: {
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@example.com',
    phone: '07700 900000'
  },
  property: {
    address: '42 Park Road',
    city: 'London',
    postcode: 'SW19 2HZ',
    monthlyRent: 1200
  },
  payments: [
    { id: 1, amount: 1200, dueDate: '2023-07-01', paidDate: '2023-07-01', status: 'paid', method: 'Direct Debit', isVerified: true },
    { id: 2, amount: 1200, dueDate: '2023-06-01', paidDate: '2023-06-01', status: 'paid', method: 'Direct Debit', isVerified: true },
    { id: 3, amount: 1200, dueDate: '2023-05-01', paidDate: '2023-05-01', status: 'paid', method: 'Direct Debit', isVerified: true },
    { id: 4, amount: 1200, dueDate: '2023-04-01', paidDate: '2023-04-01', status: 'paid', method: 'Direct Debit', isVerified: true },
    { id: 5, amount: 1200, dueDate: '2023-03-01', paidDate: '2023-03-01', status: 'paid', method: 'Direct Debit', isVerified: true },
    { id: 6, amount: 1200, dueDate: '2023-02-01', paidDate: '2023-02-01', status: 'paid', method: 'Direct Debit', isVerified: true },
    { id: 7, amount: 1200, dueDate: '2023-01-01', paidDate: '2023-01-01', status: 'paid', method: 'Direct Debit', isVerified: true },
  ],
  reportId: 'SAMPLE-001',
  generatedAt: new Date().toISOString(),
  verificationStatus: 'verified',
  rentScore: 950,
  onTimeRate: 100,
  totalPaid: 8400,
  landlordInfo: {
    name: 'Citywide Estates',
    email: 'agents@citywide.co.uk',
    verificationStatus: 'verified'
  }
};

export async function generateCreditReportPDF(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // --- Helper Functions ---
      const formatDate = (dateStr?: string | Date | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      };

      const formatCurrency = (amount: number | string) => {
        return `£${Number(amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      // --- Data Normalization ---
      const reportType = data.reportType || 'credit';
      const reportId = data.reportId;
      const generatedDate = data.generatedDate || data.generatedAt || new Date().toISOString();
      const user = data.user || data.userInfo || data.tenantInfo || { name: 'Unknown', email: 'N/A' };
      const userName = (user as any).firstName ? `${(user as any).firstName} ${(user as any).lastName}` : ((user as any).name || 'Unknown');

      const property = data.property || data.currentAddress || data.currentProperty || data.propertyDetails || { fullAddress: 'N/A', city: '', postcode: '' };
      const propertyAddress = (property as any).fullAddress ||
        ((property as any).address ? `${(property as any).address}, ${(property as any).city || ''}, ${(property as any).postcode || ''}` : 'N/A');

      const payments = data.payments || data.paymentHistory || data.paymentRecords || [];

      const landlord = data.landlordInfo || { name: 'N/A', email: 'N/A' };

      // --- Watermark ---
      doc.save();
      doc.translate(300, 400); // Center of A4 roughly
      doc.rotate(-45);
      doc.fontSize(80);
      doc.fillColor('#f3f4f6'); // Very light gray
      doc.opacity(0.4);
      doc.text('RentLedger', -200, 0, { align: 'center', width: 400 });
      doc.restore();

      // --- Header ---
      // Header - Logo
      const logoPath = path.resolve(process.cwd(), 'client/public/logo.png');
      try {
        if (fs.existsSync(logoPath)) {
          // Draw rounded rectangle for logo background
          doc.roundedRect(490, 40, 60, 60, 10).fill('#3b82f6'); // Blue-500
          // Place logo inside
          doc.image(logoPath, 500, 50, { width: 40, height: 40 });
        } else {
          throw new Error('Logo file not found');
        }
      } catch (err) {
        // Fallback if logo file missing or error loading
        console.warn('Could not load logo for PDF:', err);
        doc.roundedRect(490, 40, 60, 60, 10).fill('#3b82f6');
        doc.fontSize(30).fillColor('white').text('R', 510, 55);
      }

      // Title
      const titleGradient = doc.linearGradient(50, 60, 250, 60);
      titleGradient.stop(0, '#3b82f6').stop(1, '#8b5cf6');

      doc.fontSize(28)
        .font('Helvetica-Bold')
        .fill(titleGradient)
        .text('RentLedger', 50, 60, { align: 'left' });

      // Subtitle / Report Type
      let reportTitle = 'Tenant Credit Report';
      if (reportType === 'rental') reportTitle = 'Rental History Report';
      if (reportType === 'landlord') reportTitle = 'Tenant Verification Report';

      doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text(reportTitle, 50, 95);

      doc.moveDown(4);

      // --- Info Section (Grid Layout) ---
      const leftColX = 50;
      let currentY = 160;

      // Tenant Detail
      doc.fontSize(10).fillColor('#6b7280').text('Tenant Name', leftColX, currentY);
      doc.fontSize(12).fillColor('#111827').text(userName, leftColX, currentY + 15);

      doc.fontSize(10).fillColor('#6b7280').text('Address', leftColX, currentY + 40);
      doc.fontSize(12).fillColor('#111827').text(propertyAddress, leftColX, currentY + 55, { width: 250 });

      // Landlord Detail
      doc.fontSize(10).fillColor('#6b7280').text('Landlord / Agent', leftColX, currentY + 95);
      doc.fontSize(12).fillColor('#111827').text(landlord.name || 'N/A', leftColX, currentY + 110);

      // Tenancy Period
      const startDate = (property as any).moveInDate || (property as any).tenancyStart || (property as any).tenancyStartDate;
      const tenancyPeriod = startDate ? `${formatDate(startDate)} – Present` : 'Active Tenancy';
      doc.fontSize(10).fillColor('#6b7280').text('Tenancy Period', leftColX, currentY + 140);
      doc.fontSize(12).fillColor('#111827').text(tenancyPeriod, leftColX, currentY + 155);

      // Stats Column (Right aligned, kind of) - Only for Credit reports
      if (reportType === 'credit') {
        const rightColX = 350;
        const statsY = 160;

        // Stats container
        doc.roundedRect(rightColX, statsY, 150, 80, 5).fill('#f9fafb');

        // Rent Score
        const score = data.rentScore || data.reliabilityMetrics?.rentScore || 0;
        doc.fillColor('#2563eb').fontSize(24).text(score.toString(), rightColX + 20, statsY + 20);
        doc.fillColor('#6b7280').fontSize(9).text('Rent Score', rightColX + 20, statsY + 50);

        // On Time Rate
        const rate = data.onTimeRate || data.paymentSummary?.onTimeRate || data.reliabilityMetrics?.onTimeRate || 0;
        doc.fillColor('#059669').fontSize(24).text(`${rate}%`, rightColX + 90, statsY + 20);
        doc.fillColor('#6b7280').fontSize(9).text('On-Time', rightColX + 90, statsY + 50);
      }

      doc.moveDown(2);
      currentY = 360; // Table starts here (Increased spacing from top section)

      // --- Payment History Table ---

      // Table Header Background
      doc.rect(50, currentY, 500, 30).fill('#f3f4f6');

      // Table Header Text
      doc.fontSize(9).fillColor('#111827').font('Helvetica-Bold');
      doc.text('DATE', 70, currentY + 11);
      doc.text('AMOUNT', 180, currentY + 11);
      doc.text('STATUS', 280, currentY + 11);
      doc.text('METHOD', 380, currentY + 11);
      doc.text('VERIFIED', 480, currentY + 11);

      currentY += 30; // Row start

      // Rows
      doc.font('Helvetica');
      doc.fontSize(10);

      // Border lines
      // We will draw lines between rows

      payments.slice(0, 15).forEach((p: any, i: number) => {
        // Alternate row bg? Maybe unnecessary clean look is better

        const date = formatDate(p.paidDate || p.dueDate);
        const amount = formatCurrency(p.amount);
        const status = (p.status || 'paid').charAt(0).toUpperCase() + (p.status || 'paid').slice(1);
        const method = p.method || p.paymentMethod || 'Direct Debit';
        const isVerified = p.isVerified || p.status === 'verified';

        // Row Content
        doc.fillColor('#374151');
        doc.text(date, 70, currentY + 12);
        doc.text(amount, 180, currentY + 12);
        doc.text(status, 280, currentY + 12);
        doc.text(method, 380, currentY + 12);

        // Verified Icon (Circle Check)
        if (isVerified) {
          doc.circle(500, currentY + 16, 8).fill('#10b981'); // Green circle
          // Checkmark (white lines)
          doc.lineWidth(1.5).strokeColor('white');
          doc.moveTo(496, currentY + 16).lineTo(499, currentY + 19).lineTo(504, currentY + 13).stroke();
        }

        // Horizontal Line
        doc.rect(50, currentY + 35, 500, 1).fill('#e5e7eb');

        currentY += 35;
      });

      // --- Achievement Badges Section ---
      const badges = data.badges || data.earnedBadges || [];
      if (badges.length > 0) {
        // Check if we have enough space for the header + one row of badges (approx 100px)
        // A4 height is ~841px. Footer is at 750. Safe limit around 650-700.
        if (currentY + 120 > 750) {
          doc.addPage();
          currentY = 50; // Reset to top margin
        } else {
          currentY += 40;
        }

        // Section Header
        doc.fontSize(14).fillColor('#111827').font('Helvetica-Bold');
        doc.text('Achievement Portfolio', 50, currentY);
        currentY += 25;

        // Badge Grid
        let badgeX = 50;
        const colWidth = 160;

        doc.font('Helvetica');
        doc.fontSize(10);

        badges.forEach((badge: any, index: number) => {
          // Wrap to new row if needed
          if (index > 0 && index % 3 === 0) {
            currentY += 60;
            badgeX = 50;

            // Check if this new row will hit the footer area
            if (currentY + 60 > 750) {
              doc.addPage();
              currentY = 50;
            }
          }

          // Badge Box
          doc.roundedRect(badgeX, currentY, 150, 50, 5).stroke('#e5e7eb');

          // Icon placeholder (simple circle)
          doc.circle(badgeX + 25, currentY + 25, 12).fill('#8b5cf6'); // Violet-500
          doc.fillColor('white').fontSize(14).text('★', badgeX + 19, currentY + 20); // Star icon

          // Text
          doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold');
          // Format badge type title
          const title = (badge.badgeType || 'Achievement')
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          doc.text(title, badgeX + 45, currentY + 15, { width: 100 });

          doc.fillColor('#6b7280').fontSize(8).font('Helvetica');
          const levelText = badge.level ? `Level ${badge.level}` : 'Earned';
          doc.text(levelText, badgeX + 45, currentY + 30);

          badgeX += colWidth;
        });
      }

      // Footer Meta
      doc.fontSize(8).fillColor('#9ca3af');
      const footerY = 750;
      doc.text(`Generated by RentLedger on: ${new Date(generatedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, footerY);
      doc.text(`Ledger ID: ${reportId.split('-').pop() || '003589'}`, 400, footerY, { align: 'right' });

      doc.end();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
}