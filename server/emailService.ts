import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
const apiKey = process.env.SENDGRID_API_KEY;

if (apiKey) {
  mailService.setApiKey(apiKey);
} else {
  console.warn('SENDGRID_API_KEY not set - email functionality will be disabled');
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  if (!apiKey) {
    const message = `Email service not configured - SENDGRID_API_KEY is missing. Would have sent to ${params.to}`;
    console.warn(`⚠️  ${message}`);
    return { success: false, error: message };
  }
  
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || params.text || '',
    });
    console.log(`✅ Email sent successfully to ${params.to}`);
    return { success: true };
  } catch (error: any) {
    const errorMessage = error.response?.body?.errors?.[0]?.message || error.message || 'Unknown error';
    console.error(`❌ SendGrid email error: ${errorMessage}`);
    console.error('Full error:', error);
    return { success: false, error: errorMessage };
  }
}

export function isEmailServiceEnabled(): boolean {
  return !!apiKey;
}

export function createTenantInviteEmail(
  tenantEmail: string,
  landlordName: string,
  propertyAddress: string,
  inviteUrl: string,
  qrCodeDataUrl: string
): EmailParams {
  const subject = `You're invited to join RentLedger - ${landlordName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 8px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Welcome to RentLedger!</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p><strong>${landlordName}</strong> has invited you to join RentLedger for the property:</p>
          <p style="font-size: 16px; font-weight: bold; color: #667eea;">${propertyAddress}</p>
          
          <p>RentLedger helps you build your credit history through on-time rent payments. Join now to:</p>
          <ul>
            <li>✅ Track all your rent payments automatically</li>
            <li>📊 Build a verified payment history</li>
            <li>🌟 Earn credit-building badges</li>
            <li>📄 Generate shareable credit reports</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Accept Invitation & Sign Up</a>
          </div>
          
          <div class="qr-section">
            <p style="margin-bottom: 15px;"><strong>Or scan this QR code:</strong></p>
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
          </div>
          
          <p style="color: #666; font-size: 14px;">This invitation link will expire in 7 days. If you have any questions, please contact support@rentledger.co.uk.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from RentLedger. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return {
    to: tenantEmail,
    from: 'noreply@rentledger.co.uk',
    subject,
    html
  };
}

export function createLandlordVerificationEmail(
  landlordEmail: string,
  tenantName: string,
  propertyAddress: string,
  verificationUrl: string
): EmailParams {
  const subject = `Tenant Verification Request - ${tenantName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #2563eb; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
        }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>RentLedger - Landlord Verification Request</h1>
        </div>
        <div class="content">
          <h2>Hello,</h2>
          <p>Your tenant <strong>${tenantName}</strong> has requested verification of their rental history for the property:</p>
          <p><strong>${propertyAddress}</strong></p>
          
          <p>This verification helps build their credit history and rental profile. By confirming their tenancy details, you're helping them access better rental opportunities in the future.</p>
          
          <p>Please click the button below to review and verify their rental information:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Tenant Details</a>
          </div>
          
          <p>This link will expire in 7 days. If you have any questions, please contact support@rentledger.co.uk.</p>
          
          <p>Thank you for your time.</p>
          <p><strong>The RentLedger Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message from RentLedger. Please do not reply to this email.</p>
          <p>If you believe you received this email in error, please contact support@rentledger.co.uk.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    RentLedger - Landlord Verification Request
    
    Hello,
    
    Your tenant ${tenantName} has requested verification of their rental history for the property: ${propertyAddress}
    
    This verification helps build their credit history and rental profile. By confirming their tenancy details, you're helping them access better rental opportunities in the future.
    
    Please visit the following link to review and verify their rental information:
    ${verificationUrl}
    
    This link will expire in 7 days. If you have any questions, please contact support@rentledger.co.uk.
    
    Thank you for your time.
    The RentLedger Team
    
    ---
    This is an automated message from RentLedger. Please do not reply to this email.
    If you believe you received this email in error, please contact support@rentledger.co.uk.
  `;

  return {
    to: landlordEmail,
    from: 'noreply@rentledger.co.uk',
    subject,
    html,
    text
  };
}

interface LandlordVerificationRequestParams {
  landlordEmail: string;
  landlordName: string;
  tenantName: string;
  tenantEmail: string;
  propertyAddress: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  receiptUrl?: string;
}

export function createLandlordPaymentVerificationEmail(
  params: LandlordVerificationRequestParams
): EmailParams {
  const subject = `Payment Verification Request - ${params.tenantName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a8a; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
        .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e3a8a; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: 600; color: #666; }
        .detail-value { color: #333; font-weight: 500; }
        .button { 
          display: inline-block; 
          background: #1e3a8a; 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover { background: #1e40af; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Payment Verification Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${params.landlordName},</h2>
          <p>Your tenant <strong>${params.tenantName}</strong> has logged a rent payment and is requesting your verification.</p>
          
          <div class="payment-details">
            <h3 style="margin-top: 0; color: #1e3a8a;">Payment Details</h3>
            <div class="detail-row">
              <span class="detail-label">Property:</span>
              <span class="detail-value">${params.propertyAddress}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tenant:</span>
              <span class="detail-value">${params.tenantName} (${params.tenantEmail})</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value" style="color: #059669; font-size: 18px;">£${params.amount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Date:</span>
              <span class="detail-value">${params.paymentDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${params.paymentMethod}</span>
            </div>
            ${params.receiptUrl ? `
            <div class="detail-row">
              <span class="detail-label">Receipt Attached:</span>
              <span class="detail-value">✅ Yes</span>
            </div>
            ` : ''}
          </div>
          
          <div class="alert-box">
            <p style="margin: 0;"><strong>Why is this important?</strong></p>
            <p style="margin: 5px 0 0 0;">Your verification helps ${params.tenantName} build their credit history and rental profile, making it easier for them to secure future rentals.</p>
          </div>
          
          <p><strong>Please verify this payment:</strong></p>
          <ul>
            <li>✅ <strong>Confirm</strong> if the payment was received</li>
            <li>❌ <strong>Reject</strong> if the payment details are incorrect</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.APP_URL || 'https://rentledger.co.uk'}/landlord/verify-payment" class="button">Verify Payment Now</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">If you have any questions or concerns, please contact us at support@rentledger.co.uk or reply to your tenant directly.</p>
          
          <p style="margin-top: 30px;">Thank you for helping build a transparent rental community!</p>
          <p><strong>The RentLedger Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification from RentLedger.</p>
          <p>© ${new Date().getFullYear()} RentLedger. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    RentLedger - Payment Verification Request
    
    Hello ${params.landlordName},
    
    Your tenant ${params.tenantName} has logged a rent payment and is requesting your verification.
    
    Payment Details:
    - Property: ${params.propertyAddress}
    - Tenant: ${params.tenantName} (${params.tenantEmail})
    - Amount: £${params.amount.toFixed(2)}
    - Payment Date: ${params.paymentDate}
    - Payment Method: ${params.paymentMethod}
    ${params.receiptUrl ? '- Receipt: Attached' : ''}
    
    Why is this important?
    Your verification helps ${params.tenantName} build their credit history and rental profile, making it easier for them to secure future rentals.
    
    Please visit the following link to verify this payment:
    ${process.env.APP_URL || 'https://rentledger.co.uk'}/landlord/verify-payment
    
    You can either confirm if the payment was received or reject if the details are incorrect.
    
    If you have any questions or concerns, please contact us at support@rentledger.co.uk or reply to your tenant directly.
    
    Thank you for helping build a transparent rental community!
    
    The RentLedger Team
    
    ---
    This is an automated notification from RentLedger.
    © ${new Date().getFullYear()} RentLedger. All rights reserved.
  `;

  return {
    to: params.landlordEmail,
    from: 'noreply@rentledger.co.uk',
    subject,
    html,
    text
  };
}

export const emailService = {
  async sendLandlordVerificationRequest(params: LandlordVerificationRequestParams): Promise<{ success: boolean; error?: string }> {
    const emailParams = createLandlordPaymentVerificationEmail(params);
    return sendEmail(emailParams);
  },
  
  async sendTenantInvite(tenantEmail: string, landlordName: string, propertyAddress: string, inviteUrl: string, qrCodeDataUrl: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createTenantInviteEmail(tenantEmail, landlordName, propertyAddress, inviteUrl, qrCodeDataUrl);
    return sendEmail(emailParams);
  },
  
  async sendLandlordVerification(landlordEmail: string, tenantName: string, propertyAddress: string, verificationUrl: string): Promise<{ success: boolean; error?: string }> {
    const emailParams = createLandlordVerificationEmail(landlordEmail, tenantName, propertyAddress, verificationUrl);
    return sendEmail(emailParams);
  },
  
  isEnabled: isEmailServiceEnabled
};