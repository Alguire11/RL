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

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!apiKey) {
    console.warn(`Email sending skipped (no API key configured) - would have sent to ${params.to}`);
    return false;
  }
  
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || params.text || '',
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
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