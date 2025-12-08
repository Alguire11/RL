import { Resend } from 'resend';

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

  const logoUrl = `${process.env.APP_URL || 'https://rentledger.co.uk'}/logo-email.png`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #1f2937; 
          background-color: #f8fafc; 
          margin: 0; 
          padding: 0; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
        }
        .header { 
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); /* RentLedger Blue Palette */
          color: white; 
          padding: 40px 20px; 
          text-align: center; 
        }
        .logo-box {
          background-color: white;
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .logo-box img {
          width: 80%;
          height: 80%;
          object-fit: contain;
        }
        .header-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        /* ... existing styles ... */
        .content { 
          padding: 40px 30px; 
        }
        .greeting {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 15px;
        }
        .intro-text {
          color: #4b5563;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .card { 
          background: #f8fafc; 
          border: 1px solid #e2e8f0; 
          border-radius: 12px; 
          padding: 25px; 
          margin-bottom: 30px;
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          padding: 12px 0; 
          border-bottom: 1px solid #cbd5e1;
        }
        .detail-row:last-child { 
          border-bottom: none; 
        }
        .label { 
          font-weight: 700; 
          color: #64748b; 
          font-size: 14px;
          width: 40%;
        }
        .value { 
          font-weight: 600; 
          color: #1e293b; 
          font-size: 15px;
          width: 60%;
          text-align: left;
        }
        .amount-value {
          color: #059669; /* Green for money */
          font-size: 18px;
        }
        .receipt-link {
          color: #2563eb;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          font-weight: 600;
        }
        .button-container { 
          text-align: center; 
          margin: 40px 0; 
        }
        .button { 
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
          color: white !important; 
          padding: 16px 36px; 
          border-radius: 8px; 
          text-decoration: none; 
          font-weight: bold; 
          font-size: 16px; 
          display: inline-block;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4); 
        }
        .footer-text {
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-box">
             <img src="${logoUrl}" alt="RL">
          </div>
          <h1 class="header-title">Rent Payment Verification Request</h1>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${params.landlordName || 'Landlord'},</div>
          
          <div class="intro-text">
            Your tenant, <strong>${params.tenantName}</strong> has logged a new rent payment and uploaded a receipt. Please review and verify the payment details below:
          </div>
          
          <div class="card">
            <div class="detail-row">
              <span class="label">Property</span>
              <span class="value"><strong>${params.propertyAddress}</strong></span>
            </div>
            <div class="detail-row">
              <span class="label">Amount</span>
              <span class="value amount-value"><strong>£${params.amount.toFixed(2)}</strong></span>
            </div>
            <div class="detail-row">
              <span class="label">Payment Date</span>
              <span class="value"><strong>${params.paymentDate}</strong></span>
            </div>
            <div class="detail-row">
              <span class="label">Payment Method</span>
              <span class="value"><strong>${params.paymentMethod}</strong></span>
            </div>
            <div class="detail-row">
              <span class="label">Receipt</span>
              <span class="value">
                ${params.receiptUrl ? `✅ <strong>Attached</strong>` : `<span style="color: #94a3b8;">Not provided</span>`}
              </span>
            </div>
          </div>
          
          <div class="test-align: center; color: #4b5563; font-size: 14px; margin-bottom: 20px;">
             Verifying this payment helps <strong>${params.tenantName}</strong> build their credit history and demonstrates your cooperation as a landlord.
          </div>
          
          <div class="button-container">
            <a href="${verificationLink}" class="button">Verify Payment Now</a>
          </div>
          
          <div class="footer-text">
             <p>© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: params.landlordEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject,
    html
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
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #4f46e5; color: white; padding: 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
        .row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .label { font-weight: 600; color: #64748b; }
        .value { font-weight: 600; color: #0f172a; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Property Verification Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${params.landlordName},</h2>
          <p><strong>${params.tenantName}</strong> has added your property to RentLedger and requested verification. Verifying this property allows your tenant to build credit with their rent payments.</p>
          
          <div class="details-box">
            <div class="row">
              <span class="label">Property Address</span>
              <span class="value">${params.propertyAddress}</span>
            </div>
            <div class="row">
              <span class="label">Tenant</span>
              <span class="value">${params.tenantName}</span>
            </div>
            <div class="row">
              <span class="label">Monthly Rent</span>
              <span class="value">£${params.monthlyRent.toFixed(2)}</span>
            </div>
            <div class="row">
              <span class="label">Lease Type</span>
              <span class="value">${params.leaseType}</span>
            </div>
            <div class="row">
              <span class="label">Start Date</span>
              <span class="value">${params.tenancyStartDate}</span>
            </div>
          </div>
          
          <p>Please confirm these details are correct to verify the tenancy.</p>
          
          <div style="text-align: center;">
            <a href="${params.verificationUrl}" class="button">Verify Property</a>
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
    to: params.landlordEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject,
    html
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

    return sendEmail(emailParams);
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

  isEnabled: isEmailServiceEnabled
};

// ... existing templates ...

// 10. Password Reset
export function createPasswordResetEmail(to: string, resetUrl: string): SendEmailParams {
  return {
    to,
    from: FROM_EMAIL,
    fromName: 'RentLedger Security',
    subject: 'Reset Your Password - RentLedger',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello,</h2>
          <p>We received a request to reset your password for your RentLedger account.</p>
          <p>If you didn't make this request, you can safely ignore this email.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p style="font-size: 14px; color: #64748b;">This link will expire in 1 hour.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `
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
    html
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
  const subject = `Welcome to RentLedger! 🎉`;
  const isLandlord = userRole === 'landlord';

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
        .feature-list { background: #f8fafc; border-left: 4px solid #4f46e5; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        h1 { margin: 0; font-size: 28px; }
        h2 { color: #1e293b; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to RentLedger!</h1>
        </div>
        <div class="content">
          <h2>Hi ${userName},</h2>
          <p>Thank you for joining RentLedger! We're excited to help you ${isLandlord ? 'manage your properties and tenants' : 'build your credit history through rent payments'}.</p>
          
          <div class="feature-list">
            <h3 style="margin-top: 0;">What you can do now:</h3>
            <ul style="margin: 0; padding-left: 20px;">
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
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}/dashboard" class="button">Go to Dashboard</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
            Need help getting started? Check out our <a href="${process.env.APP_URL || 'http://localhost:5000'}/help" style="color: #4f46e5;">Help Center</a> or reply to this email.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
          <p>Questions? Contact us at support@rentledger.co.uk</p>
        </div>
      </div>
    </body>
    </html>
    `;

  return {
    to: userEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject,
    html
  };
}

// 12. Email Verification
export function createEmailVerificationEmail(
  userEmail: string,
  userName: string,
  verificationUrl: string
): SendEmailParams {
  const subject = `Verify Your Email - RentLedger`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; font-size: 16px; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        .info-box { background: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px; }
        h1 { margin: 0; font-size: 28px; }
        h2 { color: #1e293b; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✉️ Verify Your Email</h1>
        </div>
        <div class="content">
          <h2>Hi ${userName},</h2>
          <p>Thanks for signing up for RentLedger! To complete your registration and access your account, please verify your email address.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <div class="info-box">
            <p style="margin: 0; font-size: 14px;">
              <strong>Why verify?</strong><br>
              Email verification helps us ensure your account security and allows us to send you important notifications about your rent payments and account activity.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            This verification link will expire in <strong>24 hours</strong>.<br>
            If you didn't create an account with RentLedger, you can safely ignore this email.
          </p>
          
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
          <p>Questions? Contact us at support@rentledger.co.uk</p>
        </div>
      </div>
    </body>
    </html>
    `;

  return {
    to: userEmail,
    from: FROM_EMAIL,
    fromName: 'RentLedger',
    subject,
    html
  };
}