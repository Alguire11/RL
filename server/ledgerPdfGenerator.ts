import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

export interface LedgerData {
    tenant: {
        name: string;
        email: string;
    };
    property: {
        address: string;
        city: string;
        postcode: string;
        monthlyRent: number;
        tenancyStartDate?: string | Date | null;
        tenancyEndDate?: string | Date | null;
    };
    landlord?: {
        name: string;
        email?: string;
    };
    payments: {
        date: string | Date;
        amount: number;
        status: string;
        verified: boolean;
        method?: string;
    }[];
    generatedAt: Date;
    ledgerId: string;
}

export async function generateLedgerPDF(data: LedgerData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        doc.on('error', (err) => {
            reject(err);
        });

        // --- Colors ---
        const primaryColor = '#2563eb'; // Blue
        const secondaryColor = '#64748b'; // Slate 500
        const lightBg = '#f8fafc'; // Slate 50
        const successColor = '#166534'; // Green 700
        const successBg = '#dcfce7'; // Green 100
        const warningColor = '#b45309'; // Amber 700
        const errorColor = '#b91c1c'; // Red 700

        // --- Header ---
        doc.fontSize(28).font('Helvetica-Bold').fillColor('#1e293b').text('Rent Ledger', 50, 50);

        // Logo (Simulated with a rounded rect and text)
        const logoSize = 50;
        const logoX = 500;
        const logoY = 45;

        doc.roundedRect(logoX, logoY, logoSize, logoSize, 12)
            .fillAndStroke('url(#gradient)', primaryColor); // Fallback to solid if gradient fails (pdfkit gradients are complex, using solid for now)

        // Gradient for logo (Simulated with solid color for simplicity and reliability)
        doc.save();
        doc.roundedRect(logoX, logoY, logoSize, logoSize, 12).fill(primaryColor);
        doc.fontSize(30).font('Helvetica-Bold').fillColor('white').text('R', logoX + 13, logoY + 10);
        doc.restore();

        doc.moveDown(2);

        // --- Info Block ---
        const startY = 130;
        let currentY = startY;

        // Tenant Name
        doc.fontSize(10).font('Helvetica').fillColor(secondaryColor).text('Tenant Name', 50, currentY);
        currentY += 15;
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text(data.tenant.name, 50, currentY);
        currentY += 20;

        // Address
        doc.fontSize(12).font('Helvetica').fillColor('#334155').text(`${data.property.address}, ${data.property.city}, ${data.property.postcode}`, 50, currentY);
        currentY += 30;

        // Landlord / Agent
        if (data.landlord?.name) {
            doc.fontSize(10).font('Helvetica').fillColor(secondaryColor).text('Landlord / Agent', 50, currentY);
            currentY += 15;
            doc.fontSize(12).font('Helvetica').fillColor('#334155').text(data.landlord.name, 50, currentY);
            currentY += 30;
        }

        // Tenancy Period
        doc.fontSize(10).font('Helvetica').fillColor(secondaryColor).text('Tenancy Period', 50, currentY);
        currentY += 15;

        const startDate = data.property.tenancyStartDate ? format(new Date(data.property.tenancyStartDate), 'MMMM yyyy') : 'Start';
        const endDate = data.property.tenancyEndDate ? format(new Date(data.property.tenancyEndDate), 'MMMM yyyy') : 'Present';

        doc.fontSize(12).font('Helvetica').fillColor('#334155').text(`${startDate} – ${endDate}`, 50, currentY);

        // --- Watermark (Background) ---
        // We draw this before the table but after background is clear? 
        // Actually pdfkit draws in order. Let's put it behind everything? 
        // Too late for header, but fine for table.
        doc.save();
        doc.opacity(0.05);
        doc.fontSize(80).font('Helvetica-Bold').fillColor(primaryColor);
        doc.rotate(-45, { origin: [300, 500] });
        doc.text('RentLedger', 100, 500, { align: 'center', width: 400 });
        doc.restore();

        // --- Table ---
        const tableTop = 350;
        const col1 = 60;  // Date
        const col2 = 160; // Amount
        const col3 = 260; // Status
        const col4 = 360; // Method
        const col5 = 480; // Verified

        // Table Header Background
        doc.roundedRect(50, tableTop - 10, 500, 35, 6).fill(lightBg);

        doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold');
        doc.text('DATE', col1, tableTop);
        doc.text('AMOUNT', col2, tableTop);
        doc.text('STATUS', col3, tableTop);
        doc.text('METHOD', col4, tableTop);
        doc.text('VERIFIED', col5, tableTop);

        currentY = tableTop + 40;

        // Table Rows
        doc.font('Helvetica');

        data.payments.forEach((payment, index) => {
            // Row separator
            if (index > 0) {
                doc.moveTo(50, currentY - 10).lineTo(550, currentY - 10).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
            }

            doc.fontSize(10).fillColor('#334155');

            // Date
            doc.text(format(new Date(payment.date), 'MMM yyyy'), col1, currentY);

            // Amount
            doc.text(`£${payment.amount.toLocaleString()}`, col2, currentY);

            // Status
            const status = payment.status.charAt(0).toUpperCase() + payment.status.slice(1);
            doc.text(status, col3, currentY);

            // Method
            doc.text(payment.method || 'Direct Debit', col4, currentY);

            // Verified Icon
            if (payment.verified) {
                // Draw a small circle check
                const checkX = col5 + 5;
                const checkY = currentY + 5;
                doc.save();
                doc.circle(checkX, checkY, 8).fill(successColor);
                doc.fontSize(8).fillColor('white').text('✓', checkX - 3, checkY - 3);
                doc.restore();
            } else {
                doc.fillColor('#94a3b8').text('-', col5 + 2, currentY);
            }

            currentY += 35;

            // Pagination
            if (currentY > 750) {
                doc.addPage();
                currentY = 50;
                // Re-draw header if needed, but simple list usually fine.
            }
        });

        // --- Footer ---
        const bottom = doc.page.height - 50;

        doc.moveTo(50, bottom - 20).lineTo(550, bottom - 20).strokeColor('#e2e8f0').lineWidth(1).stroke();

        doc.fontSize(9).fillColor(secondaryColor);
        doc.text(`Generated by RentLedger on ${format(data.generatedAt, 'dd MMMM yyyy')}`, 50, bottom);
        doc.text(`Ledger ID: ${data.ledgerId}`, 350, bottom, { align: 'right', width: 200 });

        doc.end();
    });
}
