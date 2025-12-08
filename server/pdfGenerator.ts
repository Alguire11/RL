import PDFDocument from "pdfkit";
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
    method?: string;
  }[];
  reportId: string;
  generatedAt: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  landlordInfo?: {
    name: string;
    email: string;
    verifiedAt?: string;
  };
  rentScore?: number;
  tenancyStartDate?: string;
  tenancyEndDate?: string;
}

export async function generatePDFReport(data: PDFReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const { user, property, payments, reportId, generatedAt, landlordInfo, rentScore, tenancyStartDate, tenancyEndDate } = data;

    // --- Header ---
    // Logo Icon (CSS-based 'R' recreated in vector)
    doc.save();
    const grad = doc.linearGradient(50, 45, 110, 105);
    grad.stop(0, "#3b82f6")
        .stop(1, "#4f46e5");
    
    doc.roundedRect(50, 45, 60, 60, 12)
       .fillAndStroke(grad, "#3b82f6");

    doc.fillColor('white')
      .fontSize(36)
      .font('Helvetica-Bold')
      .text('R', 68, 58);
    doc.restore();

    // Logo Text
    doc.fillColor('#0f172a')
      .fontSize(28) // Reduced from 42 to fit better
      .font('Helvetica-Bold')
      .text('Rent Ledger', 125, 60);

    doc.moveDown(2);

    // --- Info Grid ---
    const startY = 130;
    let currentY = startY;

    // Tenant Info
    doc.fontSize(10).fillColor('#64748b').font('Helvetica-Bold').text('TENANT NAME', 50, currentY);
    doc.fontSize(14).fillColor('#0f172a').font('Helvetica').text(`${user.firstName} ${user.lastName}`, 50, currentY + 15);
    doc.fontSize(12).fillColor('#334155').text(`${property.address}, ${property.city}, ${property.postcode}`, 50, currentY + 35);

    currentY += 70;

    // Landlord Info
    doc.fontSize(10).fillColor('#64748b').font('Helvetica-Bold').text('LANDLORD / AGENT', 50, currentY);
    doc.fontSize(14).fillColor('#0f172a').font('Helvetica').text(landlordInfo?.name || 'Property Management', 50, currentY + 15);

    currentY += 50;

    // Tenancy Period
    const startPeriod = tenancyStartDate ? format(new Date(tenancyStartDate), 'MMMM yyyy') : 'January 2023';
    const endPeriod = tenancyEndDate ? format(new Date(tenancyEndDate), 'MMMM yyyy') : 'Present';
    const tenancyPeriod = `${startPeriod} – ${endPeriod}`;

    doc.fontSize(10).fillColor('#64748b').font('Helvetica-Bold').text('TENANCY PERIOD', 50, currentY);
    doc.fontSize(14).fillColor('#0f172a').font('Helvetica').text(tenancyPeriod, 50, currentY + 15);

    currentY += 50;

    // Stats Row (Rent Score & On-Time Payments)
    if (rentScore) {
      doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#f1f5f9').stroke();
      currentY += 20;

      // Rent Score
      doc.fontSize(10).fillColor('#64748b').font('Helvetica-Bold').text('RENT SCORE', 50, currentY);
      doc.fontSize(24).fillColor('#4f46e5').font('Helvetica-Bold').text(rentScore.toString(), 50, currentY + 15);

      // On-Time Payments
      doc.fontSize(10).fillColor('#64748b').font('Helvetica-Bold').text('ON-TIME PAYMENTS', 200, currentY);
      const onTimeCount = payments.filter(p => p.status === 'paid').length;
      doc.fontSize(24).fillColor('#10b981').font('Helvetica-Bold').text(onTimeCount.toString(), 200, currentY + 15);

      currentY += 60;
    }

    doc.moveDown(2);

    // --- Payment Table ---
    const tableTop = currentY + 20;
    const itemHeight = 40;
    const colX = [50, 150, 250, 380, 480]; // Column X positions

    // Table Header
    doc.rect(50, tableTop, 495, 30).fill('#f8fafc');
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    doc.text('DATE', colX[0] + 10, tableTop + 10);
    doc.text('AMOUNT', colX[1] + 10, tableTop + 10);
    doc.text('STATUS', colX[2] + 10, tableTop + 10);
    doc.text('METHOD', colX[3] + 10, tableTop + 10);
    doc.text('VERIFIED', colX[4] + 10, tableTop + 10, { align: 'center', width: 40 });

    let y = tableTop + 30;

    // Sort payments
    const sortedPayments = [...payments].sort((a, b) =>
      new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );

    doc.font('Helvetica').fontSize(10);

    sortedPayments.forEach((payment, i) => {
      // Row background for even rows
      if (i % 2 === 0) {
        doc.rect(50, y, 495, itemHeight).fill('white');
      } else {
        doc.rect(50, y, 495, itemHeight).fill('#f8fafc'); // Alternating row color? Or just white/border
      }

      // Bottom border
      doc.moveTo(50, y + itemHeight).lineTo(545, y + itemHeight).strokeColor('#e2e8f0').stroke();

      doc.fillColor('#334155');

      // Date
      doc.text(format(new Date(payment.dueDate), 'MMM yyyy'), colX[0] + 10, y + 14);

      // Amount
      doc.text(`£${payment.amount.toLocaleString()}`, colX[1] + 10, y + 14);

      // Status
      const statusColor = payment.status === 'paid' ? '#0f172a' : '#ef4444';
      doc.fillColor(statusColor).text(payment.status.charAt(0).toUpperCase() + payment.status.slice(1), colX[2] + 10, y + 14);

      // Method
      doc.fillColor('#334155').text(payment.method || 'Direct Debit', colX[3] + 10, y + 14);

      // Verified Icon
      if (payment.status === 'paid') {
        // Draw a green checkmark circle
        const iconX = colX[4] + 30;
        const iconY = y + 20;
        doc.circle(iconX, iconY, 10).fill('#10b981');

        // Checkmark
        doc.strokeColor('white').lineWidth(2)
          .moveTo(iconX - 4, iconY)
          .lineTo(iconX - 1, iconY + 3)
          .lineTo(iconX + 4, iconY - 3)
          .stroke();
      } else {
        doc.fillColor('#cbd5e1').text('-', colX[4] + 10, y + 14, { align: 'center', width: 40 });
      }

      y += itemHeight;

      // New page if needed
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    // --- Footer ---
    const footerY = 780;
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#e2e8f0').stroke();
    doc.fontSize(8).fillColor('#64748b').text(`Generated by RentLedger on: ${format(new Date(generatedAt), 'dd MMMM yyyy')}`, 50, footerY + 10);
    doc.text(`Ledger ID: ${reportId.split('-')[0]}`, 400, footerY + 10, { align: 'right' });

    doc.end();
  });
}

// Alias for compatibility
export const generateCreditReportPDF = generatePDFReport;