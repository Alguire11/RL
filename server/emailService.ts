import { Resend } from 'resend';

import fs from 'fs';
import path from 'path';

// Use Resend API Key from environment
const API_KEY = process.env.RESEND_API_KEY;

// Using verified myrentledger.co.uk domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'info@myrentledger.co.uk';
const FROM_NAME = 'RentLedger';

const resend = API_KEY ? new Resend(API_KEY) : null;

interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  fromName?: string;
  toName?: string;
  replyTo?: string;
  attachments?: any[];
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!API_KEY || !resend) {
    const message = `Email service not configured - RESEND_API_KEY is missing. Would have sent to ${params.to}`;
    console.warn(`⚠️  ${message}`);
    return { success: false, error: message };
  }

  try {
    // Resend uses a simpler API structure
    const emailData: any = {
      from: `${params.fromName || FROM_NAME} <${params.from}>`,
      to: [params.to],
      subject: params.subject,
      attachments: params.attachments,
    };

    // Add reply-to if provided
    if (params.replyTo) {
      emailData.reply_to = params.replyTo;
    }

    // Set content - HTML takes priority, fallback to text
    if (params.html) {
      emailData.html = params.html;
    }
    if (params.text) {
      emailData.text = params.text;
    }

    // Send the email using Resend
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error(`❌ Resend email error:`, error);
      console.error(`   To: ${params.to}`);
      console.error(`   Subject: ${params.subject}`);
      return { success: false, error: error.message || "Unknown error" };
    }

    console.log(`✅ Email sent successfully to ${params.to} - Subject: "${params.subject}"`);
    console.log(`   Email ID: ${data?.id}`);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Resend email error:`, error);
    console.error(`   To: ${params.to}`);
    console.error(`   Subject: ${params.subject}`);
    return { success: false, error: error.message || "Unknown error" };
  }
}

export function isEmailServiceEnabled(): boolean {
  return !!API_KEY;
}

// --- TEMPLATES ---

const appUrl = process.env.APP_URL || 'http://localhost:5000';

// Helper to get logo attachment
function getLogoAttachment() {
  try {
    // robust path resolution relative to this file (server/emailService.ts) -> up one level -> client/public
    const logoPath = path.resolve(__dirname, '..', '..', 'client', 'public', 'logo-email.png');
    const logoContent = fs.readFileSync(logoPath);
    return {
      filename: 'logo.png',
      content: logoContent,
      content_id: 'rl_logo', // standard cid without brackets for Resend usually works, but keeping simple
      disposition: 'inline',
    };
  } catch (error) {
    console.warn("Could not load logo-email.png for attachment", error);
    try {
      // Fallback to process.cwd() just in case
      const fallbackPath = path.join(process.cwd(), 'client', 'public', 'logo-email.png');
      const logoContent = fs.readFileSync(fallbackPath);
      return {
        filename: 'logo.png',
        content: logoContent,
        content_id: 'rl_logo',
        disposition: 'inline',
      };
    } catch (e) {
      console.error("Fallback logo load failed:", e);
      return undefined;
    }
  }
}

function getStroopwafelEmailTemplate(title: string, content: string, ctaText?: string, ctaUrl?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f1f5f9;
          margin: 0;
          padding: 0;
          color: #1e293b;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
          padding: 32px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
          background-color: #ffffff;
        }
        .logo-img {
          width: 48px;
          height: 48px;
          object-fit: contain;
          margin-bottom: 16px;
          background-color: transparent;
        }
        .brand-name {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .content {
          padding: 40px 32px;
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 24px 0;
          letter-spacing: -0.02em;
          text-align: center;
        }
        p {
          font-size: 16px;
          color: #475569;
          margin: 0 0 24px 0;
        }
        .btn-container {
          text-align: center;
          margin-top: 32px;
          margin-bottom: 32px;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%);
          color: #ffffff !important;
          font-weight: 600;
          font-size: 16px;
          padding: 14px 32px;
          border-radius: 8px;
          text-decoration: none;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
          transition: all 0.2s ease;
        }
        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .footer {
          background-color: #f8fafc;
          padding: 32px;
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
        .footer-brand {
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
          display: block;
        }
        .footer a {
          color: #64748b;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:rl_logo" alt="RentLedger Logo" class="logo-img" />
          <div class="brand-name">RentLedger</div>
        </div>

        <div class="content">
          <h1>${title}</h1>

          ${content}

          ${ctaUrl && ctaText ? `
            <div class="btn-container">
              <a href="${ctaUrl}" class="btn">${ctaText}</a>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <span class="footer-brand">RentLedger</span>
          <p style="margin: 0;">© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
          <div style="margin-top: 12px;">
            <a href="#">Unsubscribe</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 1. Tenant Invite
export function createTenantInviteEmail(
  tenantEmail: string,
  landlordName: string,
  propertyAddress: string,
  inviteUrl: string,
  qrCodeDataUrl: string
): SendEmailParams {
  const subject = `You're invited to join RentLedger - ${landlordName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        h1 { margin: 0; font-size: 24px; }
        h2 { color: #1e293b; margin-top: 0; }
        .highlight { color: #4f46e5; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to RentLedger</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p><strong>${landlordName}</strong> has invited you to join RentLedger for the property:</p>
          <p class="highlight" style="font-size: 18px;">${propertyAddress}</p>
          
          <p>RentLedger helps you build your credit history through on-time rent payments. Join now to:</p>
          <ul style="list-style-type: none; padding: 0;">
            <li style="margin-bottom: 10px;">✅ Track all your rent payments automatically</li>
            <li style="margin-bottom: 10px;">📊 Build a verified payment history</li>
            <li style="margin-bottom: 10px;">🌟 Earn credit-building badges</li>
            <li style="margin-bottom: 10px;">📄 Generate shareable credit reports</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Accept Invitation & Sign Up</a>
          </div>
          
          <div class="qr-section">
            <p style="margin-bottom: 15px; font-weight: 600;">Or scan this QR code:</p>
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 180px; height: 180px;" />
          </div>
          
          <p style="font-size: 14px; color: #64748b;">This invitation link will expire in 7 days.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
          <p>If you have questions, contact support@rentledger.co.uk</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: tenantEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject,
    html
  };
}

// 2. Landlord Verification Request (General)
export function createLandlordVerificationEmail(
  landlordEmail: string,
  tenantName: string,
  propertyAddress: string,
  verificationUrl: string
): SendEmailParams {
  const subject = `Action Required: Verify Tenancy for ${tenantName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #0f172a; color: white; padding: 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Tenancy Verification Request</h1>
        </div>
        <div class="content">
          <h2>Hello,</h2>
          <p>Your tenant <strong>${tenantName}</strong> has requested verification of their rental history for:</p>
          <p style="font-size: 18px; font-weight: bold; color: #0f172a;">${propertyAddress}</p>
          
          <p>Verifying this information helps your tenant build their credit profile and demonstrates your cooperation as a landlord.</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Tenancy Details</a>
          </div>
          
          <p style="font-size: 14px; color: #64748b;">Link expires in 7 days.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: landlordEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject,
    html
  };
}

// 3. Landlord Payment Verification
interface LandlordVerificationRequestParams {
  landlordEmail: string;
  landlordName: string;
  tenantName: string;
  tenantEmail: string;
  propertyAddress: string;
  amount: number;
  rentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  receiptUrl?: string;
  verificationToken?: string;
}

export function createLandlordPaymentVerificationEmail(params: LandlordVerificationRequestParams): SendEmailParams {
  const subject = `Verify Payment: ${params.tenantName} - £${params.amount.toFixed(2)}`;
  const verificationLink = params.verificationToken
    ? `${process.env.APP_URL || 'https://rentledger.co.uk'}/landlord/verify-payment/${params.verificationToken}`
    : `${process.env.APP_URL || 'https://rentledger.co.uk'}/landlord/verify-payment`;

  const content = `
    <p>Hello ${params.landlordName || 'Landlord'},</p>
    <p>Your tenant <strong>${params.tenantName}</strong> has logged a new rent payment and uploaded a receipt. Please review and verify the payment details below:</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left;">
      <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 16px; font-weight: 600;">Payment Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Property</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${params.propertyAddress}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount</td>
          <td style="padding: 8px 0; color: #059669; font-weight: 600; text-align: right; font-size: 16px;">£${params.amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment Date</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${params.paymentDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Method</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${params.paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Receipt</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${params.receiptUrl ? '✅ Attached' : 'Not provided'}</td>
        </tr>
      </table>
    </div>

    <p>Verifying this payment helps <strong>${params.tenantName}</strong> build their credit history and demonstrates your cooperation as a landlord.</p>
  `;

  const html = getStroopwafelEmailTemplate("Rent Payment Verification", content, "Verify Payment Now", verificationLink);

  return {
    to: params.landlordEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject,
    html,
    attachments: [getLogoAttachment()].filter(Boolean)
  };
}

// 3.5. Property Verification Request (New)
interface PropertyVerificationRequestParams {
  landlordEmail: string;
  landlordName: string;
  tenantName: string;
  tenantEmail: string;
  propertyAddress: string;
  monthlyRent: number;
  leaseType: string;
  tenancyStartDate: string;
  verificationUrl: string;
}

export function createPropertyVerificationRequestEmail(params: PropertyVerificationRequestParams): SendEmailParams {
  const subject = `Verify Property: ${params.propertyAddress} - Tenant: ${params.tenantName}`;
  const content = `
    <p>Hello ${params.landlordName},</p>
    <p><strong>${params.tenantName}</strong> has added your property to RentLedger and requested verification. Verifying this property allows your tenant to build credit with their rent payments.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left;">
      <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 16px; font-weight: 600;">Property Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Property Address</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${params.propertyAddress}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Tenant</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${params.tenantName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Monthly Rent</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">£${params.monthlyRent.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Lease Type</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${params.leaseType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Start Date</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${params.tenancyStartDate}</td>
        </tr>
      </table>
    </div>
    
    <p>Please confirm these details are correct to verify the tenancy.</p>
  `;

  const html = getStroopwafelEmailTemplate("Property Verification Request", content, "Verify Property", params.verificationUrl);

  return {
    to: params.landlordEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject,
    html,
    attachments: [getLogoAttachment()].filter(Boolean)
  };
}

// 4. Rent Reminder
export function createRentReminderEmail(
  tenantEmail: string,
  tenantName: string,
  amount: number,
  dueDate: string
): SendEmailParams {
  const subject = `Reminder: Rent Due Soon - £${amount.toFixed(2)}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Rent Payment Reminder</h1>
        </div>
        <div class="content">
          <h2>Hi ${tenantName},</h2>
          <p>This is a friendly reminder that your upcoming rent payment is due soon.</p>
          
          <p style="font-size: 18px; text-align: center; margin: 30px 0;">
            <strong>Amount Due:</strong> <span style="color: #d97706;">£${amount.toFixed(2)}</span><br>
            <strong>Due Date:</strong> ${dueDate}
          </p>
          
          <p>Log in to RentLedger to record your payment and keep your payment streak alive!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.APP_URL || 'https://rentledger.co.uk'}/dashboard" class="button">Go to Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: tenantEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject,
    html
  };
}

// 5. Support Request (Admin Notification)
export function createSupportRequestAdminEmail(
  ticketId: number,
  fromName: string,
  fromEmail: string,
  subject: string,
  priority: string,
  message: string
): SendEmailParams {
  const emailSubject = `[Support] New Ticket #${ticketId}: ${subject}`;
  const html = `
    <h2>New Support Request</h2>
    <p><strong>Ticket ID:</strong> #${ticketId}</p>
    <p><strong>From:</strong> ${fromName} (<a href="mailto:${fromEmail}">${fromEmail}</a>)</p>
    <p><strong>Priority:</strong> ${priority}</p>
    <hr>
    <h3>Message:</h3>
    <p style="white-space: pre-wrap;">${message}</p>
    <hr>
    <p><a href="${process.env.APP_URL || 'https://rentledger.co.uk'}/admin/support">View in Admin Dashboard</a></p>
  `;

  return {
    to: process.env.ADMIN_EMAIL || FROM_EMAIL,
    from: FROM_EMAIL,
    fromName: 'RentLedger System',
    subject: emailSubject,
    html
  };
}

// 6. Support Reply (To User)
export function createSupportReplyEmail(
  ticketId: number,
  userEmail: string,
  userName: string,
  ticketSubject: string,
  replyMessage: string
): SendEmailParams {
  const subject = `Re: ${ticketSubject} [Ticket #${ticketId}]`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .reply-box { background: #f0f9ff; padding: 20px; border-left: 4px solid #0ea5e9; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <p>Hi ${userName},</p>
        <p>Our support team has replied to your ticket:</p>
        
        <div class="reply-box">
          ${replyMessage.replace(/\n/g, '<br>')}
        </div>
        
        <p>If you have any further questions, please reply to this email.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">Ticket ID: #${ticketId}</p>
      </div>
    </body>
    </html>
  `;

  return {
    to: userEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger Support',
    subject,
    html
  };
}

// 11. Report Share Email
export function createReportShareEmail(
  to: string,
  senderName: string,
  recipientType: string,
  shareUrl: string
): SendEmailParams {
  const recipientLabel = recipientType === 'landlord' ? 'Landlord' :
    recipientType === 'lender' ? 'Lender' :
      recipientType === 'agency' ? 'Agent' : 'User';

  const content = `
    <p>Hello,</p>
    <p><strong>${senderName}</strong> has shared their RentLedger Rent History with you.</p>
    <p>RentLedger allows tenants to build a verified track record of their rent payments. You can view their full payment history, badges, and verification status by clicking the link below.</p>
    
    <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #0284c7;"><strong>Note:</strong> This link allows temporary read-only access to the user's report.</p>
    </div>
  `;

  return {
    to,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject: `${senderName} has shared their Rent History with you`,
    html: getStroopwafelEmailTemplate("Rent History Shared", content, "View Rent Report", shareUrl),
    attachments: [getLogoAttachment()].filter(Boolean)
  };
}

export const emailService = {
  async sendLandlordVerificationRequest(params: LandlordVerificationRequestParams): Promise<{ success: boolean; error?: string }> {
    const emailParams = createLandlordPaymentVerificationEmail(params);
    return sendEmail(emailParams);
  },

  async sendPropertyVerificationRequest(params: PropertyVerificationRequestParams): Promise<{ success: boolean; error?: string }> {
    const emailParams = createPropertyVerificationRequestEmail(params);
    return sendEmail(emailParams);
  },

  async sendTenantInvite(tenantEmail: string, landlordName: string, propertyAddress: string, inviteUrl: string, qrCodeDataUrl: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createTenantInviteEmail(tenantEmail, landlordName, propertyAddress, inviteUrl, qrCodeDataUrl);
    return sendEmail(emailParams);
  },

  async sendTenantInvitation(email: string, inviteUrl: string, landlordName: string, propertyAddress: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = {
      to: email,
      from: process.env.MAILERSEND_FROM_EMAIL || "info@rentledger.co.uk",
      fromName: 'RentLedger',
      subject: "You've been invited to join RentLedger",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a;">Welcome to RentLedger</h2>
          <p>Hello,</p>
          <p><strong>${landlordName}</strong> has invited you to join RentLedger as a tenant for the property at:</p>
          <p style="font-size: 16px; font-weight: bold; color: #4b5563; padding: 10px; background-color: #f3f4f6; border-radius: 4px;">
            ${propertyAddress}
          </p>
          <p>RentLedger helps you build credit with your rent payments and keep track of your rental history.</p>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size: 12px; color: #6b7280;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `Hello, ${landlordName} has invited you to join RentLedger for ${propertyAddress}. Accept here: ${inviteUrl}`
    };

    return sendEmail({ ...emailParams, attachments: [getLogoAttachment()].filter(Boolean) });
  },


  async sendLandlordVerification(landlordEmail: string, tenantName: string, propertyAddress: string, verificationUrl: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createLandlordVerificationEmail(landlordEmail, tenantName, propertyAddress, verificationUrl);
    return sendEmail(emailParams);
  },

  async sendRentReminder(tenantEmail: string, tenantName: string, amount: number, dueDate: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createRentReminderEmail(tenantEmail, tenantName, amount, dueDate);
    return sendEmail(emailParams);
  },

  async sendSupportRequestAdmin(ticketId: number, fromName: string, fromEmail: string, subject: string, priority: string, message: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createSupportRequestAdminEmail(ticketId, fromName, fromEmail, subject, priority, message);
    return sendEmail(emailParams);
  },

  async sendSupportReply(ticketId: number, userEmail: string, userName: string, ticketSubject: string, replyMessage: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createSupportReplyEmail(ticketId, userEmail, userName, ticketSubject, replyMessage);
    return sendEmail(emailParams);
  },

  async sendRentPaymentNotification(landlordEmail: string, landlordName: string, tenantName: string, propertyAddress: string, amount: number, dueDate: string, status: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createRentPaymentNotificationEmail(landlordEmail, landlordName, tenantName, propertyAddress, amount, dueDate, status);
    return sendEmail(emailParams);
  },

  async sendSupportRequestConfirmation(userEmail: string, userName: string, subject: string, message: string, ticketId?: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createSupportRequestConfirmationEmail(userEmail, userName, subject, message, ticketId);
    return sendEmail(emailParams);
  },

  async sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createTestEmail(to);
    return sendEmail(emailParams);
  },

  async sendPasswordReset(to: string, resetUrl: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createPasswordResetEmail(to, resetUrl);
    return sendEmail(emailParams);
  },

  async sendWelcomeEmail(userEmail: string, userName: string, userRole: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createWelcomeEmail(userEmail, userName, userRole);
    return sendEmail(emailParams);
  },

  async sendEmailVerification(userEmail: string, userName: string, verificationUrl: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createEmailVerificationEmail(userEmail, userName, verificationUrl);
    return sendEmail(emailParams);
  },

  async sendReportShareEmail(to: string, senderName: string, recipientType: string, shareUrl: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createReportShareEmail(to, senderName, recipientType, shareUrl);
    return sendEmail(emailParams);
  },

  isEnabled: isEmailServiceEnabled
};

// ... existing templates ...

// 10. Password Reset
export function createPasswordResetEmail(to: string, resetUrl: string): SendEmailParams {
  const content = `
    <p>We received a request to reset your password for your RentLedger account.</p>
    <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  `;

  return {
    to,
    from: FROM_EMAIL,
    fromName: 'RentLedger Security',
    subject: 'Reset your password',
    html: getStroopwafelEmailTemplate('Reset your password', content, 'Reset Password', resetUrl),
    attachments: [getLogoAttachment()].filter(Boolean)
  };
}

// 7. Rent Payment Notification (To Landlord)
export function createRentPaymentNotificationEmail(
  landlordEmail: string,
  landlordName: string,
  tenantName: string,
  propertyAddress: string,
  amount: number,
  dueDate: string,
  status: string
): SendEmailParams {
  const subject = `Rent Payment Notification - RentLedger`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .details-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #dcfce7; padding-bottom: 10px; }
        .row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .label { font-weight: 600; color: #15803d; }
        .value { font-weight: 600; color: #0f172a; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Rent Payment Recorded</h1>
        </div>
        <div class="content">
          <h2>Hello ${landlordName},</h2>
          <p>Your tenant <strong>${tenantName}</strong> has recorded a rent payment:</p>
          
          <div class="details-box">
            <div class="row">
              <span class="label">Property</span>
              <span class="value">${propertyAddress}</span>
            </div>
            <div class="row">
              <span class="label">Amount</span>
              <span class="value">£${amount.toFixed(2)}</span>
            </div>
            <div class="row">
              <span class="label">Due Date</span>
              <span class="value">${dueDate}</span>
            </div>
            <div class="row">
              <span class="label">Status</span>
              <span class="value" style="text-transform: capitalize;">${status}</span>
            </div>
          </div>
          
          <p>This payment has been logged in the RentLedger system to help build your tenant's credit profile.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

  return {
    to: landlordEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject,
    html,
    attachments: [getLogoAttachment()].filter(Boolean)
  };
}

// 8. Support Request Confirmation (To User)
export function createSupportRequestConfirmationEmail(
  userEmail: string,
  userName: string,
  subject: string,
  message: string,
  ticketId?: string
): SendEmailParams {
  const emailSubject = `Support Request Received: ${subject} `;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .message-box { background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .footer { margin-top: 30px; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Thank You for Contacting Support</h2>
        <p>Hi ${userName},</p>
        <p>We've received your support request and our team will respond within 24 hours.</p>
        
        <div class="header">
          <p><strong>Subject:</strong> ${subject}</p>
          ${ticketId ? `<p><strong>Ticket ID:</strong> #${ticketId}</p>` : ''}
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="message-box">
          <h3>Your Message:</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        
        <div class="footer">
          <p>Best regards,<br>The RentLedger Support Team</p>
        </div>
      </div>
    </body>
    </html>
    `;

  return {
    to: userEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger Support',
    subject: emailSubject,
    html
  };
}

// 9. Test Email
export function createTestEmail(to: string): SendEmailParams {
  return {
    to,
    from: FROM_EMAIL,
    fromName: 'RentLedger Admin',
    subject: 'RentLedger - Test Email',
    html: `
      <h2>Test Email from RentLedger Admin</h2>
      <p>This is a test email to verify email configuration is working correctly.</p>
      <p>If you received this email, the email service is properly configured.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `
  };
}

// 11. Welcome Email
export function createWelcomeEmail(
  userEmail: string,
  userName: string,
  userRole: string
): SendEmailParams {
  const isLandlord = userRole === 'landlord';
  const content = `
    <p>Hi ${userName},</p>
    <p>Thank you for joining RentLedger! We're excited to help you ${isLandlord ? 'manage your properties and tenants' : 'build your credit history through rent payments'}.</p>
    <p><strong>What you can do now:</strong></p>
    <ul>
      ${isLandlord ? `
        <li>Add your properties</li>
        <li>Invite tenants to track their rent</li>
        <li>Monitor payment history</li>
        <li>Verify tenant payments</li>
      ` : `
        <li>Log your rent payments</li>
        <li>Build your payment history</li>
        <li>Earn credit-building badges</li>
        <li>Generate shareable credit reports</li>
      `}
    </ul>
  `;

  return {
    to: userEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject: 'Welcome to RentLedger!',
    html: getStroopwafelEmailTemplate('Welcome to RentLedger!', content, 'Go to Dashboard', `${process.env.APP_URL || 'http://localhost:5000'}/dashboard`),
    attachments: [getLogoAttachment()].filter(Boolean)
  };
}

// 12. Email Verification
export function createEmailVerificationEmail(
  userEmail: string,
  userName: string,
  verificationUrl: string
): SendEmailParams {
  const content = `
    <p>Please click the button below to confirm your email address and finish setting up your account. This link is valid for 48 hours.</p>
  `;

  return {
    to: userEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject: 'Confirm your account',
    html: getStroopwafelEmailTemplate('Confirm your account', content, 'Confirm', verificationUrl),
    attachments: [getLogoAttachment()].filter(Boolean)
  };
}